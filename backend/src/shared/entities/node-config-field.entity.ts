import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { NodeType } from './node-type.entity';
import { NodeConfigOption } from './node-config-option.entity';

export type FieldType = 'text' | 'number' | 'select' | 'multiselect' | 'boolean' | 'range';

@Entity('node_config_fields', { comment: '节点配置字段表 - 定义各节点类型的配置字段信息' })
export class NodeConfigField {
  @PrimaryGeneratedColumn({ comment: '主键ID' })
  id: number;

  @Column({ 
    type: 'varchar', 
    length: 50, 
    name: 'node_type',
    comment: '关联的节点类型标识符'
  })
  nodeTypeValue: string;

  @Column({ 
    type: 'varchar', 
    length: 100, 
    name: 'field_key',
    comment: '字段键名，用于表单提交和数据存储'
  })
  fieldKey: string;

  @Column({ 
    type: 'varchar', 
    length: 100, 
    name: 'field_name',
    comment: '字段显示名称'
  })
  fieldName: string;

  @Column({
    type: 'enum',
    enum: ['text', 'number', 'select', 'multiselect', 'boolean', 'range'],
    name: 'field_type',
    comment: '字段类型：text-文本框，number-数字输入，select-单选下拉，multiselect-多选下拉，boolean-布尔开关，range-范围选择'
  })
  fieldType: FieldType;

  @Column({ 
    type: 'boolean', 
    default: false, 
    name: 'is_required',
    comment: '是否必填字段'
  })
  isRequired: boolean;

  @Column({ 
    type: 'text', 
    nullable: true, 
    name: 'default_value',
    comment: '默认值'
  })
  defaultValue: string;

  @Column({ 
    type: 'varchar', 
    length: 200, 
    nullable: true,
    comment: '输入框占位符文本'
  })
  placeholder: string;

  @Column({ 
    type: 'text', 
    nullable: true,
    comment: '字段描述和帮助信息'
  })
  description: string;

  @Column({ 
    type: 'int', 
    default: 0, 
    name: 'sort_order',
    comment: '排序顺序，数值越小越靠前'
  })
  sortOrder: number;

  @CreateDateColumn({ 
    name: 'created_at',
    comment: '创建时间'
  })
  createdAt: Date;

  @UpdateDateColumn({ 
    name: 'updated_at',
    comment: '更新时间'
  })
  updatedAt: Date;

  @ManyToOne(() => NodeType, nodeType => nodeType.configFields)
  @JoinColumn({ name: 'node_type', referencedColumnName: 'type' })
  nodeType: NodeType;

  @OneToMany(() => NodeConfigOption, option => option.configField)
  options: NodeConfigOption[];
} 