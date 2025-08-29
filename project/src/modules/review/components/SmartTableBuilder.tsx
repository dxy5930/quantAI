import React, { useMemo, useState } from 'react';
import { FieldType, Field, FieldConfig } from '../types';

export interface BuilderFieldConfig {
  id: string;
  name: string;
  type: FieldType;
  config?: FieldConfig;
  width?: number;
  isPreset?: boolean; // 预设字段标记（只读）
}

export interface SmartTableBlueprint {
  name: string;
  description?: string;
  icon?: string;
  fields: BuilderFieldConfig[];
  initialRows?: number;
  hiddenFieldIds?: string[]; // 初始隐藏字段（用于默认视图）
}

interface SmartTableBuilderProps {
  initial?: Partial<SmartTableBlueprint>;
  onCancel: () => void;
  onSave: (blueprint: SmartTableBlueprint) => void;
}

const DEFAULT_FIELDS: BuilderFieldConfig[] = [
  { id: 'title', name: '名称', type: FieldType.TEXT, width: 200 },
  { id: 'type', name: '类型', type: FieldType.SELECT, config: { options: [] }, width: 120 },
  { id: 'date', name: '日期', type: FieldType.DATE, width: 140 },
];

// 预设指标（只读，通过 AI 填充）
const PRESET_INDICATORS: Array<{ id: string; name: string; type: FieldType; width?: number }> = [
  { id: 'preset_open', name: '今开', type: FieldType.NUMBER, width: 100 },
  { id: 'preset_high', name: '最高', type: FieldType.NUMBER, width: 100 },
  { id: 'preset_low', name: '最低', type: FieldType.NUMBER, width: 100 },
  { id: 'preset_volume', name: '总手', type: FieldType.NUMBER, width: 120 },
  { id: 'preset_amount', name: '金额', type: FieldType.NUMBER, width: 120 },
  { id: 'preset_float_cap', name: '流值', type: FieldType.NUMBER, width: 120 },
  { id: 'preset_total_cap', name: '总值', type: FieldType.NUMBER, width: 120 },
  { id: 'preset_pe', name: '市盈', type: FieldType.NUMBER, width: 100 },
  { id: 'preset_turnover', name: '换手', type: FieldType.NUMBER, width: 100 },
];

