/**
 * 多维表格复盘系统类型定义
 * Multi-dimensional Table Review System Types
 * 模仿飞书多维表格的数据结构
 */

// ==================== 基础字段类型 ====================

/**
 * 字段类型枚举
 */
export enum FieldType {
  TEXT = 'text',                    // 文本
  NUMBER = 'number',                // 数字
  DATE = 'date',                    // 日期
  DATETIME = 'datetime',            // 日期时间
  SELECT = 'select',                // 单选
  MULTI_SELECT = 'multiSelect',     // 多选
  CHECKBOX = 'checkbox',            // 复选框
  CURRENCY = 'currency',            // 货币
  PERCENT = 'percent',              // 百分比
  URL = 'url',                      // 链接
  EMAIL = 'email',                  // 邮箱
  PHONE = 'phone',                  // 电话
  ATTACHMENT = 'attachment',        // 附件
  RATING = 'rating',                // 评分
  PROGRESS = 'progress',            // 进度条
  FORMULA = 'formula',              // 公式
  LOOKUP = 'lookup',                // 引用
  ROLLUP = 'rollup',                // 汇总
  CREATED_TIME = 'createdTime',     // 创建时间
  LAST_MODIFIED_TIME = 'lastModifiedTime', // 修改时间
  CREATED_BY = 'createdBy',         // 创建人
  LAST_MODIFIED_BY = 'lastModifiedBy',     // 修改人
  AUTO_NUMBER = 'autoNumber',       // 自动编号
  BARCODE = 'barcode',              // 条码
  BUTTON = 'button',                // 按钮
  AI_GENERATED = 'aiGenerated',     // AI生成字段
}

/**
 * 字段选项配置
 */
export interface FieldOption {
  id: string;
  name: string;
  color?: string;
  description?: string;
}

/**
 * 字段配置
 */
export interface FieldConfig {
  // 基础配置
  required?: boolean;
  unique?: boolean;
  defaultValue?: any;
  
  // 文本字段配置
  maxLength?: number;
  multiline?: boolean;
  
  // 数字字段配置
  precision?: number;
  min?: number;
  max?: number;
  
  // 选择字段配置
  options?: FieldOption[];
  allowOther?: boolean;
  
  // 日期字段配置
  includeTime?: boolean;
  dateFormat?: string;
  
  // 货币字段配置
  currency?: string;
  
  // 评分字段配置
  maxRating?: number;
  icon?: string;
  
  // 进度条配置
  showPercent?: boolean;
  
  // 公式配置
  expression?: string;
  
  // 引用配置
  tableId?: string;
  fieldId?: string;
  
  // AI字段配置
  aiPrompt?: string;
  aiModel?: string;
  autoUpdate?: boolean;
}

/**
 * 字段定义
 */
export interface FieldDefinition {
  id: string;
  name: string;
  type: FieldType;
  description?: string;
  config?: FieldConfig;
  isPrimary?: boolean;        // 是否为主字段
  isHidden?: boolean;         // 是否隐藏
  width?: number;             // 字段宽度
  order: number;              // 字段顺序
  createdAt: string;
  updatedAt: string;
}

// ==================== 记录和数据 ====================

/**
 * 字段值类型
 */
export type FieldValue = 
  | string 
  | number 
  | boolean 
  | Date 
  | string[] 
  | number[] 
  | FieldOption[] 
  | FileAttachment[] 
  | null;

/**
 * 文件附件
 */
export interface FileAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  thumbnailUrl?: string;
}

/**
 * 记录数据
 */
export interface RecordData {
  [fieldId: string]: FieldValue;
}

/**
 * 数据记录
 */
export interface DatabaseRecord {
  id: string;
  data: RecordData;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  lastModifiedBy?: string;
}

// ==================== 视图系统 ====================

/**
 * 视图类型
 */
