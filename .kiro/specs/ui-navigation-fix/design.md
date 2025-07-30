# UI导航和布局修复设计文档

## 概述

本设计文档旨在解决策略配置页面中的导航重复和布局问题，通过优化PageHeader组件和ActionButtons组件的布局逻辑，提供清晰一致的用户界面。

## 架构

### 组件层次结构

```
StrategyConfigPage
├── ResponsiveContainer
│   ├── ErrorMessage (条件渲染)
│   ├── PageHeader
│   │   ├── BackButton
│   │   ├── TitleSection
│   │   └── ActionButtons
│   └── MainContent
│       ├── ParametersSection
│       ├── StockSelectionSection
│       └── BacktestConfigSection
```

## 组件和接口

### 1. PageHeader组件优化

#### 当前问题
- 在某些情况下可能显示重复的返回按钮
- 操作按钮在响应式布局中被挤压

#### 设计方案
```typescript
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backText?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  // 新增属性
  hideBackButton?: boolean; // 控制是否显示返回按钮
  actionsPosition?: 'right' | 'bottom'; // 控制操作按钮位置
}
```

#### 布局逻辑
1. **桌面端**: 标题和操作按钮水平排列
2. **移动端**: 标题和操作按钮垂直排列
3. **返回按钮**: 始终在最左侧，可通过props控制显示/隐藏

### 2. ActionButtons组件优化

#### 当前问题
- 在PageHeader中被挤压
- 响应式布局不够灵活

#### 设计方案
```typescript
interface ActionButtonsProps {
  onSave?: () => void;
  onPublish?: () => void;
  onShare?: () => void;
  isSaving?: boolean;
  isPublishing?: boolean;
  disabled?: boolean;
  // 新增属性
  layout?: 'horizontal' | 'vertical'; // 布局方向
  size?: 'sm' | 'md' | 'lg'; // 按钮大小
  fullWidth?: boolean; // 是否占满宽度
}
```

### 3. 响应式布局策略

#### 断点设计
- **xs (< 640px)**: 垂直布局，按钮全宽
- **sm (640px - 768px)**: 垂直布局，按钮适中
- **md (768px - 1024px)**: 水平布局，紧凑间距
- **lg (> 1024px)**: 水平布局，标准间距

## 数据模型

### 布局状态管理
```typescript
interface LayoutState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  showBackButton: boolean;
  actionsLayout: 'horizontal' | 'vertical';
}
```

## 错误处理

### 布局错误处理
1. **组件渲染失败**: 使用ErrorBoundary捕获并显示备用UI
2. **响应式断点错误**: 提供默认的桌面端布局
3. **按钮状态错误**: 确保按钮始终可交互或正确显示禁用状态

## 测试策略

### 单元测试
1. **PageHeader组件**
   - 测试返回按钮的显示/隐藏逻辑
   - 测试响应式布局切换
   - 测试操作按钮的正确渲染

2. **ActionButtons组件**
   - 测试不同布局模式的渲染
   - 测试按钮状态的正确显示
   - 测试点击事件的正确触发

### 集成测试
1. **页面布局测试**
   - 测试不同屏幕尺寸下的布局正确性
   - 测试组件间的交互是否正常
   - 测试错误状态下的UI表现

### 视觉回归测试
1. **截图对比**
   - 桌面端布局截图
   - 移动端布局截图
   - 不同状态下的按钮显示

## 实现细节

### CSS类名规范
```css
/* PageHeader */
.page-header-container
.page-header-desktop
.page-header-mobile
.page-header-back-button
.page-header-title-section
.page-header-actions

/* ActionButtons */
.action-buttons-container
.action-buttons-horizontal
.action-buttons-vertical
.action-button-item
.action-button-loading
```

### 动画和过渡
1. **布局切换动画**: 使用CSS transition实现平滑的布局变化
2. **按钮状态动画**: 加载状态的旋转动画
3. **响应式过渡**: 屏幕尺寸变化时的平滑过渡

## 性能考虑

### 渲染优化
1. **条件渲染**: 只渲染当前需要的布局组件
2. **记忆化**: 使用React.memo优化不必要的重渲染
3. **懒加载**: 对于复杂的操作按钮组件使用懒加载

### 内存优化
1. **事件监听器清理**: 确保响应式监听器正确清理
2. **状态管理**: 避免不必要的状态更新
3. **组件卸载**: 正确处理组件卸载时的清理工作