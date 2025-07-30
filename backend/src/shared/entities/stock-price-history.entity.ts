import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from "typeorm";
import { Stock } from "./stock.entity";

/**
 * 股票价格历史实体
 */
@Entity("stock_price_history", { 
  comment: '股票价格历史表：存储股票的历史价格数据用于技术分析' 
})
@Unique(["stockId", "date"])
export class StockPriceHistory {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ comment: '股票ID' })
  stockId: string;

  @Column({ length: 20, comment: '股票代码' })
  symbol: string;

  @Column({ type: "date", comment: '日期' })
  date: Date;

  @Column({ type: "decimal", precision: 10, scale: 4, nullable: true, comment: '开盘价' })
  openPrice?: number;

  @Column({ type: "decimal", precision: 10, scale: 4, nullable: true, comment: '最高价' })
  highPrice?: number;

  @Column({ type: "decimal", precision: 10, scale: 4, nullable: true, comment: '最低价' })
  lowPrice?: number;

  @Column({ type: "decimal", precision: 10, scale: 4, comment: '收盘价' })
  closePrice: number;

  @Column({ type: "bigint", nullable: true, comment: '成交量' })
  volume?: number;

  @Column({ type: "decimal", precision: 10, scale: 4, nullable: true, comment: '调整后收盘价' })
  adjClose?: number;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  // 关联关系
  @ManyToOne(() => Stock, (stock) => stock.priceHistory)
  @JoinColumn({ name: "stockId" })
  stock: Stock;
}