import { useState, useEffect, useRef } from 'react';

interface ScrollDetectionOptions {
  /** 触发阈值，超过这个滚动距离后显示粘性条，默认100px */
  threshold?: number;
  /** 防抖延迟，默认10ms */
  debounceMs?: number;
  /** 是否启用，默认true */
  enabled?: boolean;
  /** 监听的容器，默认window */
  container?: Window | HTMLElement;
}

interface ScrollDetectionResult {
  /** 是否已滚动超过阈值 */
  isScrolled: boolean;
  /** 当前滚动位置 */
  scrollY: number;
  /** 滚动方向，'up' | 'down' | 'none' */
  scrollDirection: 'up' | 'down' | 'none';
  /** 是否正在向上滚动 */
  isScrollingUp: boolean;
  /** 是否正在向下滚动 */
  isScrollingDown: boolean;
}

export const useScrollDetection = (
  options: ScrollDetectionOptions = {}
): ScrollDetectionResult => {
  const {
    threshold = 100,
    debounceMs = 10,
    enabled = true,
    container = typeof window !== 'undefined' ? window : null,
  } = options;

  const [scrollState, setScrollState] = useState<ScrollDetectionResult>({
    isScrolled: false,
    scrollY: 0,
    scrollDirection: 'none',
    isScrollingUp: false,
    isScrollingDown: false,
  });

  const lastScrollY = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled || !container) return;

    const handleScroll = () => {
      // 清除之前的防抖定时器
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        let currentScrollY: number;

        if (container === window) {
          currentScrollY = window.pageYOffset || document.documentElement.scrollTop;
        } else {
          currentScrollY = (container as HTMLElement).scrollTop;
        }

        const isScrolled = currentScrollY > threshold;
        const deltaY = currentScrollY - lastScrollY.current;
        
        let scrollDirection: 'up' | 'down' | 'none' = 'none';
        if (deltaY > 0) {
          scrollDirection = 'down';
        } else if (deltaY < 0) {
          scrollDirection = 'up';
        }

        setScrollState({
          isScrolled,
          scrollY: currentScrollY,
          scrollDirection,
          isScrollingUp: scrollDirection === 'up',
          isScrollingDown: scrollDirection === 'down',
        });

        lastScrollY.current = currentScrollY;
      }, debounceMs);
    };

    // 初始化状态
    handleScroll();

    // 添加滚动监听器
    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [threshold, debounceMs, enabled, container]);

  return scrollState;
}; 