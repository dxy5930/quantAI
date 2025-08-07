import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { WorkflowStep } from './workflow-step.entity';
import { WorkflowResource } from './workflow-resource.entity';
import { WorkflowMessage } from './workflow-message.entity';

export enum WorkflowStatus {
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PAUSED = 'paused'
}

@Entity('workflow_instances')
export class WorkflowInstance {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ name: 'user_id', nullable: true })
  userId: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: WorkflowStatus,
    default: WorkflowStatus.RUNNING
  })
  status: WorkflowStatus;

  @Column({ name: 'progress_percentage', type: 'decimal', precision: 5, scale: 2, default: 0.00 })
  progressPercentage: number;

  @Column({ name: 'current_step', default: 0 })
  currentStep: number;

  @Column({ name: 'total_steps', default: 0 })
  totalSteps: number;

  @Column({ name: 'start_time', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  startTime: Date;

  @Column({ name: 'end_time', type: 'timestamp', nullable: true })
  endTime: Date;

  @Column({ 
    name: 'last_activity', 
    type: 'timestamp', 
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP'
  })
  lastActivity: Date;

  @Column({ name: 'context_data', type: 'json', nullable: true })
  contextData: any;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // 关联关系
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => WorkflowStep, step => step.workflow, { cascade: true })
  steps: WorkflowStep[];

  @OneToMany(() => WorkflowResource, resource => resource.workflow, { cascade: true })
  resources: WorkflowResource[];

  @OneToMany(() => WorkflowMessage, message => message.workflow, { cascade: true })
  messages: WorkflowMessage[];
} 