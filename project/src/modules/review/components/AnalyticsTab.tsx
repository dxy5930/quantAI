import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { Field, FieldType, TableRecord } from '../types';

interface AnalyticsTabProps {
  fields: Field[];
  records: TableRecord[];
}

function getPrimaryTextField(fields: Field[]): Field | undefined {
  const primary = fields.find(f => f.isPrimary);
  if (primary) return primary;
  return fields.find(f => f.type === FieldType.TEXT || f.type === FieldType.LONG_TEXT);
}

function getDateField(fields: Field[]): Field | undefined {
  return fields.find(f => f.type === FieldType.DATE || f.type === FieldType.DATETIME);
}

function getNumericFields(fields: Field[]): Field[] {
  return fields.filter(f => f.type === FieldType.NUMBER);
}

function getSelectField(fields: Field[]): Field | undefined {
  return fields.find(f => f.type === FieldType.SELECT || f.type === FieldType.MULTI_SELECT);
}

function safeNumber(value: any): number | null {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

const containerClass = 'bg-white rounded-lg border border-gray-200 p-4';

const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ fields, records }) => {
  const primaryTextField = useMemo(() => getPrimaryTextField(fields), [fields]);
  const dateField = useMemo(() => getDateField(fields), [fields]);
  const numericFields = useMemo(() => getNumericFields(fields).slice(0, 3), [fields]);
  const selectField = useMemo(() => getSelectField(fields), [fields]);

  const labels = useMemo(() => {
    return records.map((r, idx) => {
      if (primaryTextField) {
        const v = r.data[primaryTextField.id];
        if (v !== undefined && v !== null && String(v).length > 0) return String(v);
      }
      return `记录${idx + 1}`;
    });
  }, [records, primaryTextField]);

  const barOption = useMemo(() => {
    const field = numericFields[0];
    if (!field) return undefined;
    const seriesData = records.map(r => safeNumber(r.data[field.id]) ?? 0);
    return {
      title: { text: `${field.name}（当前视图）`, left: 'center' },
      tooltip: { trigger: 'axis' },
      grid: { left: 40, right: 20, top: 40, bottom: 40 },
      xAxis: { type: 'category', data: labels },
      yAxis: { type: 'value' },
      series: [
        { name: field.name, type: 'bar', data: seriesData, itemStyle: { color: '#3B82F6' } }
      ]
    } as echarts.EChartsOption;
  }, [numericFields, records, labels]);

  const multiLineOption = useMemo(() => {
    if (!dateField || numericFields.length === 0) return undefined;
    const rows = records
      .map(r => ({
        date: r.data[dateField.id] ? new Date(r.data[dateField.id]).getTime() : null,
        data: r.data
      }))
      .filter(r => r.date !== null)
      .sort((a, b) => (a.date as number) - (b.date as number));

    const x = rows.map(r => new Date(r.date as number).toLocaleDateString());
    const series = numericFields.map(f => ({
      name: f.name,
      type: 'line',
      smooth: true,
      data: rows.map(row => safeNumber(row.data[f.id]))
    }));

    return {
      title: { text: '数值字段随时间变化', left: 'center' },
      tooltip: { trigger: 'axis' },
      legend: { bottom: 0 },
      grid: { left: 40, right: 20, top: 40, bottom: 60 },
      xAxis: { type: 'category', data: x },
      yAxis: { type: 'value' },
      series
    } as echarts.EChartsOption;
  }, [dateField, numericFields, records]);

  const pieOption = useMemo(() => {
    if (!selectField) return undefined;
    const counts: Record<string, number> = {};
    const optionNames = selectField.config?.options?.map(o => o.name) || [];
    for (const name of optionNames) counts[name] = 0;

    records.forEach(r => {
      const v = r.data[selectField.id];
      if (Array.isArray(v)) {
        v.forEach((x: any) => {
          const name = typeof x === 'string' ? x : x?.name ?? String(x);
          counts[name] = (counts[name] || 0) + 1;
        });
      } else if (v != null) {
        const name = typeof v === 'string' ? v : v?.name ?? String(v);
        counts[name] = (counts[name] || 0) + 1;
      }
    });

    const data = Object.entries(counts).map(([name, value]) => ({ name, value }));
    if (data.length === 0) return undefined;

    return {
      title: { text: `${selectField.name}分布`, left: 'center' },
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      series: [
        {
          type: 'pie',
          radius: '60%',
          data,
          emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.3)' } }
        }
      ]
    } as echarts.EChartsOption;
  }, [selectField, records]);

  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className={containerClass}>
          {barOption ? (
            <ReactECharts echarts={echarts} option={barOption} notMerge={true} lazyUpdate={true} style={{ height: 360 }} />
          ) : (
            <div className="text-gray-500 text-sm">未找到数值字段，无法生成柱状图</div>
          )}
        </div>

        <div className={containerClass}>
          {multiLineOption ? (
            <ReactECharts echarts={echarts} option={multiLineOption} notMerge={true} lazyUpdate={true} style={{ height: 360 }} />
          ) : (
            <div className="text-gray-500 text-sm">缺少日期字段或数值字段，无法生成折线图</div>
          )}
        </div>

        <div className={containerClass}>
          {pieOption ? (
            <ReactECharts echarts={echarts} option={pieOption} notMerge={true} lazyUpdate={true} style={{ height: 360 }} />
          ) : (
            <div className="text-gray-500 text-sm">缺少单选/多选字段，无法生成分布图</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab; 