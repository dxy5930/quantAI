import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { EquityData } from '../../types';

interface EquityChartProps {
  data: EquityData[];
  title?: string;
  height?: number;
  className?: string;
}

const EquityChart: React.FC<EquityChartProps> = ({
  data,
  title = '资金曲线',
  height = 400,
  className = '',
}) => {
  const formatCurrency = (value: number) => {
    if (!value || value === 0) {
      return '0';
    }
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toFixed(0);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
    });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
            {formatDate(label)}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              <span className="font-medium">{entry.name}:</span> 
              {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 20,
          }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#374151" 
            opacity={0.3}
          />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            stroke="#6B7280"
            fontSize={12}
            tick={{ fill: '#6B7280' }}
          />
          <YAxis
            tickFormatter={formatCurrency}
            stroke="#6B7280"
            fontSize={12}
            tick={{ fill: '#6B7280' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={false}
            name="策略净值"
            activeDot={{ r: 4, fill: '#3B82F6' }}
          />
          {data.some(d => d.benchmark) && (
            <Line
              type="monotone"
              dataKey="benchmark"
              stroke="#6B7280"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="基准"
              activeDot={{ r: 4, fill: '#6B7280' }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EquityChart; 