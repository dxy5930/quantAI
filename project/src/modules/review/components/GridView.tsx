/**
 * 表格视图组件 - 类似飞书多维表格的Grid视图
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Field, TableRecord, FieldType, RecordData, ViewConfig, Sort } from '../types';
import { formatPrice2, formatIntegerWithThousands, formatAmountFixedUnit, formatPE2, formatPercentSmart, toNumber, formatWithThousands } from '../../../utils/formatters';

interface GridViewProps {
  fields: Field[];
  records: TableRecord[];
  viewConfig?: ViewConfig;
  onRecordUpdate: (recordId: string, data: Partial<RecordData>) => void;
  onRecordDelete: (recordId: string) => void;
  onFieldUpdate: (fieldId: string, updates: Partial<Field>) => void;
  onAddRecord: () => void;
  onAddField: () => void;
  readonly?: boolean;
  // 新增：排序变化时回调
  onSortChange?: (sort?: Sort) => void;
  // 新增：AI 补全加载态（来自父组件）
  aiLoading?: boolean;
  // 新增：正在AI补全的行ID
  aiLoadingRowId?: string;
}

const GridView: React.FC<GridViewProps> = ({
  fields,
  records,
  viewConfig,
  onRecordUpdate,
  onRecordDelete,
  onFieldUpdate,
  onAddRecord,
  onAddField,
  readonly = false,
  onSortChange,
  aiLoading,
  aiLoadingRowId,
}) => {
  const [editingCell, setEditingCell] = useState<{ recordId: string; fieldId: string } | null>(null);
  const [editingValue, setEditingValue] = useState<any>('');
  // 新增：本地排序（三态：undefined -> asc -> desc -> undefined）
  const [localSort, setLocalSort] = useState<Sort | undefined>(undefined);

  // 新增：用于实现前两列 sticky 的动态 left 计算
  const ROW_NUM_COL_WIDTH_PX = 48; // 对应 w-12（3rem）
  const firstHeaderRef = useRef<HTMLTableCellElement | null>(null);
  const firstBodyCellRef = useRef<HTMLTableCellElement | null>(null);
  const [firstColWidth, setFirstColWidth] = useState<number>(160);

  // 尝试测量第一数据列宽度（优先用表体首行单元格，退而求其次用表头）
  const measureFirstCol = () => {
    const bodyW = firstBodyCellRef.current?.getBoundingClientRect().width;
    const headW = firstHeaderRef.current?.getBoundingClientRect().width;
    const w = bodyW || headW;
    if (w && Math.abs(w - firstColWidth) > 1) setFirstColWidth(w);
  };

  useEffect(() => {
    measureFirstCol();
    // 监听窗口尺寸变化
    const onResize = () => measureFirstCol();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // 依赖可触发重新测量
  }, [records, fields, viewConfig]);

  // 过滤和排序记录
  const processedRecords = useMemo(() => {
    let filteredRecords = [...records];

    // 应用过滤器
    if (viewConfig?.filters && viewConfig.filters.length > 0) {
      filteredRecords = filteredRecords.filter(record => {
        return viewConfig.filters!.every(filter => {
          const value = record.data[filter.fieldId];
          switch (filter.operator) {
            case 'equals':
              return value === filter.value;
            case 'not_equals':
              return value !== filter.value;
            case 'contains':
              return String(value || '').includes(String(filter.value || ''));
            case 'not_contains':
              return !String(value || '').includes(String(filter.value || ''));
            case 'is_empty':
              return !value || value === '';
            case 'is_not_empty':
              return value && value !== '';
            default:
              return true;
          }
        });
      });
    }

    // 优先使用本地排序，其次使用视图排序
    const sorts = localSort ? [localSort] : (viewConfig?.sorts || []);
    if (sorts.length > 0) {
      filteredRecords.sort((a, b) => {
        for (const sort of sorts) {
          const aValue = a.data[sort.fieldId];
          const bValue = b.data[sort.fieldId];

          let comparison = 0;
          if (aValue === undefined && bValue !== undefined) comparison = -1;
          else if (aValue !== undefined && bValue === undefined) comparison = 1;
          else if (aValue < bValue) comparison = -1;
          else if (aValue > bValue) comparison = 1;

          if (comparison !== 0) {
            return sort.direction === 'desc' ? -comparison : comparison;
          }
        }
        return 0;
      });
    }

    return filteredRecords;
  }, [records, viewConfig, localSort]);

  // 过滤显示的字段
  const visibleFields = useMemo(() => {
    const hidden = new Set(viewConfig?.hiddenFields || []);
    const sorted = [...fields]
      .filter(f => f.isPreset || !hidden.has(f.id)) // 预设字段始终可见
      .sort((a, b) => a.order - b.order);
    // 确保股票代码列（preset_symbol）排在第一数据列
    const symbolIndex = sorted.findIndex(f => f.id === 'preset_symbol');
    if (symbolIndex > 0) {
      const [symbolField] = sorted.splice(symbolIndex, 1);
      sorted.unshift(symbolField);
    }
    return sorted;
  }, [fields, viewConfig]);

  // 开始编辑单元格
  const startEditing = (recordId: string, fieldId: string, currentValue: any) => {
    if (readonly) return;
    
    setEditingCell({ recordId, fieldId });
    setEditingValue(currentValue || '');
  };

  // 保存编辑
  const saveEdit = () => {
    if (!editingCell) return;
    
    onRecordUpdate(editingCell.recordId, {
      [editingCell.fieldId]: editingValue
    });
    
    setEditingCell(null);
    setEditingValue('');
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingCell(null);
    setEditingValue('');
  };

  // 点击表头切换排序
  const toggleSort = (fieldId: string) => {
    setLocalSort(prev => {
      let next: Sort | undefined;
      if (!prev || prev.fieldId !== fieldId) next = { fieldId, direction: 'asc' };
      else if (prev.direction === 'asc') next = { fieldId, direction: 'desc' };
      else next = undefined; // 取消排序
      // 通知上层以便按接口重新拉取
      onSortChange?.(next);
      return next;
    });
  };

  // 渲染字段值
  const renderFieldValue = (field: Field, value: any, record: TableRecord) => {
    // 如果正在编辑这个单元格
    if (editingCell?.recordId === record.id && editingCell?.fieldId === field.id) {
      return renderEditableCell(field, editingValue, setEditingValue);
    }

    // 只读模式下的显示
    return renderDisplayValue(field, value);
  };

  // 固定单位显示：默认使用“亿”，可按需改为“万”
  const AMOUNT_FIXED_UNIT: '亿' | '万' = '亿';
  const formatRaw = (v: any) => {
    const n = toNumber(v);
    if (n === null) return '';
    return formatWithThousands(n, 2);
  };

  // 渲染可编辑单元格
  const renderEditableCell = (field: Field, value: any, onChange: (value: any) => void) => {
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEdit();
      }
    };

    const baseProps = {
      value: value || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => 
        onChange((e as any).target?.value),
      onBlur: saveEdit,
      onKeyDown: handleKeyDown,
      autoFocus: true,
      className: "w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500",
      onClick: (e: React.MouseEvent) => e.stopPropagation(),
      onMouseDown: (e: React.MouseEvent) => e.stopPropagation(),
    };

    switch (field.type) {
      case FieldType.LONG_TEXT:
        return (
          <textarea
            {...baseProps}
            rows={3}
            className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
          />
        );
      
      case FieldType.NUMBER:
        return (
          <input
            {...baseProps}
            type="number"
            step="any"
          />
        );
      
      case FieldType.DATE:
        return (
          <input
            {...baseProps}
            type="date"
          />
        );
      
      case FieldType.DATETIME:
        return (
          <input
            {...baseProps}
            type="datetime-local"
          />
        );
      
      case FieldType.SELECT: {
        const options = field.config?.options || [];
        if (!options.length) {
          // 若无选项但当前单元格已有值，则自动以当前值创建一个选项，避免初始显示“请选择”
          if (value) {
            const newOpt = { id: `opt_${Date.now()}`, name: String(value) } as any;
            onFieldUpdate(field.id, { config: { ...(field.config || {}), options: [newOpt] } as any });
          }
          const handleGenerateFromData = () => {
            const uniq = new Set<string>();
            records.forEach(r => {
              const v = (r.data as any)?.[field.id];
              if (typeof v === 'string' && v.trim()) uniq.add(v.trim());
            });
            const generated = Array.from(uniq).slice(0, 50).map((name, idx) => ({ id: `opt_${idx}_${Date.now()}`, name }));
            if (generated.length === 0) {
              const demo = ['选项A', '选项B', '选项C'].map((name, idx) => ({ id: `opt_${idx}_${Date.now()}`, name }));
              onFieldUpdate(field.id, { config: { ...(field.config || {}), options: demo } as any });
            } else {
              onFieldUpdate(field.id, { config: { ...(field.config || {}), options: generated } as any });
            }
          };
          const handleAddDemo = () => {
            const demo = ['选项A', '选项B', '选项C'].map((name, idx) => ({ id: `opt_${idx}_${Date.now()}`, name }));
            onFieldUpdate(field.id, { config: { ...(field.config || {}), options: demo } as any });
          };
          return (
            <div className="text-xs text-gray-500 flex items-center gap-2">
              <span>暂无选项</span>
              <button type="button" className="px-2 py-0.5 border rounded hover:bg-gray-50" onClick={handleGenerateFromData}>从数据生成</button>
              <button type="button" className="px-2 py-0.5 border rounded hover:bg-gray-50" onClick={handleAddDemo}>添加示例</button>
            </div>
          );
        }
        // 兼容 {id,name} 与 {value,label}
        const getOptionId = (opt: any) => (opt?.id ?? opt?.value ?? '');
        const getOptionName = (opt: any) => (opt?.name ?? opt?.label ?? '');
        // 如果当前值是 name/label，需要映射为对应的 id/value
        const normalizedValue = (() => {
          if (!value) return '';
          // 已经是某个选项的 id/value
          const existsById = options.some(opt => getOptionId(opt) === value);
          if (existsById) return value;
          // 尝试通过名称匹配
          const matched = options.find(opt => getOptionName(opt) === value);
          return matched ? getOptionId(matched) : '';
        })();
        // 新增：当有值但不在选项中，自动追加到选项
        if (value && !options.some(opt => getOptionId(opt) === value || getOptionName(opt) === value)) {
          const newOpt = { id: `opt_${Date.now()}`, name: String(value) } as any;
          onFieldUpdate(field.id, { config: { ...(field.config || {}), options: [...options, newOpt] } as any });
        }
        return (
          <select
            {...baseProps}
            value={normalizedValue}
            onChange={(e) => onChange((e.target as HTMLSelectElement).value)}
          >
            <option value="">请选择</option>
            {options.map(option => (
              <option key={getOptionId(option)} value={getOptionId(option)}>
                {getOptionName(option)}
              </option>
            ))}
          </select>
        );
      }
      
      case FieldType.MULTI_SELECT: {
        const options = field.config?.options || [];
        if (!options.length) {
          const handleAddDemo = () => {
            const demo = ['选项A', '选项B', '选项C'].map((name, idx) => ({ id: `opt_${idx}_${Date.now()}`, name }));
            onFieldUpdate(field.id, { config: { ...(field.config || {}), options: demo } as any });
          };
          return (
            <div className="text-xs text-gray-500 flex items-center gap-2">
              <span>暂无选项</span>
              <button type="button" className="px-2 py-0.5 border rounded hover:bg-gray-50" onClick={handleAddDemo}>添加示例</button>
            </div>
          );
        }
        const selectedValues: string[] = Array.isArray(value) ? value : (value ? [value] : []);
        return (
          <select
            multiple
            className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={selectedValues}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions).map(o => o.value);
              onChange(selected);
            }}
            onBlur={saveEdit}
            onKeyDown={handleKeyDown}
            autoFocus
          >
            {options.map(option => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        );
      }
      
      case FieldType.CHECKBOX:
        return (
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange((e.target as HTMLInputElement).checked)}
            onBlur={saveEdit}
            autoFocus
            className="w-4 h-4"
          />
        );
      
      default:
        return <input {...baseProps} type="text" />;
    }
  };

  // 渲染显示值
  const renderDisplayValue = (field: Field, value: any) => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-gray-400">-</span>;
    }

    // 预设数值格式优先
    if (field.isPreset || field.id === 'preset_symbol') {
      switch (field.id) {
        case 'preset_open':
        case 'preset_high':
        case 'preset_low':
          return <span>{formatPrice2(value, 2)}</span>;
        case 'preset_volume':
          return <span>{formatIntegerWithThousands(value)}</span>;
        case 'preset_amount':
        case 'preset_float_cap':
        case 'preset_total_cap':
          return <span title={formatRaw(value)}>{formatAmountFixedUnit(value, AMOUNT_FIXED_UNIT)}</span>;
        case 'preset_pe':
          return <span>{formatPE2(value, 2)}</span>;
        case 'preset_turnover':
          return <span>{formatPercentSmart(value, 2)}</span>;
        case 'preset_symbol':
          return (
            <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-800 font-mono text-xs">
              {String(value)}
            </span>
          );
        default:
          break;
      }
    }

    switch (field.type) {
      case FieldType.CHECKBOX:
        return (
          <input
            type="checkbox"
            checked={!!value}
            readOnly
            className="w-4 h-4"
          />
        );
      
      case FieldType.SELECT:
        const option = field.config?.options?.find(opt => {
          const id = (opt as any)?.id ?? (opt as any)?.value;
          const name = (opt as any)?.name ?? (opt as any)?.label;
          return id === value || name === value;
        });
        return option ? (
          <span 
            className="inline-block px-2 py-1 rounded text-xs"
            style={{ backgroundColor: (option as any).color || '#f0f0f0' }}
          >
            {(option as any).name ?? (option as any).label}
          </span>
        ) : <span className="text-gray-400">未知选项</span>;
      
      case FieldType.MULTI_SELECT:
        const values = Array.isArray(value) ? value : [value];
        return (
          <div className="flex flex-wrap gap-1">
            {values.map((val, index) => {
              const option = field.config?.options?.find(opt => (opt as any)?.id === val || (opt as any)?.value === val || (opt as any)?.name === val || (opt as any)?.label === val);
              return option ? (
                <span 
                  key={index}
                  className="inline-block px-2 py-1 rounded text-xs"
                  style={{ backgroundColor: (option as any).color || '#f0f0f0' }}
                >
                  {(option as any).name ?? (option as any).label}
                </span>
              ) : null;
            })}
          </div>
        );
      
      case FieldType.URL:
        return (
          <a 
            href={value} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {value}
          </a>
        );
      
      case FieldType.EMAIL:
        return (
          <a 
            href={`mailto:${value}`}
            className="text-blue-600 hover:underline"
          >
            {value}
          </a>
        );
      
      case FieldType.DATE:
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
          return value;
        }
        return new Date(value).toLocaleDateString();
      
      case FieldType.DATETIME:
        return new Date(value).toLocaleString();
      
      case FieldType.LONG_TEXT:
        return (
          <div className="max-w-xs truncate" title={value}>
            {value}
          </div>
        );
      
      default:
        return String(value);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white min-h-0 overflow-auto">
      {/* 工具栏 */}
      <div className="px-4 py-2 border-b border-gray-200 flex items-center gap-2 justify-end bg-white sticky top-0 z-20">
        {/* AI 加载指示 */}
        {aiLoading && (
          <div className="flex items-center text-blue-600 text-sm mr-2" title="AI补全运行中...">
            <svg className="animate-spin h-4 w-4 mr-1" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            正在AI补全...
          </div>
        )}
        <button
          type="button"
          className={`px-3 py-1 rounded text-sm border ${editingCell ? 'text-blue-600 border-blue-200 hover:bg-blue-50' : 'text-gray-400 border-gray-200 cursor-not-allowed'} ${aiLoading ? 'opacity-60 cursor-wait' : ''}`}
          disabled={!editingCell || !!aiLoading}
          title={editingCell ? (aiLoading ? 'AI正在补全...' : '保存当前单元格并AI补全同行') : '点击某个单元格开始编辑以启用'}
          onClick={() => {
            if (!editingCell || aiLoading) return;
            // 触发保存，从而使用上层包装的 onRecordUpdate 调用AI
            saveEdit();
          }}
        >
          {aiLoading ? 'AI补全中...' : 'AI补全本行'}
        </button>
      </div>
      {/* 表格容器 */}
      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto w-[100vw]">
        <table className="table-auto w-full border-separate border-spacing-0 min-w-max">
          {/* 表头 */}
          <thead className="bg-gray-50 sticky top-0 z-30">
            <tr>
              {/* 行号列 */}
              <th className="w-12 px-2 py-3 text-left text-xs font-medium text-gray-500 border-r border-gray-200 sticky left-0 z-20 bg-gray-50">
                #
              </th>
              
              {/* 字段列 */}
              {visibleFields.map((field, i) => (
                <th 
                  key={field.id}
                  className={`px-4 py-3 text-left text-xs font-medium text-gray-500 border-r border-gray-200 whitespace-nowrap cursor-pointer select-none ${i <= 1 ? 'sticky z-30 bg-gray-50' : ''}`}
                  ref={i === 0 ? firstHeaderRef : undefined}
                  style={i === 0 ? { left: ROW_NUM_COL_WIDTH_PX } : i === 1 ? { left: ROW_NUM_COL_WIDTH_PX + firstColWidth, boxShadow: '2px 0 0 0 rgba(229,231,235,1)' } : undefined}
                  onClick={() => toggleSort(field.id)}
                  title="点击切换排序：无序 → 升序 → 降序"
                >
                  <div className="flex items-center justify-between group">
                    <span className="truncate whitespace-nowrap" title={field.name}>
                      {field.name}
                      {( (field.isPreset && field.id !== 'preset_symbol') || field.id === 'title') && <span className="ml-1 text-gray-400" title="预设字段，结构只读">🔒</span>}
                    </span>
                    <span className="flex items-center text-gray-400 ml-1">
                      {/* 字段类型标记 */}
                      {field.type === FieldType.TEXT && '文本'}
                      {field.type === FieldType.NUMBER && '数字'}
                      {field.type === FieldType.DATE && '日期'}
                      {field.type === FieldType.SELECT && '选择'}
                      {field.type === FieldType.CHECKBOX && '复选'}
                      {/* 排序指示器 */}
                      <span className="ml-2 text-gray-400">
                        {localSort?.fieldId === field.id ? (
                          localSort.direction === 'asc' ? '▲' : '▼'
                        ) : '↕'}
                      </span>
                    </span>
                  </div>
                </th>
              ))}
              
              {/* 添加字段按钮 */}
              {!readonly && (
                <th className="w-12 px-2 py-3 border-r border-gray-200 sticky right-0 z-20 bg-gray-50">
                  <button
                    onClick={onAddField}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                    title="添加指标"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M12 5v14M5 12h14" strokeWidth={2} strokeLinecap="round" />
                    </svg>
                  </button>
                </th>
              )}
            </tr>
          </thead>
          
          {/* 表体 */}
          <tbody>
            {processedRecords.map((record, index) => (
              <tr 
                key={record.id}
                className={`border-b border-gray-100 hover:bg-gray-50 group ${aiLoading && aiLoadingRowId === record.id ? 'ai-row-disabled' : ''}`}
              >
                {/* 行号 */}
                <td className="w-12 px-2 py-3 text-xs text-gray-500 border-r border-gray-200 sticky left-0 z-10 bg-white">
                  {index + 1}
                </td>
                
                {/* 数据单元格 */}
                {visibleFields.map((field, i) => (
                  <td 
                    key={`${record.id}-${field.id}`}
                    className={`px-4 py-3 border-r border-gray-200 cursor-pointer hover:bg-blue-50 whitespace-nowrap ${i <= 1 ? 'sticky bg-white' : ''} ${i === 1 ? 'z-20' : i === 0 ? 'z-10' : ''}`}
                    ref={i === 0 && index === 0 ? firstBodyCellRef : undefined}
                    style={i === 0 ? { left: ROW_NUM_COL_WIDTH_PX } : i === 1 ? { left: ROW_NUM_COL_WIDTH_PX + firstColWidth, boxShadow: '2px 0 0 0 rgba(229,231,235,1)' } : undefined}
                    onClick={() => {
                      if (editingCell?.recordId === record.id && editingCell?.fieldId === field.id) return;
                      if ((field.isPreset && field.id !== 'preset_symbol') || field.id === 'title') return; // 预设字段（除股票代码）与名称字段禁止直接编辑
                      startEditing(record.id, field.id, record.data[field.id])
                    }}
                  >
                    {renderFieldValue(field, record.data[field.id], record)}
                  </td>
                ))}
                
                {/* 操作列 */}
                {!readonly && (
                  <td className="w-12 px-2 py-3 border-r border-gray-200 sticky right-0 z-10 bg-white">
                    <button
                      onClick={() => onRecordDelete(record.id)}
                      className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="删除记录"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                )}
              </tr>
            ))}
            
            {/* 添加记录行 */}
            {/* {!readonly && (
              <tr className="border-b border-gray-100">
                <td className="w-12 px-2 py-3 text-xs text-gray-500 border-r border-gray-200">
                  +
                </td>
                <td 
                  colSpan={visibleFields.length + 1}
                  className="px-4 py-3 border-r border-gray-200 cursor-pointer hover:bg-blue-50 text-gray-500"
                  onClick={onAddRecord}
                >
                  点击添加新记录
                </td>
              </tr>
            )} */}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GridView; 