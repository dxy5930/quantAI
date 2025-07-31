export type StickyNoteColor = "yellow" | "pink" | "blue" | "green" | "orange";

export interface ColorConfig {
  value: StickyNoteColor;
  label: string;
  bg: string;
  border: string;
  text: string;
  listBg: string;
  listBorder: string;
}

// 便利贴颜色配置
export const STICKY_NOTE_COLORS: Record<StickyNoteColor, ColorConfig> = {
  yellow: {
    value: 'yellow',
    label: '黄色',
    bg: 'bg-yellow-100 dark:bg-yellow-800',
    border: 'border-yellow-300 dark:border-yellow-600',
    text: 'text-yellow-900 dark:text-yellow-100',
    listBg: 'bg-yellow-200 dark:bg-yellow-700',
    listBorder: 'border-yellow-300 dark:border-yellow-600',
  },
  pink: {
    value: 'pink',
    label: '粉色',
    bg: 'bg-pink-100 dark:bg-pink-800',
    border: 'border-pink-300 dark:border-pink-600',
    text: 'text-pink-900 dark:text-pink-100',
    listBg: 'bg-pink-200 dark:bg-pink-700',
    listBorder: 'border-pink-300 dark:border-pink-600',
  },
  blue: {
    value: 'blue',
    label: '蓝色',
    bg: 'bg-blue-100 dark:bg-blue-800',
    border: 'border-blue-300 dark:border-blue-600',
    text: 'text-blue-900 dark:text-blue-100',
    listBg: 'bg-blue-200 dark:bg-blue-700',
    listBorder: 'border-blue-300 dark:border-blue-600',
  },
  green: {
    value: 'green',
    label: '绿色',
    bg: 'bg-green-100 dark:bg-green-800',
    border: 'border-green-300 dark:border-green-600',
    text: 'text-green-900 dark:text-green-100',
    listBg: 'bg-green-200 dark:bg-green-700',
    listBorder: 'border-green-300 dark:border-green-600',
  },
  orange: {
    value: 'orange',
    label: '橙色',
    bg: 'bg-orange-100 dark:bg-orange-800',
    border: 'border-orange-300 dark:border-orange-600',
    text: 'text-orange-900 dark:text-orange-100',
    listBg: 'bg-orange-200 dark:bg-orange-700',
    listBorder: 'border-orange-300 dark:border-orange-600',
  },
};

// 获取颜色配置数组（用于颜色选择器）
export const getColorOptions = (): ColorConfig[] => {
  return Object.values(STICKY_NOTE_COLORS);
};

// 获取指定颜色的配置
export const getColorConfig = (color: StickyNoteColor): ColorConfig => {
  return STICKY_NOTE_COLORS[color] || STICKY_NOTE_COLORS.yellow;
};

// 获取便利贴主要样式类名
export const getStickyNoteClasses = (color: StickyNoteColor) => {
  const config = getColorConfig(color);
  return {
    bg: config.bg,
    border: config.border,
    text: config.text,
  };
};

// 获取列表项颜色指示器的样式类名
export const getListColorClasses = (color: StickyNoteColor): string => {
  const config = getColorConfig(color);
  return `w-3 h-3 rounded border-2 flex-shrink-0 ${config.listBg} ${config.listBorder}`;
}; 