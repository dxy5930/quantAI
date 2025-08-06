# Python API 配置说明

## 环境变量配置

在项目的 `.env.development` 文件中添加以下配置：

```bash
# Python分析服务API配置
VITE_PYTHON_API_BASE_URL=http://localhost:8000
VITE_PYTHON_API_TIMEOUT=60000
```

## 配置说明

- `VITE_PYTHON_API_BASE_URL`: Python分析服务的基础URL，默认为 `http://localhost:8000`
- `VITE_PYTHON_API_TIMEOUT`: API请求超时时间，单位毫秒，默认为 60 秒

## 流式对话功能

已将流式输出功能集成到中间区域的WorkflowCanvas对话框中，包括：

1. **实时流式响应**: 使用EventSource接收服务端推送的消息
2. **进度显示**: 显示任务执行的步骤和进度
3. **错误处理**: 处理连接中断和服务异常
4. **用户体验**: 流式输入时禁用输入框和按钮

## 技术实现

- 使用 axios 替代原生 fetch API
- 环境变量配置，便于不同环境的部署
- EventSource 实现服务端推送
- 完善的错误处理和用户反馈

## 使用方式

1. 确保Python分析服务正在运行（端口8000）
2. 在WorkflowCanvas中输入消息
3. 系统会自动建立流式连接并实时显示响应 