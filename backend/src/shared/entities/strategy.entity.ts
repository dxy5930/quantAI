import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { User } from "./user.entity";
import { BacktestHistory } from "./backtest-history.entity";
import { StockRecommendation } from "./stock-recommendation.entity";
import { BacktestStock } from "./backtest-stock.entity";
import { StrategyChartData } from "./strategy-chart-data.entity";
import { SectorAnalysis } from "./sector-analysis.entity";
import { STRATEGY_CONSTANTS } from "../constants";

/**
 * 策略实体
 * 用于存储用户创建的交易策略信息，包括选股策略和回测策略
 * 支持策略的分享、评分、使用统计等功能
 */
@Entity("strategies", { 
  comment: '策略信息表：存储用户创建的交易策略信息，包括选股策略和回测策略' 
})
export class Strategy {
  /**
   * 策略唯一标识符
   * 使用UUID格式，确保全局唯一性
   */
  @PrimaryGeneratedColumn("uuid")
  id: string;

  /**
   * 策略名称
   * 用户自定义的策略名称，用于标识和显示
   */
  @Column({ length: STRATEGY_CONSTANTS.NAME_MAX_LENGTH, comment: '策略名称' })
  name: string;

  /**
   * 策略描述
   * 详细描述策略的逻辑、用途和特点
   */
  @Column({ type: "text", comment: '策略详细描述' })
  description: string;

  /**
   * 策略图标
   * 用于在界面中显示的图标标识
   */
  @Column({ length: STRATEGY_CONSTANTS.ICON_MAX_LENGTH, comment: '策略图标标识' })
  icon: string;

  /**
   * 策略分类
   * 用于对策略进行分类管理
   */
  @Column({ length: STRATEGY_CONSTANTS.CATEGORY_MAX_LENGTH, comment: '策略分类' })
  category: string;

  /**
   * 策略类型
   * 区分选股策略和回测策略
   */
  @Column({
    type: "enum",
    enum: [STRATEGY_CONSTANTS.TYPES.STOCK_SELECTION, STRATEGY_CONSTANTS.TYPES.BACKTEST],
    comment: '策略类型：stock_selection-选股策略，backtest-回测策略'
  })
  strategyType: "stock_selection" | "backtest";

  /**
   * 策略难度等级
   * 用于标识策略的复杂程度
   */
  @Column({
    type: "enum",
    enum: [STRATEGY_CONSTANTS.DIFFICULTIES.EASY, STRATEGY_CONSTANTS.DIFFICULTIES.MEDIUM, STRATEGY_CONSTANTS.DIFFICULTIES.HARD],
    default: STRATEGY_CONSTANTS.DIFFICULTIES.MEDIUM,
    comment: '策略难度等级：easy-简单，medium-中等，hard-困难'
  })
  difficulty: "easy" | "medium" | "hard";

  /**
   * 策略热度
   * 用于排序和推荐，数值越高表示越受欢迎
   */
  @Column({ type: "int", default: 0, comment: '策略热度值，用于排序和推荐' })
  popularity: number;

  /**
   * 策略参数配置
   * 存储策略的参数设置，JSON格式
   */
  @Column({ type: "json", comment: '策略参数配置（JSON格式）' })
  parameters: any[];

  /**
   * 策略标签
   * 用于标记策略的特征和属性
   */
  @Column({ type: "json", nullable: true, comment: '策略标签列表' })
  tags?: string[];

  /**
   * 是否公开
   * 控制策略是否在公共策略库中显示
   */
  @Column({ default: false, comment: '是否公开显示策略' })
  isPublic: boolean;

  /**
   * 是否已分享
   * 标识策略是否已被分享给其他用户
   */
  @Column({ default: false, comment: '是否已分享策略' })
  isShared: boolean;

  /**
   * 分享ID
   * 用于生成分享链接的唯一标识
   */
  @Column({ nullable: true, unique: true, comment: '策略分享的唯一标识' })
  shareId?: string;

  /**
   * 分享时间
   * 记录策略首次分享的时间
   */
  @Column({ nullable: true, comment: '策略分享时间' })
  sharedAt?: Date;

  /**
   * 点赞数量
   * 用户对策略的点赞统计
   */
  @Column({ type: "int", default: 0, comment: '策略点赞数量' })
  likes: number;

  /**
   * 收藏数量
   * 用户对策略的收藏统计
   */
  @Column({ type: "int", default: 0, comment: '策略收藏数量' })
  favorites: number;

