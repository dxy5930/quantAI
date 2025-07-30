/**
 * 滚动到页面顶部的工具函数
 */

interface ScrollToTopOptions {
  /** 滚动行为，默认为 'smooth'（平滑滚动） */
  behavior?: 'auto' | 'smooth';
  /** 是否考虑Header高度偏移，默认为true */
  includeHeaderOffset?: boolean;
  /** 自定义偏移量，默认为0 */
  offset?: number;
}

/**
 * 滚动到页面顶部
 * @param options 滚动选项
 */
export const scrollToTop = (options: ScrollToTopOptions = {}) => {
  const {
    behavior = 'smooth',
    includeHeaderOffset = true,
    offset = 0
  } = options;

  // 计算滚动位置
  let scrollTop = 0;
  
  if (includeHeaderOffset) {
    // Header 高度通常是 64px
    const headerHeight = 0;
    scrollTop = headerHeight + offset;
  } else {
    scrollTop = offset;
  }

  // 执行滚动
  window.scrollTo({
    top: scrollTop,
    behavior
  });
};

/**
 * 立即滚动到顶部（无动画）
 */
export const scrollToTopInstant = (offset = 0) => {
  scrollToTop({ behavior: 'auto', offset });
};

/**
 * 平滑滚动到顶部
 */
export const scrollToTopSmooth = (offset = 0) => {
  scrollToTop({ behavior: 'smooth', offset });
}; 