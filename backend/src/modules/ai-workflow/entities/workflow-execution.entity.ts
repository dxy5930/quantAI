import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * AI工作流执行记录实体
 * 存储工作流的执行历史、状态跟踪和结果数据
 */
@Entity('workflow_executions', {
  comment: 'AI工作流执行记录表 - 存储工作流的执行历史、状态跟踪和结果数据'
})
@Index(['userId', 'createdAt'])
@Index(['workflowDefinitionId'])
@Index(['status'])
export class WorkflowExecution {
  /** 执行记录唯一标识符，使用UUID格式，作为主键 */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 执行ID，用于前端和Python服务识别的执行标识，支持自定义格式 */
  @Column({ 
    type: 'varchar', 
    length: 255,
    comment: '执行ID，用于前端和Python服务识别的执行标识，支持自定义格式'
  })
  executionId: string;

  /** 关联的工作流定义ID，外键关联workflow_definitions表的id字段 */
  @Column({ 
    type: 'uuid',
    comment: '关联的工作流定义ID，外键关联workflow_definitions表的id字段'
  })
  workflowDefinitionId: string;

  /** 执行用户ID，关联users表的主键，支持匿名执行（null值） */
  @Column({ 
    type: 'uuid', 
    nullable: true,
    comment: '执行用户ID，关联users表的主键，支持匿名执行（null值）'
  })
  userId: string;

  /** 执行状态：running-运行中，completed-已完成，error-执行失败，stopped-用户主动停止 */
  @Column({ 
    type: 'varchar', 
    length: 50, 
    default: 'running',
    comment: '执行状态：running-运行中，completed-已完成，error-执行失败，stopped-用户主动停止'
  })
  status: string;

  /** 执行进度百分比，范围0-100，用于前端显示进度条 */
  @Column({ 
    type: 'int', 
    default: 0,
    comment: '执行进度百分比，范围0-100，用于前端显示进度条'
  })
  progress: number;

  /** 当前正在执行的节点ID，对应workflow_definitions.nodes中的节点标识 */
  @Column({ 
    type: 'varchar', 
    length: 255, 
    nullable: true,
    comment: '当前正在执行的节点ID，对应workflow_definitions.nodes中的节点标识'
  })
  currentNodeId: string;

  /** 所有节点的执行状态详情，JSON格式记录每个节点的运行状态和时间信息 */
  @Column({ 
    type: 'json', 
    nullable: true,
    comment: '所有节点的执行状态详情，JSON格式记录每个节点的运行状态和时间信息'
  })
  nodeStatuses: Record<string, any>;

  /** 各节点的执行结果数据，JSON格式存储每个节点处理后的输出数据 */
  @Column({ 
    type: 'json', 
    nullable: true,
    comment: '各节点的执行结果数据，JSON格式存储每个节点处理后的输出数据'
  })
  nodeResults: Record<string, any>;

  /** 工作流最终执行结果，JSON格式包含整个工作流的输出结果和汇总信息 */
  @Column({ 
    type: 'json', 
    nullable: true,
    comment: '工作流最终执行结果，JSON格式包含整个工作流的输出结果和汇总信息'
  })
  finalResults: Record<string, any>;

  /** 执行上下文信息，JSON格式包括用户偏好、环境参数、输入数据等 */
  @Column({ 
    type: 'json', 
    nullable: true,
    comment: '执行上下文信息，JSON格式包括用户偏好、环境参数、输入数据等'
  })
  executionContext: Record<string, any>;

  /** 错误信息，当执行失败时记录详细的错误描述和堆栈信息 */
  @Column({ 
    type: 'text', 
    nullable: true,
    comment: '错误信息，当执行失败时记录详细的错误描述和堆栈信息'
  })
  errorMessage: string;

  /** 执行日志，JSON数组格式记录详细的执行过程和调试信息 */
  @Column({ 
    type: 'json', 
    nullable: true,
    comment: '执行日志，JSON数组格式记录详细的执行过程和调试信息'
  })
  executionLogs: any[];

  /** 执行开始时间，记录工作流开始执行的精确时间戳 */
  @Column({ 
    type: 'timestamp', 
    nullable: true,
    comment: '执行开始时间，记录工作流开始执行的精确时间戳'
  })
  startTime: Date;

  /** 执行结束时间，记录工作流完成或失败的精确时间戳 */
  @Column({ 
    type: 'timestamp', 
    nullable: true,
    comment: '执行结束时间，记录工作流完成或失败的精确时间戳'
  })
  endTime: Date;

  /** 执行持续时间，单位毫秒，用于性能分析和监控 */
  @Column({ 
    type: 'int', 
    nullable: true,
    comment: '执行持续时间，单位毫秒，用于性能分析和监控'
  })
  durationMs: number;

  /** 记录创建时间，执行记录首次创建的时间戳 */
  @CreateDateColumn({
    comment: '记录创建时间，执行记录首次创建的时间戳'
  })
  createdAt: Date;

  /** 记录更新时间，执行状态最后一次更新的时间戳 */
  @UpdateDateColumn({
    comment: '记录更新时间，执行状态最后一次更新的时间戳'
  })
  updatedAt: Date;
}