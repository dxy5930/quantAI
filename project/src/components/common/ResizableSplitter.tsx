import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GripVertical } from 'lucide-react';

interface ResizableSplitterProps {
  onResize: (leftWidth: number, rightWidth: number) => void;
  minLeftWidth?: number;
  minRightWidth?: number;
  className?: string;
}

export const ResizableSplitter: React.FC<ResizableSplitterProps> = ({
  onResize,
  minLeftWidth = 200,
  minRightWidth = 300,
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const splitterRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const container = containerRef.current.parentElement;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const mouseX = e.clientX - containerRect.left;
    
    const totalWidth = containerRect.width;
    const leftWidth = Math.max(minLeftWidth, Math.min(mouseX, totalWidth - minRightWidth));
    const rightWidth = totalWidth - leftWidth;

    onResize(leftWidth, rightWidth);
  }, [isDragging, onResize, minLeftWidth, minRightWidth]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-center w-1 bg-gray-200 dark:bg-gray-700 hover:bg-blue-500 dark:hover:bg-blue-600 transition-colors cursor-col-resize group ${className}`}
      onMouseDown={handleMouseDown}
    >
      <div 
        ref={splitterRef}
        className="absolute inset-y-0 -left-1 -right-1 flex items-center justify-center"
      >
        <GripVertical className="w-3 h-3 text-gray-400 group-hover:text-white transition-colors" />
      </div>
      
      {/* 拖拽区域扩大 */}
      <div className="absolute inset-y-0 -left-2 -right-2" />
    </div>
  );
};

export default ResizableSplitter; 