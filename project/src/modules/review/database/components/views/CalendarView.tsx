/**
 * 日历视图组件
 * Calendar View Component - 基于日期的复盘记录展示
 */

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { 
  ReviewDatabase, 
  ViewDefinition, 
  DatabaseRecord, 
  FieldDefinition, 
  FieldType, 
  RecordData,
  ViewComponentProps 
} from '../../types';
import { FieldRenderer } from '../fields/FieldRenderer';

interface CalendarViewProps extends ViewComponentProps {
  onRecordAdd?: (data: RecordData) => Promise<DatabaseRecord | null>;
  onRecordDelete?: (recordId: string) => void;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  records: DatabaseRecord[];
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  database,
  view,
  records,
  onRecordSelect,
  onRecordUpdate,
  onRecordAdd,
  onRecordDelete,
  readOnly = false,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [recordMenuOpen, setRecordMenuOpen] = useState<string | null>(null);

  // 获取日期字段
  const dateField = useMemo(() => {
    const fieldId = view.config.dateField;
    return database.fields.find(f => f.id === fieldId && (f.type === FieldType.DATE || f.type === FieldType.DATETIME));
  }, [database.fields, view.config.dateField]);

  // 获取标题字段
  const titleField = useMemo(() => {
    const fieldId = view.config.titleField;
    return database.fields.find(f => f.id === fieldId) || database.fields.find(f => f.isPrimary);
  }, [database.fields, view.config.titleField]);

  // 获取颜色字段
  const colorField = useMemo(() => {
    const fieldId = view.config.colorField;
    return database.fields.find(f => f.id === fieldId && f.type === FieldType.SELECT);
  }, [database.fields, view.config.colorField]);

