import React, { useMemo, useState } from 'react';
import Modal from '../../../components/common/Modal';
import { FieldType, CreateFieldParams } from '../types';

interface AddFieldModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (params: CreateFieldParams) => void;
}

const FIELD_TYPE_LABEL: Record<FieldType, string> = {
  [FieldType.TEXT]: '文本',
  [FieldType.LONG_TEXT]: '长文本',
  [FieldType.NUMBER]: '数字',
  [FieldType.SELECT]: '单选',
  [FieldType.MULTI_SELECT]: '多选',
  [FieldType.DATE]: '日期',
  [FieldType.DATETIME]: '日期时间',
  [FieldType.CHECKBOX]: '复选框',
  [FieldType.URL]: '网址',
  [FieldType.EMAIL]: '邮箱',
  [FieldType.PHONE]: '电话',
  [FieldType.ATTACHMENT]: '附件',
  [FieldType.USER]: '人员',
  [FieldType.REFERENCE]: '关联',
  [FieldType.FORMULA]: '公式',
  [FieldType.LOOKUP]: '查找',
  [FieldType.CREATED_TIME]: '创建时间',
  [FieldType.UPDATED_TIME]: '更新时间',
  [FieldType.CREATED_BY]: '创建人',
  [FieldType.UPDATED_BY]: '更新人',
  [FieldType.AUTO_NUMBER]: '自动编号',
};

const FACTS_OPTIONS: Array<{ key: string; label: string }> = [
  { key: 'date', label: '日期 (date)' },
  { key: 'open', label: '今开 (open)' },
  { key: 'high', label: '最高 (high)' },
  { key: 'low', label: '最低 (low)' },
  { key: 'close', label: '收盘 (close)' },
  { key: 'volume', label: '成交量/总手 (volume)' },
  { key: 'amount', label: '成交额/金额 (amount)' },
  { key: 'float_cap', label: '流值/流通市值 (float_cap)' },
  { key: 'total_cap', label: '总值/总市值 (total_cap)' },
  { key: 'pe', label: '市盈 (pe)' },
  { key: 'turnover_rate', label: '换手 (turnover_rate)' },
  { key: 'pct_chg', label: '涨跌幅 (pct_chg)' },
  { key: 'chg', label: '涨跌额 (chg)' },
  { key: 'amplitude', label: '振幅 (amplitude)' },
  { key: 'in_volume', label: '内盘 (in_volume)' },
  { key: 'out_volume', label: '外盘 (out_volume)' },
];

const AddFieldModal: React.FC<AddFieldModalProps> = ({ open, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<FieldType>(FieldType.TEXT);
  const [defaultValue, setDefaultValue] = useState<any>('');
  const [selectOptionsText, setSelectOptionsText] = useState<string>('');
  const [required, setRequired] = useState<boolean>(false);
  const [mapsTo, setMapsTo] = useState<string>('');
  const [formula, setFormula] = useState<string>('');

  const isOptionType = useMemo(() => type === FieldType.SELECT || type === FieldType.MULTI_SELECT, [type]);

  const suggestFromName = (raw: string) => {
    const n = (raw || '').toLowerCase();
    const hit = (ks: string[]) => ks.some(k => n.includes(k));
    if (hit(['内盘','inner','neipan'])) return { m: 'in_volume' };
    if (hit(['外盘','outer','waipan'])) return { m: 'out_volume' };
    if (hit(['今开','开盘','open'])) return { m: 'open' };
    if (hit(['最高','high'])) return { m: 'high' };
    if (hit(['最低','low'])) return { m: 'low' };
    if (hit(['收盘','close'])) return { m: 'close' };
    if (hit(['成交量','总手','volume'])) return { m: 'volume' };
    if (hit(['成交额','金额','amount'])) return { m: 'amount' };
    if (hit(['流值','流通市值'])) return { m: 'float_cap' };
    if (hit(['总值','总市值'])) return { m: 'total_cap' };
    if (hit(['市盈','pe'])) return { m: 'pe' };
    if (hit(['换手'])) return { m: 'turnover_rate' };
    if (hit(['涨跌幅','涨幅','pct'])) return { m: 'pct_chg' };
    if (hit(['涨跌额','涨额'])) return { m: 'chg' };
    if (hit(['振幅','amplitude'])) return { f: '(high - low) / close * 100' };
    if (hit(['均价','均值','avg'])) return { f: 'amount / volume' };
    if (hit(['日期','交易日'])) return { m: 'date' };
    return {} as any;
  };

  const handleSave = () => {
    if (!name.trim()) return;

    const params: CreateFieldParams = {
      name: name.trim(),
      type,
      config: {
        required,
        defaultValue: defaultValue === '' ? undefined : defaultValue,
        mapsTo: mapsTo.trim() || undefined,
        formula: formula.trim() || undefined,
        options: isOptionType
          ? selectOptionsText
              .split('\n')
              .map(s => s.trim())
              .filter(Boolean)
              .map((n, idx) => ({ id: `opt_${idx}_${Date.now()}`, name: n }))
          : undefined,
      },
    };

    onSubmit(params);
    // 重置并关闭
    setName('');
    setType(FieldType.TEXT);
    setDefaultValue('');
    setSelectOptionsText('');
    setRequired(false);
    setMapsTo('');
    setFormula('');
    onClose();
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="新增指标" width="max-w-xl">
      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-gray-600">指标名称</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={name}
            onChange={e => {
              const v = e.target.value;
              setName(v);
              // 智能建议：仅在未手动填写 mapsTo/formula 时给出
              if (!mapsTo && !formula) {
                const s = suggestFromName(v);
                if (s.m) setMapsTo(s.m);
                if (s.f) setFormula(s.f);
              }
            }}
            placeholder="如：交易价格"
          />
          <p className="text-xs text-gray-400">系统会根据名称智能建议“映射/公式”，也可手动调整；留空也可以，系统会尽量根据同义词自动补全。</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-gray-600">指标类型</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={type}
            onChange={e => setType(e.target.value as FieldType)}
          >
            {Object.values(FieldType).map(t => (
              <option key={t} value={t}>{FIELD_TYPE_LABEL[t]}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-sm text-gray-600">映射事实键（可选）</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={mapsTo}
              onChange={e => setMapsTo(e.target.value)}
            >
              <option value="">不映射（自动识别）</option>
              {FACTS_OPTIONS.map(o => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400">不清楚就留空，系统会按字段名自动匹配；或使用公式。</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-gray-600">公式（可选）</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={formula}
              onChange={e => setFormula(e.target.value)}
              placeholder="如：(high - low) / close * 100"
            />
            <p className="text-xs text-gray-400">可用变量：open/high/low/close/volume/amount/...；示例：均价=amount/volume。</p>
          </div>
        </div>

        {isOptionType && (
          <div className="space-y-2">
            <label className="text-sm text-gray-600">选项（每行一个）</label>
            <textarea
              className="w-full border rounded px-3 py-2 h-28"
              value={selectOptionsText}
              onChange={e => setSelectOptionsText(e.target.value)}
              placeholder={"如：\n买入\n卖出"}
            />
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm text-gray-600">默认值（可选）</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={defaultValue}
            onChange={e => setDefaultValue(e.target.value)}
            placeholder="留空则无默认值"
          />
        </div>

        <div className="flex items-center gap-2">
          <input id="required" type="checkbox" checked={required} onChange={e => setRequired(e.target.checked)} />
          <label htmlFor="required" className="text-sm text-gray-700">必填</label>
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded text-gray-700">取消</button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded" disabled={!name.trim()}>保存</button>
        </div>
      </div>
    </Modal>
  );
};

export default AddFieldModal; 