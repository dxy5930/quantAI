import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";

import { User } from "../../shared/entities/user.entity";
import {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  ErrorCode,
} from "../../shared/types";
import { AUTH_CONSTANTS } from "../../shared/constants";
import { ForgotPasswordDto, ResetPasswordDto } from "./dto";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { username },
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }

    return null;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const user = await this.validateUser(
      credentials.username,
      credentials.password,
    );

    if (!user) {
      throw new UnauthorizedException("用户名或密码错误");
    }

    // 更新最后登录时间
    await this.userRepository.update(user.id, {
      lastLoginAt: new Date(),
    });

    const payload = { username: user.username, sub: user.id };
    const token = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: "7d" });

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        createdAt: user.createdAt,
        lastLoginAt: new Date(),
        profile: user.profile,
      },
      access_token: token,
      refresh_token: refreshToken,
      expires_in: AUTH_CONSTANTS.JWT_EXPIRES_IN_SECONDS,
    };
  }

  async register(registerData: RegisterData): Promise<AuthResponse> {
    const { username, email, password, confirmPassword } = registerData;

    // 验证密码确认
    if (password !== confirmPassword) {
      throw new ConflictException("密码确认不匹配");
    }

    // 检查用户名是否已存在
    const existingUser = await this.userRepository.findOne({
      where: [{ username }, { email }],
    });

    if (existingUser) {
      if (existingUser.username === username) {
        throw new ConflictException("用户名已存在");
      }
      if (existingUser.email === email) {
        throw new ConflictException("邮箱已被使用");
      }
    }

    // 创建新用户
    const hashedPassword = await bcrypt.hash(password, AUTH_CONSTANTS.BCRYPT_SALT_ROUNDS);
    const user = this.userRepository.create({
      username,
      email,
      password: hashedPassword,
      displayName: username,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
    });

    const savedUser = await this.userRepository.save(user);

    // 生成JWT令牌
    const payload = { username: savedUser.username, sub: savedUser.id };
    const token = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: "7d" });

    return {
      user: {
        id: savedUser.id,
        username: savedUser.username,
        email: savedUser.email,
        avatar: savedUser.avatar,
        role: savedUser.role,
        createdAt: savedUser.createdAt,
        lastLoginAt: savedUser.lastLoginAt,
        profile: savedUser.profile,
      },
      access_token: token,
      refresh_token: refreshToken,
      expires_in: AUTH_CONSTANTS.JWT_EXPIRES_IN_SECONDS,
    };
  }

  async refreshToken(refreshToken: string): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException("用户不存在");
      }

      const newPayload = { username: user.username, sub: user.id };
      const newToken = this.jwtService.sign(newPayload);
      const newRefreshToken = this.jwtService.sign(newPayload, { expiresIn: "7d" });

      return { 
        access_token: newToken,
        refresh_token: newRefreshToken,
        expires_in: AUTH_CONSTANTS.JWT_EXPIRES_IN_SECONDS,
      };
    } catch (error) {
      throw new UnauthorizedException("刷新令牌无效");
    }
  }

  async getCurrentUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["strategies"],
    });

    if (!user) {
      throw new UnauthorizedException("用户不存在");
    }

    return user;
  }

  // 用户登出
  async logout(userId: string): Promise<void> {
    // 在实际应用中，这里可以实现token黑名单机制
    // 或者更新用户的最后登出时间等
    // 目前简单返回成功即可，因为JWT token是无状态的
    // 实际的登出逻辑主要在客户端清除token
    
    // 可选：更新用户的最后登出时间
    await this.userRepository.update(userId, {
      lastLoginAt: new Date(), // 这里可以添加 lastLogoutAt 字段
    });
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;

    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      // 为了安全，即使用户不存在也返回成功信息
      return { message: "如果该邮箱存在，我们已向您发送了重置密码的链接" };
    }

    // 生成重置令牌
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000); // 15分钟后过期

    // 保存重置令牌到数据库
    await this.userRepository.update(user.id, {
      resetPasswordToken: resetToken,
      resetPasswordExpires: resetTokenExpires,
    });

    // TODO: 这里应该发送邮件，目前先返回令牌（生产环境中应该移除）
    console.log(`重置密码令牌: ${resetToken}`);
    console.log(`用户邮箱: ${email}`);

    return { message: "如果该邮箱存在，我们已向您发送了重置密码的链接" };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, password, confirmPassword } = resetPasswordDto;

    // 验证密码确认
    if (password !== confirmPassword) {
      throw new BadRequestException("密码确认不匹配");
    }

    // 查找具有有效重置令牌的用户
    const user = await this.userRepository.findOne({
      where: {
        resetPasswordToken: token,
      },
    });

    if (!user) {
      throw new BadRequestException("重置令牌无效或已过期");
    }

    // 检查令牌是否过期
    if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      throw new BadRequestException("重置令牌已过期");
    }

    // 更新密码并清除重置令牌
    const hashedPassword = await bcrypt.hash(password, AUTH_CONSTANTS.BCRYPT_SALT_ROUNDS);
    await this.userRepository.update(user.id, {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });

    return { message: "密码重置成功" };
  }
}
