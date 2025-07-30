import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

interface ScrollPositionOptions {
  key?: string;
  debounceMs?: number;
  threshold?: number;
}

export const useScrollPosition = (options: ScrollPositionOptions = {}) => {
  const {
    key,
    debounceMs = 100,
    threshold = 50
  } = options;
  
  const location = useLocation();
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollPositionRef = useRef<number>(0);
  const isRestoringRef = useRef<boolean>(false);

  // 生成存储键
  const storageKey = key || `scroll-${location.pathname}`;

  // 保存滚动位置
  const saveScrollPosition = (position: number) => {
    if (isRestoringRef.current) return;
    
    // 防抖保存
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      // 只有滚动距离超过阈值才保存
      if (Math.abs(position - lastScrollPositionRef.current) > threshold) {
        sessionStorage.setItem(storageKey, position.toString());
        lastScrollPositionRef.current = position;
      }
    }, debounceMs);
  };

  // 恢复滚动位置
  const restoreScrollPosition = () => {
    const savedPosition = sessionStorage.getItem(storageKey);
    if (savedPosition) {
      const position = parseInt(savedPosition, 10);
      if (!isNaN(position)) {
        isRestoringRef.current = true;
        
        // 使用 requestAnimationFrame 确保在 DOM 渲染完成后恢复位置
        requestAnimationFrame(() => {
          window.scrollTo({
            top: position,
            behavior: 'instant' // 立即恢复，不使用平滑滚动
          });
          
          setTimeout(() => {
            isRestoringRef.current = false;
          }, 100);
        });
      }
    }
  };

  // 清除保存的滚动位置
  const clearScrollPosition = () => {
    sessionStorage.removeItem(storageKey);
    lastScrollPositionRef.current = 0;
  };

  // 监听滚动事件
  useEffect(() => {
    const handleScroll = () => {
      const currentPosition = window.pageYOffset || document.documentElement.scrollTop;
      saveScrollPosition(currentPosition);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [storageKey, debounceMs, threshold]);

  // 在组件挂载时恢复滚动位置
  useEffect(() => {
    // 延迟恢复，确保页面内容已加载
    const timer = setTimeout(() => {
      restoreScrollPosition();
    }, 50);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  // 在页面卸载时保存当前滚动位置
  useEffect(() => {
    const handleBeforeUnload = () => {
      const currentPosition = window.pageYOffset || document.documentElement.scrollTop;
      sessionStorage.setItem(storageKey, currentPosition.toString());
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [storageKey]);

  return {
    saveScrollPosition,
    restoreScrollPosition,
    clearScrollPosition
  };
}; 