# 复盘模块 (Review Module)

这是一个独立的复盘功能模块，采用模块化设计，便于维护和复用。

## 目录结构

```
src/modules/review/
├── components/          # 组件目录
│   ├── ReviewPage.tsx          # 主页面组件
│   ├── ReviewEditor.tsx        # 复盘编辑器
│   ├── ReviewList.tsx          # 复盘列表
│   ├── StockInputModal.tsx     # 股票输入模态框
│   ├── AISuggestions.tsx       # AI智能建议
│   └── StreamingAIGenerator.tsx # 流式AI生成器
├── hooks/               # 自定义Hooks
│   └── index.ts                # 复盘相关的所有Hooks
├── services/            # 服务层
│   ├── api.ts                  # API服务
│   └── ai.ts                   # AI服务
├── types/               # 类型定义
│   └── index.ts                # 所有类型定义
├── index.ts             # 统一导出
└── README.md            # 模块文档
```

## 核心功能

### 1. 复盘管理
- ✅ 创建、编辑、删除复盘
- ✅ 复盘列表展示
- ✅ 状态管理（草稿/已完成）
- ✅ Markdown支持

### 2. AI智能功能
- ✅ AI完整复盘生成
- ✅ 市场环境分析
- ✅ 股票表现分析
- ✅ 投资建议生成
- ✅ 流式AI对话
- ✅ AI智能建议

### 3. 数据输入
- ✅ 股票持仓信息输入
- ✅ 自动盈亏计算
- ✅ 多持仓管理

## 使用方法

### 基础使用

```tsx
import { ReviewPage } from '@/modules/review';

// 在路由中使用
<Route path="/review" element={<ReviewPage />} />
```

### 使用独立组件

```tsx
import { 
  ReviewEditor, 
  ReviewList, 
  useReviewData,
  useReviewAI 
} from '@/modules/review';

function MyReviewComponent() {
  const { reviews, selectedReview, updateReview } = useReviewData();
  const { generateFullReview } = useReviewAI();
  
  return (
    <div className="flex">
      <ReviewList 
        reviews={reviews}
        selectedReview={selectedReview}
        onSelectReview={selectReview}
        onCreateReview={createReview}
        onDeleteReview={deleteReview}
      />
      <ReviewEditor 
        review={selectedReview}
        onUpdateReview={updateReview}
      />
    </div>
  );
}
```

### 使用Hooks

```tsx
import { useReviewData, useReviewAI } from '@/modules/review';

function MyComponent() {
  // 复盘数据管理
  const {
    reviews,
    selectedReview,
    loading,
    error,
    createReview,
    updateReview,
    deleteReview,
    selectReview
  } = useReviewData();

  // AI功能
  const {
    loading: aiLoading,
    generateFullReview,
    analyzeStockPerformance,
    analyzeMarketCondition,
    generateInvestmentSuggestions
  } = useReviewAI();

  // 使用AI生成完整复盘
  const handleGenerateReview = async () => {
    const context = {
      reviewId: selectedReview.id,
      title: selectedReview.title,
      date: selectedReview.date,
      personalNotes: selectedReview.summary
    };
    
    const result = await generateFullReview(context);
    if (result) {
      await updateReview(selectedReview.id, {
        content: result.content,
        summary: result.summary
      });
    }
  };
}
```

### 使用服务

```tsx
import { reviewApiService, reviewAIService } from '@/modules/review';

// 直接调用API服务
const reviews = await reviewApiService.list();
const newReview = await reviewApiService.create({ title: '新复盘' });

// 直接调用AI服务
const analysis = await reviewAIService.analyzeMarketCondition('2024-01-01');
```

## 组件介绍

### ReviewPage
主页面组件，包含完整的复盘功能界面。

**特性：**
- 左右分栏布局
- 集成所有子组件
- 自动数据管理

### ReviewEditor
复盘内容编辑器，支持Markdown编辑和预览。

**特性：**
- 编辑/预览模式切换
- AI智能生成集成
- 实时保存
- 多种AI功能

### ReviewList
复盘列表组件，展示所有复盘记录。

**特性：**
- 状态显示
- 搜索过滤
- 删除确认
- 响应式设计

### AI组件
- **AISuggestions**: 基于复盘内容生成智能建议
- **StreamingAIGenerator**: 流式AI对话生成器
- **StockInputModal**: 股票信息输入界面

## 设计原则

### 1. 模块化设计
- 每个功能独立封装
- 清晰的职责分离
- 便于单独使用和测试

### 2. Hooks优先
- 业务逻辑抽离到Hooks
- 组件专注UI渲染
- 便于复用和测试

### 3. 类型安全
- 完整的TypeScript类型定义
- 接口规范化
- 运行时类型检查

### 4. 用户体验
- 响应式设计
- 深色模式支持
- 加载状态处理
- 错误处理

## 扩展指南

### 添加新功能
1. 在 `types/index.ts` 中定义相关类型
2. 在 `services/` 中添加API或AI服务
3. 在 `hooks/` 中封装业务逻辑
4. 在 `components/` 中创建UI组件
5. 在 `index.ts` 中导出新功能

### 自定义样式
组件使用Tailwind CSS，可以通过props或CSS变量进行样式定制。

### 集成到其他项目
1. 复制整个 `review` 模块目录
2. 确保项目有必要的依赖（React、Tailwind等）
3. 调整导入路径和API配置
4. 根据需要定制功能

## 依赖说明

### 核心依赖
- React 18+
- TypeScript 4.5+
- Tailwind CSS 3+
- Lucide React（图标）

### 外部服务
- Python分析服务（AI功能）
- 复盘API服务（数据持久化）

## 注意事项

1. **API配置**: 确保Python服务运行在正确的端口
2. **认证**: 某些功能需要用户登录
3. **错误处理**: 组件内置了基础错误处理，但建议根据实际情况完善
4. **性能**: 大量复盘数据时建议添加分页功能

## 后续计划

- [ ] 添加复盘模板功能
- [ ] 支持图片和文件上传
- [ ] 添加分享和导出功能
- [ ] 优化移动端体验
- [ ] 添加协作功能