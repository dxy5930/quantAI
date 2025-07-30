import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('stock_performance', { 
  comment: '股票收益率表：存储股票在不同时间周期的收益率和绩效指标数据' 
})
@Index(['symbol', 'period'], { unique: true })
export class StockPerformance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 20, comment: '股票代码' })
  @Index()
  symbol: string;

  @Column({ length: 100, comment: '股票名称' })
  name: string;

  @Column({ length: 10, comment: '时间周期(1m,3m,6m,1y,2y,3y,5y)' })
  @Index()
  period: string;

  @Column({ type: 'date', comment: '计算基准日期' })
  @Index()
  baseDate: string;

  @Column({ type: 'date', comment: '数据更新日期' })
  updateDate: string;

  // ========== 收益率指标 ==========
  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true, comment: '总收益率(%)' })
  totalReturn: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true, comment: '年化收益率(%)' })
  annualizedReturn: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true, comment: '累计收益率(%)' })
  cumulativeReturn: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true, comment: '复合年增长率CAGR(%)' })
  cagr: number;

  // ========== 风险指标 ==========
  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true, comment: '最大回撤(%)' })
  maxDrawdown: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true, comment: '波动率(%)' })
  volatility: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true, comment: '下行风险(%)' })
  downwardRisk: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true, comment: 'VaR风险价值(%)' })
  var95: number;

  // ========== 风险调整收益指标 ==========
  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true, comment: '夏普比率' })
  sharpeRatio: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true, comment: '索提诺比率' })
  sortinoRatio: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true, comment: '卡尔马比率' })
  calmarRatio: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true, comment: '信息比率' })
  informationRatio: number;

  // ========== 基准比较 ==========
  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true, comment: '相对基准收益率(%)' })
  relativeReturn: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true, comment: 'Beta系数' })
  beta: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true, comment: 'Alpha系数' })
  alpha: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true, comment: '跟踪误差(%)' })
  trackingError: number;

  // ========== 价格指标 ==========
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: '期初价格' })
  startPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: '期末价格' })
  endPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: '最高价格' })
  highestPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: '最低价格' })
  lowestPrice: number;

  // ========== 统计指标 ==========
  @Column({ type: 'int', nullable: true, comment: '交易日数量' })
  tradingDays: number;

  @Column({ type: 'int', nullable: true, comment: '上涨天数' })
  upDays: number;

  @Column({ type: 'int', nullable: true, comment: '下跌天数' })
  downDays: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true, comment: '胜率(%)' })
  winRate: number;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
} 