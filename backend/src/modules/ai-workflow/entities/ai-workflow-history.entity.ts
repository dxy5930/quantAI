import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../../shared/entities/user.entity';

@Entity('ai_workflow_history')
@Index(['userId', 'createdAt'])
@Index(['status'])
@Index(['workflowType'])
export class AIWorkflowHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workflow_id', unique: true })
  workflowId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'query', type: 'text' })
  query: string;

  @Column({ name: 'workflow_type', default: 'chat_analysis' })
  workflowType: string; // chat_analysis, stock_recommendation, strategy_generation

  @Column({ name: 'status', default: 'running' })
  status: string; // running, completed, error, stopped

  @Column({ name: 'progress', type: 'int', default: 0 })
  progress: number;

  @Column({ name: 'current_agent', nullable: true })
  currentAgent: string;

  @Column({ name: 'agents_status', type: 'json', nullable: true })
  agentsStatus: any; // 智能体状态数组

  @Column({ name: 'results', type: 'json', nullable: true })
  results: any; // 工作流结果

  @Column({ name: 'context', type: 'json', nullable: true })
  context: any; // 用户上下文信息

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @Column({ name: 'start_time', type: 'datetime' })
  startTime: Date;

  @Column({ name: 'end_time', type: 'datetime', nullable: true })
  endTime: Date;

  @Column({ name: 'duration_ms', type: 'int', nullable: true })
  durationMs: number; // 执行时长（毫秒）

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // 关联用户
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}