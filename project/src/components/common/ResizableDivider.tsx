import React from 'react';

interface ResizableDividerProps {
  onMouseDown: (e: React.MouseEvent) => void;
  isResizing: boolean;
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}

export const ResizableDivider: React.FC<ResizableDividerProps> = ({
  onMouseDown,
  isResizing,
  orientation = 'vertical',
  className = ''
}) => {
  const isVertical = orientation === 'vertical';
  
  return (
    <div 
      className={`
        flex-shrink-0 
        ${isVertical ? 'w-2 cursor-col-resize' : 'h-2 cursor-row-resize'}
        hover:bg-blue-200 dark:hover:bg-blue-800 
        transition-colors 
        flex items-center justify-center
        ${isResizing ? 'bg-blue-300 dark:bg-blue-700' : ''}
        ${className}
      `}
      onMouseDown={onMouseDown}
      title={isVertical ? "拖拽调整宽度" : "拖拽调整高度"}
    >
      <div 
        className={`
          bg-gray-300 dark:bg-gray-600 rounded-full
          ${isVertical ? 'w-1 h-8' : 'w-8 h-1'}
        `}
      />
    </div>
  );
}; 