import React, { useMemo, useRef, useState } from 'react';
import { Field, CreateFieldParams } from '../types';

interface FieldManagerPanelProps {
  open: boolean;
  fields: Field[];
  hiddenFieldIds: string[];
  onClose: () => void;
  onToggleHide: (fieldId: string, hide: boolean) => void;
  onMove: (fieldId: string, direction: 'up' | 'down') => void;
  onRename: (fieldId: string, name: string) => void;
  onEdit: (fieldId: string) => void;
  onDelete: (fieldId: string) => void;
  onReorder: (orderedIds: string[]) => void;
  onCreateField: (params: CreateFieldParams) => void;
}

const FieldManagerPanel: React.FC<FieldManagerPanelProps> = ({ open, fields, hiddenFieldIds, onClose, onToggleHide, onMove, onRename, onEdit, onDelete, onReorder, onCreateField }) => {
  const orderedAll = useMemo(() => [...fields].sort((a, b) => a.order - b.order), [fields]);
  const ordered = useMemo(() => orderedAll.filter(f => !f.isPreset), [orderedAll]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!open) return null;

  const handleDragStart = (id: string) => () => setDraggingId(id);
  const handleDragOver = (id: string) => (e: React.DragEvent) => {
    e.preventDefault();
    if (overId !== id) setOverId(id);
  };
  const handleDrop = (id: string) => (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggingId) return;
    const ids = ordered.map(f => f.id);
    const from = ids.indexOf(draggingId);
    const to = ids.indexOf(id);
    if (from === -1 || to === -1 || from === to) return;
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    onReorder(ids);
    setDraggingId(null);
    setOverId(null);
  };
  const handleDragEnd = () => {
    setDraggingId(null);
    setOverId(null);
  };

  const handleExport = () => {
    // 仅导出非预设字段
    const simple = ordered.map(f => ({ name: f.name, type: f.type, config: f.config, width: f.width }));
    const blob = new Blob([JSON.stringify(simple, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fields.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => fileInputRef.current?.click();
  const handleImportChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const list = JSON.parse(text);
      if (!Array.isArray(list)) return;
      list.forEach((item: any) => {
        if (item && item.name && item.type) {
          const params: CreateFieldParams = { name: item.name, type: item.type, config: item.config, };
          onCreateField(params);
        }
      });
    } catch (err) {
      console.error('导入字段失败', err);
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex">
      <div className="flex-1" onClick={onClose} />
      <div className="w-[420px] bg-white shadow-2xl border-l border-gray-200 p-4 overflow-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">指标管理</h3>
          <div className="flex items-center gap-2">
            <button className="px-2 py-1 text-sm border rounded" onClick={handleExport}>导出</button>
            <button className="px-2 py-1 text-sm border rounded" onClick={handleImportClick}>导入</button>
            <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImportChange} />
            <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>关闭</button>
          </div>
        </div>

        <div className="space-y-3">
          {ordered.map((f, idx) => {
            const isHidden = hiddenFieldIds.includes(f.id);
            const isOver = overId === f.id && draggingId !== f.id;
            const isPreset = !!f.isPreset;
            return (
              <div
                key={f.id}
                className={`border rounded p-2 ${isOver ? 'ring-2 ring-blue-300' : ''}`}
                draggable
                onDragStart={handleDragStart(f.id)}
                onDragOver={handleDragOver(f.id)}
                onDrop={handleDrop(f.id)}
                onDragEnd={handleDragEnd}
              >
                <div className="flex items-center gap-2">
                  <div className="cursor-move select-none text-gray-400">☰</div>
                  <input
                    className="flex-1 border rounded px-2 py-1"
                    value={f.name}
                    onChange={e => !isPreset && onRename(f.id, e.target.value)}
                    disabled={isPreset}
                  />
                  {isPreset && <span className="text-gray-400" title="预设字段，结构只读">🔒</span>}
                  <button className="px-2 py-1 text-sm border rounded" onClick={() => onMove(f.id, 'up')} disabled={idx === 0}>上移</button>
                  <button className="px-2 py-1 text-sm border rounded" onClick={() => onMove(f.id, 'down')} disabled={idx === ordered.length - 1}>下移</button>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={isHidden} onChange={e => onToggleHide(f.id, e.target.checked)} /> 隐藏
                  </label>
                  <div className="flex items-center gap-2">
                    <button className="px-2 py-1 text-sm border rounded" onClick={() => !isPreset && onEdit(f.id)} disabled={isPreset}>编辑</button>
                    <button className="px-2 py-1 text-sm border rounded text-red-600" onClick={() => !isPreset && onDelete(f.id)} disabled={isPreset}>删除</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FieldManagerPanel; 