const SmartTableBuilder: React.FC<SmartTableBuilderProps> = ({ initial, onCancel, onSave }) => {
  const [tableName, setTableName] = useState(initial?.name || '新建表格');
  const [description, setDescription] = useState(initial?.description || '');
  const [icon, setIcon] = useState(initial?.icon || '📊');
  const [fields, setFields] = useState<BuilderFieldConfig[]>(initial?.fields || DEFAULT_FIELDS);
  const [initialRows, setInitialRows] = useState<number>(initial?.initialRows ?? 3);
  const [selectedPresetIds, setSelectedPresetIds] = useState<string[]>(
    PRESET_INDICATORS.map(p => p.id)
  );

  const addField = () => {
    const nextIndex = fields.length + 1;
    const id = `field_${nextIndex}`;
    setFields(prev => [
      ...prev,
      { id, name: `指标${nextIndex}`, type: FieldType.TEXT, width: 160 }
    ]);
  };

  const removeField = (id: string) => {
    setFields(prev => prev.filter(f => f.id !== id));
  };

  const updateField = (id: string, updates: Partial<BuilderFieldConfig>) => {
    setFields(prev => prev.map(f => (f.id === id ? { ...f, ...updates } : f)));
  };

  const moveField = (id: string, direction: 'up' | 'down') => {
    const idx = fields.findIndex(f => f.id === id);
    if (idx === -1) return;
    const newFields = [...fields];
    const swapWith = direction === 'up' ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= newFields.length) return;
    [newFields[idx], newFields[swapWith]] = [newFields[swapWith], newFields[idx]];
    setFields(newFields);
  };

  const handleSave = () => {
    // 预设字段全部加入，但仅将未选中的预设字段放入 hidden 列表
    const presetFields: BuilderFieldConfig[] = PRESET_INDICATORS.map((p, i) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      width: p.width ?? 120,
      isPreset: true,
    }));
    const hiddenFromPreset = PRESET_INDICATORS
      .filter(p => !selectedPresetIds.includes(p.id))
      .map(p => p.id);

    const blueprint: SmartTableBlueprint = {
      name: tableName.trim() || '未命名表格',
      description: description.trim() || undefined,
      icon: icon || '📊',
      fields: [...fields, ...presetFields],
      initialRows: Math.max(0, Math.min(100, initialRows || 0)),
      hiddenFieldIds: hiddenFromPreset,
    };
    onSave(blueprint);
  };

  const PreviewHeader = useMemo(() => (
    <tr>
      <th className="w-12 px-2 py-2 text-left text-xs text-gray-500">#</th>
      {fields.map(f => (
        <th key={f.id} className="px-3 py-2 text-left text-xs text-gray-500 border-l border-gray-200">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-700">{f.name}</span>
            <span className="text-gray-400">{mapFieldTypeLabel(f.type)}</span>
          </div>
        </th>
      ))}
    </tr>
  ), [fields]);

  const PreviewRows = useMemo(() => (
    Array.from({ length: Math.max(1, initialRows || 1) }).map((_, i) => (
      <tr key={i} className="border-t border-gray-100">
        <td className="w-12 px-2 py-2 text-xs text-gray-500">{i + 1}</td>
        {fields.map(f => (
          <td key={f.id} className="px-3 py-2 text-sm text-gray-700 border-l border-gray-100">
            {renderPreviewCell(f)}
          </td>
        ))}
      </tr>
    ))
  ), [fields, initialRows]);

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <div className="shrink-0 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <input
            value={icon}
            onChange={e => setIcon(e.target.value)}
            className="w-12 text-2xl text-center bg-transparent"
          />
          <input
            value={tableName}
            onChange={e => setTableName(e.target.value)}
            className="px-3 py-2 border rounded w-72"
            placeholder="表格名称"
          />
          <input
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="px-3 py-2 border rounded w-[28rem]"
            placeholder="表格描述"
          />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onCancel} className="px-3 py-1.5 rounded border">取消</button>
          <button onClick={handleSave} className="px-3 py-1.5 rounded bg-blue-600 text-white">保存并创建</button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex">
        {/* 左侧：字段配置 */}
        <div className="w-[520px] border-r border-gray-200 p-3 overflow-auto">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-800">列设置</h3>
            <button onClick={addField} className="text-sm px-2 py-1 rounded bg-gray-100 hover:bg-gray-200">新增列</button>
          </div>

          {/* 预设指标选择 */}
          <div className="mb-4 border rounded p-3">
            <div className="text-sm font-semibold text-gray-800 mb-2">预设指标（只读，由 AI 填充）</div>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_INDICATORS.map(p => {
                const checked = selectedPresetIds.includes(p.id);
                return (
                  <label key={p.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setSelectedPresetIds(prev => {
                          const set = new Set(prev);
                          if (e.target.checked) set.add(p.id); else set.delete(p.id);
                          return Array.from(set);
                        });
                      }}
                    />
                    <span>{p.name}</span>
                  </label>
                );
              })}
            </div>
            <div className="mt-2 text-xs text-gray-500">仅控制默认视图是否显示。未勾选的预设指标仍会创建，但在默认视图中隐藏。</div>
          </div>

          <div className="space-y-3">
            {fields.map((f, idx) => (
              <div key={f.id} className="border rounded p-2">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    value={f.name}
                    onChange={e => updateField(f.id, { name: e.target.value })}
                    className="px-2 py-1 border rounded flex-1"
                    placeholder="列名"
                  />
                  <select
                    value={f.type}
                    onChange={e => updateField(f.id, { type: e.target.value as FieldType })}
                    className="px-2 py-1 border rounded"
                  >
                    {Object.values(FieldType).map(t => (
                      <option key={t} value={t}>{mapFieldTypeLabel(t)}</option>
                    ))}
                  </select>
                </div>

                {/* 选项型字段配置 */}
                {(f.type === FieldType.SELECT || f.type === FieldType.MULTI_SELECT) && (
                  <SelectOptionsEditor
                    options={f.config?.options || []}
                    onChange={opts => updateField(f.id, { config: { ...(f.config || {}), options: opts } })}
                  />
                )}

                {/* 默认值配置 */}
                <div className="mt-2">
                  <label className="block text-xs text-gray-500 mb-1">默认值</label>
                  <input
                    value={(f.config as any)?.defaultValue ?? ''}
                    onChange={e => updateField(f.id, { config: { ...(f.config || {}), defaultValue: e.target.value } })}
                    className="px-2 py-1 border rounded w-full"
                    placeholder="可选"
                  />
                </div>

                {/* 数据源配置 */}
                <div className="mt-3">
                  <label className="block text-xs text-gray-500 mb-1">数据源</label>
                  <DataSourceEditor
                    value={(f.config as any)?.dataSource}
                    onChange={ds => updateField(f.id, { config: { ...(f.config || {}), dataSource: ds } })}
                  />
                </div>

                <div className="flex items-center justify-between mt-3 text-sm">
                  <div className="flex gap-1">
                    <button className="px-2 py-1 rounded border" onClick={() => moveField(f.id, 'up')} disabled={idx === 0}>上移</button>
                    <button className="px-2 py-1 rounded border" onClick={() => moveField(f.id, 'down')} disabled={idx === fields.length - 1}>下移</button>
                  </div>
                  <button className="px-2 py-1 rounded border text-red-600" onClick={() => removeField(f.id)}>删除</button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <label className="block text-xs text-gray-500 mb-1">初始行数</label>
            <input
              type="number"
              min={0}
              max={100}
              value={initialRows}
              onChange={e => setInitialRows(Number(e.target.value))}
              className="px-2 py-1 border rounded w-32"
            />
          </div>
        </div>

        {/* 右侧：预览 */}
        <div className="flex-1 p-3 overflow-auto">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">预览</h3>
          <div className="border rounded overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0 z-10">
                {PreviewHeader}
              </thead>
              <tbody>
                {PreviewRows}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

function mapFieldTypeLabel(t: FieldType): string {
  switch (t) {
    case FieldType.TEXT: return '文本';
    case FieldType.LONG_TEXT: return '长文本';
    case FieldType.NUMBER: return '数字';
    case FieldType.SELECT: return '单选';
    case FieldType.MULTI_SELECT: return '多选';
    case FieldType.DATE: return '日期';
    case FieldType.DATETIME: return '日期时间';
    case FieldType.CHECKBOX: return '复选';
    case FieldType.URL: return '链接';
    case FieldType.EMAIL: return '邮箱';
    case FieldType.PHONE: return '电话';
    case FieldType.ATTACHMENT: return '附件';
    case FieldType.USER: return '用户';
    case FieldType.REFERENCE: return '关联表';
    case FieldType.FORMULA: return '公式';
    case FieldType.LOOKUP: return '查找';
    case FieldType.CREATED_TIME: return '创建时间';
    case FieldType.UPDATED_TIME: return '更新时间';
    case FieldType.CREATED_BY: return '创建人';
    case FieldType.UPDATED_BY: return '更新人';
    case FieldType.AUTO_NUMBER: return '自动编号';
    default: return String(t);
  }
}

function renderPreviewCell(f: BuilderFieldConfig) {
  switch (f.type) {
    case FieldType.CHECKBOX:
      return <input type="checkbox" disabled className="w-4 h-4" />;
    case FieldType.DATE:
      return <input type="date" disabled className="px-2 py-1 border rounded w-full" />;
    case FieldType.NUMBER:
      return <input type="number" disabled className="px-2 py-1 border rounded w-full" />;
    case FieldType.SELECT:
      return (
        <select disabled className="px-2 py-1 border rounded w-full">
          <option>选项</option>
        </select>
      );
    case FieldType.LONG_TEXT:
      return <textarea disabled className="px-2 py-1 border rounded w-full" rows={2} />;
    default:
      return <input type="text" disabled className="px-2 py-1 border rounded w-full" />;
  }
}

// 占位：选择型字段编辑器与数据源编辑器（与原实现一致，保持不变）
function SelectOptionsEditor(props: { options: any[]; onChange: (opts: any[]) => void }) {
  const { options, onChange } = props;
  const [text, setText] = useState((options || []).map((o: any) => o?.name ?? o?.label ?? '').join('\n'));
  return (
    <div className="mt-2">
      <label className="block text-xs text-gray-500 mb-1">选项（每行一个）</label>
      <textarea
        className="px-2 py-1 border rounded w-full h-24"
        value={text}
        onChange={e => setText(e.target.value)}
        onBlur={() => {
          const opts = text.split('\n').map(s => s.trim()).filter(Boolean).map((n, idx) => ({ id: `opt_${idx}`, name: n }));
          onChange(opts);
        }}
      />
    </div>
  );
}

function DataSourceEditor(props: { value: any; onChange: (v: any) => void }) {
  return (
    <div className="text-xs text-gray-500">可选：配置公式/引用/API 等数据源</div>
  );
}

export default SmartTableBuilder; 