export enum ViewType {
  GRID = 'grid',              // 表格视图
  KANBAN = 'kanban',          // 看板视图
  CALENDAR = 'calendar',      // 日历视图
  GALLERY = 'gallery',        // 画廊视图
  FORM = 'form',              // 表单视图
  GANTT = 'gantt',            // 甘特图视图
  TIMELINE = 'timeline',      // 时间线视图
}

/**
 * 排序配置
 */
export interface SortConfig {
  fieldId: string;
  direction: 'asc' | 'desc';
}

/**
 * 过滤条件
 */
export interface FilterCondition {
  fieldId: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'notContains' | 'isEmpty' | 'isNotEmpty' | 'in' | 'notIn';
  value: any;
  logicalOperator?: 'and' | 'or';
}

/**
 * 分组配置
 */
export interface GroupConfig {
  fieldId: string;
  collapsed?: boolean;
}

/**
 * 视图配置
 */
export interface ViewConfig {
  // 通用配置
  visibleFields?: string[];           // 可见字段
  fieldOrder?: string[];              // 字段顺序
  filters?: FilterCondition[];        // 过滤条件
  sorts?: SortConfig[];               // 排序配置
  groups?: GroupConfig[];             // 分组配置
  
  // 表格视图配置
  rowHeight?: number;                 // 行高
  showRecordId?: boolean;             // 显示记录ID
  
  // 看板视图配置
  groupByField?: string;              // 分组字段
  stackByField?: string;              // 堆叠字段
  cardFields?: string[];              // 卡片显示字段
  
  // 日历视图配置
  dateField?: string;                 // 日期字段
  colorField?: string;                // 颜色字段
  titleField?: string;                // 标题字段
  
  // 画廊视图配置
  imageField?: string;                // 图片字段
  cardSize?: 'small' | 'medium' | 'large';
  
  // 表单视图配置
  formFields?: string[];              // 表单字段
  submitAction?: string;              // 提交动作
}

/**
 * 视图定义
 */
export interface ViewDefinition {
  id: string;
  name: string;
  type: ViewType;
  description?: string;
  config: ViewConfig;
  isDefault?: boolean;        // 是否为默认视图
  isPublic?: boolean;         // 是否公开
  order: number;              // 视图顺序
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

// ==================== 数据库/表格定义 ====================

/**
 * 复盘数据库/表格
 */
export interface ReviewDatabase {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  
  // 字段和视图
  fields: FieldDefinition[];
  views: ViewDefinition[];
  records: DatabaseRecord[];
  
  // 权限和设置
  permissions?: DatabasePermissions;
  settings?: DatabaseSettings;
  
  // 元数据
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  lastModifiedBy?: string;
}

/**
 * 数据库权限
 */
export interface DatabasePermissions {
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canShare: boolean;
  canManageStructure: boolean;
  allowedUsers?: string[];
  allowedRoles?: string[];
}

/**
 * 数据库设置
 */
export interface DatabaseSettings {
  enableVersionHistory?: boolean;     // 启用版本历史
  enableComments?: boolean;           // 启用评论
  enableNotifications?: boolean;      // 启用通知
  autoSave?: boolean;                 // 自动保存
  backupEnabled?: boolean;            // 启用备份
  aiIntegration?: boolean;            // AI集成
}

// ==================== AI集成类型 ====================

/**
 * AI分析结果
 */
export interface AIAnalysisResult {
  fieldId: string;
  recordId: string;
  analysis: {
    summary: string;
    insights: string[];
    recommendations: string[];
    score?: number;
    confidence?: number;
  };
  generatedAt: string;
}

/**
 * AI字段生成配置
 */
export interface AIFieldConfig {
  sourceFields: string[];              // 源字段
  prompt: string;                      // AI提示词
  model: string;                       // AI模型
  autoUpdate: boolean;                 // 自动更新
  updateTriggers: string[];            // 更新触发器
}

/**
 * AI智能建议
 */
export interface AISuggestion {
  id: string;
  type: 'field' | 'view' | 'filter' | 'formula' | 'insight';
  title: string;
  description: string;
  action?: {
    type: string;
    data: any;
  };
  confidence: number;
  generatedAt: string;
}

// ==================== 导出类型 ====================

/**
 * 导出格式
 */
export enum ExportFormat {
  CSV = 'csv',
  EXCEL = 'excel',
  JSON = 'json',
  PDF = 'pdf',
}

/**
 * 导出配置
 */
export interface ExportConfig {
  format: ExportFormat;
  includeFields?: string[];
  includeFilters?: boolean;
  includeFormats?: boolean;
  viewId?: string;
}

// ==================== 模板和预设 ====================

/**
 * 数据库模板
 */
export interface DatabaseTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon?: string;
  fields: Omit<FieldDefinition, 'id' | 'createdAt' | 'updatedAt'>[];
  views: Omit<ViewDefinition, 'id' | 'createdAt' | 'updatedAt'>[];
  sampleData?: Omit<DatabaseRecord, 'id' | 'createdAt' | 'updatedAt'>[];
  tags?: string[];
}

