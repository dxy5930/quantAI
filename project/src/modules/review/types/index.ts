/**
 * 复盘多维表格类型定义
 * 参考飞书多维表格设计
 */

// 字段类型枚举
export enum FieldType {
  TEXT = 'text',                    // 单行文本
  LONG_TEXT = 'long_text',         // 多行文本
  NUMBER = 'number',               // 数字
  SELECT = 'select',               // 单选
  MULTI_SELECT = 'multi_select',   // 多选
  DATE = 'date',                   // 日期
  DATETIME = 'datetime',           // 日期时间
  CHECKBOX = 'checkbox',           // 复选框
  URL = 'url',                     // 网址
  EMAIL = 'email',                 // 邮箱
  PHONE = 'phone',                 // 电话
  ATTACHMENT = 'attachment',       // 附件
  USER = 'user',                   // 人员
  REFERENCE = 'reference',         // 关联其他表
  FORMULA = 'formula',             // 公式
  LOOKUP = 'lookup',               // 查找
  CREATED_TIME = 'created_time',   // 创建时间
  UPDATED_TIME = 'updated_time',   // 更新时间
  CREATED_BY = 'created_by',       // 创建人
  UPDATED_BY = 'updated_by',       // 更新人
  AUTO_NUMBER = 'auto_number',     // 自动编号
}

// 视图类型枚举
export enum ViewType {
  GRID = 'grid',           // 表格视图
  KANBAN = 'kanban',       // 看板视图
  GALLERY = 'gallery',     // 画册视图
  GANTT = 'gantt',         // 甘特图视图
  CALENDAR = 'calendar',   // 日历视图
  FORM = 'form',           // 表单视图
}

// 字段选项配置
export interface FieldOption {
  id: string;
  name: string;
  color?: string;
}

// 字段配置
export interface FieldConfig {
  required?: boolean;
  unique?: boolean;
  options?: FieldOption[];      // 用于选择类型字段
  format?: string;              // 用于数字、日期等格式化
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  formula?: string;             // 用于公式字段
  linkedTableId?: string;       // 用于关联字段
  linkedFieldId?: string;       // 用于查找字段
  // 新增：数据源配置（列级别，必要时可扩展到单元格覆盖）
  dataSource?: {
    type: 'static' | 'formula' | 'reference' | 'lookup' | 'api';
    // 静态：直接使用 defaultValue 或手动输入
    // 公式：使用 formula 字段
    // 关联：reference 到其他表的某字段
    reference?: {
      tableId: string;
      fieldId: string;
      // 可选：用当前记录中的哪个字段与目标表关联
      linkByFieldId?: string;
    };
    // 查找：从 reference 的目标记录中再取一个字段（如 Airtable 的 Lookup）
    lookup?: {
      fromFieldId: string; // 目标表中的字段
    };
    // API：通过远程接口获取值，支持映射
    api?: {
      url: string;
      method?: 'GET' | 'POST';
      headers?: Record<string, string>;
      // 请求体模板，允许使用 {{fieldId}} 引用当前记录数据
      bodyTemplate?: string;
      // 响应映射，支持 JSONPath 简写（如 data.value）
      responsePath?: string;
    };
  };
  // 新增：直接映射到后端事实键（如 open/high/amount 等）
  mapsTo?: string;
}

// 字段定义
export interface Field {
  id: string;
  name: string;
  type: FieldType;
  description?: string;
  config?: FieldConfig;
  isPrimary?: boolean;         // 是否为主字段
  isHidden?: boolean;          // 是否隐藏
  width?: number;              // 列宽
  order: number;               // 排序
  createdAt: string;
  updatedAt: string;
  isPreset?: boolean;          // 是否为系统预设字段（只读，用户不可编辑结构/手填）
}

// 记录数据
export interface RecordData {
  [fieldId: string]: any;
}

// 记录
export interface TableRecord {
  id: string;
  data: RecordData;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

// 过滤条件
export interface Filter {
  fieldId: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 
           'starts_with' | 'ends_with' | 'is_empty' | 'is_not_empty' |
           'greater_than' | 'less_than' | 'greater_equal' | 'less_equal' |
           'is_before' | 'is_after' | 'is_today' | 'is_yesterday' |
           'is_tomorrow' | 'is_this_week' | 'is_this_month' | 'is_this_year';
  value?: any;
}

// 排序配置
export interface Sort {
  fieldId: string;
  direction: 'asc' | 'desc';
}

// 分组配置
export interface Group {
  fieldId: string;
  direction: 'asc' | 'desc';
}

// 视图配置
export interface ViewConfig {
  filters?: Filter[];
  sorts?: Sort[];
  groups?: Group[];
  hiddenFields?: string[];
  fieldWidths?: { [fieldId: string]: number };
  frozenColumns?: number;
  rowHeight?: 'short' | 'medium' | 'tall' | 'extra_tall';
  // 看板视图特有配置
  groupByFieldId?: string;
  stackedByFieldId?: string;
  // 日历视图特有配置
  dateFieldId?: string;
  colorFieldId?: string;
}

// 视图定义
export interface View {
  id: string;
  name: string;
  type: ViewType;
  description?: string;
  config: ViewConfig;
  isShared?: boolean;          // 是否共享
  isDefault?: boolean;         // 是否为默认视图
  order: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

// 表格定义
export interface Table {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  fields: Field[];
  records: TableRecord[];
  views: View[];
  permissions?: {
    read: string[];
    write: string[];
    manage: string[];
  };
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 分页参数
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  total?: number;
}

// 查询参数
export interface QueryParams extends PaginationParams {
  viewId?: string;
  filters?: Filter[];
  sorts?: Sort[];
  search?: string;
}

// 表格创建参数
export interface CreateTableParams {
  name: string;
  description?: string;
  icon?: string;
  templateId?: string;
}

// 字段创建参数
export interface CreateFieldParams {
  name: string;
  type: FieldType;
  description?: string;
  config?: FieldConfig;
  insertAfter?: string;  // 在哪个字段后插入
  isPreset?: boolean;    // 是否为系统预设字段
}

// 记录创建参数
export interface CreateRecordParams {
  data: RecordData;
  insertAfter?: string;  // 在哪条记录后插入
}

// 批量操作参数
export interface BatchOperation {
  type: 'create' | 'update' | 'delete';
  records: Array<{
    id?: string;
    data?: RecordData;
  }>;
}

// 导出配置
export interface ExportConfig {
  format: 'csv' | 'excel' | 'json';
  viewId?: string;
  includeFields?: string[];
  includeComments?: boolean;
}

// 导入配置
export interface ImportConfig {
  replaceData?: boolean;
  fieldMapping?: Record<string, string>;
  skipFirstRow?: boolean;
} 