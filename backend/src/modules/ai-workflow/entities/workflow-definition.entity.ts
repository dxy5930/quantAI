import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * AI工作流定义实体
 * 存储用户创建的工作流模板、配置信息和版本管理数据
 */
@Entity('workflow_definitions', {
  comment: 'AI工作流定义表 - 存储用户创建的工作流模板、配置信息和版本管理数据'
})
@Index(['userId', 'createdAt'])
@Index(['status'])
export class WorkflowDefinition {
  /** 工作流定义唯一标识符，使用UUID格式，作为主键 */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 工作流名称，用户自定义的工作流标题，最大255字符 */
  @Column({ 
    type: 'varchar', 
    length: 255,
    comment: '工作流名称，用户自定义的工作流标题，最大255字符'
  })
  name: string;

  /** 工作流描述，详细说明工作流的用途、功能和使用场景 */
  @Column({ 
    type: 'text', 
    nullable: true,
    comment: '工作流描述，详细说明工作流的用途、功能和使用场景'
  })
  description: string;

  /** 创建者用户ID，关联users表的主键，支持匿名用户（null值） */
  @Column({ 
    type: 'uuid', 
    nullable: true,
    comment: '创建者用户ID，关联users表的主键，支持匿名用户（null值）'
  })
  userId: string;

  /** 工作流状态：draft-草稿状态，active-已激活可运行，archived-已归档，deleted-已删除 */
  @Column({ 
    type: 'varchar', 
    length: 50, 
    default: 'draft',
    comment: '工作流状态：draft-草稿状态，active-已激活可运行，archived-已归档，deleted-已删除'
  })
  status: string;

  /** 工作流分类标签：如技术分析、基本面分析、风险管理、策略生成、数据处理等 */
  @Column({ 
    type: 'varchar', 
    length: 100, 
    nullable: true,
    comment: '工作流分类标签：如技术分析、基本面分析、风险管理、策略生成、数据处理等'
  })
  category: string;

  /** 工作流节点配置，JSON格式存储所有节点的详细信息：类型、参数、位置等 */
  @Column({ 
    type: 'json',
    comment: '工作流节点配置，JSON格式存储所有节点的详细信息：类型、参数、位置等'
  })
  nodes: any[];

  /** 节点连接关系，JSON格式定义节点间的数据流向和执行顺序 */
  @Column({ 
    type: 'json',
    comment: '节点连接关系，JSON格式定义节点间的数据流向和执行顺序'
  })
  connections: any[];

  /** 工作流全局配置参数，JSON格式存储执行超时、并发数、错误处理策略等 */
  @Column({ 
    type: 'json', 
    nullable: true,
    comment: '工作流全局配置参数，JSON格式存储执行超时、并发数、错误处理策略等'
  })
  config: Record<string, any>;

  /** 工作流元数据，JSON格式包括标签、作者信息、使用说明、更新日志等 */
  @Column({ 
    type: 'json', 
    nullable: true,
    comment: '工作流元数据，JSON格式包括标签、作者信息、使用说明、更新日志等'
  })
  metadata: Record<string, any>;

  /** 是否为模板：false-普通工作流（用户自用），true-可复用模板（供他人使用） */
  @Column({ 
    type: 'boolean', 
    default: false,
    comment: '是否为模板：false-普通工作流（用户自用），true-可复用模板（供他人使用）'
  })
  isTemplate: boolean;

  /** 是否公开：false-私有（仅创建者可见），true-公开（所有用户可见和使用） */
  @Column({ 
    type: 'boolean', 
    default: false,
    comment: '是否公开：false-私有（仅创建者可见），true-公开（所有用户可见和使用）'
  })
  isPublic: boolean;

  /** 版本号，用于工作流版本控制，每次修改后递增 */
  @Column({ 
    type: 'int', 
    default: 0,
    comment: '版本号，用于工作流版本控制，每次修改后递增'
  })
  version: number;

  /** 父工作流ID，用于版本继承关系，指向原始版本的工作流ID */
  @Column({ 
    type: 'uuid', 
    nullable: true,
    comment: '父工作流ID，用于版本继承关系，指向原始版本的工作流ID'
  })
  parentId: string;

  /** 标签列表，逗号分隔的关键词，用于搜索和分类，如"股票,技术分析,MACD" */
  @Column({ 
    type: 'simple-array', 
    nullable: true,
    comment: '标签列表，逗号分隔的关键词，用于搜索和分类'
  })
  tags: string[];

  /** 创建时间，记录工作流首次创建的时间戳 */
  @CreateDateColumn({
    comment: '创建时间，记录工作流首次创建的时间戳'
  })
  createdAt: Date;

  /** 最后更新时间，记录工作流最后一次修改的时间戳 */
  @UpdateDateColumn({
    comment: '最后更新时间，记录工作流最后一次修改的时间戳'
  })
  updatedAt: Date;
}