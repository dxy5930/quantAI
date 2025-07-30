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
 * 回测股票实体
 */
@Entity("backtest_stocks", { 
  comment: '回测股票表：存储回测中每只股票的详细表现数据' 
})
export class BacktestStock {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ comment: '策略ID' })
  strategyId: string;

  @Column({ comment: '股票ID' })
  stockId: string;

  @Column({ length: 20, comment: '股票代码' })
  symbol: string;

  @Column({ type: "decimal", precision: 6, scale: 2, comment: '权重' })
  weight: number;

  @Column({ type: "decimal", precision: 8, scale: 4, nullable: true, comment: '表现(%)' })
  performance?: number;

  @Column({ type: "decimal", precision: 8, scale: 4, nullable: true, comment: '贡献度' })
  contribution?: number;

  @Column({ type: "int", default: 0, comment: '交易次数' })
  tradesCount: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true, comment: '平均成交价' })
  avgPrice?: number;

  @Column({ type: "decimal", precision: 8, scale: 4, nullable: true, comment: '总收益率' })
  totalReturn?: number;

  @Column({ type: "decimal", precision: 8, scale: 4, nullable: true, comment: '最大回撤' })
  maxDrawdown?: number;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;

  // 关联关系
  @ManyToOne(() => Strategy, (strategy) => strategy.backtestStocks)
  @JoinColumn({ name: "strategyId" })
  strategy: Strategy;

  @ManyToOne(() => Stock, (stock) => stock.backtestStocks)
  @JoinColumn({ name: "stockId" })
  stock: Stock;
}