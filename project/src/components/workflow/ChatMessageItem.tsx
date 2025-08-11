import React from 'react';
import { Bot, User, Loader2, ChevronRight, CheckCircle2 } from 'lucide-react';
import { MarkdownRenderer } from '../common/MarkdownRenderer';

export interface ExecutionStep {
  id: string;
  stepNumber?: number;
  totalSteps?: number;
  category?: string;
  resourceType?: string;
  content?: string;
  isCompleted?: boolean;
}

export interface TaskMessage {
  id: string;
  type: 'user' | 'system' | 'task' | 'result' | 'assistant';
  content: string;
  timestamp: Date;
  isComplete?: boolean;
  isStreaming?: boolean;
  steps?: ExecutionStep[];
  currentStep?: ExecutionStep | null;
  data?: Record<string, any> & { progressLines?: string[] };
}

interface ChatMessageItemProps {
  message: TaskMessage;
  onStepClick?: (step: ExecutionStep) => void;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message, onStepClick }) => {
  const isUser = message.type === 'user';
  const isAssistant = message.type === 'assistant';
  const showThinking = !!message.data?.isAssistantLoading;
  const step = message.currentStep || (Array.isArray(message.steps) ? message.steps[message.steps.length - 1] : undefined);
  const progressLines: string[] = Array.isArray(message.data?.progressLines) ? (message.data!.progressLines as string[]) : [];

  // Coze风格：隐藏所有 system 气泡（包括步骤系统消息）
  if (message.type === 'system') return null;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 mr-3 mt-1">
          <div className="w-8 h-8 rounded-full bg-purple-600/10 text-purple-600 flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
        </div>
      )}

      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col space-y-2`}>
        <div
          className={`rounded-2xl border text-sm leading-relaxed px-3 py-2 whitespace-pre-wrap ${
            isUser
              ? 'bg-blue-600 text-white border-blue-600 rounded-br-sm'
              : 'bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 rounded-bl-sm'
          }`}
        >
          {/* 进度提示列表（Coze 风格） */}
          {isAssistant && progressLines.length > 0 && (
            <div className="mb-2 space-y-1">
              {progressLines.map((line, idx) => {
                const running = /^正在/.test(line);
                const done = /已完成$/.test(line) || /^✅/.test(line);
                return (
                  <div key={idx} className={`flex items-center text-xs ${running ? 'text-gray-600' : done ? 'text-green-600' : 'text-gray-600'}`}>
                    {running ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : done ? (
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                    ) : null}
                    <span>{line}</span>
                  </div>
                );
              })}
            </div>
          )}

          {showThinking ? (
            <span className="inline-flex items-center text-gray-600 dark:text-gray-300">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              正在思考…
            </span>
          ) : isAssistant ? (
            <MarkdownRenderer content={message.content} />
          ) : (
            <span>{message.content}</span>
          )}
        </div>

        {/* 助手内联步骤进度（简化Coze风格） */}
        {isAssistant && step && (
          <button
            className="group inline-flex items-center text-xs text-gray-500 hover:text-blue-600 transition-colors"
            onClick={() => onStepClick && step && onStepClick(step)}
            title="查看步骤详情"
          >
            <span>
              第{step.stepNumber || 1}{step.totalSteps ? `/${step.totalSteps}` : ''}步 · {step.category || '执行'}
              {step.isCompleted ? ' · 已完成' : ' · 进行中'}
            </span>
            <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>

      {isUser && (
        <div className="flex-shrink-0 ml-3 mt-1">
          <div className="w-8 h-8 rounded-full bg-blue-600/10 text-blue-600 flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatMessageItem; 