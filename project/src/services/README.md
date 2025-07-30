# 服务层说明

## 概述
服务层负责处理应用的数据获取、业务逻辑和API调用。

## 主要服务

- **shareService.ts**: 统一的分享服务，封装策略分享逻辑
- **strategyService.ts**: 策略相关的业务逻辑服务
- **authService.ts**: 认证相关的业务逻辑服务
- **backtestService.ts**: 回测相关的业务逻辑服务
- **metaService.ts**: 元数据服务，管理应用级别的元数据

### MetaService vs MetaStore
- **MetaStore** (推荐): 使用MobX进行状态管理，提供响应式更新
- **MetaService**: 传统的服务类，主要用于向后兼容

#### 页面加载时的Meta数据使用方式

**推荐做法**：
```typescript
// 在页面组件中
const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
const [strategyTypes, setStrategyTypes] = useState<{ value: string; label: string; description?: string }[]>([]);
const [sortOptions, setSortOptions] = useState<{ value: string; label: string }[]>([]);

useEffect(() => {
  const initializePage = async () => {
    try {
      await meta.loadMeta();
      
      // 将meta数据分别赋值给三个数组
      setCategories(meta.getStrategyCategories());
      setStrategyTypes(meta.getStrategyTypes());
      setSortOptions(meta.getSortOptions());
      
    } catch (error) {
      console.error('加载meta数据失败:', error);
      // 设置默认数据
      setCategories([{ value: 'all', label: '全部分类' }]);
      setStrategyTypes([{ value: 'all', label: '全部类型' }]);
      setSortOptions([{ value: 'popularity', label: '热度排序' }]);
    }
  };

  initializePage();
}, [meta]);
```

**下拉框组件使用**：
```typescript
<EnhancedSearchFilter
  // ... 其他props
  config={{
    categories: categories,
    strategyTypes: strategyTypes,
    sortOptions: sortOptions,
    showStrategyTypes: true,
    showSort: true,
  }}
/>
```

### API 服务
- `authApi.ts`: 用户认证相关API
- `strategyApi.ts`: 策略相关API，包含meta数据接口
- `backtestApi.ts`: 回测相关API
- `stockApi.ts`: 股票数据API
- `userApi.ts`: 用户信息API
- `systemApi.ts`: 系统统计API

### 业务服务
- `authService.ts`: 认证业务逻辑
- `backtestService.ts`: 回测业务逻辑
- `metaService.ts`: 元数据服务（推荐使用MetaStore）

## 最佳实践

1. **统一的错误处理**: 所有API调用都应该有适当的错误处理
2. **缓存机制**: 对于不经常变化的数据（如meta数据），使用缓存机制
3. **类型安全**: 使用TypeScript确保类型安全
4. **状态管理**: 优先使用MobX Store进行状态管理，而不是直接使用服务类

## 注意事项

- Meta数据应该在页面加载时统一获取，避免在组件中重复调用
- 三个下拉框（分类、策略类型、排序）应该使用统一的数据源
- 错误处理应该提供合适的降级方案（默认数据） 