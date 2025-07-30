import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('strategy_types', { 
  comment: '策略类型表：定义系统支持的策略类型及其配置' 
})
export class StrategyType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50, comment: '类型值（如stock_selection）' })
  value: string;

  @Column({ length: 50, comment: '类型显示名' })
  label: string;

  @Column({ type: 'text', nullable: true, comment: '类型描述' })
  description?: string;

  @Column({ type: 'int', default: 0, comment: '排序' })
  order: number;
} 