import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./user.entity";
import { Strategy } from "./strategy.entity";

/**
 * 回测历史实体
 * 用于存储用户执行回测的历史记录，包括回测配置、结果、状态等信息
 * 支持回测任务的状态跟踪和结果查询
 */
@Entity("backtest_history", {
  comment:
    "回测历史表：存储用户执行回测的历史记录，包括回测配置、结果、状态等信息",
})
export class BacktestHistory {
  /**
   * 回测记录唯一标识符
   * 使用UUID格式，确保全局唯一性
   */
  @PrimaryGeneratedColumn("uuid")
  id: string;

  /**
   * 回测配置
   * 存储回测的参数配置，包括时间范围、初始资金、交易规则等
   */
  @Column({ type: "json", comment: "回测配置参数（JSON格式）" })
  config: any;

  /**
   * 回测结果
   * 存储回测的详细结果数据，包括收益率、最大回撤、夏普比率等指标
   */
  @Column({ type: "json", nullable: true, comment: "回测结果数据（JSON格式）" })
  results?: any;

  /**
   * 回测状态
   * 标识回测任务的执行状态
   */
  @Column({
    type: "enum",
    enum: ["running", "completed", "failed"],
    default: "running",
    comment: "回测状态：running-运行中，completed-已完成，failed-失败",
  })
  status: "running" | "completed" | "failed";

  /**
   * 错误信息
   * 当回测失败时，存储具体的错误信息
   */
  @Column({ nullable: true, type: "text", comment: "回测失败时的错误信息" })
  errorMessage?: string;

  /**
   * 回测耗时
   * 记录回测任务的执行时间，单位为秒
   */
  @Column({ type: "int", nullable: true, comment: "回测耗时（秒）" })
  duration?: number;

  /**
   * 回测创建时间
   * 自动生成，记录回测任务的创建时间
   */
  @CreateDateColumn({ comment: "回测任务创建时间" })
  createdAt: Date;

  // ================== 关联关系 ==================

  /**
   * 执行回测的用户
   * 多对一关系，多个回测记录可以属于同一个用户
   */
  @ManyToOne(() => User, (user) => user.backtestHistory)
  @JoinColumn({ name: "userId" })
  user: User;

  /**
   * 执行回测的用户ID
   * 外键，关联到用户表
   */
  @Column({ comment: "执行回测的用户ID" })
  userId: string;

  /**
   * 回测使用的策略
   * 多对一关系，多个回测记录可以使用同一个策略
   */
  @ManyToOne(() => Strategy, (strategy) => strategy.backtestHistory)
  @JoinColumn({ name: "strategyId" })
  strategy: Strategy;

  /**
   * 回测使用的策略ID
   * 外键，关联到策略表
   */
  @Column({ comment: "回测使用的策略ID" })
  strategyId: string;

  /**
   * 交易规则配置
   * 存储买卖条件、止损止盈等交易规则
   */
  @Column({
    name: "tradingRules",
    type: "json",
    nullable: true,
    comment: "交易规则配置（JSON格式）",
  })
  tradingRules?: any;

  /**
   * 滑点设置
   * 模拟实际交易中的价格滑点
   */
  @Column({
    name: "slippage",
    type: "decimal",
    precision: 10,
    scale: 6,
    default: 0.001,
    comment: "滑点设置",
  })
  slippage?: number;

  /**
   * 最小交易金额
   * 设置单笔交易的最小金额限制
   */
  @Column({
    name: "minTradeAmount",
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 1000,
    comment: "最小交易金额",
  })
  minTradeAmount?: number;

  // ================== 回测结果指标字段 ==================

  /**
   * 总收益率
   * 回测期间的总收益率，用于排序和筛选
   */
  @Column({
    name: "totalReturn",
    type: "decimal",
    precision: 10,
    scale: 6,
    nullable: true,
    comment: "总收益率",
  })
  totalReturn?: number;

  /**
   * 年化收益率
   * 按年化计算的收益率
   */
  @Column({
    name: "annualReturn",
    type: "decimal",
    precision: 10,
    scale: 6,
    nullable: true,
    comment: "年化收益率",
  })
  annualReturn?: number;

  /**
   * 夏普比率
   * 风险调整后的收益指标
   */
  @Column({
    name: "sharpeRatio",
    type: "decimal",
    precision: 10,
    scale: 6,
    nullable: true,
    comment: "夏普比率",
  })
  sharpeRatio?: number;

  /**
   * 最大回撤
   * 回测期间的最大回撤幅度
   */
  @Column({
    name: "maxDrawdown",
    type: "decimal",
    precision: 10,
    scale: 6,
    nullable: true,
    comment: "最大回撤",
  })
  maxDrawdown?: number;

  /**
   * 胜率
   * 盈利交易占总交易的比例
   */
  @Column({
    name: "winRate",
    type: "decimal",
    precision: 10,
    scale: 6,
    nullable: true,
    comment: "胜率",
  })
  winRate?: number;

  /**
   * 总交易次数
   * 回测期间的总交易次数
   */
  @Column({
    name: "totalTrades",
    type: "int",
    nullable: true,
    comment: "总交易次数",
  })
  totalTrades?: number;

  /**
   * 平均持仓天数
   * 平均每笔交易的持仓天数
   */
  @Column({
    name: "avgHoldingDays",
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
    comment: "平均持仓天数",
  })
  avgHoldingDays?: number;

  /**
   * 波动率
   * 收益率的标准差，衡量风险
   */
  @Column({
    name: "volatility",
    type: "decimal",
    precision: 10,
    scale: 6,
    nullable: true,
    comment: "波动率",
  })
  volatility?: number;

  /**
   * 信息比率
   * 超额收益与跟踪误差的比值
   */
  @Column({
    name: "informationRatio",
    type: "decimal",
    precision: 10,
    scale: 6,
    nullable: true,
    comment: "信息比率",
  })
  informationRatio?: number;

  /**
   * 索提诺比率
   * 只考虑下行风险的风险调整收益指标
   */
  @Column({
    name: "sortinoRatio",
    type: "decimal",
    precision: 10,
    scale: 6,
    nullable: true,
    comment: "索提诺比率",
  })
  sortinoRatio?: number;
}
