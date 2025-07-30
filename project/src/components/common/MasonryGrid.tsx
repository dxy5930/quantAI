import React, { useEffect, useRef, useState } from 'react';

interface MasonryGridProps {
  children: React.ReactNode[];
  columns?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: number;
  className?: string;
}

export const MasonryGrid: React.FC<MasonryGridProps> = ({
  children,
  columns = { sm: 1, md: 2, lg: 3, xl: 4 },
  gap = 16,
  className = ''
}) => {
  const [columnCount, setColumnCount] = useState(columns.sm || 1);
  const [isLoaded, setIsLoaded] = useState(false);
  const [itemWidths, setItemWidths] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // 计算列宽度
  const calculateColumnWidth = () => {
    if (!containerRef.current) return 0;
    const containerWidth = containerRef.current.offsetWidth;
    return (containerWidth - gap * (columnCount - 1)) / columnCount;
  };

  // 响应式列数计算
  useEffect(() => {
    const updateColumns = () => {
      if (!containerRef.current) return;
      
      const width = containerRef.current.offsetWidth;
      let cols = columns.sm || 1;
      
      if (width >= 1280 && columns.xl) cols = columns.xl;
      else if (width >= 1024 && columns.lg) cols = columns.lg;
      else if (width >= 768 && columns.md) cols = columns.md;
      else if (width >= 640 && columns.sm) cols = columns.sm;
      
      setColumnCount(cols);
      // 立即更新宽度，避免布局跳跃
      const newWidth = calculateColumnWidth();
      setItemWidths(newWidth);
    };

    // 立即计算初始宽度
    const initialWidth = calculateColumnWidth();
    setItemWidths(initialWidth);

    updateColumns();
    window.addEventListener('resize', updateColumns);
    
    // 使用更短的延迟，减少布局跳跃
    const timer = setTimeout(() => setIsLoaded(true), 50);
    
    return () => {
      window.removeEventListener('resize', updateColumns);
      clearTimeout(timer);
    };
  }, [columns, columnCount, gap]);

  // 将子元素分配到各列 - 优化分布算法
  const distributeItems = () => {
    const columnsArray: React.ReactNode[][] = Array.from({ length: columnCount }, () => []);
    const columnHeights: number[] = Array.from({ length: columnCount }, () => 0);
    const columnWidth = itemWidths || calculateColumnWidth();
    
    children.forEach((child, index) => {
      // 找到当前高度最小的列
      const minHeightIndex = columnHeights.indexOf(Math.min(...columnHeights));
      
      const wrappedChild = (
        <div 
          key={index}
          className={`masonry-item ${isLoaded ? 'masonry-item-loaded' : 'masonry-item-loading'}`}
          style={{ 
            width: `${columnWidth}px`,
            marginBottom: `${gap}px`
          }}
        >
          {child}
        </div>
      );
      
      columnsArray[minHeightIndex].push(wrappedChild);
      // 模拟增加高度（实际项目中可能需要实际测量元素高度）
      columnHeights[minHeightIndex] += 1;
    });
    
    return columnsArray;
  };

  if (!isLoaded) {
    // 预加载阶段，显示统一尺寸的占位符
    const columnWidth = itemWidths || calculateColumnWidth();
    const columnsArray: React.ReactNode[][] = Array.from({ length: columnCount }, () => []);
    
    children.forEach((child, index) => {
      const columnIndex = index % columnCount;
      columnsArray[columnIndex].push(
        <div 
          key={index}
          className="masonry-item-loading"
          style={{ 
            width: `${columnWidth}px`,
            marginBottom: `${gap}px`,
            opacity: 0.7
          }}
        >
          {child}
        </div>
      );
    });

    return (
      <div 
        ref={containerRef} 
        className={`masonry-container flex w-full stable-height ${className}`}
        style={{ 
          gap: `${gap}px`,
          alignItems: 'flex-start'
        }}
      >
        {columnsArray.map((column, columnIndex) => (
          <div
            key={columnIndex}
            className="flex flex-col"
            style={{ flex: 1 }}
          >
            {column}
          </div>
        ))}
      </div>
    );
  }

  const columnsArray = distributeItems();

  return (
    <div 
      ref={containerRef} 
      className={`masonry-container w-full preload-fade ${className}`}
      style={{ 
        display: 'flex', 
        gap: `${gap}px`,
        alignItems: 'flex-start'
      }}
    >
      {columnsArray.map((column, columnIndex) => (
        <div
          key={columnIndex}
          className="flex flex-col"
          style={{ 
            flex: 1
          }}
        >
          {column}
        </div>
      ))}
    </div>
  );
}; 