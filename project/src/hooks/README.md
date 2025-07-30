# Hooks 使用说明

## useLoadMore Hook

用于处理滑动加载更多功能的通用 hook。

### 功能特性

- 自动检测滚动到底部
- 防抖处理，避免频繁触发
- 支持自定义容器和阈值
- 提供加载状态管理
- 支持手动触发加载

### 使用方法

```typescript
import { useLoadMore } from '../hooks/useLoadMore';

const MyComponent = () => {
  const { isLoading, isEnd, loadMore, reset } = useLoadMore(
    async () => {
      // 返回是否还有更多数据
      const hasMore = await fetchMoreData();
      return hasMore;
    },
    {
      threshold: 200,        // 距离底部多少像素时触发
      enabled: true,         // 是否启用
      debounceDelay: 300,    // 防抖延迟
      container: '#my-container' // 监听的容器
    }
  );

  return (
    <div>
      {/* 你的内容 */}
      {isLoading && <div>加载中...</div>}
      {isEnd && <div>已加载完毕</div>}
    </div>
  );
};
```

### 参数说明

#### onLoadMore
- 类型: `() => Promise<boolean> | boolean`
- 说明: 加载更多数据的回调函数，返回是否还有更多数据

#### options
- `threshold`: 触发加载的距离底部阈值，默认 200px
- `enabled`: 是否启用加载更多，默认 true
- `debounceDelay`: 防抖延迟时间，默认 300ms
- `container`: 监听的容器，可以是选择器字符串或 HTMLElement，默认监听 window

### 返回值

- `isLoading`: 是否正在加载
- `isEnd`: 是否已加载完毕
- `loadMore`: 手动触发加载更多
- `reset`: 重置状态
- `setLoading`: 设置加载状态
- `setEnd`: 设置结束状态

### 在策略列表中的使用示例

```typescript
// 在 StrategyListPage 中的使用
const { isLoading: isLoadingMore, isEnd } = useLoadMore(
  async () => {
    return await strategy.loadMoreStrategies();
  },
  {
    threshold: 200,
    enabled: true,
    debounceDelay: 300,
  }
);
```

## useStore Hook

用于获取全局状态管理器的 hook。

### 使用方法

```typescript
import { useStore } from '../hooks/useStore';

const MyComponent = () => {
  const { strategy, user, app } = useStore();
  
  // 使用 store
  return <div>{strategy.filteredStrategies.length} 个策略</div>;
};
```

## useTheme Hook

用于主题管理的 hook。

### 使用方法

```typescript
import { useTheme } from '../hooks/useTheme';

const MyComponent = () => {
  const { theme, setTheme } = useTheme();
  
  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      切换主题
    </button>
  );
};
``` 