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

@Entity('ai_chat_history')
@Index(['userId', 'conversationId', 'createdAt'])
@Index(['messageType'])
export class AIChatHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'message_id', unique: true })
  messageId: string;

  @Column({ name: 'conversation_id' })
  conversationId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'message_type' })
  messageType: string; // user, assistant, system

  @Column({ name: 'content', type: 'text' })
  content: string;

  @Column({ name: 'workflow_id', nullable: true })
  workflowId: string; // 关联的工作流ID

  @Column({ name: 'context', type: 'json', nullable: true })
  context: any; // 消息上下文

  @Column({ name: 'metadata', type: 'json', nullable: true })
  metadata: any; // 额外的元数据

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // 关联用户
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}