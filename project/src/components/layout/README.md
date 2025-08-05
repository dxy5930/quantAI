# 布局组件功能说明

## 侧边栏收缩功能

### 功能描述
- 在左侧边栏和中间内容区域之间添加了收缩/展开按钮
- 点击按钮可以收起或展开左侧边栏
- 收缩状态下侧边栏完全隐藏，释放更多空间给中间内容区域

### 使用位置
- `WorkflowPageLayout` 组件中的侧边栏控制
- 按钮位置：左侧边栏右边缘，垂直居中

### 交互效果
- 悬停时按钮背景色变化和阴影增强
- 图标颜色在悬停时变为蓝色
- 平滑的展开/收缩动画（300ms）

## 可调整分隔条功能

### 功能描述
- 在中间内容区域和右侧面板之间添加可拖拽的分隔条
- 只有在右侧面板显示时才会出现分隔条
- 支持鼠标拖拽调整右侧面板宽度

### 技术实现
- 使用自定义Hook `useResizable` 处理拖拽逻辑
- 使用 `ResizableDivider` 组件作为可视化分隔条
- 支持最小宽度（280px）和最大宽度（容器60%）限制

### 交互效果
- 悬停时分隔条背景色变化
- 拖拽时鼠标样式变为调整大小光标
- 拖拽期间分隔条高亮显示
- 实时调整面板宽度，无延迟

### 使用组件
- `WorkflowLayout` 组件中的右侧面板调整
- 条件显示：`shouldShowRightPanel` 为true时显示

## 相关文件
- `/src/router/layouts/WorkflowLayout.tsx` - 侧边栏收缩控制
- `/src/components/workflow/WorkflowLayout.tsx` - 分隔条实现
- `/src/hooks/useResizable.ts` - 分隔条拖拽逻辑
- `/src/components/common/ResizableDivider.tsx` - 分隔条组件