import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { WorkflowInstance } from './workflow-instance.entity';

export enum StepCategory {
  ANALYSIS = 'analysis',
  STRATEGY = 'strategy',
  GENERAL = 'general',
  RESULT = 'result',
  ERROR = 'error'
}

export enum ResourceType {
  BROWSER = 'browser',
  DATABASE = 'database',
  API = 'api',
  GENERAL = 'general'
}

export enum StepStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

@Entity('workflow_steps')
export class WorkflowStep {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ name: 'workflow_id', type: 'varchar', length: 36 })
  workflowId: string;

  @Column({ name: 'step_number' })
  stepNumber: number;

  @Column({ name: 'step_id', type: 'varchar', length: 255 })
  stepId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'enum',
    enum: StepCategory,
    default: StepCategory.GENERAL
  })
  category: StepCategory;

  @Column({
    name: 'resource_type',
    type: 'enum',
    enum: ResourceType,
    default: ResourceType.GENERAL
  })
  resourceType: ResourceType;

  @Column({
    type: 'enum',
    enum: StepStatus,
    default: StepStatus.PENDING
  })
  status: StepStatus;

  @Column({ name: 'start_time', type: 'timestamp', nullable: true })
  startTime: Date;

  @Column({ name: 'end_time', type: 'timestamp', nullable: true })
  endTime: Date;

  @Column({ name: 'execution_details', type: 'json', nullable: true })
  executionDetails: any;

  @Column({ type: 'json', nullable: true })
  results: any;

  @Column({ type: 'json', nullable: true })
  urls: string[];

  @Column({ type: 'json', nullable: true })
  files: string[];

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // 关联关系
  @ManyToOne(() => WorkflowInstance, workflow => workflow.steps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workflow_id' })
  workflow: WorkflowInstance;
} 