  /**
   * 使用次数
   * 策略被使用的总次数统计
   */
  @Column({ type: "int", default: 0, comment: '策略使用次数统计' })
  usageCount: number;

  /**
   * 策略评分
   * 用户对策略的平均评分（1-5分）
   */
  @Column({ type: "decimal", precision: 3, scale: 2, nullable: true, comment: '策略平均评分（1-5分）' })
  rating?: number;

  // ================== 选股策略专用字段 ==================

  /**
   * 股票推荐结果
   * 选股策略运行后的推荐股票列表
   */
  @Column({ type: "json", nullable: true, comment: '选股策略推荐的股票列表' })
  stockRecommendations?: any[];

  /**
   * 选股条件
   * 定义选股的具体条件和规则
   */
  @Column({ type: "json", nullable: true, comment: '选股条件和规则配置' })
  selectionCriteria?: any;

  /**
   * 最后筛选时间
   * 选股策略最后一次运行的时间
   */
  @Column({ nullable: true, comment: '选股策略最后筛选时间' })
  lastScreeningDate?: Date;

  /**
   * 筛选股票总数
   * 参与筛选的股票总数量
   */
  @Column({ type: "int", nullable: true, comment: '参与筛选的股票总数' })
  totalStocksScreened?: number;

  /**
   * 推荐股票数量
   * 符合条件的推荐股票数量
   */
  @Column({ type: "int", nullable: true, comment: '推荐股票数量' })
  recommendedStocksCount?: number;

  // ================== 回测策略专用字段 ==================

  /**
   * 回测结果
   * 存储回测的详细结果数据
   */
  @Column({ type: "json", nullable: true, comment: '回测结果数据' })
  backtestResults?: any;

  /**
   * 回测时间区间
   * 定义回测的起止时间范围
   */
  @Column({ type: "json", nullable: true, comment: '回测时间区间设置' })
  backtestPeriod?: any;

  /**
   * 回测股票集
   * 存储回测使用的股票集合数据
   */
  @Column({ type: "json", nullable: true, comment: '回测股票集数据' })
  backtestStocks?: any[];

  /**
   * 最后回测时间
   * 策略最后一次回测的时间
   */
  @Column({ nullable: true, comment: '策略最后回测时间' })
  lastBacktestDate?: Date;

  /**
   * 默认交易规则
   * 策略的默认买卖条件和交易规则配置
   */
  @Column({ name: "defaultTradingRules", type: "json", nullable: true, comment: '默认交易规则配置（JSON格式）' })
  defaultTradingRules?: any;

  /**
   * 策略创建时间
   * 自动生成，记录策略创建时间
   */
  @CreateDateColumn({ comment: '策略创建时间' })
  createdAt: Date;

  /**
   * 策略更新时间
   * 自动更新，记录策略最后修改时间
   */
  @UpdateDateColumn({ comment: '策略最后更新时间' })
  updatedAt: Date;

  // ================== 关联关系 ==================

  /**
   * 策略作者
   * 多对一关系，多个策略可以属于同一个用户
   */
  @ManyToOne(() => User, (user) => user.strategies)
  @JoinColumn({ name: "authorId" })
  author: User;

  /**
   * 策略作者ID
   * 外键，关联到用户表
   */
  @Column({ comment: '策略作者用户ID' })
  authorId: string;

  /**
   * 策略回测历史
   * 一对多关系，一个策略可以有多个回测记录
   */
  @OneToMany(() => BacktestHistory, (history) => history.strategy)
  backtestHistory: BacktestHistory[];

  /**
   * 股票推荐关联
   * 一对多关系，一个策略可以有多个股票推荐
   */
  @OneToMany(() => StockRecommendation, (recommendation) => recommendation.strategy)
  stockRecommendationEntities: StockRecommendation[];

  /**
   * 回测股票关联
   * 一对多关系，一个策略可以有多个回测股票
   */
  @OneToMany(() => BacktestStock, (backtestStock) => backtestStock.strategy)
  backtestStockEntities: BacktestStock[];

  /**
   * 策略图表数据
   * 一对多关系，一个策略可以有多个图表数据
   */
  @OneToMany(() => StrategyChartData, (chartData) => chartData.strategy)
  chartData: StrategyChartData[];

  /**
   * 行业分析数据
   * 一对多关系，一个策略可以有多个行业分析数据
   */
  @OneToMany(() => SectorAnalysis, (sectorAnalysis) => sectorAnalysis.strategy)
  sectorAnalysis: SectorAnalysis[];
  publishedAt: Date;
  shareCount: any;
    backtestHistories: any;
}
