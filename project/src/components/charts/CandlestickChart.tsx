import React from 'react';
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { CandlestickData } from '../../types';

interface CandlestickChartProps {
  data: CandlestickData[];
  title?: string;
  height?: number;
  className?: string;
}

const CandlestickChart: React.FC<CandlestickChartProps> = ({
  data,
  title = 'K线图',
  height = 400,
  className = '',
}) => {
  // 处理数据，为每个K线添加上下影线数据
  const processedData = data.map(item => ({
    ...item,
    shadowRange: [item.low, item.high],
    bodyRange: item.close >= item.open ? [item.open, item.close] : [item.close, item.open],
    isPositive: item.close >= item.open,
  }));

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatVolume = (value: number) => {
    if (!value || value === 0) {
      return '0';
    }
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      if (data) {
        return (
          <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm">
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
              {formatDate(label)}
            </p>
            <div className="space-y-1 text-sm">
              <p className="text-gray-900 dark:text-white">
                <span className="font-medium">开盘:</span> {Number(data.open || 0).toFixed(2)}
              </p>
              <p className="text-gray-900 dark:text-white">
                <span className="font-medium">收盘:</span> {Number(data.close || 0).toFixed(2)}
              </p>
              <p className="text-gray-900 dark:text-white">
                <span className="font-medium">最高:</span> {Number(data.high || 0).toFixed(2)}
              </p>
              <p className="text-gray-900 dark:text-white">
                <span className="font-medium">最低:</span> {Number(data.low || 0).toFixed(2)}
              </p>
              <p className="text-gray-900 dark:text-white">
                <span className="font-medium">成交量:</span> {formatVolume(data.volume)}
              </p>
              <p className={`font-medium ${data.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                涨跌: {data.isPositive ? '+' : ''}{(((Number(data.close) || 0) - (Number(data.open) || 0)) / (Number(data.open) || 1) * 100).toFixed(2)}%
              </p>
            </div>
          </div>
        );
      }
    }
    return null;
  };

  // 自定义K线形状组件
  const CustomCandlestick = (props: any) => {
    const { payload, x, y, width, height } = props;
    if (!payload) return null;

    const { open, close, high, low, isPositive } = payload;
    const candleWidth = Math.max(width * 0.6, 2);
    const centerX = x + width / 2;
    
    // 计算价格到像素的映射
    const priceRange = high - low;
    const pixelPerPrice = height / priceRange;
    
    const openY = y + height - (open - low) * pixelPerPrice;
    const closeY = y + height - (close - low) * pixelPerPrice;
    const highY = y + height - (high - low) * pixelPerPrice;
    const lowY = y + height - (low - low) * pixelPerPrice;
    
    const bodyTop = Math.min(openY, closeY);
    const bodyHeight = Math.abs(openY - closeY);
    
    const color = isPositive ? '#10B981' : '#EF4444';
    const fillColor = isPositive ? '#10B981' : '#EF4444';
    
    return (
      <g>
        {/* 上影线 */}
        <line
          x1={centerX}
          y1={highY}
          x2={centerX}
          y2={bodyTop}
          stroke={color}
          strokeWidth={1}
        />
        {/* 下影线 */}
        <line
          x1={centerX}
          y1={bodyTop + bodyHeight}
          x2={centerX}
          y2={lowY}
          stroke={color}
          strokeWidth={1}
        />
        {/* K线实体 */}
        <rect
          x={centerX - candleWidth / 2}
          y={bodyTop}
          width={candleWidth}
          height={Math.max(bodyHeight, 1)}
          fill={fillColor}
          stroke={color}
          strokeWidth={1}
        />
      </g>
    );
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart
          data={processedData}
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
            domain={['dataMin - 1', 'dataMax + 1']}
            stroke="#6B7280"
            fontSize={12}
            tick={{ fill: '#6B7280' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="close"
            shape={<CustomCandlestick />}
            fill="transparent"
          />
        </ComposedChart>
      </ResponsiveContainer>
      
      {/* 成交量图表 */}
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          成交量
        </h4>
        <ResponsiveContainer width="100%" height={100}>
          <ComposedChart
            data={processedData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              stroke="#6B7280"
              fontSize={10}
              tick={{ fill: '#6B7280' }}
            />
            <YAxis
              tickFormatter={formatVolume}
              stroke="#6B7280"
              fontSize={10}
              tick={{ fill: '#6B7280' }}
            />
            <Bar dataKey="volume" fill="#6B7280" opacity={0.6}>
              {processedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.isPositive ? '#10B981' : '#EF4444'} />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CandlestickChart; 