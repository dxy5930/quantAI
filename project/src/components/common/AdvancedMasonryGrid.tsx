import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';

interface AdvancedMasonryGridProps {
  children: React.ReactNode[];
  columns?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: number;
  className?: string;
  itemClassName?: string;
}

export const AdvancedMasonryGrid: React.FC<AdvancedMasonryGridProps> = ({
  children,
  columns = { sm: 1, md: 2, lg: 3, xl: 4 },
  gap = 16,
  className = '',
  itemClassName = ''
}) => {
  const [columnCount, setColumnCount] = useState(columns.sm || 1);
  const containerRef = useRef<HTMLDivElement>(null);

  // 计算列宽度
  const calculateColumnWidth = useCallback(() => {
    if (!containerRef.current) return 0;
    const containerWidth = containerRef.current.offsetWidth;
    return (containerWidth - gap * (columnCount - 1)) / columnCount;
  }, [columnCount, gap]);

  // 响应式列数计算
  const updateColumns = useCallback(() => {
    if (!containerRef.current) return;
    
    const width = containerRef.current.offsetWidth;
    let cols = columns.sm || 1;
    
    if (width >= 1280 && columns.xl) cols = columns.xl;
    else if (width >= 1024 && columns.lg) cols = columns.lg;
    else if (width >= 768 && columns.md) cols = columns.md;
    else if (width >= 640 && columns.sm) cols = columns.sm;
    
    if (cols !== columnCount) {
      setColumnCount(cols);
    }
  }, [columns, columnCount]);

  // 使用CSS Grid布局，让浏览器自动处理
  const getGridStyle = useMemo(() => {
    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
      gap: `${gap}px`,
      width: '100%'
    };
  }, [columnCount, gap]);

  // 初始化组件
  useEffect(() => {
    updateColumns();
    window.addEventListener('resize', updateColumns);
    
    return () => {
      window.removeEventListener('resize', updateColumns);
    };
  }, [updateColumns]);

  // 分配子元素到各列 - 使用memoized计算
  const columnsArray = useMemo(() => {
    const result: React.ReactNode[][] = Array.from({ length: columnCount }, () => []);
    
    children.forEach((child, index) => {
      const columnIndex = index % columnCount;
      result[columnIndex].push(
        <div 
          key={index}
          className={itemClassName}
          style={{ 
            breakInside: 'avoid',
            pageBreakInside: 'avoid'
          }}
        >
          {child}
        </div>
      );
    });
    
    return result;
  }, [children, columnCount, itemClassName, gap]);

  // 统一使用flex布局，避免两阶段渲染
  return (
    <div 
      ref={containerRef}
      className={`flex w-full ${className}`}
      style={{ 
        gap: `${gap}px`,
        alignItems: 'flex-start'
      }}
    >
      {columnsArray.map((column, columnIndex) => (
        <div
          key={columnIndex}
          className="flex flex-col flex-1"
          style={{ 
            gap: `${gap}px`
          }}
        >
          {column}
        </div>
      ))}
    </div>
  );
}; 