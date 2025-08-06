# AI流式对话功能说明

## 功能概述

集成了通义千问AI的智能流式对话系统，提供实时的投资分析和建议，包含详细的执行步骤跟踪和交互式体验。

## 核心功能

### 1. 智能AI回答
- **通义千问集成**: 使用阿里云通义千问大模型提供专业的投资分析
- **上下文理解**: AI能够理解对话上下文，提供连贯的分析
- **专业提示词**: 针对投资场景优化的提示词模板

### 2. 流式执行步骤
- **实时进度显示**: 显示AI思考和分析的每个步骤
- **分类标识**: 不同类型的步骤有不同的颜色和图标标识
  - 🟢 **分析** - 数据分析和市场研究
  - 🟣 **策略** - 投资策略制定
  - 🔵 **通用** - 一般性处理
  - 🔴 **错误** - 错误处理

### 3. 可点击步骤交互
- **步骤点击**: 用户可以点击任何执行步骤查看详情
- **右侧跟随**: 点击步骤后右侧面板自动显示详细信息
- **实时切换**: 自动切换到"实时跟随"标签页

### 4. 分段式输出
每个AI回答包含以下步骤：
1. **理解问题** - 分析用户的具体需求
2. **搜索数据** - 收集相关市场信息
3. **AI分析** - 调用通义千问进行深度分析
4. **整理结果** - 组织和结构化分析结果
5. **生成建议** - 提供具体的投资建议

## 使用方式

### 1. 发起对话
- 在WorkflowCanvas中间区域输入投资相关问题
- 系统自动识别问题类型（分析、策略、通用）
- 开始流式AI分析过程

### 2. 查看执行步骤
- 观察实时的执行进度条
- 查看每个步骤的具体内容
- 步骤完成后会显示在助手消息中

### 3. 交互式体验
- 点击任意执行步骤
- 右侧面板自动显示步骤详情
- 包含步骤分类、执行时间、详细内容

## 技术实现

### 后端实现
```python
# 通义千问集成
from services.qwen_analyzer import QwenAnalyzer

# 流式响应生成
async def generate_analysis_stream(message: str, context: Dict[str, Any]):
    # 分段执行步骤
    steps = [
        "正在理解您的问题...",
        "正在搜索相关数据...", 
        "正在调用通义千问AI分析...",
        "正在整理分析结果...",
        "正在生成投资建议..."
    ]
    
    # 调用通义千问API
    ai_response = qwen_analyzer.analyze_text(analysis_prompt, max_tokens=2000)
```

### 前端实现
```typescript
// 执行步骤数据结构
interface ExecutionStep {
  id: string;
  content: string;
  stepNumber: number;
  totalSteps: number;
  category: 'analysis' | 'strategy' | 'general' | 'result' | 'error';
  timestamp: Date;
  isClickable?: boolean;
}

// 步骤点击处理
const handleStepClick = (step: ExecutionStep, messageId: string) => {
  setSelectedStep(step);
  // 通知右侧面板显示详情
  onNodeClick(messageId, 'info');
};
```

## 配置说明

### 环境变量
```bash
# 通义千问API配置
DASHSCOPE_API_KEY=your_api_key
QWEN_MODEL=qwen-plus
QWEN_MAX_TOKENS=2000
QWEN_TEMPERATURE=0.3
```

### API路径
- 流式对话: `GET /api/v1/chat/stream`
- 普通消息: `POST /api/v1/chat/message`
- 聊天历史: `GET /api/v1/chat/history/{conversation_id}`

## 用户体验特性

1. **视觉反馈**: 步骤执行时的动画和颜色变化
2. **即时响应**: 流式输出无需等待完整结果
3. **交互式探索**: 可深入了解每个执行步骤
4. **上下文保持**: 对话历史和上下文信息保持
5. **错误处理**: 友好的错误提示和降级方案

## 示例对话流程

1. **用户输入**: "帮我分析一下当前科技股的投资机会"
2. **系统响应**: 
   - 步骤1: 正在理解您的问题... ✅
   - 步骤2: 正在搜索相关数据... ✅
   - 步骤3: 正在调用通义千问AI分析... ✅
   - 步骤4: 正在整理分析结果... ✅
   - 步骤5: 正在生成投资建议... ✅
3. **AI回答**: 详细的科技股分析报告
4. **用户操作**: 点击"步骤3"查看AI分析详情
5. **系统响应**: 右侧显示AI分析的具体过程和方法

这个系统为用户提供了透明、交互式、专业的AI投资分析体验。 