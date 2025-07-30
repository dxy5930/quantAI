# AI 工作流画布组件

这是一个可拖拽的 AI 工作流编辑器，用于构建和执行投资分析工作流。

## 功能特性

### 🎨 可视化编辑
- 拖拽式节点操作
- 实时连线和数据流可视化
- 支持缩放和平移画布
- 节点状态实时更新

### 🧩 丰富的节点类型
- **数据收集节点**: 收集股票数据、财务数据、新闻等
- **分析节点**: 技术分析、基本面分析
- **策略节点**: 动量策略、价值投资、风险平价等
- **风险评估节点**: VaR、夏普比率、最大回撤等
- **输出节点**: 报告生成、可视化输出

### 📋 模板系统
- 预设经典策略模板
- 一键加载模板快速开始
- 支持自定义和分享模板
- 模板难度分级（初级/中级/高级）

### ⚙️ 节点配置
- 动态配置界面
- 支持多种参数类型
- 实时配置验证
- 配置预设和模板

### 🔄 工作流执行
- 实时执行状态监控
- 节点进度可视化
- 错误处理和重试
- 执行日志和结果查看

## 组件结构

```
src/components/workflow/
├── WorkflowCanvas.tsx          # 主画布组件
├── NodeConfigPanel.tsx         # 节点配置面板
├── WorkflowTemplates.tsx       # 工作流模板
├── index.ts                    # 组件导出
└── README.md                   # 文档
```

## 使用方法

### 基本使用

```tsx
import { WorkflowCanvas } from '../../components/workflow';

function MyWorkflowPage() {
  const handleWorkflowRun = async (workflow) => {
    // 处理工作流运行
    console.log('运行工作流:', workflow);
  };

  const handleWorkflowSave = async (workflow) => {
    // 处理工作流保存
    console.log('保存工作流:', workflow);
  };

  return (
    <div className="h-screen">
      <WorkflowCanvas
        onWorkflowRun={handleWorkflowRun}
        onWorkflowSave={handleWorkflowSave}
      />
    </div>
  );
}
```

### 工作流定义结构

```typescript
interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  connections: Connection[];
  status: 'idle' | 'running' | 'completed' | 'error';
  createdAt: Date;
  updatedAt: Date;
}

interface WorkflowNode {
  id: string;
  type: 'data' | 'analysis' | 'strategy' | 'risk' | 'output' | 'custom';
  name: string;
  description: string;
  position: { x: number; y: number };
  config: Record<string, any>;
  inputs: string[];
  outputs: string[];
  status: 'idle' | 'running' | 'completed' | 'error';
  progress: number;
  result?: any;
}
```

## 节点类型详解

### 数据收集节点 (data)
收集各种市场数据作为分析基础。

**配置选项:**
- `dataSources`: 数据源类型 (stock_price, financial_data, news)
- `timeRange`: 时间范围 (1d, 1w, 1m, 3m, 6m, 1y, 2y, 5y)
- `symbols`: 股票代码列表

### 分析节点 (analysis)
对数据进行技术分析或基本面分析。

**配置选项:**
- `indicators`: 技术指标 (MA, RSI, MACD, KDJ, BOLL)
- `period`: 分析周期
- `metrics`: 基本面指标 (PE, PB, ROE, ROA)

### 策略节点 (strategy)
基于分析结果生成投资策略。

**配置选项:**
- `strategyType`: 策略类型 (momentum, mean_reversion, value, growth)
- `riskLevel`: 风险等级 (low, medium, high)
- `timeHorizon`: 投资期限 (short_term, medium_term, long_term)

### 风险评估节点 (risk)
评估策略风险和回测表现。

**配置选项:**
- `riskMetrics`: 风险指标 (VaR, Sharpe, MaxDrawdown, Volatility)
- `backtestPeriod`: 回测期间
- `benchmarks`: 基准比较

### 输出节点 (output)
生成最终的分析报告和建议。

**配置选项:**
- `outputFormat`: 输出格式 (summary, detailed_report, json, csv)
- `includeCharts`: 是否包含图表
- `language`: 报告语言

## API 接口

### 后端接口 (NestJS)

```typescript
// 保存工作流定义
POST /ai-workflow/workflow/save
{
  workflow: Workflow
}

// 运行工作流定义
POST /ai-workflow/workflow/run
{
  workflowDefinition: Workflow,
  context?: any
}

// 获取工作流定义
GET /ai-workflow/workflow/:workflowId

// 获取工作流模板
GET /ai-workflow/workflow/templates/list

// 验证工作流定义
POST /ai-workflow/workflow/validate
{
  workflow: Workflow
}
```

### Python 分析服务接口

```python
# 运行工作流定义
POST /api/v1/workflow/definition/run
{
  "execution_id": str,
  "workflow_definition": dict,
  "user_id": str,
  "context": dict
}

# 获取执行状态
GET /api/v1/workflow/execution/status/{execution_id}

# 获取执行结果
GET /api/v1/workflow/execution/results/{execution_id}

# 验证工作流定义
POST /api/v1/workflow/definition/validate
{
  "workflow_definition": dict
}
```

## 开发指南

### 添加新节点类型

1. 在 `NODE_TEMPLATES` 中添加节点模板
2. 在 `getNodeIcon` 和 `getNodeColor` 中添加对应的图标和颜色
3. 在 Python 服务中添加对应的执行逻辑

### 自定义配置面板

在 `NodeConfigPanel.tsx` 中的 `renderConfigField` 方法中添加新的配置字段类型。

### 添加新模板

在 `WorkflowTemplates.tsx` 中的 `WORKFLOW_TEMPLATES` 数组中添加新的模板定义。

## 故障排除

### 常见问题

1. **节点无法连接**: 检查节点的输入输出端口是否匹配
2. **工作流执行失败**: 查看 Python 服务日志，确保所有依赖服务正常
3. **配置不生效**: 确保配置格式正确，检查类型验证
4. **模板加载失败**: 检查模板定义的完整性和格式

### 调试技巧

1. 使用浏览器开发者工具查看网络请求
2. 检查 Python 服务的日志输出
3. 使用 `test-workflow-canvas.js` 脚本测试接口
4. 在组件中添加 console.log 调试信息

## 性能优化

1. **大型工作流**: 对于节点数量超过20个的工作流，考虑分批执行
2. **实时更新**: 使用 WebSocket 或 Server-Sent Events 进行实时状态更新
3. **缓存策略**: 缓存常用的模板和配置
4. **懒加载**: 对于复杂的配置面板，使用懒加载减少初始渲染时间

## 扩展功能

### 计划中的功能
- [ ] 工作流版本控制
- [ ] 协作编辑
- [ ] 自动布局算法
- [ ] 工作流调试器
- [ ] 性能分析工具
- [ ] 工作流市场

### 集成建议
- 与现有的回测系统集成
- 支持更多数据源
- 添加机器学习节点
- 支持实时交易执行