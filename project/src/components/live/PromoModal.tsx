import React from 'react';
import { liveApi } from '../../services/api';
import type { LivePromo } from '../../services/api/types';

export interface PromoModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelId: string;
}

export const PromoModal: React.FC<PromoModalProps> = ({ isOpen, onClose, channelId }) => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [promo, setPromo] = React.useState<LivePromo | null>(null);

  React.useEffect(() => {
    const fetchPromo = async () => {
      if (!isOpen) return;
      setLoading(true);
      setError(null);
      try {
        const data = await liveApi.getPromo(channelId);
        setPromo(data);
      } catch (e: any) {
        setError(e?.message || '获取失败');
      } finally {
        setLoading(false);
      }
    };
    fetchPromo();
  }, [isOpen, channelId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-xl mx-4 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 p-5">
        <div className="text-lg font-semibold mb-3">{promo?.title || '订阅咨询'}</div>

        {error && <div className="text-sm text-red-600 mb-3">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div className="flex items-center justify-center">
            {promo?.qrUrl ? (
              <img src={promo.qrUrl} alt="二维码" className="w-60 h-60 rounded-lg border border-gray-200 dark:border-gray-700 bg-white" />
            ) : (
              <div className="w-60 h-60 rounded-lg border border-dashed flex items-center justify-center text-gray-500">{loading?'加载中…':'暂无二维码'}</div>
            )}
          </div>
          <div className="space-y-2 text-sm">
            <div className="text-gray-700 dark:text-gray-200">
              {promo?.description || '扫码加企微，获取订阅优惠与一对一顾问服务'}
            </div>
            <ul className="list-disc pl-5 text-gray-600 dark:text-gray-300">
              {(promo?.bulletPoints || []).map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
            {promo?.expiresAt && (
              <div className="text-xs text-gray-500">有效期至：{new Date(promo.expiresAt).toLocaleString()}</div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end mt-4">
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm">关闭</button>
        </div>
      </div>
    </div>
  );
};

export default PromoModal; 