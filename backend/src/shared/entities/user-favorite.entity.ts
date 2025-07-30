import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from "typeorm";
import { User } from "./user.entity";
import { Strategy } from "./strategy.entity";

/**
 * 用户收藏策略实体
 * 用于存储用户收藏的策略记录
 */
@Entity("user_favorites", { 
  comment: '用户收藏表：存储用户收藏的策略' 
})
@Unique(["userId", "strategyId"])
export class UserFavorite {
  /**
   * 收藏记录唯一标识符
   */
  @PrimaryGeneratedColumn("uuid")
  id: string;

  /**
   * 收藏时间
   */
  @CreateDateColumn({ comment: '收藏时间' })
  createdAt: Date;

  // ================== 关联关系 ==================

  /**
   * 收藏的用户
   */
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  /**
   * 用户ID
   */
  @Column({ comment: '用户ID' })
  userId: string;

  /**
   * 收藏的策略
   */
  @ManyToOne(() => Strategy, { onDelete: "CASCADE" })
  @JoinColumn({ name: "strategyId" })
  strategy: Strategy;

  /**
   * 策略ID
   */
  @Column({ comment: '策略ID' })
  strategyId: string;
} 