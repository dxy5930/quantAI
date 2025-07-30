import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { NodeConfigField } from './node-config-field.entity';

@Entity('node_types', { comment: '节点类型表 - 定义AI工作流中各种节点的类型信息' })
export class NodeType {
  @PrimaryGeneratedColumn({ comment: '主键ID' })
  id: number;

  @Column({ 
    type: 'varchar', 
    length: 50, 
    unique: true,
    comment: '节点类型标识符，唯一值，如data_source、filter、analysis等'
  })
  type: string;

  @Column({ 
    type: 'varchar', 
    length: 100,
    comment: '节点类型显示名称'
  })
  name: string;

  @Column({ 
    type: 'text', 
    nullable: true,
    comment: '节点类型描述信息'
  })
  description: string;

  @Column({ 
    type: 'varchar', 
    length: 50, 
    nullable: true,
    comment: '节点图标标识符'
  })
  icon: string;

  @Column({ 
    type: 'varchar', 
    length: 50, 
    nullable: true,
    comment: '节点颜色标识符'
  })
  color: string;

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

  @OneToMany(() => NodeConfigField, configField => configField.nodeType)
  configFields: NodeConfigField[];
} 