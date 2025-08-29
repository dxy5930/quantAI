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

const AddFieldModal: React.FC<AddFieldModalProps> = ({ open, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<FieldType>(FieldType.TEXT);
  const [defaultValue, setDefaultValue] = useState<any>('');
  const [selectOptionsText, setSelectOptionsText] = useState<string>('');
  const [required, setRequired] = useState<boolean>(false);

  const isOptionType = useMemo(() => type === FieldType.SELECT || type === FieldType.MULTI_SELECT, [type]);

  const handleSave = () => {
    if (!name.trim()) return;

    const params: CreateFieldParams = {
      name: name.trim(),
      type,
      config: {
        required,
        defaultValue: defaultValue === '' ? undefined : defaultValue,
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
            onChange={e => setName(e.target.value)}
            placeholder="如：交易价格"
          />
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