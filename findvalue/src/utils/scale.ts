// utils/scale.ts
import { Dimensions, StyleSheet, PixelRatio, ViewStyle, TextStyle, ImageStyle } from 'react-native';

// 1. UI 稿基准宽度 (可切换 750 或 375)
const DESIGN_WIDTH = 750;

// 2. 获取屏幕宽度 & 像素比
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = SCREEN_WIDTH / DESIGN_WIDTH;

// 定义样式类型
type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

// 3. px 转 dp
export function px2dp(px: number): number {
  return Math.round(px * SCALE);
}

// 4. 字体缩放（带最小值/最大值保护）
export function scaleFont(size: number): number {
  const newSize = size * SCALE;
  // 使用 PixelRatio 来避免在高分屏上字体过大/过小
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
}

// 5. 自动转换 StyleSheet
export function createStyle<T extends NamedStyles<T>>(styleObj: T): T {
  const newObj: { [key: string]: any } = {};
  
  for (const key in styleObj) {
    const value = styleObj[key];

    if (typeof value === 'number') {
      // 针对 fontSize 用 scaleFont，其它数值用 px2dp
      if (key.toLowerCase().includes('font')) {
        newObj[key] = scaleFont(value);
      } else {
        newObj[key] = px2dp(value);
      }
    } else if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
      newObj[key] = createStyle(value as any); // 递归处理
    } else {
      newObj[key] = value;
    }
  }
  
  return StyleSheet.create(newObj as T);
}
