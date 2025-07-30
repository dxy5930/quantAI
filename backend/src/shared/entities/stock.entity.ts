import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";

/**
 * 股票基础信息实体
 */
@Entity("stocks", { 
  comment: '股票基础信息表：系统主表，存储股票的基本信息和关联关系' 
})
export class Stock {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 20, unique: true, comment: "股票代码" })
  symbol: string;

  @Column({ length: 100, comment: "股票名称" })
  name: string;

  @Column({ length: 50, nullable: true, comment: "所属行业" })
  sector?: string;

  @Column({ length: 100, nullable: true, comment: "所属子行业" })
  industry?: string;

  @Column({ type: "bigint", nullable: true, comment: "市值" })
  marketCap?: number;

  @Column({ length: 20, nullable: true, comment: "交易所" })
  exchange?: string;

  @Column({ length: 10, default: "USD", comment: "货币单位" })
  currency: string;

  @Column({ length: 50, nullable: true, comment: "所属国家" })
  country?: string;

  @Column({ default: true, comment: "是否活跃交易" })
  isActive: boolean;

  @CreateDateColumn({ comment: "创建时间" })
  createdAt: Date;

  @UpdateDateColumn({ comment: "更新时间" })
  updatedAt: Date;

  // 关联关系
  @OneToMany(
    "StockRecommendation",
    (recommendation: any) => recommendation.stock
  )
  recommendations: any[];

  @OneToMany("BacktestStock", (backtestStock: any) => backtestStock.stock)
  backtestStocks: any[];

  @OneToMany("StockPriceHistory", (priceHistory: any) => priceHistory.stock)
  priceHistory: any[];

  @OneToMany(
    "TechnicalAnalysis",
    (technicalAnalysis: any) => technicalAnalysis.stock
  )
  technicalAnalysis: any[];

  @OneToMany(
    "FundamentalAnalysis",
    (fundamentalAnalysis: any) => fundamentalAnalysis.stock
  )
  fundamentalAnalysis: any[];
}
