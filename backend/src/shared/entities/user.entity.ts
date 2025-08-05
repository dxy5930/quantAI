import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Exclude, Expose } from "class-transformer";
import { UserLevel, USER_LEVEL_PERMISSIONS } from "../types";
import { USER_CONSTANTS } from "../constants";

/**
 * 用户实体
 * 用于存储系统用户的基本信息、权限、个人资料等数据
 */
@Entity("users", { 
  comment: '用户信息表：存储系统用户的基本信息、权限、个人资料等数据' 
})
export class User {
  /**
   * 用户唯一标识符
   * 使用UUID格式，确保全局唯一性
   */
  @PrimaryGeneratedColumn("uuid")
  id: string;

  /**
   * 用户名
   * 用于登录和显示，必须唯一，长度限制50字符
   */
  @Column({ unique: true, length: USER_CONSTANTS.USERNAME_MAX_LENGTH, comment: '用户名，用于登录和显示' })
  username: string;

  /**
   * 用户邮箱
   * 用于登录、找回密码等，必须唯一，长度限制100字符
   */
  @Column({ unique: true, length: USER_CONSTANTS.EMAIL_MAX_LENGTH, comment: '用户邮箱地址' })
  email: string;

  /**
   * 用户密码
   * 已加密存储，在序列化时排除
   */
  @Column({ comment: '用户密码（已加密）' })
  @Exclude()
  password: string;

  /**
   * 用户头像URL或base64数据
   * 可选字段，存储头像图片的URL地址或base64编码的图片数据
   */
  @Column({ nullable: true, type: 'text', comment: '用户头像URL地址或base64编码的图片数据' })
  avatar?: string;

  /**
   * 用户角色
   * 用于权限控制，区分普通用户和管理员
   */
  @Column({ type: "enum", enum: ["user", "admin"], default: "user", comment: '用户角色：user-普通用户，admin-管理员' })
  role: "user" | "admin";

  /**
   * 用户等级
   * 1-普通用户，2-高级用户，3-超级用户
   * 用于区分不同等级用户的权限和功能限制
   */
  @Column({ type: "int", default: UserLevel.NORMAL, comment: '用户等级：1-普通用户，2-高级用户，3-超级用户' })
  level: UserLevel;

  /**
   * 账户创建时间
   * 自动生成，记录用户注册时间
   */
  @CreateDateColumn({ comment: '账户创建时间' })
  createdAt: Date;

  /**
   * 账户更新时间
   * 自动更新，记录用户信息最后修改时间
   */
  @UpdateDateColumn({ comment: '账户信息最后更新时间' })
  updatedAt: Date;

  /**
   * 最后登录时间
   * 可选字段，记录用户最后一次登录的时间
   */
  @Column({ nullable: true, comment: '用户最后登录时间' })
  lastLoginAt?: Date;

  /**
   * 密码重置令牌
   * 用于忘记密码时的身份验证
   */
  @Column({ nullable: true, comment: '密码重置令牌' })
  resetPasswordToken?: string;

  /**
   * 密码重置令牌过期时间
   * 重置令牌的有效期限
   */
  @Column({ nullable: true, comment: '密码重置令牌过期时间' })
  resetPasswordExpires?: Date;

  // ================== 用户资料相关字段 ==================

  /**
   * 显示名称
   * 用户自定义的显示名称，如果未设置则使用用户名
   */
  @Column({ nullable: true, length: USER_CONSTANTS.DISPLAY_NAME_MAX_LENGTH, comment: '用户显示名称' })
  displayName?: string;



  /**
   * 交易经验等级
   * 用于标识用户的交易经验水平
   */
  @Column({
    type: "enum",
    enum: ["beginner", "intermediate", "advanced", "expert"],
    default: "beginner",
    comment: '交易经验等级：beginner-初学者，intermediate-中级，advanced-高级，expert-专家'
  })
  tradingExperience: "beginner" | "intermediate" | "advanced" | "expert";



  /**
   * 风险承受能力
   * 用户的风险偏好设置
   */
  @Column({
    type: "enum",
    enum: ["low", "medium", "high"],
    default: "medium",
    comment: '风险承受能力：low-低风险，medium-中等风险，high-高风险'
  })
  riskTolerance: "low" | "medium" | "high";

  // ================== 关联关系 ==================

  /**
   * 用户创建的策略列表
   * 一对多关系，一个用户可以创建多个策略
   */
  @OneToMany(() => Strategy, (strategy) => strategy.author)
  strategies: any[];

  /**
   * 用户的回测历史记录
   * 一对多关系，一个用户可以有多个回测记录
   */
  @OneToMany(() => BacktestHistory, (history) => history.user)
  backtestHistory: BacktestHistory[];

  // ================== 虚拟属性 ==================

  /**
   * 用户资料信息
   * 虚拟属性，用于获取用户的完整资料信息
   */
  @Expose()
  get profile() {
    return {
      displayName: this.displayName || this.username,
      tradingExperience: this.tradingExperience,
      riskTolerance: this.riskTolerance,
    };
  }

  /**
   * 用户等级信息
   * 虚拟属性，用于获取用户等级的详细信息
   */
  @Expose()
  get levelInfo() {
    return {
      level: this.level,
      name: this.level === UserLevel.NORMAL ? '普通用户' : 
            this.level === UserLevel.PREMIUM ? '高级用户' : '超级用户',
      permissions: this.getLevelPermissions(),
    };
  }

  /**
   * 获取用户等级权限
   * 根据用户等级返回对应的权限配置
   */
  private getLevelPermissions() {
    return USER_LEVEL_PERMISSIONS[this.level] || USER_LEVEL_PERMISSIONS[UserLevel.NORMAL];
  }
}
