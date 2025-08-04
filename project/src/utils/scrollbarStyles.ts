/**
 * 滚动条样式工具类
 * 提供不同风格的滚动条样式类名
 */

export const scrollbarStyles = {
  /** 默认美化滚动条 - 全局应用 */
  default: '',
  
  /** 细版滚动条 - 适用于小空间 */
  thin: 'scrollbar-thin',
  
  /** 精致版滚动条 - 适用于重要区域 */
  elegant: 'scrollbar-elegant',
  
  /** 隐藏滚动条 - 保持功能但不显示 */
  hidden: 'scrollbar-hide'
} as const;

export type ScrollbarStyle = keyof typeof scrollbarStyles;

/**
 * 获取滚动条样式类名
 * @param style 滚动条样式类型
 * @returns 对应的CSS类名
 */
export const getScrollbarClass = (style: ScrollbarStyle = 'default'): string => {
  return scrollbarStyles[style];
};

/**
 * 滚动条样式使用指南
 */
export const scrollbarGuide = {
  default: {
    name: '默认美化滚动条',
    description: '全局应用，带渐变色和悬停效果',
    usage: '无需额外类名，全局自动应用',
    bestFor: '大部分页面内容区域'
  },
  thin: {
    name: '细版滚动条',
    description: '更细的滚动条，占用空间更小',
    usage: 'className="scrollbar-thin"',
    bestFor: '侧边栏、小窗口、表格等空间受限区域'
  },
  elegant: {
    name: '精致版滚动条',
    description: '带边框和阴影的高级滚动条',
    usage: 'className="scrollbar-elegant"',
    bestFor: '重要的内容展示区域、编辑器等'
  },
  hidden: {
    name: '隐藏滚动条',
    description: '隐藏滚动条但保持滚动功能',
    usage: 'className="scrollbar-hide"',
    bestFor: '自定义滚动指示器的区域'
  }
} as const; 