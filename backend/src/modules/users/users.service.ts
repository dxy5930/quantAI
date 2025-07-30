import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcryptjs";

import { User } from "../../shared/entities/user.entity";
import { UpdateUserProfileDto } from "./dto/update-user-profile.dto";
import { UpdateUserLevelDto, BatchUpdateUserLevelDto } from "./dto/update-user-level.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { UserLevel, USER_LEVEL_PERMISSIONS } from "../../shared/types";
import { USER_CONSTANTS } from "../../shared/constants";
import { AUTH_CONSTANTS } from "../../shared/constants";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ["strategies"],
    });

    if (!user) {
      throw new NotFoundException("用户不存在");
    }

    return user;
  }

  async findByUsername(username: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { username },
    });

    if (!user) {
      throw new NotFoundException("用户不存在");
    }

    return user;
  }

  async updateProfile(
    userId: string,
    updateData: UpdateUserProfileDto,
  ): Promise<User> {
    const user = await this.findById(userId);

    // 如果更新包含等级信息，需要检查权限
    if (updateData.level !== undefined) {
      // 只有管理员可以修改用户等级
      if (user.role !== 'admin') {
        throw new ForbiddenException("只有管理员可以修改用户等级");
      }
    }

    // 如果更新邮箱，需要检查邮箱是否已被使用
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateData.email },
      });
      if (existingUser && existingUser.id !== userId) {
        throw new ForbiddenException("该邮箱已被其他用户使用");
      }
    }

    // 如果更新头像，需要验证格式和大小
    if (updateData.avatar) {
      this.validateAvatar(updateData.avatar);
    }

    // 更新用户基本信息
    Object.assign(user, updateData);

    const savedUser = await this.userRepository.save(user);
    
    // 重新查询用户信息，确保返回完整的数据（包括虚拟属性）
    return this.findById(savedUser.id);
  }

  /**
   * 验证头像数据
   * @param avatar 头像数据（URL或base64）
   */
  private validateAvatar(avatar: string): void {
    // 如果是base64格式
    if (avatar.startsWith('data:image/')) {
      // 检查是否是支持的图片格式
      const supportedFormats = ['data:image/jpeg', 'data:image/png', 'data:image/gif', 'data:image/webp'];
      const isSupported = supportedFormats.some(format => avatar.startsWith(format));
      
      if (!isSupported) {
        throw new ForbiddenException("不支持的图片格式，请使用 JPEG、PNG、GIF 或 WebP 格式");
      }

      // 检查base64数据大小（估算）
      const base64Data = avatar.split(',')[1];
      if (base64Data) {
        const sizeInBytes = (base64Data.length * 3) / 4;
        const maxSize = 5 * 1024 * 1024; // 5MB
        
        if (sizeInBytes > maxSize) {
          throw new ForbiddenException("头像文件过大，请选择小于5MB的图片");
        }
      }
    }
    // 如果是URL格式，已经通过DTO验证
  }

  async getUserStats(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["strategies", "backtestHistory"],
    });

    if (!user) {
      throw new NotFoundException("用户不存在");
    }

    const totalStrategies = user.strategies.length;
    const publicStrategies = user.strategies.filter((s) => s.isPublic).length;
    const totalBacktests = user.backtestHistory.length;
    const successfulBacktests = user.backtestHistory.filter(
      (b) => b.status === "completed",
    ).length;

    return {
      totalStrategies,
      publicStrategies,
      totalBacktests,
      successfulBacktests,
      memberSince: user.createdAt,
      lastActive: user.lastLoginAt,
      level: user.level,
      levelInfo: user.levelInfo,
    };
  }

  // ================== 用户等级管理功能 ==================

  /**
   * 更新用户等级（管理员专用）
   * @param adminUserId 管理员用户ID
   * @param targetUserId 目标用户ID
   * @param updateData 更新数据
   */
  async updateUserLevel(
    adminUserId: string,
    targetUserId: string,
    updateData: UpdateUserLevelDto,
  ): Promise<User> {
    // 验证管理员权限
    const admin = await this.findById(adminUserId);
    if (admin.role !== 'admin') {
      throw new ForbiddenException("只有管理员可以修改用户等级");
    }

    // 查找目标用户
    const targetUser = await this.findById(targetUserId);
    
    // 更新用户等级
    targetUser.level = updateData.level;
    
    return this.userRepository.save(targetUser);
  }

  /**
   * 批量更新用户等级（管理员专用）
   * @param adminUserId 管理员用户ID
   * @param updateData 批量更新数据
   */
  async batchUpdateUserLevel(
    adminUserId: string,
    updateData: BatchUpdateUserLevelDto,
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    // 验证管理员权限
    const admin = await this.findById(adminUserId);
    if (admin.role !== 'admin') {
      throw new ForbiddenException("只有管理员可以修改用户等级");
    }

    const results = { success: 0, failed: 0, errors: [] };

    for (const userId of updateData.userIds) {
      try {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
          results.failed++;
          results.errors.push(`用户 ${userId} 不存在`);
          continue;
        }

        user.level = updateData.level;
        await this.userRepository.save(user);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`更新用户 ${userId} 失败: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * 获取用户等级权限信息
   * @param userId 用户ID
   */
  async getUserLevelPermissions(userId: string) {
    const user = await this.findById(userId);
    return USER_LEVEL_PERMISSIONS[user.level] || USER_LEVEL_PERMISSIONS[UserLevel.NORMAL];
  }

  /**
   * 检查用户是否具有特定权限
   * @param userId 用户ID
   * @param permission 权限名称
   */
  async checkUserPermission(userId: string, permission: keyof typeof USER_LEVEL_PERMISSIONS[UserLevel.NORMAL]): Promise<boolean> {
    const permissions = await this.getUserLevelPermissions(userId);
    return permissions[permission] as boolean;
  }

  /**
   * 检查用户策略数量限制
   * @param userId 用户ID
   */
  async checkStrategyLimit(userId: string): Promise<{ canCreate: boolean; current: number; max: number }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["strategies"],
    });

    if (!user) {
      throw new NotFoundException("用户不存在");
    }

    const permissions = USER_LEVEL_PERMISSIONS[user.level] || USER_LEVEL_PERMISSIONS[UserLevel.NORMAL];
    const currentCount = user.strategies.length;
    const maxStrategies = permissions.maxStrategies;

    return {
      canCreate: maxStrategies === -1 || currentCount < maxStrategies,
      current: currentCount,
      max: maxStrategies,
    };
  }

  /**
   * 获取用户等级统计信息（管理员专用）
   * @param adminUserId 管理员用户ID
   */
  async getUserLevelStats(adminUserId: string) {
    // 验证管理员权限
    const admin = await this.findById(adminUserId);
    if (admin.role !== 'admin') {
      throw new ForbiddenException("只有管理员可以查看用户等级统计");
    }

    const stats = await this.userRepository
      .createQueryBuilder("user")
      .select("user.level", "level")
      .addSelect("COUNT(*)", "count")
      .groupBy("user.level")
      .getRawMany();

    const levelStats = {
      [UserLevel.NORMAL]: 0,
      [UserLevel.PREMIUM]: 0,
      [UserLevel.SUPER]: 0,
    };

    stats.forEach(stat => {
      levelStats[stat.level] = parseInt(stat.count);
    });

    const totalUsers = Object.values(levelStats).reduce((sum, count) => sum + count, 0);

    return {
      totalUsers,
      levelDistribution: levelStats,
      percentages: {
        [UserLevel.NORMAL]: totalUsers > 0 ? (levelStats[UserLevel.NORMAL] / totalUsers * 100).toFixed(2) : '0',
        [UserLevel.PREMIUM]: totalUsers > 0 ? (levelStats[UserLevel.PREMIUM] / totalUsers * 100).toFixed(2) : '0',
        [UserLevel.SUPER]: totalUsers > 0 ? (levelStats[UserLevel.SUPER] / totalUsers * 100).toFixed(2) : '0',
      },
    };
  }

  /**
   * 获取用户资料选项
   */
  async getProfileOptions() {
    return {
      tradingExperience: USER_CONSTANTS.TRADING_EXPERIENCE_OPTIONS,
      riskTolerance: USER_CONSTANTS.RISK_TOLERANCE_OPTIONS,
    };
  }

  /**
   * 修改用户密码
   * @param userId 用户ID
   * @param changePasswordDto 修改密码数据
   */
  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{ success: boolean; message: string }> {
    const { currentPassword, newPassword, confirmPassword } = changePasswordDto;

    // 验证新密码和确认密码是否一致
    if (newPassword !== confirmPassword) {
      return { success: false, message: "新密码和确认密码不一致" };
    }

    // 验证新密码长度
    if (newPassword.length < 8) {
      return { success: false, message: "密码长度至少8位" };
    }

    // 验证新密码不能与当前密码相同
    if (currentPassword === newPassword) {
      return { success: false, message: "新密码不能与当前密码相同" };
    }

    // 查找用户（需要包含密码字段）
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'username', 'email', 'password'], // 明确选择需要的字段，包括密码
    });

    if (!user) {
      return { success: false, message: "用户不存在" };
    }

    // 验证当前密码是否正确
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return { success: false, message: "当前密码不正确" };
    }

    // 加密新密码
    const hashedNewPassword = await bcrypt.hash(newPassword, AUTH_CONSTANTS.BCRYPT_SALT_ROUNDS);

    // 更新密码
    await this.userRepository.update(userId, {
      password: hashedNewPassword,
    });

    return { success: true, message: "密码修改成功" };
  }
}
