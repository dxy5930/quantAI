import React, { useEffect, useMemo, useRef } from 'react';
import Grid from 'tui-grid';
import 'tui-grid/dist/tui-grid.css';
import { Field, FieldType, TableRecord, RecordData, ViewConfig } from '../types';

interface TuiGridViewProps {
  fields: Field[];
  records: TableRecord[];
  viewConfig?: ViewConfig;
  onRecordUpdate: (recordId: string, data: Partial<RecordData>) => void;
  onRecordDelete: (recordId: string) => void;
  onAddRecord: () => void;
  onAddField: () => void;
  readonly?: boolean;
}

const TuiGridView: React.FC<TuiGridViewProps> = ({
  fields,
  records,
  viewConfig,
  onRecordUpdate,
  onRecordDelete,
  onAddRecord,
  onAddField,
  readonly = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<Grid | null>(null);

  const visibleFields = useMemo(() => {
    const baseFields = [...fields].sort((a, b) => a.order - b.order);
    return baseFields.filter(f => !viewConfig?.hiddenFields?.includes(f.id));
  }, [fields, viewConfig]);

  const rows = useMemo(() => {
    return records.map(r => ({ id: r.id, ...r.data }));
  }, [records]);

  useEffect(() => {
    if (!containerRef.current) return;

    if (!gridRef.current) {
      gridRef.current = new Grid({
        el: containerRef.current,
        data: rows,
        columns: visibleFields.map(f => mapFieldToColumn(f)),
        bodyHeight: 'fitToParent',
        rowHeaders: ['rowNum'],
        scrollX: true,
        scrollY: true,
        usageStatistics: false,
        columnOptions: { resizable: true },
      });

      gridRef.current.on('afterChange', (ev: any) => {
        if (!ev?.changes) return;
        ev.changes.forEach((change: any) => {
          const { rowKey, columnName, value, nextValue } = change;
          if (value === nextValue) return;
          const row = gridRef.current!.getRow(rowKey);
          const recordId = row?.id as string;
          if (!recordId) return;
          onRecordUpdate(recordId, { [columnName]: nextValue });
        });
      });
    } else {
      // 已创建实例则更新数据与列
      gridRef.current.resetData(rows);
      gridRef.current.setColumns(visibleFields.map(f => mapFieldToColumn(f)));
    }

    return () => {
      // 组件卸载时销毁实例
      // 注意：不要在每次依赖变更时销毁
    };
    // 仅在首次创建时访问 containerRef
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, visibleFields]);

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {!readonly && (
        <div className="p-2 border-b border-gray-200 flex items-center gap-2">
          <button
            onClick={onAddRecord}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            新增记录
          </button>
          <button
            onClick={onAddField}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            新增指标
          </button>
        </div>
      )}
      <div className="flex-1 min-h-0" ref={containerRef} />
    </div>
  );
};

function mapFieldToColumn(field: Field) {
  const common: any = {
    header: field.name,
    name: field.id,
    align: 'left',
    width: field.width || 160,
  };

  // 预设字段保持只读，不提供 editor
  if (field.isPreset) {
    switch (field.type) {
      case FieldType.CHECKBOX:
        return {
          ...common,
          formatter: ({ value }: any) => (value ? '✔' : ''),
          width: Math.max(80, field.width || 80),
        };
      case FieldType.SELECT:
        return {
          ...common,
          formatter: ({ value }: any) => {
            const opt = field.config?.options?.find((o: any) => o?.id === value || o?.value === value || o?.name === value || o?.label === value);
            return ((opt as any)?.name ?? (opt as any)?.label ?? value ?? '') as string;
          },
        };
      default:
        return { ...common };
    }
  }

  switch (field.type) {
    case FieldType.NUMBER:
      return { ...common, editor: 'text', align: 'right' };
    case FieldType.CHECKBOX:
      return {
        ...common,
        formatter: ({ value }: any) => (value ? '✔' : ''),
        width: Math.max(80, field.width || 80),
      };
    case FieldType.SELECT:
      return {
        ...common,
        formatter: ({ value }: any) => {
          const opt = field.config?.options?.find((o: any) => o?.id === value || o?.value === value || o?.name === value || o?.label === value);
          return ((opt as any)?.name ?? (opt as any)?.label ?? value ?? '') as string;
        },
      };
    case FieldType.DATE:
    case FieldType.DATETIME:
      return { ...common };
    default:
      return { ...common, editor: 'text' };
  }
}

export default TuiGridView; 