import React from 'react';
import LivePlayer from '../../components/live/LivePlayer';
import LiveChat from '../../components/live/LiveChat';
import { useLiveChat } from '../../hooks/useLiveChat';
import { useUserStore } from '../../hooks/useStore';
import ConfirmModal from '../../components/common/ConfirmModal';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import ChannelTabs, { ChannelOption } from '../../components/live/ChannelTabs';
import { liveApi } from '../../services/api';
import PurchaseModal from '../../components/live/PurchaseModal';
import PromoModal from '../../components/live/PromoModal';

// WebSocket 地址：优先使用 .env 原样值；未设置时走默认
const RAW_WS = (import.meta.env.VITE_LIVE_WS_URL || '').trim();
const SCHEME = location.protocol === 'https:' ? 'wss' : 'ws';
const CHAT_WS_URL = RAW_WS || (import.meta.env.DEV
  ? `${SCHEME}://127.0.0.1:8000/ws/live`
  : `${SCHEME}://${location.host}/python-api/ws/live`
);

type AccessState = Record<string, { checked: boolean; allowed: boolean; reason?: string; endAt?: string } | undefined>;

const LivePage: React.FC = () => {
  const userStore = useUserStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLoginConfirm, setShowLoginConfirm] = React.useState(false);
  const [showPurchase, setShowPurchase] = React.useState(false);
  const [showPromo, setShowPromo] = React.useState(false);

  // 频道状态
  const [channels, setChannels] = React.useState<ChannelOption[]>([]);
  const [activeChannel, setActiveChannel] = React.useState<ChannelOption | null>(null);
  const [access, setAccess] = React.useState<AccessState>({});

  // 从后端获取频道并根据 URL 初始化
  React.useEffect(() => {
    const init = async () => {
      try {
        const list = await liveApi.getChannels();
        // 仅保留包含有效播放地址的频道，并映射 teacherId
        const options: ChannelOption[] = (list || [])
          .filter((o: any) => o && typeof o.streamUrl === 'string' && o.streamUrl.trim().length > 0)
          .map((o: any) => ({ id: o.id, name: o.name, streamUrl: o.streamUrl, room: o.room, teacherId: o.teacherId }));
        setChannels(options);
        if (options.length > 0) {
          const params = new URLSearchParams(location.search);
          const idFromUrl = params.get('channel');
          const initial = options.find(o => o.id === idFromUrl) || options[0];
          setActiveChannel(initial);
          // 同步 URL（若没有）
          if (!idFromUrl) {
            params.set('channel', initial.id);
            navigate(`${location.pathname}?${params.toString()}`, { replace: true });
          }
        } else {
          // 无可用频道
          setActiveChannel(null);
        }
      } catch (e) {
        // 获取失败：不使用内置示例，显示“暂无直播”
        setChannels([]);
        setActiveChannel(null);
      }
    };
    init();
  }, []);

  // 聊天（根据房间切换）
  const chat = useLiveChat({ url: CHAT_WS_URL, autoConnect: true, room: 'global' });

  // 精确内容高度：窗口高度 - header - footer - 外边距
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [contentHeight, setContentHeight] = React.useState<number>(600);
  React.useEffect(() => {
    const compute = () => {
      const header = document.querySelector('header');
      const footer = document.querySelector('footer');
      const headerH = header ? (header as HTMLElement).offsetHeight : 0;
      const footerH = footer ? (footer as HTMLElement).offsetHeight : 0;
      const padding = 32 + 32; // 上下内边距估值
      const h = Math.max(360, window.innerHeight - headerH - footerH - padding);
      setContentHeight(h);
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  const handleSend = (content: string) => {
    if (!userStore.isLoggedIn) {
      setShowLoginConfirm(true);
      return;
    }
    chat.send(content);
  };

  const goLogin = () => {
    setShowLoginConfirm(false);
    const returnUrl = location.pathname + location.search;
    try { localStorage.setItem('returnUrl', returnUrl); } catch {}
    navigate(`${ROUTES.LOGIN}?returnUrl=${encodeURIComponent(returnUrl)}`);
  };

  const checkAndUpdateAccess = async (ch: ChannelOption) => {
    if (!ch.teacherId) {
      setAccess(prev => ({ ...prev, [ch.id]: { checked: true, allowed: true } }));
      return;
    }
    const result = await liveApi.checkAccess(ch.id);
    if (result) {
      setAccess(prev => ({ ...prev, [ch.id]: { checked: true, allowed: !!result.allowed, reason: result.reason, endAt: result.endAt } }));
    }
  };

  const handleChannelChange = async (ch: ChannelOption) => {
    // 切换频道并更新URL
    setActiveChannel(ch);
    const params = new URLSearchParams(location.search);
    params.set('channel', ch.id);
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });

    // 检查权限
    await checkAndUpdateAccess(ch);
  };

  // activeChannel 变化（包含浏览器返回后初次挂载）立即重检权限
  React.useEffect(() => {
    if (activeChannel) {
      checkAndUpdateAccess(activeChannel);
    }
  }, [activeChannel?.id]);

  // 页面显示/窗口聚焦与 URL 变化时，重检当前频道权限
  React.useEffect(() => {
    const recheck = () => {
      if (activeChannel) checkAndUpdateAccess(activeChannel);
    };
    window.addEventListener('focus', recheck);
    document.addEventListener('visibilitychange', recheck);
    return () => {
      window.removeEventListener('focus', recheck);
      document.removeEventListener('visibilitychange', recheck);
    };
  }, [activeChannel?.id]);

  React.useEffect(() => {
    // 监听 URL 中 channel 变化
    const params = new URLSearchParams(location.search);
    const idFromUrl = params.get('channel');
    if (idFromUrl && activeChannel && idFromUrl === activeChannel.id) {
      checkAndUpdateAccess(activeChannel);
    }
  }, [location.search]);

  const isBlocked = !!(activeChannel && access[activeChannel.id]?.checked && access[activeChannel.id]?.allowed === false);

  const onPurchaseSuccess = async () => {
    setShowPurchase(false);
    if (activeChannel) {
      await checkAndUpdateAccess(activeChannel);
    }
  };

  const overlay = isBlocked ? (
    <div className="px-5 py-4 rounded-xl bg-black/60 backdrop-blur-sm border border-white/10 text-white text-center max-w-md">
      <div className="text-base md:text-lg font-medium mb-2">暂无权限</div>
      <div className="text-xs md:text-sm text-white/80 mb-4">购买该老师课程或订阅后可观看本直播</div>
      <div className="flex items-center justify-center space-x-3">
        <button
          onClick={() => setShowPromo(true)}
          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xs md:text-sm"
        >联系销售</button>
        {/* <button
          onClick={() => navigate(ROUTES.ABOUT)}
          className="px-3 py-1.5 rounded-lg border border-white/20 hover:bg-white/10 text-white text-xs md:text-sm"
        >了解更多</button> */}
      </div>
    </div>
  ) : null;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 md:py-10" ref={containerRef}>
      <ChannelTabs
        channels={channels}
        activeId={activeChannel?.id || ''}
        onChange={handleChannelChange}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ minHeight: contentHeight }}>
        <div className="lg:col-span-2 h-full">
          <LivePlayer src={activeChannel?.streamUrl || ''} className="h-full min-h-[400px]" blocked={isBlocked} overlay={overlay} />
        </div>
        <div className="lg:col-span-1 h-full">
          <LiveChat
            messages={chat.messages.map(m => ({ id: m.id, user: m.user, content: m.content, createdAt: m.createdAt }))}
            onSend={handleSend}
          />
        </div>
      </div>

      <ConfirmModal
        isOpen={showLoginConfirm}
        onCancel={() => setShowLoginConfirm(false)}
        onConfirm={goLogin}
        title="需要登录"
        message="登录后才能发送评论，是否前往登录？"
        confirmText="登录"
        cancelText="取消"
        variant="info"
      />

      <PurchaseModal
        isOpen={showPurchase}
        onClose={() => setShowPurchase(false)}
        channelId={activeChannel?.id || ''}
        teacherName={activeChannel?.name}
        onSuccess={onPurchaseSuccess}
      />

      <PromoModal
        isOpen={showPromo}
        onClose={() => setShowPromo(false)}
        channelId={activeChannel?.id || ''}
      />
    </div>
  );
};

export default LivePage; 