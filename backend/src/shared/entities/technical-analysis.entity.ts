import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from "typeorm";
import { Stock } from "./stock.entity";

/**
 * 技术分析数据实体
 */
@Entity("technical_analysis", { 
  comment: '技术分析数据表：存储各种技术指标的计算结果' 
})
@Unique(["stockId", "date"])
export class TechnicalAnalysis {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ comment: '股票ID' })
  stockId: string;

  @Column({ length: 20, comment: '股票代码' })
  symbol: string;

  @Column({ type: "date", comment: '分析日期' })
  date: Date;

  @Column({ type: "decimal", precision: 5, scale: 2, nullable: true, comment: 'RSI指标' })
  rsi?: number;

  @Column({ type: "decimal", precision: 8, scale: 4, nullable: true, comment: 'MACD值' })
  macd?: number;

  @Column({ type: "decimal", precision: 8, scale: 4, nullable: true, comment: 'MACD信号线' })
  macdSignal?: number;

  @Column({ type: "decimal", precision: 8, scale: 4, nullable: true, comment: 'MACD柱状图' })
  macdHistogram?: number;

  @Column({ type: "decimal", precision: 10, scale: 4, nullable: true, comment: '5日均线' })
  ma5?: number;

  @Column({ type: "decimal", precision: 10, scale: 4, nullable: true, comment: '10日均线' })
  ma10?: number;

  @Column({ type: "decimal", precision: 10, scale: 4, nullable: true, comment: '20日均线' })
  ma20?: number;

  @Column({ type: "decimal", precision: 10, scale: 4, nullable: true, comment: '50日均线' })
  ma50?: number;

  @Column({ type: "decimal", precision: 10, scale: 4, nullable: true, comment: '200日均线' })
  ma200?: number;

  @Column({ type: "decimal", precision: 10, scale: 4, nullable: true, comment: '支撑位' })
  supportLevel?: number;

  @Column({ type: "decimal", precision: 10, scale: 4, nullable: true, comment: '阻力位' })
  resistanceLevel?: number;

  @Column({
    type: "enum",
    enum: ["bullish", "bearish", "neutral"],
    nullable: true,
    comment: '趋势方向'
  })
  trend?: "bullish" | "bearish" | "neutral";

  @Column({
    type: "enum",
    enum: ["strong", "moderate", "weak"],
    nullable: true,
    comment: '趋势强度'
  })
  strength?: "strong" | "moderate" | "weak";

  @Column({ type: "decimal", precision: 10, scale: 4, nullable: true, comment: '布林带上轨' })
  bollingerUpper?: number;

  @Column({ type: "decimal", precision: 10, scale: 4, nullable: true, comment: '布林带中轨' })
  bollingerMiddle?: number;

  @Column({ type: "decimal", precision: 10, scale: 4, nullable: true, comment: '布林带下轨' })
  bollingerLower?: number;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;

  // 关联关系
  @ManyToOne(() => Stock, (stock) => stock.technicalAnalysis)
  @JoinColumn({ name: "stockId" })
  stock: Stock;
}