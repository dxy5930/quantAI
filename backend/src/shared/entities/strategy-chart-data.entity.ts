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

/**
 * 策略图表数据实体
 */
@Entity("strategy_chart_data", { 
  comment: '策略图表数据表：存储回测结果的各种图表数据' 
})
export class StrategyChartData {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ comment: '策略ID' })
  strategyId: string;

  @Column({
    type: "enum",
    enum: [
      "equity",
      "drawdown", 
      "returns",
      "performance",
      "stock_performance",
      "sector_analysis",
      "risk_metrics",
      "selection_history"
    ],
    comment: '图表类型'
  })
  chartType: "equity" | "drawdown" | "returns" | "performance" | "stock_performance" | "sector_analysis" | "risk_metrics" | "selection_history";

  @Column({ length: 10, comment: '时间周期' })
  period: string;

  @Column({ type: "date", comment: '数据日期' })
  dataDate: Date;

  @Column({ type: "json", comment: '图表数据值' })
  dataValue: any;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;

  // 关联关系
  @ManyToOne(() => Strategy, (strategy) => strategy.chartData)
  @JoinColumn({ name: "strategyId" })
  strategy: Strategy;
}