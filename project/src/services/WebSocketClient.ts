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
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    const payload = typeof message === 'string' || message instanceof Blob || message instanceof ArrayBuffer || ArrayBuffer.isView(message)
      ? message
      : JSON.stringify(message);
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
      this.options.onOpen?.(ev);
      this.startHeartbeat();
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