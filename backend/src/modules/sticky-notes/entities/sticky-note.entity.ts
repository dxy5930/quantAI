import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('sticky_notes', { 
    comment: '笔记' 
  })
@Index(['userId', 'noteId'], { unique: true })
export class StickyNote {
  @PrimaryGeneratedColumn({ comment: '笔记ID，主键' })
  id: number;

  @Column({ 
    name: 'user_id',
    type: 'bigint',
    unsigned: true,
    comment: '用户ID，关联用户表'
  })
  @Index()
  userId: number;

  @Column({ 
    name: 'note_id',
    type: 'varchar',
    length: 100,
    comment: '便利贴唯一标识符'
  })
  noteId: string;

  @Column({ 
    type: 'varchar',
    length: 255,
    default: '我的便利贴',
    comment: '笔记标题'
  })
  title: string;

  @Column({ 
    type: 'longtext',
    nullable: true,
    comment: '笔记内容，支持富文本HTML格式'
  })
  content: string;

  @Column({ 
    name: 'position_x',
    type: 'int',
    default: 100,
    comment: '便利贴X坐标位置'
  })
  positionX: number;

  @Column({ 
    name: 'position_y',
    type: 'int',
    default: 100,
    comment: '便利贴Y坐标位置'
  })
  positionY: number;

  @Column({ 
    type: 'int',
    default: 400,
    comment: '便利贴宽度'
  })
  width: number;

  @Column({ 
    type: 'int',
    default: 300,
    comment: '便利贴高度'
  })
  height: number;

  @Column({ 
    type: 'enum',
    enum: ['yellow', 'pink', 'blue', 'green', 'orange'],
    default: 'yellow',
    comment: '便利贴颜色主题'
  })
  color: 'yellow' | 'pink' | 'blue' | 'green' | 'orange';

  @Column({ 
    name: 'is_minimized',
    type: 'tinyint',
    width: 1,
    default: 0,
    comment: '是否最小化，0-展开，1-最小化'
  })
  isMinimized: boolean;

  @Column({ 
    name: 'z_index',
    type: 'int',
    default: 1,
    comment: '层级索引，用于控制显示顺序'
  })
  zIndex: number;

  @Column({ 
    name: 'is_deleted',
    type: 'tinyint',
    width: 1,
    default: 0,
    comment: '是否删除，0-未删除，1-已删除'
  })
  isDeleted: boolean;

  @CreateDateColumn({ 
    name: 'created_at',
    comment: '创建时间'
  })
  @Index()
  createdAt: Date;

  @UpdateDateColumn({ 
    name: 'updated_at',
    comment: '更新时间'
  })
  @Index()
  updatedAt: Date;
}