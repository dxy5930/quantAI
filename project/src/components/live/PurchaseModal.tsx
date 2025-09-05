import React from 'react';
import { liveApi } from '../../services/api';

export interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelId: string;
  teacherName?: string;
  onSuccess?: () => void; // 支付成功回调
}

const currency = (cents: number) => `¥${(cents / 100).toFixed(2)}`;

export const PurchaseModal: React.FC<PurchaseModalProps> = ({ isOpen, onClose, channelId, teacherName, onSuccess }) => {
  const [duration, setDuration] = React.useState<'week' | 'month'>('week');
  const [payMethod, setPayMethod] = React.useState<'wechat' | 'alipay' | 'bankcard'>('wechat');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [orderId, setOrderId] = React.useState<string | null>(null);
  const [price, setPrice] = React.useState<number>(9900);
  const [paid, setPaid] = React.useState(false);
  const [expiresAt, setExpiresAt] = React.useState<string | null>(null);

  React.useEffect(() => {
    setPrice(duration === 'week' ? 9900 : 29900);
  }, [duration]);

  const createOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      const order = await liveApi.createOrder({ channelId, duration, payMethod });
      if (!order) throw new Error('下单失败');
      setOrderId(order.id);
    } catch (e: any) {
      setError(e?.message || '下单失败');
    } finally {
      setLoading(false);
    }
  };

  const pay = async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await liveApi.payOrder(orderId);
      if (!res?.paid) throw new Error('支付失败');
      setPaid(true);
      setExpiresAt(res.expiresAt || null);
      // 通知外层刷新权限
      onSuccess?.();
    } catch (e: any) {
      setError(e?.message || '支付失败');
    } finally {
      setLoading(false);
    }
  };

  const close = () => {
    setOrderId(null);
    setPaid(false);
    setExpiresAt(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={close} />
      <div className="relative w-full max-w-lg mx-4 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 p-5">
        <div className="text-lg font-semibold mb-3">购买订阅</div>

        <div className="space-y-3 mb-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-300">老师/频道</span>
            <span className="text-gray-900 dark:text-gray-100">{teacherName || channelId}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-300">订阅时长</span>
            <div className="flex items-center space-x-2">
              <button
                className={`px-2.5 py-1 rounded-md border text-xs ${duration==='week'?'bg-blue-600 text-white border-transparent':'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600'}`}
                onClick={() => setDuration('week')}
              >一周</button>
              <button
                className={`px-2.5 py-1 rounded-md border text-xs ${duration==='month'?'bg-blue-600 text-white border-transparent':'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600'}`}
                onClick={() => setDuration('month')}
              >一月</button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-300">支付方式</span>
            <select
              value={payMethod}
              onChange={e => setPayMethod(e.target.value as any)}
              className="px-2 py-1 rounded-md border bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600"
            >
              <option value="wechat">微信支付</option>
              <option value="alipay">支付宝</option>
              <option value="bankcard">银行卡</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-300">应付金额</span>
            <span className="text-gray-900 dark:text-gray-100 font-medium">{currency(price)}</span>
          </div>
        </div>

        {error && (
          <div className="mb-3 text-sm text-red-600">{error}</div>
        )}

        {!orderId && (
          <div className="flex items-center justify-end space-x-2">
            <button onClick={close} className="px-3 py-1.5 rounded-lg border text-sm">取消</button>
            <button onClick={createOrder} disabled={loading} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-60">{loading?'提交中…':'下单'}</button>
          </div>
        )}

        {!!orderId && !paid && (
          <div className="rounded-md border px-3 py-2 mb-3 text-xs text-gray-600 dark:text-gray-300">
            订单已创建：{orderId}，请点击“模拟支付”完成订阅。
          </div>
        )}

        {!!orderId && !paid && (
          <div className="flex items-center justify-end space-x-2">
            <button onClick={close} className="px-3 py-1.5 rounded-lg border text-sm">关闭</button>
            <button onClick={pay} disabled={loading} className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm disabled:opacity-60">{loading?'处理中…':'模拟支付'}</button>
          </div>
        )}

        {!!paid && (
          <div className="rounded-md border px-3 py-2 mt-2 text-sm text-green-700">
            支付成功，订阅已开通{expiresAt ? `（到期：${new Date(expiresAt).toLocaleString()}）` : ''}
          </div>
        )}

        {!!paid && (
          <div className="flex items-center justify-end mt-3">
            <button onClick={close} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm">我知道了</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseModal; 