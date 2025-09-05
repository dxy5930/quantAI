import React, { useEffect, useMemo, useRef, useState } from 'react';

export interface ChatMessage {
  id: string;
  user: string;
  content: string;
  createdAt: number;
}

export interface LiveChatProps {
  initialMessages?: ChatMessage[];
  messages?: ChatMessage[];
  onSend?: (message: string) => void;
  onMessageListChange?: (messages: ChatMessage[]) => void;
  className?: string;
}

export const LiveChat: React.FC<LiveChatProps> = ({ initialMessages = [], messages: controlledMessages, onSend, onMessageListChange, className = '' }) => {
  const isControlled = Array.isArray(controlledMessages);
  const [uncontrolledMessages, setUncontrolledMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const messages = isControlled ? controlledMessages! : uncontrolledMessages;

  // 仅滚动评论容器，避免页面整体滚动
  const scrollToBottom = () => {
    const list = listRef.current;
    if (!list) return;
    requestAnimationFrame(() => {
      list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const handleSend = () => {
    const content = input.trim();
    if (!content) return;

    // 受控模式只调用外部 send
    if (isControlled) {
      onSend?.(content);
      setInput('');
      return;
    }

    // 非受控模式本地新增
    const msg: ChatMessage = {
      id: Math.random().toString(36).slice(2),
      user: '游客',
      content,
      createdAt: Date.now(),
    };
    const next = [...uncontrolledMessages, msg];
    setUncontrolledMessages(next);
    onMessageListChange?.(next);
    onSend?.(content);
    setInput('');
  };

  const placeholder = useMemo(() => '文明发言，理性讨论~', []);

  return (
    <div className={`flex h-full w-full flex-col bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden ${className}`}>
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200">实时评论</div>
      <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50/60 dark:bg-slate-900/40">
        {messages.map(m => (
          <div key={m.id} className="text-sm rounded-lg p-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">{m.user} · {new Date(m.createdAt).toLocaleTimeString()}</div>
            <div className="text-gray-800 dark:text-gray-100 whitespace-pre-wrap break-words">{m.content}</div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSend}
            className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm"
          >发送</button>
        </div>
      </div>
    </div>
  );
};

export default LiveChat; 