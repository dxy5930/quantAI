import React, { useState, useRef, useEffect } from 'react';
import { ImageIcon } from 'lucide-react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: React.ReactNode;
  fallback?: React.ReactNode;
  threshold?: number;
  onLoad?: () => void;
  onError?: () => void;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  placeholder,
  fallback,
  threshold = 0.1,
  onLoad,
  onError,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 使用 Intersection Observer 检测图片是否进入视口
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  // 处理图片加载
  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setIsError(true);
    onError?.();
  };

  // 默认占位符
  const defaultPlaceholder = (
    <div className="flex items-center justify-center bg-gray-100 animate-pulse">
      <ImageIcon className="h-8 w-8 text-gray-400" />
    </div>
  );

  // 默认错误回退
  const defaultFallback = (
    <div className="flex items-center justify-center bg-gray-100">
      <ImageIcon className="h-8 w-8 text-gray-400" />
      <span className="ml-2 text-sm text-gray-500">加载失败</span>
    </div>
  );

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      {isInView && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          onLoad={handleLoad}
          onError={handleError}
          style={{ display: isError ? 'none' : 'block' }}
        />
      )}
      
      {/* 占位符或错误回退 */}
      {(!isInView || !isLoaded) && !isError && (
        <div className={`absolute inset-0 ${className}`}>
          {placeholder || defaultPlaceholder}
        </div>
      )}
      
      {isError && (
        <div className={`absolute inset-0 ${className}`}>
          {fallback || defaultFallback}
        </div>
      )}
    </div>
  );
};

// 带有渐进式加载的图片组件
export const ProgressiveImage: React.FC<LazyImageProps & {
  lowQualitySrc?: string;
}> = ({
  src,
  lowQualitySrc,
  alt,
  className = '',
  onLoad,
  onError,
  ...props
}) => {
  const [isHighQualityLoaded, setIsHighQualityLoaded] = useState(false);
  const [isLowQualityLoaded, setIsLowQualityLoaded] = useState(false);

  const handleHighQualityLoad = () => {
    setIsHighQualityLoaded(true);
    onLoad?.();
  };

  const handleLowQualityLoad = () => {
    setIsLowQualityLoaded(true);
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* 低质量图片 */}
      {lowQualitySrc && (
        <img
          src={lowQualitySrc}
          alt={alt}
          className={`absolute inset-0 w-full h-full object-cover filter blur-sm transition-opacity duration-300 ${
            isHighQualityLoaded ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={handleLowQualityLoad}
        />
      )}
      
      {/* 高质量图片 */}
      <LazyImage
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isHighQualityLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={handleHighQualityLoad}
        onError={onError}
        {...props}
      />
    </div>
  );
};