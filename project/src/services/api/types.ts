import { ApiResponse } from '../../types';

export interface AuthResponse {
  user: any;
  token: string;
  refreshToken?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error';
  createdAt: string;
  read: boolean;
}

export interface ReviewTableInfo {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

// 频道定义（频道即老师）
export interface LiveChannel {
  id: string;
  name: string;
  streamUrl: string;
  room?: string;
  order?: number;
  isActive?: boolean;
  teacherId?: string | null;
}

export type LiveChannelListResponse = ApiResponse<LiveChannel[]>;

export interface LiveAccessCheckResult {
  allowed: boolean;
  reason: 'public' | 'subscribed' | 'not_subscribed';
  endAt?: string;
  teacherId?: string;
}

export type LiveAccessCheckResponse = ApiResponse<LiveAccessCheckResult>;

// 订单/支付
export interface LiveOrderSummary {
  id: string;
  channelId: string;
  teacherId: string;
  durationDays: number;
  amountCents: number;
  currency: 'CNY' | string;
  payMethod?: 'wechat' | 'alipay' | 'bankcard' | string;
  status: 'PENDING' | 'PAID' | 'CANCELED' | string;
  createdAt?: string;
}

export interface PayResult {
  paid: boolean;
  orderId: string;
  channelId: string;
  teacherId: string;
  expiresAt: string;
  amountCents: number;
  currency: 'CNY' | string;
}

export type CreateOrderResponse = ApiResponse<LiveOrderSummary>;
export type PayOrderResponse = ApiResponse<PayResult>;

// 推广信息
export interface LivePromo {
  title: string;
  description: string;
  bulletPoints: string[];
  qrUrl: string;
  contact: string;
  teacherId: string;
  channelId: string;
  expiresAt: string;
}

export type LivePromoResponse = ApiResponse<LivePromo>;

 