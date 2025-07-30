import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('stock_data', { 
  comment: '股票日线交易数据表：存储每只股票每个交易日的OHLC数据、成交量、涨跌幅等交易信息' 
})
// 临时注释掉唯一索引，避免启动时的重复键错误
@Index(['symbol', 'date'], { unique: true })
export class StockData {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 20, unique: true, comment: '股票代码' })
  symbol: string;

  @Column({ length: 100, comment: '股票名称' })
  name: string;

  @Column({ type: 'date', comment: '交易日期' })
  date: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '开盘价' })
  open: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '最高价' })
  high: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '最低价' })
  low: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '收盘价' })
  close: number;

  @Column({ type: 'bigint', comment: '成交量' })
  volume: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, comment: '成交额' })
  amount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, comment: '涨跌幅(%)' })
  changePercent: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '涨跌额' })
  changeAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '换手率(%)' })
  turnoverRate: number;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
}