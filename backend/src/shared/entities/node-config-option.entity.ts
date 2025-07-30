import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { NodeConfigField } from './node-config-field.entity';

@Entity('node_config_options', { comment: '节点配置选项表 - 定义select和multiselect类型字段的可选项' })
export class NodeConfigOption {
  @PrimaryGeneratedColumn({ comment: '主键ID' })
  id: number;

  @Column({ 
    type: 'bigint', 
    name: 'config_field_id',
    comment: '关联的配置字段ID'
  })
  configFieldId: number;

  @Column({ 
    type: 'varchar', 
    length: 100, 
    name: 'option_value',
    comment: '选项值，用于表单提交和数据存储'
  })
  optionValue: string;

  @Column({ 
    type: 'varchar', 
    length: 100, 
    name: 'option_label',
    comment: '选项显示标签'
  })
  optionLabel: string;

  @Column({ 
    type: 'text', 
    nullable: true, 
    name: 'option_description',
    comment: '选项描述信息'
  })
  optionDescription: string;

  @Column({ 
    type: 'int', 
    default: 0, 
    name: 'sort_order',
    comment: '排序顺序，数值越小越靠前'
  })
  sortOrder: number;

  @Column({ 
    type: 'boolean', 
    default: true, 
    name: 'is_active',
    comment: '是否启用此选项'
  })
  isActive: boolean;

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

  @ManyToOne(() => NodeConfigField, configField => configField.options)
  @JoinColumn({ name: 'config_field_id' })
  configField: NodeConfigField;
} 