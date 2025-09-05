import React, { useEffect, useRef, useState } from 'react';

// 轻量封装直播播放器，默认支持 HLS（m3u8）；其他协议走 <video> 原生能力
export interface LivePlayerProps {
  src: string; // 拉流地址（HLS m3u8）
  poster?: string;
  muted?: boolean;
  autoPlay?: boolean;
  controls?: boolean;
  className?: string;
  blocked?: boolean; // 是否被权限阻止（展示覆盖层，不加载流）
  overlay?: React.ReactNode; // 自定义覆盖层内容
}

export const LivePlayer: React.FC<LivePlayerProps> = ({
  src,
  poster,
  muted = true,
  autoPlay = true,
  controls = true,
  className = '',
  blocked = false,
  overlay,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('暂无直播');
  const playingRef = useRef<boolean>(false);

  useEffect(() => {
    // 被阻止时不加载视频
    if (blocked) {
      setLoading(false);
      setError(false);
      playingRef.current = false;
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    // 初始状态
    setError(!src);
    setErrorMessage('暂无直播');
    setLoading(!!src);
    playingRef.current = false;
    if (!src) return;

    // 动态加载 hls.js，避免打包体积
    let hls: any = null;
    let cleanupVideoEvents: (() => void) | null = null;

    const hideLoading = () => setLoading(false);
    const showLoadingIfPlaying = () => {
      if (playingRef.current) setLoading(true);
    };

    const setup = async () => {
      const isHls = src.endsWith('.m3u8') || src.includes('.m3u8');
      if (!isHls) {
        video.src = src;
        const onLoadedMeta = hideLoading;
        const onLoadedData = hideLoading;
        const onCanPlay = hideLoading;
        const onPlaying = () => { playingRef.current = true; hideLoading(); };
        const onPlay = () => { playingRef.current = true; hideLoading(); };
        const onPause = () => { playingRef.current = false; hideLoading(); };
        const onTimeUpdate = hideLoading;
        const onWaiting = showLoadingIfPlaying;
        const onStalled = showLoadingIfPlaying;
        const onError = () => { setError(true); hideLoading(); };

        video.addEventListener('loadedmetadata', onLoadedMeta);
        video.addEventListener('loadeddata', onLoadedData);
        video.addEventListener('canplay', onCanPlay);
        video.addEventListener('playing', onPlaying);
        video.addEventListener('play', onPlay);
        video.addEventListener('pause', onPause);
        video.addEventListener('timeupdate', onTimeUpdate);
        video.addEventListener('waiting', onWaiting);
        video.addEventListener('stalled', onStalled);
        video.addEventListener('error', onError);

        cleanupVideoEvents = () => {
          video.removeEventListener('loadedmetadata', onLoadedMeta);
          video.removeEventListener('loadeddata', onLoadedData);
          video.removeEventListener('canplay', onCanPlay);
          video.removeEventListener('playing', onPlaying);
          video.removeEventListener('play', onPlay);
          video.removeEventListener('pause', onPause);
          video.removeEventListener('timeupdate', onTimeUpdate);
          video.removeEventListener('waiting', onWaiting);
          video.removeEventListener('stalled', onStalled);
          video.removeEventListener('error', onError);
        };

        try { await video.play(); } catch {}
        return;
      }

      const HlsModule = await import('hls.js').catch(() => null);
      const Hls = HlsModule?.default;
      if (Hls && Hls.isSupported()) {
        hls = new Hls({ enableWorker: true });
        hls.attachMedia(video);
        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          hls.loadSource(src);
        });
        // 只要清单或分片任何一个加载成功，就关闭 loading
        hls.on(Hls.Events.MANIFEST_LOADED, hideLoading);
        hls.on(Hls.Events.MANIFEST_PARSED, hideLoading);
        hls.on(Hls.Events.LEVEL_LOADED, hideLoading);
        hls.on(Hls.Events.FRAG_LOADED, hideLoading);
        hls.on(Hls.Events.FRAG_BUFFERED, hideLoading);
        hls.on(Hls.Events.ERROR, (_evt: any, data: any) => {
          const isFatal = data?.fatal === true;
          const status = data?.response?.code || data?.response?.status;
          if (status === 404) {
            setError(true);
            hideLoading();
            setErrorMessage('直播地址不存在 (404)');
            return;
          }
          if (isFatal) {
            setError(true);
            hideLoading();
            setErrorMessage('直播播放失败');
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
      } else {
        // 回退：直接赋值，可能不支持
        video.src = src;
      }

      const onLoadedMeta = hideLoading;
      const onLoadedData = hideLoading;
      const onCanPlay = hideLoading;
      const onPlaying = () => { playingRef.current = true; hideLoading(); };
      const onPlay = () => { playingRef.current = true; hideLoading(); };
      const onPause = () => { playingRef.current = false; hideLoading(); };
      const onTimeUpdate = hideLoading;
      const onWaiting = showLoadingIfPlaying;
      const onStalled = showLoadingIfPlaying;
      const onError = () => { setError(true); hideLoading(); };

      video.addEventListener('loadedmetadata', onLoadedMeta);
      video.addEventListener('loadeddata', onLoadedData);
      video.addEventListener('canplay', onCanPlay);
      video.addEventListener('playing', onPlaying);
      video.addEventListener('play', onPlay);
      video.addEventListener('pause', onPause);
      video.addEventListener('timeupdate', onTimeUpdate);
      video.addEventListener('waiting', onWaiting);
      video.addEventListener('stalled', onStalled);
      video.addEventListener('error', onError);

      cleanupVideoEvents = () => {
        video.removeEventListener('loadedmetadata', onLoadedMeta);
        video.removeEventListener('loadeddata', onLoadedData);
        video.removeEventListener('canplay', onCanPlay);
        video.removeEventListener('playing', onPlaying);
        video.removeEventListener('play', onPlay);
        video.removeEventListener('pause', onPause);
        video.removeEventListener('timeupdate', onTimeUpdate);
        video.removeEventListener('waiting', onWaiting);
        video.removeEventListener('stalled', onStalled);
        video.removeEventListener('error', onError);
      };
    };

    const cleanup = () => {
      cleanupVideoEvents?.();
      if (hls) {
        try { hls.destroy(); } catch {}
        hls = null;
      }
    };

    setup();
    return cleanup;
  }, [src, blocked]);

  return (
    <div className={`w-full h-full bg-black rounded-xl overflow-hidden relative ${className}`}>
      {!blocked && (
        <video
          ref={videoRef}
          poster={poster}
          muted={muted}
          autoPlay={autoPlay}
          controls={controls}
          playsInline
          preload="auto"
          className="w-full h-full object-contain bg-black"
        />
      )}

      {overlay && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          {overlay}
        </div>
      )}

      {!blocked && loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="px-4 py-2 rounded-xl bg-black/50 backdrop-blur-sm border border-white/10 text-white text-sm flex items-center space-x-2">
            <span className="inline-block h-4 w-4 rounded-full border-2 border-white/60 border-t-transparent animate-spin"></span>
            <span>加载中…</span>
          </div>
        </div>
      )}

      {!blocked && error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="px-4 py-3 rounded-xl bg-black/50 backdrop-blur-sm border border-white/10 text-white text-sm md:text-base">
            {errorMessage}
          </div>
        </div>
      )}
    </div>
  );
};

export default LivePlayer; 