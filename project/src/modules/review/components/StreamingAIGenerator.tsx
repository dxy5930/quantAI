/**
 * 流式AI生成器组件 - 模块化版本
 * Streaming AI Generator Component - Modular Version
 */

import React, { useState, useEffect, useRef } from 'react';
import { Send, Square, Loader2, Bot, User, Copy, Check } from 'lucide-react';
import { pythonApiClient } from '../../../services/pythonApiClient';
import { StreamingAIGeneratorProps, StreamingMessage } from '../types';

export const StreamingAIGenerator: React.FC<StreamingAIGeneratorProps> = ({
  isOpen,
  onClose,
  onContentGenerated,
  reviewContext
}) => {
  const [messages, setMessages] = useState<StreamingMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationId = useRef<string>(`review-stream-${Date.now()}`);

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 组件挂载时添加欢迎消息
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: StreamingMessage = {
        id: 'welcome',
        role: 'assistant',
        content: `您好！我是您的AI复盘助手。我可以帮您：

📊 **分析市场环境** - 为复盘提供市场背景分析
📈 **生成投资建议** - 基于您的交易情况提供专业建议  
📝 **完善复盘内容** - 帮助您完善复盘的各个部分
🎯 **制定改进计划** - 为您的投资策略提供优化方向

请告诉我您希望我帮您分析什么？`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen]);

  // 清理资源
  useEffect(() => {
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [eventSource]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isStreaming) return;

    const userMessage: StreamingMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsStreaming(true);

    try {
      // 构建上下文信息
      const context = {
        reviewId: reviewContext?.id,
        reviewTitle: reviewContext?.title,
        reviewDate: reviewContext?.date,
        reviewSummary: reviewContext?.summary,
        existingContent: reviewContext?.content,
        conversationType: 'review-assistant'
      };

      // 创建流式连接
      const source = pythonApiClient.createStreamingChat({
        message: inputMessage,
        conversationId: conversationId.current,
        context: context
      });

      setEventSource(source);

      // 创建助手消息
      const assistantMessage: StreamingMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true
      };

      setMessages(prev => [...prev, assistantMessage]);

      // 监听流式响应
      source.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'content') {
            setMessages(prev => prev.map(msg => 
              msg.id === assistantMessage.id 
                ? { ...msg, content: msg.content + data.content }
                : msg
            ));
          } else if (data.type === 'done') {
            setMessages(prev => prev.map(msg => 
              msg.id === assistantMessage.id 
                ? { ...msg, isStreaming: false }
                : msg
            ));
            setIsStreaming(false);
            source.close();
            setEventSource(null);
          } else if (data.type === 'error') {
            console.error('流式响应错误:', data.error);
            setMessages(prev => prev.map(msg => 
              msg.id === assistantMessage.id 
                ? { ...msg, content: '抱歉，生成过程中出现了错误，请重试。', isStreaming: false }
                : msg
            ));
            setIsStreaming(false);
            source.close();
            setEventSource(null);
          }
        } catch (error) {
          console.error('解析流式数据失败:', error);
        }
      };

      source.onerror = (error) => {
        console.error('流式连接错误:', error);
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessage.id 
            ? { ...msg, content: '连接中断，请重试。', isStreaming: false }
            : msg
        ));
        setIsStreaming(false);
        source.close();
        setEventSource(null);
      };

    } catch (error) {
      console.error('发送消息失败:', error);
      setIsStreaming(false);
    }
  };

  const stopGeneration = () => {
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
    }
    setIsStreaming(false);
    setMessages(prev => prev.map(msg => 
      msg.isStreaming ? { ...msg, isStreaming: false } : msg
    ));
  };

  const copyToClipboard = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  const insertIntoReview = (content: string) => {
    onContentGenerated(content);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                AI复盘助手
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                与AI对话，实时生成复盘内容
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                <div className="flex items-center space-x-2 mb-1">
                  {message.role === 'assistant' ? (
                    <Bot className="w-4 h-4 text-blue-600" />
                  ) : (
                    <User className="w-4 h-4 text-green-600" />
                  )}
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {message.role === 'assistant' ? 'AI助手' : '您'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                
                <div className={`p-3 rounded-lg relative group ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.content}
                    {message.isStreaming && (
                      <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
                    )}
                  </div>
                  
                  {/* 操作按钮 */}
                  {message.role === 'assistant' && message.content && !message.isStreaming && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => copyToClipboard(message.content, message.id)}
                          className="p-1 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                          title="复制内容"
                        >
                          {copiedMessageId === message.id ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                        <button
                          onClick={() => insertIntoReview(message.content)}
                          className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs px-2"
                          title="插入到复盘"
                        >
                          插入
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入区域 */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="输入您的问题或需求..."
                disabled={isStreaming}
                className="w-full p-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              />
            </div>
            
            {isStreaming ? (
              <button
                onClick={stopGeneration}
                className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <Square className="w-4 h-4" />
                <span>停止</span>
              </button>
            ) : (
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim()}
                className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                <span>发送</span>
              </button>
            )}
          </div>
          
          {/* 快捷建议 */}
          <div className="flex flex-wrap gap-2 mt-3">
            {[
              '帮我分析今日市场情况',
              '生成持仓分析模板',
              '制定明日投资策略',
              '总结经验教训'
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setInputMessage(suggestion)}
                disabled={isStreaming}
                className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreamingAIGenerator;