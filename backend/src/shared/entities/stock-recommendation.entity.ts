import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Strategy } from "./strategy.entity";
import { Stock } from "./stock.entity";

/**
 * 股票推荐实体
 */
@Entity("stock_recommendations", { 
  comment: '股票推荐表：存储AI分析推荐的股票及其评分和理由' 
})
export class StockRecommendation {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ comment: '策略ID' })
  strategyId: string;

  @Column({ comment: '股票ID' })
  stockId: string;

  @Column({ length: 20, comment: '股票代码' })
  symbol: string;

  @Column({ type: "decimal", precision: 5, scale: 2, comment: '推荐评分' })
  score: number;

  @Column({ type: "text", nullable: true, comment: '推荐理由' })
  reason?: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true, comment: '目标价格' })
  targetPrice?: number;

  @Column({
    type: "enum",
    enum: ["low", "medium", "high"],
    default: "medium",
    comment: '风险等级'
  })
  riskLevel: "low" | "medium" | "high";

  @Column({
    type: "enum",
    enum: ["BUY", "HOLD", "SELL"],
    default: "HOLD",
    comment: '推荐类型'
  })
  recommendationType: "BUY" | "HOLD" | "SELL";

  @Column({ type: "decimal", precision: 3, scale: 2, nullable: true, comment: '置信度' })
  confidence?: number;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;

  // 关联关系
  @ManyToOne(() => Strategy, (strategy) => strategy.stockRecommendations)
  @JoinColumn({ name: "strategyId" })
  strategy: Strategy;

  @ManyToOne(() => Stock, (stock) => stock.recommendations)
  @JoinColumn({ name: "stockId" })
  stock: Stock;
}