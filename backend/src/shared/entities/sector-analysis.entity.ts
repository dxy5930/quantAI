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
 * 行业分析数据实体
 */
@Entity("sector_analysis", { 
  comment: '行业分析数据表：存储按行业分类的分析结果' 
})
export class SectorAnalysis {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ comment: '策略ID' })
  strategyId: string;

  @Column({ length: 50, comment: '行业名称' })
  sector: string;

  @Column({ type: "int", default: 0, comment: '股票数量' })
  stockCount: number;

  @Column({ type: "decimal", precision: 5, scale: 2, nullable: true, comment: '平均评分' })
  avgScore?: number;

  @Column({ type: "decimal", precision: 8, scale: 4, nullable: true, comment: '平均收益率' })
  avgReturn?: number;

  @Column({ type: "decimal", precision: 5, scale: 4, nullable: true, comment: '权重' })
  weight?: number;

  @Column({
    type: "enum",
    enum: ["low", "medium", "high"],
    nullable: true,
    comment: '风险等级'
  })
  riskLevel?: "low" | "medium" | "high";

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;

  // 关联关系
  @ManyToOne(() => Strategy, (strategy) => strategy.sectorAnalysis)
  @JoinColumn({ name: "strategyId" })
  strategy: Strategy;
}