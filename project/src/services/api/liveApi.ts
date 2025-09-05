import { httpClient } from '../../utils/httpClient';
import { LiveChannel, LiveAccessCheckResult, LiveOrderSummary, PayResult, LivePromo } from './types';

export const liveApi = {
  async getChannels(): Promise<LiveChannel[]> {
    // 真实后端路径：python 服务下的直播频道列表
    const resp = await httpClient.get<LiveChannel[]>('/api/live/channels');
    if ((resp as any)?.success) {
      return ((resp as any).data as LiveChannel[]) || [];
    }
    return [];
  },

  async checkAccess(channelId: string): Promise<LiveAccessCheckResult | null> {
    const resp = await httpClient.post<LiveAccessCheckResult>('/api/live/check-access', { channelId });
    if ((resp as any)?.success) {
      return ((resp as any).data as LiveAccessCheckResult) || null;
    }
    return null;
  },

  async createOrder(params: { channelId: string; duration: 'week' | 'month'; payMethod: 'wechat' | 'alipay' | 'bankcard' }): Promise<LiveOrderSummary | null> {
    const resp = await httpClient.post<LiveOrderSummary>('/api/live/orders/create', params);
    if ((resp as any)?.success) {
      return ((resp as any).data as LiveOrderSummary) || null;
    }
    return null;
  },

  async payOrder(orderId: string): Promise<PayResult | null> {
    const resp = await httpClient.post<PayResult>('/api/live/orders/pay', { orderId });
    if ((resp as any)?.success) {
      return ((resp as any).data as PayResult) || null;
    }
    return null;
  },

  async getPromo(channelId: string): Promise<LivePromo | null> {
    const resp = await httpClient.post<LivePromo>('/api/live/promo', { channelId });
    if ((resp as any)?.success) {
      return ((resp as any).data as LivePromo) || null;
    }
    return null;
  }
};

export default liveApi; 