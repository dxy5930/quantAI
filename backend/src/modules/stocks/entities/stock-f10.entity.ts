import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('stock_f10', { 
  comment: '股票F10基本信息表：存储上市公司的详细资料，包括公司概况、管理层信息、联系方式等' 
})
export class StockF10 {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 20, unique: true, comment: '股票代码' })
  @Index()
  symbol: string;

  @Column({ length: 100, comment: '股票名称' })
  name: string;

  @Column({ length: 100, comment: '英文名称', nullable: true })
  englishName: string;

  @Column({ length: 50, comment: '曾用名', nullable: true })
  formerName: string;

  @Column({ length: 100, comment: '公司全称' })
  fullName: string;

  @Column({ length: 200, comment: '注册地址', nullable: true })
  registeredAddress: string;

  @Column({ length: 200, comment: '办公地址', nullable: true })
  officeAddress: string;

  @Column({ length: 50, comment: '法定代表人', nullable: true })
  legalRepresentative: string;

  @Column({ length: 50, comment: '总经理', nullable: true })
  generalManager: string;

  @Column({ length: 50, comment: '董事会秘书', nullable: true })
  boardSecretary: string;

  @Column({ length: 100, comment: '联系电话', nullable: true })
  contactPhone: string;

  @Column({ length: 100, comment: '传真', nullable: true })
  fax: string;

  @Column({ length: 100, comment: '电子邮箱', nullable: true })
  email: string;

  @Column({ length: 100, comment: '公司网址', nullable: true })
  website: string;

  @Column({ type: 'date', comment: '成立日期', nullable: true })
  establishDate: string;

  @Column({ type: 'date', comment: '上市日期', nullable: true })
  listingDate: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, comment: '注册资本(万元)', nullable: true })
  registeredCapital: number;

  @Column({ length: 50, comment: '所属行业' })
  industry: string;

  @Column({ length: 50, comment: '行业分类', nullable: true })
  industryClassification: string;

  @Column({ length: 100, comment: '主营业务', nullable: true })
  mainBusiness: string;

  @Column({ type: 'text', comment: '经营范围', nullable: true })
  businessScope: string;

  @Column({ type: 'text', comment: '公司简介', nullable: true })
  companyProfile: string;

  @Column({ length: 100, comment: '会计师事务所', nullable: true })
  accountingFirm: string;

  @Column({ length: 100, comment: '律师事务所', nullable: true })
  lawFirm: string;

  @Column({ length: 100, comment: '保荐机构', nullable: true })
  sponsor: string;

  @Column({ type: 'bigint', comment: '总股本(股)', nullable: true })
  totalShares: number;

  @Column({ type: 'bigint', comment: '流通股本(股)', nullable: true })
  circulationShares: number;

  @Column({ type: 'bigint', comment: '限售股本(股)', nullable: true })
  restrictedShares: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, comment: '国有股比例(%)', nullable: true })
  stateOwnedRatio: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, comment: '法人股比例(%)', nullable: true })
  legalPersonRatio: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, comment: '公众股比例(%)', nullable: true })
  publicRatio: number;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
}