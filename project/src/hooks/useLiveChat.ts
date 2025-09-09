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
  const receivedIdsRef = useRef<Set<string>>(new Set());

  const ensureClient = useCallback(() => {
    if (clientRef.current) return clientRef.current;
    clientRef.current = new WebSocketClient({
      url,
      onOpen: () => { setConnected(true); setConnecting(false); console.debug('[LiveChat] WebSocket opened'); },
      onClose: () => { setConnected(false); console.debug('[LiveChat] WebSocket closed'); },
      onError: () => { setConnected(false); console.error('[LiveChat] WebSocket error'); },
      onMessage: (data) => {
        // 统一只接受服务端广播
        console.debug('[LiveChat] onMessage:', data);
        if (data?.type === 'chat') {
          const id = data.id || Math.random().toString(36).slice(2);
          if (receivedIdsRef.current.has(id)) return;
          receivedIdsRef.current.add(id);
          const msg: LiveChatMessage = {
            id,
            user: data.user || '匿名',
            content: data.content || '',
            createdAt: Number(data.createdAt) || Date.now(),
          };
          setMessages(prev => {
            const next = [...prev, msg];
            next.sort((a, b) => a.createdAt - b.createdAt);
            return next;
          });
        }
      },
    });
    return clientRef.current;
  }, [url]);

  const connect = useCallback(() => {
    if (connecting || connected) return;
    setConnecting(true);
    const c = ensureClient();
    // 在 onOpen 中发送 join，避免竞态
    const prevOnOpen = (c as any).options?.onOpen;
    (c as any).options = {
      ...(c as any).options,
      onOpen: (ev: Event) => {
        prevOnOpen?.(ev);
        try {
          const payload = { type: 'join', room, user: effectiveUsername, createdAt: Date.now() };
          console.debug('[LiveChat] send join:', payload);
          ensureClient().send(payload);
        } catch {}
      }
    };
    console.debug('[LiveChat] connecting to', url, 'room:', room, 'user:', effectiveUsername);
    c.connect();
  }, [ensureClient, connecting, connected, room, effectiveUsername, url]);

  const disconnect = useCallback(() => {
    clientRef.current?.close();
    clientRef.current = null;
    setConnected(false);
  }, []);

  const send = useCallback((content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    const id = `c_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const payload = {
      type: 'chat',
      id,
      room,
      user: effectiveUsername,
      content: trimmed,
      createdAt: Date.now(),
    };
    // 乐观更新：本地先显示，并记录 id 以避免回显重复
    receivedIdsRef.current.add(id);
    setMessages(prev => {
      const optimistic = { id, user: effectiveUsername, content: trimmed, createdAt: Date.now() };
      const next = [...prev, optimistic];
      next.sort((a, b) => a.createdAt - b.createdAt);
      return next;
    });
    console.debug('[LiveChat] send chat:', payload);
    ensureClient().send(payload);
  }, [ensureClient, room, effectiveUsername]);

  // 连接：仅在 autoConnect 变为 true 时尝试连接，不在依赖变化时清理
  useEffect(() => {
    if (autoConnect) connect();
  }, [autoConnect, connect]);

  // 卸载时断开连接
  useEffect(() => {
    return () => { disconnect(); };
  }, [disconnect]);

  // 监听房间变更：清空消息并发送 join
  useEffect(() => {
    if (lastRoomRef.current !== room) {
      setMessages([]);
      receivedIdsRef.current.clear();
      lastRoomRef.current = room;
      if (connected) {
        try { ensureClient().send({ type: 'join', room, user: effectiveUsername, createdAt: Date.now() }); } catch {}
      }
    }
  }, [room, connected, ensureClient, effectiveUsername]);

  return { messages, connected, connecting, send, connect, disconnect };
}; 