# 全局消息提示使用指南

## 概述

我们实现了类似 Ant Design 的全局消息提示系统，支持成功、错误、警告和信息四种类型的提示。

## 使用方法

### 方式1：使用全局 message 工具（推荐）

```typescript
import { message } from '../utils/message';

// 基本用法
message.success('操作成功！');
message.error('操作失败！');
message.warning('请注意！');
message.info('提示信息');

// 自定义持续时间（毫秒）
message.success('3秒后消失', 3000);
message.error('10秒后消失', 10000);

// 带自定义标题
message.successWithTitle('数据已保存到服务器', '保存成功');
message.errorWithTitle('网络连接超时，请检查网络设置', '连接失败');
```

### 方式2：直接使用 AppStore

```typescript
import { useAppStore } from '../hooks/useStore';

const appStore = useAppStore();

// 基本用法
appStore.showSuccess('操作成功！');
appStore.showError('操作失败！');
appStore.showWarning('请注意！');
appStore.showInfo('提示信息');

// 带自定义标题和持续时间
appStore.showSuccess('操作完成', '成功', 5000);
appStore.showError('网络错误', '连接失败', 8000);
```

## 特性

- **自动消失**：提示会在指定时间后自动消失
- **手动关闭**：用户可以点击关闭按钮手动关闭
- **动画效果**：流畅的进入和退出动画
- **响应式设计**：适配不同屏幕尺寸
- **主题支持**：支持明暗主题切换
- **类型安全**：完整的 TypeScript 类型支持

## 默认持续时间

- 成功提示：3秒
- 错误提示：5秒
- 警告提示：4秒
- 信息提示：3秒

## 样式特点

- 位置：屏幕右上角
- 最大显示数量：5个
- 支持堆叠显示
- 自动适配内容长度
- 图标和颜色区分不同类型

## 在组件中的使用示例

```typescript
import React from 'react';
import { message } from '../utils/message';

export const MyComponent: React.FC = () => {
  const handleSave = async () => {
    try {
      // 执行保存操作
      await saveData();
      message.success('数据保存成功！');
    } catch (error) {
      message.error('保存失败，请重试');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteData();
      message.successWithTitle('数据已从服务器删除', '删除成功');
    } catch (error) {
      message.errorWithTitle('删除操作失败，请稍后重试', '删除失败');
    }
  };

  return (
    <div>
      <button onClick={handleSave}>保存</button>
      <button onClick={handleDelete}>删除</button>
    </div>
  );
};
```

## 注意事项

1. 推荐使用 `message` 工具而不是直接调用 `appStore` 方法
2. 错误提示的持续时间较长，给用户足够时间阅读
3. 避免在短时间内显示过多提示，以免影响用户体验
4. 提示内容应该简洁明了，重要信息可以使用自定义标题