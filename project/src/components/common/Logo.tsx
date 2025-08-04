import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';

interface LogoProps {
  variant?: 'header' | 'auth' | 'footer';
  showText?: boolean;
  className?: string;
}

// 完整版logo - 使用FindValue.png图片
const FullLogo: React.FC<{ size: string }> = ({ size }) => (
  <img 
    src="/src/assets/FindValue.png" 
    alt="FindValue Logo" 
    className={`${size} object-contain`}
  />
);

// 简化版logo - 也使用FindValue.png图片
const SimpleLogo: React.FC<{ size: string }> = ({ size }) => (
  <img 
    src="/src/assets/FindValue.png" 
    alt="FindValue Logo" 
    className={`${size} object-contain`}
  />
);

export const Logo: React.FC<LogoProps> = ({ 
  variant = 'header', 
  showText = true, 
  className = '' 
}) => {
  const getSize = () => {
    switch (variant) {
      case 'auth':
        return 'w-16 h-16';
      case 'footer':
        return 'w-10 h-10';
      default:
        return 'w-12 h-12';
    }
  };

  const getTextSize = () => {
    switch (variant) {
      case 'auth':
        return 'text-2xl';
      case 'footer':
        return 'text-lg';
      default:
        return 'text-xl';
    }
  };

  const LogoIcon = () => (
    <div className={`${getSize()} group-hover:scale-105 transition-all duration-300 flex items-center justify-center relative`}>
      {variant === 'auth' ? (
        <FullLogo size="w-full h-full" />
      ) : (
        <SimpleLogo size="w-full h-full" />
      )}
    </div>
  );

  const LogoText = () => showText && (
    <div className="flex flex-col">
      <h1 className={`${getTextSize()} font-bold text-gray-900 dark:text-white group-hover:text-gradient transition-all duration-300`}>
        FindValue
      </h1>
      {variant !== 'footer' && (
        <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
          Find your edge. Find your alpha.
        </p>
      )}
    </div>
  );

  return (
    <Link to={ROUTES.AI_WORKFLOW} className={`flex items-center space-x-3 group ${className}`}>
      <LogoIcon />
      <LogoText />
    </Link>
  );
}; 