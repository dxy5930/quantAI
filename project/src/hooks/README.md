# useStreamingChat Hook 使用说明

## 概述

`useStreamingChat` 是一个自定义 React Hook，用于管理 SSE（Server-Sent Events）流式对话功能。它将复杂的流式对话逻辑从组件中抽离出来，提供了清晰的接口和状态管理。

## 主要功能

- 🔄 管理 SSE 连接的生命周期
- 📝 处理流式消息和步骤更新
- 🔗 自动处理连接管理和清理
- 💡 生成智能建议选项
- 🛡️ 错误处理和连接状态管理

## 接口定义

```typescript
interface UseStreamingChatOptions {
  workflowId: string | null;
  onMessagesUpdate: (updater: (prev: TaskMessage[]) => TaskMessage[]) => void;
  onStepsUpdate: (updater: (prev: ExecutionStep[]) => ExecutionStep[]) => void;
  onSuggestionsUpdate: (suggestions: any[]) => void;
}

interface StreamingChatState {
  isStreaming: boolean;
  isRunning: boolean;
  currentTaskId: string | null;
}
```

## 使用示例

```typescript
import { useStreamingChat } from '../hooks/useStreamingChat';

const MyComponent = () => {
  const [messages, setMessages] = useState<TaskMessage[]>([]);
  const [steps, setSteps] = useState<ExecutionStep[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  
  // 使用流式聊天Hook
  const streamingChat = useStreamingChat({
    workflowId: 'your-workflow-id',
    onMessagesUpdate: setMessages,
    onStepsUpdate: setSteps,
    onSuggestionsUpdate: setSuggestions
  });

  const handleSendMessage = (message: string) => {
    // 添加用户消息
    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      content: message,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    
    // 开始流式对话
    streamingChat.startStreamingChat(message);
  };

  const handleStop = () => {
    streamingChat.forceStopAllConnections();
  };

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      streamingChat.cleanup();
    };
  }, [streamingChat.cleanup]);

  return (
    <div>
      {/* 消息列表 */}
      {messages.map(msg => (
        <div key={msg.id}>{msg.content}</div>
      ))}
      
      {/* 输入框和控制按钮 */}
      <input 
        disabled={streamingChat.state.isStreaming}
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            handleSendMessage(e.currentTarget.value);
          }
        }}
      />
      
      {streamingChat.state.isStreaming ? (
        <button onClick={handleStop}>停止</button>
      ) : (
        <button onClick={() => handleSendMessage('Hello')}>发送</button>
      )}
    </div>
  );
};
```

## Hook 返回值

```typescript
const {
  state,                    // 当前状态 { isStreaming, isRunning, currentTaskId }
  startStreamingChat,       // 开始流式对话的函数
  forceStopAllConnections,  // 强制停止所有连接的函数
  cleanup                   // 清理函数
} = useStreamingChat(options);
```

## 主要特性

### 1. 自动状态管理
Hook 自动管理连接状态、流式状态和任务ID，无需手动管理这些复杂的状态。

### 2. 连接生命周期管理
- 自动处理连接的创建和关闭
- 防止内存泄漏和重复连接
- 组件卸载时自动清理资源

### 3. 流式消息处理
- 支持多种消息类型（start、progress、content、complete、error等）
- 自动更新消息和步骤状态
- 智能处理进度行和步骤完成状态

### 4. 智能建议生成
- AI 回答完成后自动生成相关建议
- 支持后端 API 调用
- 错误时优雅降级

### 5. 错误处理
- 连接错误自动重试和清理
- 组件卸载检查防止状态泄漏
- 连接状态验证

## 注意事项

1. **组件卸载**：确保在组件卸载时调用 `cleanup()` 函数
2. **工作流ID**：workflowId 变化时会自动处理连接切换
3. **状态同步**：通过回调函数保持状态同步，避免直接修改Hook内部状态
4. **并发控制**：Hook内部处理并发连接问题，确保只有一个活跃连接

## 重构前后对比

### 重构前（WorkflowCanvas.tsx）
- 1676 行代码，包含大量 SSE 处理逻辑
- 复杂的状态管理和事件处理
- 难以测试和维护

### 重构后
- WorkflowCanvas.tsx：减少至约 800 行
- useStreamingChat.ts：539 行专门的Hook逻辑
- 清晰的职责分离和更好的可维护性

这种重构提高了代码的可读性、可测试性和可维护性，同时保持了所有原有功能。