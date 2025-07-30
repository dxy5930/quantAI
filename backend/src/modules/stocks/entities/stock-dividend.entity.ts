import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('stock_dividend', { 
  comment: '股票分红配股表：存储上市公司的历史分红配股记录，包括现金分红、送股、转增股等' 
})
@Index(['symbol', 'recordDate'], { unique: true })
export class StockDividend {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 20, comment: '股票代码' })
  @Index()
  symbol: string;

  @Column({ length: 100, comment: '股票名称' })
  name: string;

  @Column({ type: 'date', comment: '股权登记日' })
  @Index()
  recordDate: string;

  @Column({ type: 'date', comment: '除权除息日', nullable: true })
  exDividendDate: string;

  @Column({ type: 'date', comment: '派息日', nullable: true })
  paymentDate: string;

  @Column({ type: 'decimal', precision: 10, scale: 4, comment: '每股派息(元)', nullable: true })
  cashDividendPerShare: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, comment: '每股送股(股)', nullable: true })
  stockDividendPerShare: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, comment: '每股转增(股)', nullable: true })
  capitalReservePerShare: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, comment: '分红总额(元)', nullable: true })
  totalDividend: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, comment: '股息率(%)', nullable: true })
  dividendYield: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '除权前价格(元)', nullable: true })
  priceBeforeEx: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '除权后价格(元)', nullable: true })
  priceAfterEx: number;

  @Column({ length: 200, comment: '分红方案', nullable: true })
  dividendPlan: string;

  @Column({ length: 50, comment: '分红状态', nullable: true }) // 预案、实施、完成
  status: string;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
}