  // 生成日历数据
  const calendarData = useMemo((): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // 获取本月第一天和最后一天
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // 获取日历开始日期（包含上月末尾几天）
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // 获取日历结束日期（包含下月开始几天）
    const endDate = new Date(lastDay);
    const remainingDays = 6 - lastDay.getDay();
    endDate.setDate(endDate.getDate() + remainingDays);
    
    const days: CalendarDay[] = [];
    const currentLoop = new Date(startDate);
    
    while (currentLoop <= endDate) {
      const dayRecords = dateField ? records.filter(record => {
        const recordDate = record.data[dateField.id];
        if (!recordDate) return false;
        
        const date = new Date(String(recordDate));
        return date.toDateString() === currentLoop.toDateString();
      }) : [];
      
      days.push({
        date: new Date(currentLoop),
        isCurrentMonth: currentLoop.getMonth() === month,
        records: dayRecords,
      });
      
      currentLoop.setDate(currentLoop.getDate() + 1);
    }
    
    return days;
  }, [currentDate, records, dateField]);

  // 处理月份导航
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  // 处理记录操作
  const handleRecordAction = (action: string, record: DatabaseRecord) => {
    setRecordMenuOpen(null);
    
    switch (action) {
      case 'edit':
        onRecordSelect?.(record);
        break;
      case 'delete':
        if (window.confirm('确定要删除这条记录吗？')) {
          onRecordDelete?.(record.id);
        }
        break;
    }
  };

  // 添加新记录
  const handleAddRecord = async (date: Date) => {
    if (!onRecordAdd || !dateField) return;
    
    const newData: RecordData = {
      [dateField.id]: date.toISOString().split('T')[0], // YYYY-MM-DD 格式
    };
    
    try {
      await onRecordAdd(newData);
    } catch (error) {
      console.error('添加记录失败:', error);
    }
  };

  // 获取记录颜色
  const getRecordColor = (record: DatabaseRecord): string => {
    if (!colorField) return '#3b82f6';
    
    const value = record.data[colorField.id];
    const option = colorField.config?.options?.find(opt => opt.id === value);
    return option?.color || '#3b82f6';
  };

  // 渲染记录项
  const renderRecord = (record: DatabaseRecord) => {
    const title = titleField ? record.data[titleField.id] : record.id;
    const color = getRecordColor(record);
    
    return (
      <div
        key={record.id}
        className="relative group mb-1 p-1 rounded text-xs cursor-pointer hover:shadow-sm transition-all"
        style={{ backgroundColor: `${color}20`, borderLeft: `3px solid ${color}` }}
        onClick={() => onRecordSelect?.(record)}
      >
        <div className="truncate font-medium text-gray-900 dark:text-white">
          {String(title || '无标题')}
        </div>
        
        {!readOnly && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setRecordMenuOpen(recordMenuOpen === record.id ? null : record.id);
            }}
            className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-gray-600 transition-all"
          >
            <MoreHorizontal className="w-3 h-3" />
          </button>
        )}
        
        {recordMenuOpen === record.id && (
          <div className="absolute top-6 right-0 w-24 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded shadow-lg z-20">
            <div className="p-1">
              <button
                onClick={() => handleRecordAction('edit', record)}
                className="w-full flex items-center space-x-1 px-2 py-1 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <Edit className="w-3 h-3" />
                <span>编辑</span>
              </button>
              <button
                onClick={() => handleRecordAction('delete', record)}
                className="w-full flex items-center space-x-1 px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
              >
                <Trash2 className="w-3 h-3" />
                <span>删除</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 渲染日期单元格
  const renderDay = (day: CalendarDay) => {
    const isToday = day.date.toDateString() === new Date().toDateString();
    const isSelected = selectedDate?.toDateString() === day.date.toDateString();
    
    return (
      <div
        key={day.date.toISOString()}
        className={`min-h-24 p-2 border border-gray-200 dark:border-gray-600 ${
          day.isCurrentMonth 
            ? 'bg-white dark:bg-gray-800' 
            : 'bg-gray-50 dark:bg-gray-900'
        } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
        onClick={() => setSelectedDate(day.date)}
      >
        <div className="flex items-center justify-between mb-1">
          <span className={`text-sm font-medium ${
            isToday 
              ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs'
              : day.isCurrentMonth
                ? 'text-gray-900 dark:text-white'
                : 'text-gray-400 dark:text-gray-600'
          }`}>
            {day.date.getDate()}
          </span>
          
          {!readOnly && day.isCurrentMonth && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAddRecord(day.date);
              }}
              className="opacity-0 hover:opacity-100 p-1 text-gray-400 hover:text-blue-600 transition-all"
              title="添加记录"
            >
              <Plus className="w-3 h-3" />
            </button>
          )}
        </div>
        
        <div className="space-y-1 max-h-16 overflow-y-auto">
          {day.records.slice(0, 3).map(record => renderRecord(record))}
          {day.records.length > 3 && (
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              +{day.records.length - 3} 更多
            </div>
          )}
        </div>
      </div>
    );
  };

  // 如果没有设置日期字段，显示提示
  if (!dateField) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            配置日历视图
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md">
            请在视图设置中选择一个日期字段作为日历的时间轴，然后就可以按日期查看复盘记录了。
          </p>
        </div>
      </div>
    );
  }

  const monthNames = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ];

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className="h-full bg-white dark:bg-gray-800 flex flex-col">
      {/* 日历头部 */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {currentDate.getFullYear()}年 {monthNames[currentDate.getMonth()]}
          </h2>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              今天
            </button>
            
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 星期标题 */}
      <div className="flex-shrink-0 grid grid-cols-7 border-b border-gray-200 dark:border-gray-600">
        {weekDays.map(day => (
          <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700">
            {day}
          </div>
        ))}
      </div>

      {/* 日历主体 */}
      <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-hidden">
        {calendarData.map(day => renderDay(day))}
      </div>

      {/* 点击外部关闭菜单 */}
      {recordMenuOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setRecordMenuOpen(null)}
        />
      )}
    </div>
  );
};

export default CalendarView;