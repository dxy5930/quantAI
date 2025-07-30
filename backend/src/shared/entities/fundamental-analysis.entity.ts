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
 * 基本面分析数据实体
 */
@Entity("fundamental_analysis", { 
  comment: '基本面分析数据表：存储财务比率和基本面分析指标' 
})
@Unique(["stockId", "reportDate"])
export class FundamentalAnalysis {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ comment: '股票ID' })
  stockId: string;

  @Column({ length: 20, comment: '股票代码' })
  symbol: string;

  @Column({ type: "date", comment: '报告日期' })
  reportDate: Date;

  @Column({ type: "decimal", precision: 8, scale: 2, nullable: true, comment: '市盈率' })
  peRatio?: number;

  @Column({ type: "decimal", precision: 8, scale: 2, nullable: true, comment: '市净率' })
  pbRatio?: number;

  @Column({ type: "decimal", precision: 8, scale: 2, nullable: true, comment: '市销率' })
  psRatio?: number;

  @Column({ type: "decimal", precision: 8, scale: 4, nullable: true, comment: '净资产收益率' })
  roe?: number;

  @Column({ type: "decimal", precision: 8, scale: 4, nullable: true, comment: '总资产收益率' })
  roa?: number;

  @Column({ type: "decimal", precision: 8, scale: 4, nullable: true, comment: '负债权益比' })
  debtToEquity?: number;

  @Column({ type: "decimal", precision: 8, scale: 4, nullable: true, comment: '流动比率' })
  currentRatio?: number;

  @Column({ type: "decimal", precision: 8, scale: 4, nullable: true, comment: '速动比率' })
  quickRatio?: number;

  @Column({ type: "decimal", precision: 8, scale: 4, nullable: true, comment: '毛利率' })
  grossMargin?: number;

  @Column({ type: "decimal", precision: 8, scale: 4, nullable: true, comment: '营业利润率' })
  operatingMargin?: number;

  @Column({ type: "decimal", precision: 8, scale: 4, nullable: true, comment: '净利润率' })
  netMargin?: number;

  @Column({ type: "bigint", nullable: true, comment: '营业收入' })
  revenue?: number;

  @Column({ type: "bigint", nullable: true, comment: '净利润' })
  netIncome?: number;

  @Column({ type: "bigint", nullable: true, comment: '总资产' })
  totalAssets?: number;

  @Column({ type: "bigint", nullable: true, comment: '股东权益' })
  totalEquity?: number;

  @Column({ type: "bigint", nullable: true, comment: '自由现金流' })
  freeCashFlow?: number;

  @Column({ type: "decimal", precision: 6, scale: 4, nullable: true, comment: '股息率' })
  dividendYield?: number;

  @Column({ type: "decimal", precision: 6, scale: 4, nullable: true, comment: '派息比率' })
  payoutRatio?: number;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;

  // 关联关系
  @ManyToOne(() => Stock, (stock) => stock.fundamentalAnalysis)
  @JoinColumn({ name: "stockId" })
  stock: Stock;
}