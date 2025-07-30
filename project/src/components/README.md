# 可复用组件使用指南

## 策略卡片组件

### EnhancedStrategyCard
增强的策略卡片组件，支持多种变体和业务逻辑。

```tsx
import { EnhancedStrategyCard } from './strategy/EnhancedStrategyCard';

// 基础用法
<EnhancedStrategyCard
  strategy={strategy}
  variant="default"
  onSelect={handleSelect}
/>

// 共享策略展示
<EnhancedStrategyCard
  strategy={sharedStrategy}
  variant="shared"
  onSelect={handleSelect}
  onToggleFavorite={handleToggleFavorite}
/>

// 我的策略管理
<EnhancedStrategyCard
  strategy={myStrategy}
  variant="my-strategy"
  onEdit={handleEdit}
  onShare={handleShare}
  onDelete={handleDelete}
/>
```

### CompactStrategyCard
紧凑版策略卡片，适用于列表展示。

```tsx
import { CompactStrategyCard } from './strategy/CompactStrategyCard';

<CompactStrategyCard
  strategy={strategy}
  onSelect={handleSelect}
  showMetrics={true}
/>
```

## 搜索筛选组件

### EnhancedSearchFilter
增强的搜索筛选组件，支持灵活配置。

```tsx
import { EnhancedSearchFilter } from './common/EnhancedSearchFilter';

<EnhancedSearchFilter
  searchTerm={searchTerm}
  onSearchChange={setSearchTerm}
  selectedCategory={selectedCategory}
  onCategoryChange={setSelectedCategory}
  selectedStrategyType={selectedStrategyType}
  onStrategyTypeChange={setSelectedStrategyType}
  sortBy={sortBy}
  onSortChange={setSortBy}
  searchPlaceholder="搜索策略..."
  config={{
    categories: [
      { value: 'all', label: '全部分类' },
      { value: 'trend', label: '趋势跟踪' },
      // ...更多分类
    ],
    showStrategyTypes: true,
    showSort: true,
    sortOptions: [
      { value: 'popularity', label: '按热度排序' },
      { value: 'rating', label: '按评分排序' },
      // ...更多排序选项
    ],
  }}
/>
```

## 下拉组件

### CategoryDropdown
分类下拉选择器。

```tsx
import { CategoryDropdown } from './common/CategoryDropdown';

<CategoryDropdown
  value={selectedCategory}
  onChange={setSelectedCategory}
  options={[
    { value: 'all', label: '全部分类' },
    { value: 'trend', label: '趋势跟踪' },
  ]}
/>
```

### StrategyTypeDropdown
策略类型下拉选择器。

```tsx
import { StrategyTypeDropdown } from './common/StrategyTypeDropdown';

<StrategyTypeDropdown
  value={selectedStrategyType}
  onChange={setSelectedStrategyType}
  showIcon={true}
/>
```

### SortDropdown
排序下拉选择器。

```tsx
import { SortDropdown } from './common/SortDropdown';

<SortDropdown
  value={sortBy}
  onChange={setSortBy}
  options={[
    { value: 'popularity', label: '按热度排序' },
    { value: 'rating', label: '按评分排序' },
  ]}
/>
```

## 基础卡片组件

### BaseCard
基础卡片容器，提供通用的卡片样式和行为。

```tsx
import { BaseCard, CardHeader, CardContent, CardFooter } from './common/BaseCard';

<BaseCard hoverable onClick={handleClick}>
  <CardHeader
    icon={TrendingUp}
    title="策略标题"
    subtitle="策略分类"
    badge={<span className="badge">标签</span>}
    actions={<button>操作</button>}
  />
  <CardContent>
    <p>策略描述内容</p>
  </CardContent>
  <CardFooter>
    <div>底部信息</div>
  </CardFooter>
</BaseCard>
```

## 性能优化

所有组件都已使用 `React.memo` 进行优化，避免不必要的重新渲染。

### 最佳实践

1. **回调函数优化**：使用 `useCallback` 包装传递给组件的回调函数
2. **数据稳定性**：确保传递给组件的数据引用稳定
3. **条件渲染**：合理使用组件的 `showActions` 等配置项

```tsx
// 推荐的使用方式
const handleSelect = useCallback((strategy) => {
  // 处理选择逻辑
}, []);

const categories = useMemo(() => [
  { value: 'all', label: '全部分类' },
  { value: 'trend', label: '趋势跟踪' },
], []);

<EnhancedStrategyCard
  strategy={strategy}
  onSelect={handleSelect}
  variant="default"
/>
```

## 扩展指南

如需添加新的卡片变体或筛选功能，请：

1. 在相应的组件中添加新的 props 接口
2. 更新组件的渲染逻辑
3. 添加相应的样式类
4. 更新此文档的使用示例 