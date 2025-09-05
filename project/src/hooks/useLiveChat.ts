import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { WebSocketClient } from '../services/WebSocketClient';
import { userStore } from '../stores/UserStore';

export interface LiveChatMessage {
  id: string;
  user: string;
  content: string;
  createdAt: number;
}

export interface UseLiveChatOptions {
  url: string;
  room?: string;
  username?: string;
  autoConnect?: boolean;
}

export interface UseLiveChatApi {
  messages: LiveChatMessage[];
  connected: boolean;
  connecting: boolean;
  send: (content: string) => void;
  connect: () => void;
  disconnect: () => void;
}

export const useLiveChat = (options: UseLiveChatOptions): UseLiveChatApi => {
  const { url, room = 'global', username, autoConnect = true } = options;
  const effectiveUsername = username || userStore.userDisplayName || userStore.currentUser?.username || '游客';
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const clientRef = useRef<WebSocketClient | null>(null);
  const lastRoomRef = useRef<string>(room);

  const ensureClient = useCallback(() => {
    if (clientRef.current) return clientRef.current;
    clientRef.current = new WebSocketClient({
      url,
      onOpen: () => { setConnected(true); setConnecting(false); },
      onClose: () => { setConnected(false); },
      onError: () => { setConnected(false); },
      onMessage: (data) => {
        // 约定消息格式：{ type: 'chat'|'system', ... }
        if (data?.type === 'chat') {
          const msg: LiveChatMessage = {
            id: data.id || Math.random().toString(36).slice(2),
            user: data.user || '匿名',
            content: data.content || '',
            createdAt: data.createdAt || Date.now(),
          };
          setMessages(prev => [...prev, msg]);
        }
      },
    });
    return clientRef.current;
  }, [url]);

  const connect = useCallback(() => {
    if (connecting || connected) return;
    setConnecting(true);
    const c = ensureClient();
    c.connect();
  }, [ensureClient, connecting, connected]);

  const disconnect = useCallback(() => {
    clientRef.current?.close();
    clientRef.current = null;
    setConnected(false);
  }, []);

  const send = useCallback((content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    const payload = {
      type: 'chat',
      room,
      user: effectiveUsername,
      content: trimmed,
      createdAt: Date.now(),
    };
    ensureClient().send(payload);
    // 同步本地显示
    setMessages(prev => [...prev, { ...payload, id: Math.random().toString(36).slice(2) }]);
  }, [ensureClient, room, effectiveUsername]);

  useEffect(() => {
    if (autoConnect) connect();
    return () => { disconnect(); };
  }, [autoConnect, connect, disconnect]);

  // 监听房间变更：清空消息并可选重连（这里仅清空消息即可）
  useEffect(() => {
    if (lastRoomRef.current !== room) {
      setMessages([]);
      lastRoomRef.current = room;
    }
  }, [room]);

  return { messages, connected, connecting, send, connect, disconnect };
}; 