export type WebSocketMessage = string | ArrayBuffer | Blob | ArrayBufferView | object;

export interface WebSocketClientOptions {
  url: string;
  protocols?: string | string[];
  autoReconnect?: boolean;
  reconnectDelayMs?: number;
  maxReconnectAttempts?: number;
  heartbeatIntervalMs?: number; // 心跳间隔
  makeHeartbeatPayload?: () => any; // 心跳负载
  onOpen?: (ev: Event) => void;
  onClose?: (ev: CloseEvent) => void;
  onError?: (ev: Event) => void;
  onMessage?: (data: any, ev: MessageEvent) => void;
}

export class WebSocketClient {
  private socket: WebSocket | null = null;
  private options: WebSocketClientOptions;
  private reconnectAttempts = 0;
  private heartbeatTimer: any = null;
  private manuallyClosed = false;
  private pendingMessages: WebSocketMessage[] = [];

  constructor(options: WebSocketClientOptions) {
    this.options = {
      autoReconnect: true,
      reconnectDelayMs: 1500,
      maxReconnectAttempts: 10,
      heartbeatIntervalMs: 25000,
      makeHeartbeatPayload: () => ({ type: 'ping', ts: Date.now() }),
      ...options,
    };
  }

  public connect() {
    this.manuallyClosed = false;
    this.initSocket();
  }

  public close() {
    this.manuallyClosed = true;
    this.clearHeartbeat();
    this.socket?.close();
    this.socket = null;
  }

  public send(message: WebSocketMessage) {
    const payload = typeof message === 'string' || message instanceof Blob || message instanceof ArrayBuffer || ArrayBuffer.isView(message)
      ? message
      : JSON.stringify(message);
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      // 未连接时先入队，连接建立后自动发送
      this.pendingMessages.push(payload as any);
      return;
    }
    this.socket.send(payload as any);
  }

  private initSocket() {
    const { url, protocols } = this.options;
    try {
      this.socket = new WebSocket(url, protocols);
    } catch (e) {
      this.scheduleReconnect();
      return;
    }

    this.socket.onopen = (ev) => {
      this.reconnectAttempts = 0;
      // 先回调，外部通常会在此发送 join
      this.options.onOpen?.(ev);
      this.startHeartbeat();
      // 再异步刷新队列，确保 join 优先
      setTimeout(() => this.flushPending(), 0);
    };

    this.socket.onmessage = (ev) => {
      let data: any = ev.data;
      try {
        data = JSON.parse(ev.data);
      } catch {}
      this.options.onMessage?.(data, ev);
    };

    this.socket.onerror = (ev) => {
      this.options.onError?.(ev);
    };

    this.socket.onclose = (ev) => {
      this.clearHeartbeat();
      this.options.onClose?.(ev);
      if (!this.manuallyClosed && this.options.autoReconnect) {
        this.scheduleReconnect();
      }
    };
  }

  private flushPending() {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    if (this.pendingMessages.length === 0) return;
    const queue = this.pendingMessages.splice(0, this.pendingMessages.length);
    for (const payload of queue) {
      try {
        this.socket.send(payload as any);
      } catch {}
    }
  }

  private scheduleReconnect() {
    if (!this.options.autoReconnect) return;
    if (this.reconnectAttempts >= (this.options.maxReconnectAttempts || 0)) return;
    this.reconnectAttempts += 1;
    setTimeout(() => this.initSocket(), this.options.reconnectDelayMs);
  }

  private startHeartbeat() {
    this.clearHeartbeat();
    if (!this.options.heartbeatIntervalMs) return;
    this.heartbeatTimer = setInterval(() => {
      this.send(this.options.makeHeartbeatPayload?.());
    }, this.options.heartbeatIntervalMs);
  }

  private clearHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
} 