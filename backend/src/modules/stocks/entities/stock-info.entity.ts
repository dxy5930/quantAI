import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('stock_info', { 
  comment: '股票基本信息表：存储A股所有股票的基础信息，包括代码、名称、市值、板块等核心数据' 
})
export class StockInfo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 20, unique: true, comment: '股票代码' })
  symbol: string;

  @Column({ length: 100, comment: '股票名称' })
  name: string;

  @Column({ length: 50, comment: '所属行业' })
  industry: string;

  @Column({ length: 50, comment: '所属板块' })
  sector: string;

  @Column({ length: 20, comment: '上市地点' })
  market: string;

  @Column({ type: 'date', comment: '上市日期' })
  listDate: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, comment: '总市值' })
  marketCap: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, comment: '流通市值' })
  circulationMarketCap: number;

  @Column({ type: 'bigint', comment: '总股本' })
  totalShares: number;

  @Column({ type: 'bigint', comment: '流通股本' })
  circulationShares: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '市盈率(TTM)' })
  peRatio: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '市净率' })
  pbRatio: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '股息率(%)' })
  dividendYield: number;

  @Column({ type: 'boolean', default: true, comment: '是否活跃' })
  isActive: boolean;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
}