/**
 * 复盘特定的预设字段
 */
export interface ReviewPresetFields {
  tradingDate: FieldDefinition;         // 交易日期
  market: FieldDefinition;              // 市场
  strategy: FieldDefinition;            // 策略
  result: FieldDefinition;              // 结果
  profit: FieldDefinition;              // 盈亏
  profitRate: FieldDefinition;          // 盈亏率
  emotion: FieldDefinition;             // 情绪状态
  confidence: FieldDefinition;          // 信心度
  aiSummary: FieldDefinition;           // AI总结
  aiScore: FieldDefinition;             // AI评分
  lessons: FieldDefinition;             // 经验教训
  improvements: FieldDefinition;        // 改进建议
}

// ==================== Hook和组件Props ====================

/**
 * 数据库Hook返回类型
 */
export interface UseDatabaseReturn {
  database: ReviewDatabase | null;
  loading: boolean;
  error: string | null;
  
  // 数据库操作
  createDatabase: (template?: string) => Promise<ReviewDatabase | null>;
  updateDatabase: (updates: Partial<ReviewDatabase>) => Promise<boolean>;
  deleteDatabase: () => Promise<boolean>;
  
  // 字段操作
  addField: (field: Omit<FieldDefinition, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateField: (fieldId: string, updates: Partial<FieldDefinition>) => Promise<boolean>;
  deleteField: (fieldId: string) => Promise<boolean>;
  
  // 记录操作
  addRecord: (data: RecordData) => Promise<DatabaseRecord | null>;
  updateRecord: (recordId: string, data: Partial<RecordData>) => Promise<boolean>;
  deleteRecord: (recordId: string) => Promise<boolean>;
  
  // 视图操作
  addView: (view: Omit<ViewDefinition, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateView: (viewId: string, updates: Partial<ViewDefinition>) => Promise<boolean>;
  deleteView: (viewId: string) => Promise<boolean>;
  
  // AI功能
  generateAIField: (fieldId: string, recordId: string) => Promise<any>;
  getAISuggestions: () => Promise<AISuggestion[]>;
  
  // 导入导出
  exportDatabase: (config: ExportConfig) => Promise<Blob>;
  importData: (file: File, mapping: Record<string, string>) => Promise<boolean>;
}

/**
 * 表格组件Props
 */
export interface DatabaseTableProps {
  database: ReviewDatabase;
  viewId?: string;
  onRecordSelect?: (record: DatabaseRecord) => void;
  onRecordUpdate?: (recordId: string, data: Partial<RecordData>) => void;
  onFieldUpdate?: (fieldId: string, updates: Partial<FieldDefinition>) => void;
  readOnly?: boolean;
  showHeader?: boolean;
  showToolbar?: boolean;
  maxHeight?: number;
}

/**
 * 视图组件通用Props
 */
export interface ViewComponentProps {
  database: ReviewDatabase;
  view: ViewDefinition;
  records: DatabaseRecord[];
  onRecordSelect?: (record: DatabaseRecord) => void;
  onRecordUpdate?: (recordId: string, data: Partial<RecordData>) => void;
  readOnly?: boolean;
}