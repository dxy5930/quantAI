import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('stock_financial', { 
  comment: '股票财务数据表：存储上市公司的财务报表数据，包括资产负债表、利润表、现金流量表等' 
})
@Index(['symbol', 'reportDate'], { unique: true })
export class StockFinancial {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 20, comment: '股票代码' })
  @Index()
  symbol: string;

  @Column({ length: 100, comment: '股票名称' })
  name: string;

  @Column({ type: 'date', comment: '报告期' })
  @Index()
  reportDate: string;

  @Column({ length: 20, comment: '报告类型', default: 'annual' }) // annual, semi-annual, quarterly
  reportType: string;

  // ========== 资产负债表 ==========
  @Column({ type: 'decimal', precision: 20, scale: 2, comment: '总资产(元)', nullable: true })
  totalAssets: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, comment: '流动资产(元)', nullable: true })
  currentAssets: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, comment: '非流动资产(元)', nullable: true })
  nonCurrentAssets: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, comment: '货币资金(元)', nullable: true })
  cash: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, comment: '应收账款(元)', nullable: true })
  accountsReceivable: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, comment: '存货(元)', nullable: true })
  inventory: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, comment: '固定资产(元)', nullable: true })
  fixedAssets: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, comment: '总负债(元)', nullable: true })
  totalLiabilities: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, comment: '流动负债(元)', nullable: true })
  currentLiabilities: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, comment: '非流动负债(元)', nullable: true })
  nonCurrentLiabilities: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, comment: '股东权益(元)', nullable: true })
  shareholdersEquity: number;

  // ========== 利润表 ==========
  @Column({ type: 'decimal', precision: 20, scale: 2, comment: '营业收入(元)', nullable: true })
  revenue: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, comment: '营业成本(元)', nullable: true })
  operatingCosts: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, comment: '营业利润(元)', nullable: true })
  operatingProfit: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, comment: '利润总额(元)', nullable: true })
  totalProfit: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, comment: '净利润(元)', nullable: true })
  netProfit: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, comment: '归母净利润(元)', nullable: true })
  netProfitAttributable: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, comment: '扣非净利润(元)', nullable: true })
  netProfitDeducted: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, comment: '基本每股收益(元)', nullable: true })
  basicEPS: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, comment: '稀释每股收益(元)', nullable: true })
  dilutedEPS: number;

  // ========== 现金流量表 ==========
  @Column({ type: 'decimal', precision: 20, scale: 2, comment: '经营活动现金流(元)', nullable: true })
  operatingCashFlow: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, comment: '投资活动现金流(元)', nullable: true })
  investingCashFlow: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, comment: '筹资活动现金流(元)', nullable: true })
  financingCashFlow: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, comment: '现金净增加额(元)', nullable: true })
  netCashIncrease: number;

  // ========== 财务比率 ==========
  @Column({ type: 'decimal', precision: 10, scale: 4, comment: '资产负债率(%)', nullable: true })
  debtToAssetRatio: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, comment: '流动比率', nullable: true })
  currentRatio: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, comment: '速动比率', nullable: true })
  quickRatio: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, comment: '净资产收益率(%)', nullable: true })
  roe: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, comment: '总资产收益率(%)', nullable: true })
  roa: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, comment: '毛利率(%)', nullable: true })
  grossMargin: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, comment: '净利率(%)', nullable: true })
  netMargin: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, comment: '营业收入增长率(%)', nullable: true })
  revenueGrowthRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, comment: '净利润增长率(%)', nullable: true })
  netProfitGrowthRate: number;

  // ========== 估值指标 ==========
  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '市盈率(PE)', nullable: true })
  peRatio: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '市净率(PB)', nullable: true })
  pbRatio: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '市销率(PS)', nullable: true })
  psRatio: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '市现率(PCF)', nullable: true })
  pcfRatio: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, comment: '股息率(%)', nullable: true })
  dividendYield: number;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
}