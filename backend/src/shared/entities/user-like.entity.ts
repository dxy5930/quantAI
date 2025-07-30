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
 * 用户点赞策略实体
 * 用于存储用户点赞的策略记录
 */
@Entity("user_likes", { 
  comment: '用户点赞表：存储用户对策略的点赞记录' 
})
@Unique(["userId", "strategyId"])
export class UserLike {
  /**
   * 点赞记录唯一标识符
   */
  @PrimaryGeneratedColumn("uuid")
  id: string;

  /**
   * 点赞时间
   */
  @CreateDateColumn({ comment: '点赞时间' })
  createdAt: Date;

  // ================== 关联关系 ==================

  /**
   * 点赞的用户
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
   * 点赞的策略
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