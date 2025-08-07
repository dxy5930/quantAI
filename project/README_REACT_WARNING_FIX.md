# React setState警告修复

## 问题描述

出现了以下React警告：
```
Warning: Cannot update a component (`WorkflowPageLayout`) while rendering a different component (`Unknown`). To locate the bad setState() call inside `Unknown`, follow the stack trace as described in https://reactjs.org/link/setstate-in-render
```

## 问题根因

在`Sidebar.tsx`的`updateSidebarTask`函数中，直接调用了`updateTask`函数，这会在组件渲染期间触发父组件`WorkflowPageLayout`的状态更新，违反了React的渲染规则。

## 解决方案

### 1. 使用setTimeout延迟setState调用
```typescript
// 使用setTimeout避免在渲染期间直接调用setState
setTimeout(() => {
  updateTask(taskId, {
    title,
    description: description || undefined,
    status: "in_progress",
  });
}, 0);
```

### 2. 使用useCallback优化函数稳定性
```typescript
const updateSidebarTaskRef = React.useCallback(async (
  taskId: string,
  title: string,
  description?: string
) => {
  // 函数实现
}, [updateTask]);
```

### 3. 移除不必要的依赖项
- 从useEffect依赖数组中移除`tasks`，避免不必要的函数重新创建
- 只保留必要的`updateTask`依赖

## 修复效果

- ✅ 消除React setState警告
- ✅ 保持功能正常运行
- ✅ 优化性能，减少不必要的重新渲染
- ✅ 提高代码稳定性

## 相关文件

- `project/src/components/layout/Sidebar.tsx` - 主要修复位置
- `project/src/components/workflow/WorkflowCanvas.tsx` - 已使用正确的延迟调用模式

## 最佳实践

1. 避免在渲染期间调用setState
2. 使用setTimeout(fn, 0)将状态更新推迟到下一个事件循环
3. 使用useCallback稳定函数引用
4. 合理管理useEffect依赖项 