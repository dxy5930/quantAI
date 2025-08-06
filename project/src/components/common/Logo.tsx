import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';

interface LogoProps {
  variant?: 'header' | 'auth' | 'footer';
  showText?: boolean;
  className?: string;
}

// 使用React.memo优化图片组件，避免不必要的重新渲染
const FullLogo = React.memo<{ size: string }>(({ size }) => (
  <img 
    src="/src/assets/FindValue.png" 
    alt="FindValue Logo" 
    className={`${size} object-contain`}
    loading="lazy"
    style={{ imageRendering: 'auto' }}
  />
));

// 简化版logo - 也使用React.memo优化
const SimpleLogo = React.memo<{ size: string }>(({ size }) => (
  <img 
    src="/src/assets/FindValue.png" 
    alt="FindValue Logo" 
    className={`${size} object-contain`}
    loading="lazy"
    style={{ imageRendering: 'auto' }}
  />
));

export const Logo: React.FC<LogoProps> = React.memo(({ 
  variant = 'header', 
  showText = true, 
  className = '' 
}) => {
  const getSize = React.useMemo(() => {
    switch (variant) {
      case 'auth':
        return 'w-16 h-16';
      case 'footer':
        return 'w-10 h-10';
      default:
        return 'w-12 h-12';
    }
  }, [variant]);

  const getTextSize = React.useMemo(() => {
    switch (variant) {
      case 'auth':
        return 'text-2xl';
      case 'footer':
        return 'text-lg';
      default:
        return 'text-xl';
    }
  }, [variant]);

  const LogoIcon = React.useMemo(() => (
    <div className={`${getSize} group-hover:scale-105 transition-all duration-300 flex items-center justify-center relative`}>
      {variant === 'auth' ? (
        <FullLogo size="w-full h-full" />
      ) : (
        <SimpleLogo size="w-full h-full" />
      )}
    </div>
  ), [variant, getSize]);

  const LogoText = React.useMemo(() => showText && (
    <div className="flex flex-col">
      <h1 className={`${getTextSize} font-bold text-gray-900 dark:text-white group-hover:text-gradient transition-all duration-300`}>
        FindValue
      </h1>
      {variant !== 'footer' && (
        <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
          Find your edge. Find your alpha.
        </p>
      )}
    </div>
  ), [variant, showText, getTextSize]);

  return (
    <Link to={ROUTES.HOME} className={`flex items-center space-x-3 group ${className}`}>
      {LogoIcon}
      {LogoText}
    </Link>
  );
});

Logo.displayName = 'Logo';
FullLogo.displayName = 'FullLogo';
SimpleLogo.displayName = 'SimpleLogo'; 