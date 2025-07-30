import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';

interface LogoProps {
  variant?: 'header' | 'auth' | 'footer';
  showText?: boolean;
  className?: string;
}

// 完整版logo SVG组件
const FullLogo: React.FC<{ size: string }> = ({ size }) => (
  <svg className={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#3B82F6', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#8B5CF6', stopOpacity: 1 }} />
      </linearGradient>
      
      <linearGradient id="aiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#06B6D4', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#3B82F6', stopOpacity: 1 }} />
      </linearGradient>
      
      <linearGradient id="dataGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#F59E0B', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#EF4444', stopOpacity: 1 }} />
      </linearGradient>
      
      <filter id="glow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge> 
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    
    <circle cx="60" cy="60" r="55" fill="url(#bgGradient)" opacity="0.95"/>
    
    {/* AI神经网络节点 - 添加脉动动画 */}
    <g id="aiNodes" fill="url(#aiGradient)" opacity="0.8">
      {/* 输入层 */}
      <circle cx="25" cy="35" r="3" filter="url(#glow)">
        <animate attributeName="r" values="3;3.5;3" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="25" cy="50" r="3" filter="url(#glow)">
        <animate attributeName="r" values="3;3.5;3" dur="2s" begin="0.5s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" begin="0.5s" repeatCount="indefinite"/>
      </circle>
      <circle cx="25" cy="65" r="3" filter="url(#glow)">
        <animate attributeName="r" values="3;3.5;3" dur="2s" begin="1s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" begin="1s" repeatCount="indefinite"/>
      </circle>
      <circle cx="25" cy="80" r="3" filter="url(#glow)">
        <animate attributeName="r" values="3;3.5;3" dur="2s" begin="1.5s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" begin="1.5s" repeatCount="indefinite"/>
      </circle>
      
      {/* 隐藏层 */}
      <circle cx="45" cy="30" r="4" filter="url(#glow)">
        <animate attributeName="r" values="4;4.5;4" dur="2.5s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.8;1;0.8" dur="2.5s" repeatCount="indefinite"/>
      </circle>
      <circle cx="45" cy="50" r="4" filter="url(#glow)">
        <animate attributeName="r" values="4;4.5;4" dur="2.5s" begin="0.6s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.8;1;0.8" dur="2.5s" begin="0.6s" repeatCount="indefinite"/>
      </circle>
      <circle cx="45" cy="70" r="4" filter="url(#glow)">
        <animate attributeName="r" values="4;4.5;4" dur="2.5s" begin="1.2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.8;1;0.8" dur="2.5s" begin="1.2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="45" cy="90" r="4" filter="url(#glow)">
        <animate attributeName="r" values="4;4.5;4" dur="2.5s" begin="1.8s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.8;1;0.8" dur="2.5s" begin="1.8s" repeatCount="indefinite"/>
      </circle>
      
      {/* 输出层 */}
      <circle cx="75" cy="40" r="3" filter="url(#glow)">
        <animate attributeName="r" values="3;3.5;3" dur="2s" begin="0.3s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" begin="0.3s" repeatCount="indefinite"/>
      </circle>
      <circle cx="75" cy="60" r="3" filter="url(#glow)">
        <animate attributeName="r" values="3;3.5;3" dur="2s" begin="0.9s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" begin="0.9s" repeatCount="indefinite"/>
      </circle>
      <circle cx="75" cy="80" r="3" filter="url(#glow)">
        <animate attributeName="r" values="3;3.5;3" dur="2s" begin="1.5s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" begin="1.5s" repeatCount="indefinite"/>
      </circle>
    </g>
    
    {/* AI神经网络连接线 - 添加流动动画 */}
    <g id="aiConnections" stroke="url(#aiGradient)" strokeWidth="1" opacity="0.6">
      {/* 输入层到隐藏层 */}
      <line x1="28" y1="35" x2="42" y2="30">
        <animate attributeName="stroke-width" values="1;1.5;1" dur="3s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.6;0.9;0.6" dur="3s" repeatCount="indefinite"/>
      </line>
      <line x1="28" y1="35" x2="42" y2="50">
        <animate attributeName="stroke-width" values="1;1.5;1" dur="3s" begin="0.5s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.6;0.9;0.6" dur="3s" begin="0.5s" repeatCount="indefinite"/>
      </line>
      <line x1="28" y1="50" x2="42" y2="30">
        <animate attributeName="stroke-width" values="1;1.5;1" dur="3s" begin="1s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.6;0.9;0.6" dur="3s" begin="1s" repeatCount="indefinite"/>
      </line>
      <line x1="28" y1="50" x2="42" y2="50">
        <animate attributeName="stroke-width" values="1;1.5;1" dur="3s" begin="1.5s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.6;0.9;0.6" dur="3s" begin="1.5s" repeatCount="indefinite"/>
      </line>
      <line x1="28" y1="50" x2="42" y2="70">
        <animate attributeName="stroke-width" values="1;1.5;1" dur="3s" begin="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.6;0.9;0.6" dur="3s" begin="2s" repeatCount="indefinite"/>
      </line>
      <line x1="28" y1="65" x2="42" y2="50">
        <animate attributeName="stroke-width" values="1;1.5;1" dur="3s" begin="2.5s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.6;0.9;0.6" dur="3s" begin="2.5s" repeatCount="indefinite"/>
      </line>
      <line x1="28" y1="65" x2="42" y2="70">
        <animate attributeName="stroke-width" values="1;1.5;1" dur="3s" begin="0.2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.6;0.9;0.6" dur="3s" begin="0.2s" repeatCount="indefinite"/>
      </line>
      <line x1="28" y1="80" x2="42" y2="70">
        <animate attributeName="stroke-width" values="1;1.5;1" dur="3s" begin="0.8s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.6;0.9;0.6" dur="3s" begin="0.8s" repeatCount="indefinite"/>
      </line>
      <line x1="28" y1="80" x2="42" y2="90">
        <animate attributeName="stroke-width" values="1;1.5;1" dur="3s" begin="1.3s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.6;0.9;0.6" dur="3s" begin="1.3s" repeatCount="indefinite"/>
      </line>
      
      {/* 隐藏层到输出层 */}
      <line x1="48" y1="30" x2="72" y2="40">
        <animate attributeName="stroke-width" values="1;1.5;1" dur="3s" begin="0.4s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.6;0.9;0.6" dur="3s" begin="0.4s" repeatCount="indefinite"/>
      </line>
      <line x1="48" y1="50" x2="72" y2="40">
        <animate attributeName="stroke-width" values="1;1.5;1" dur="3s" begin="1.1s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.6;0.9;0.6" dur="3s" begin="1.1s" repeatCount="indefinite"/>
      </line>
      <line x1="48" y1="50" x2="72" y2="60">
        <animate attributeName="stroke-width" values="1;1.5;1" dur="3s" begin="1.7s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.6;0.9;0.6" dur="3s" begin="1.7s" repeatCount="indefinite"/>
      </line>
      <line x1="48" y1="70" x2="72" y2="60">
        <animate attributeName="stroke-width" values="1;1.5;1" dur="3s" begin="2.3s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.6;0.9;0.6" dur="3s" begin="2.3s" repeatCount="indefinite"/>
      </line>
      <line x1="48" y1="70" x2="72" y2="80">
        <animate attributeName="stroke-width" values="1;1.5;1" dur="3s" begin="0.6s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.6;0.9;0.6" dur="3s" begin="0.6s" repeatCount="indefinite"/>
      </line>
      <line x1="48" y1="90" x2="72" y2="80">
        <animate attributeName="stroke-width" values="1;1.5;1" dur="3s" begin="1.4s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.6;0.9;0.6" dur="3s" begin="1.4s" repeatCount="indefinite"/>
      </line>
    </g>
    
    {/* 量化K线图表 */}
    <g id="quantChart" stroke="white" strokeWidth="2" fill="none" opacity="0.9">
      <rect x="82" y="25" width="3" height="15" fill="url(#dataGradient)"/>
      <rect x="87" y="30" width="3" height="20" fill="url(#dataGradient)"/>
      <rect x="92" y="20" width="3" height="25" fill="url(#dataGradient)"/>
      <rect x="97" y="35" width="3" height="10" fill="url(#dataGradient)"/>
      <path d="M 82 40 Q 90 25 97 35" stroke="white" strokeWidth="2" fill="none" opacity="0.8"/>
    </g>
    
    {/* 数据流动效果 */}
    <g id="dataFlow" opacity="0.7">
      <circle cx="35" cy="25" r="1.5" fill="#22D3EE">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="55" cy="35" r="1.5" fill="#22D3EE">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" begin="0.5s" repeatCount="indefinite"/>
      </circle>
      <circle cx="85" cy="45" r="1.5" fill="#22D3EE">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" begin="1s" repeatCount="indefinite"/>
      </circle>
    </g>
    
    {/* 抽象AI标识 */}
    <g id="abstractAI" transform="translate(60, 60)">
      <path d="M -12 8 L -8 -8 L -4 -8 L 0 8 L -4 8 L -6 2 L -10 2 Z" fill="white" opacity="0.95">
        <animate attributeName="opacity" values="0.8;1;0.8" dur="3s" repeatCount="indefinite"/>
      </path>
      
      <g transform="translate(8, 0)">
        <path d="M -2 -8 L 2 -8 L 3 -6 L 3 6 L 2 8 L -2 8 L -3 6 L -3 -6 Z" fill="white" opacity="0.95">
          <animate attributeName="opacity" values="0.8;1;0.8" dur="3s" begin="0.5s" repeatCount="indefinite"/>
        </path>
        <circle cx="0" cy="-4" r="1" fill="url(#aiGradient)" opacity="0.8"/>
        <circle cx="0" cy="0" r="1" fill="url(#aiGradient)" opacity="0.8"/>
        <circle cx="0" cy="4" r="1" fill="url(#aiGradient)" opacity="0.8"/>
      </g>
      
      <path d="M -6 0 L 6 0" stroke="url(#aiGradient)" strokeWidth="1" opacity="0.6">
        <animate attributeName="stroke-width" values="1;2;1" dur="2s" repeatCount="indefinite"/>
      </path>
      
      <g transform="translate(0, 18)">
        <text x="0" y="0" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="8" fill="white" opacity="0.7">QuantAI Pro</text>
      </g>
    </g>
    
    {/* 外围装饰圆环 */}
    <circle cx="60" cy="60" r="50" fill="none" stroke="white" strokeWidth="1" opacity="0.3" strokeDasharray="5,5">
      <animateTransform attributeName="transform" type="rotate" values="0 60 60;360 60 60" dur="20s" repeatCount="indefinite"/>
    </circle>
    
    {/* 内部装饰圆环 */}
    <circle cx="60" cy="60" r="45" fill="none" stroke="url(#aiGradient)" strokeWidth="0.5" opacity="0.5" strokeDasharray="3,3">
      <animateTransform attributeName="transform" type="rotate" values="360 60 60;0 60 60" dur="15s" repeatCount="indefinite"/>
    </circle>
  </svg>
);

// 简化版logo SVG组件
const SimpleLogo: React.FC<{ size: string }> = ({ size }) => (
  <svg className={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="mainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#3B82F6', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#8B5CF6', stopOpacity: 1 }} />
      </linearGradient>
      
      <linearGradient id="aiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#06B6D4', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#3B82F6', stopOpacity: 1 }} />
      </linearGradient>
      
      <filter id="glow">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge> 
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    
    <circle cx="32" cy="32" r="30" fill="url(#mainGradient)" opacity="0.95"/>
    
    {/* AI神经网络简化版 - 添加脉动动画 */}
    <g opacity="0.8">
      {/* 节点 */}
      <circle cx="15" cy="20" r="2" fill="url(#aiGradient)" filter="url(#glow)">
        <animate attributeName="r" values="2;2.5;2" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="15" cy="32" r="2" fill="url(#aiGradient)" filter="url(#glow)">
        <animate attributeName="r" values="2;2.5;2" dur="2s" begin="0.7s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" begin="0.7s" repeatCount="indefinite"/>
      </circle>
      <circle cx="15" cy="44" r="2" fill="url(#aiGradient)" filter="url(#glow)">
        <animate attributeName="r" values="2;2.5;2" dur="2s" begin="1.4s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" begin="1.4s" repeatCount="indefinite"/>
      </circle>
      
      <circle cx="32" cy="15" r="2.5" fill="url(#aiGradient)" filter="url(#glow)">
        <animate attributeName="r" values="2.5;3;2.5" dur="2.5s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.8;1;0.8" dur="2.5s" repeatCount="indefinite"/>
      </circle>
      <circle cx="32" cy="32" r="2.5" fill="url(#aiGradient)" filter="url(#glow)">
        <animate attributeName="r" values="2.5;3;2.5" dur="2.5s" begin="0.8s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.8;1;0.8" dur="2.5s" begin="0.8s" repeatCount="indefinite"/>
      </circle>
      <circle cx="32" cy="49" r="2.5" fill="url(#aiGradient)" filter="url(#glow)">
        <animate attributeName="r" values="2.5;3;2.5" dur="2.5s" begin="1.6s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.8;1;0.8" dur="2.5s" begin="1.6s" repeatCount="indefinite"/>
      </circle>
      
      <circle cx="49" cy="25" r="2" fill="url(#aiGradient)" filter="url(#glow)">
        <animate attributeName="r" values="2;2.5;2" dur="2s" begin="0.5s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" begin="0.5s" repeatCount="indefinite"/>
      </circle>
      <circle cx="49" cy="39" r="2" fill="url(#aiGradient)" filter="url(#glow)">
        <animate attributeName="r" values="2;2.5;2" dur="2s" begin="1.2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" begin="1.2s" repeatCount="indefinite"/>
      </circle>
      
      {/* 连接线 - 添加流动动画 */}
      <g stroke="url(#aiGradient)" strokeWidth="1" opacity="0.6">
        <line x1="17" y1="20" x2="30" y2="15">
          <animate attributeName="stroke-width" values="1;1.5;1" dur="3s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.6;0.9;0.6" dur="3s" repeatCount="indefinite"/>
        </line>
        <line x1="17" y1="32" x2="30" y2="32">
          <animate attributeName="stroke-width" values="1;1.5;1" dur="3s" begin="0.6s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.6;0.9;0.6" dur="3s" begin="0.6s" repeatCount="indefinite"/>
        </line>
        <line x1="17" y1="44" x2="30" y2="49">
          <animate attributeName="stroke-width" values="1;1.5;1" dur="3s" begin="1.2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.6;0.9;0.6" dur="3s" begin="1.2s" repeatCount="indefinite"/>
        </line>
        <line x1="34" y1="15" x2="47" y2="25">
          <animate attributeName="stroke-width" values="1;1.5;1" dur="3s" begin="1.8s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.6;0.9;0.6" dur="3s" begin="1.8s" repeatCount="indefinite"/>
        </line>
        <line x1="34" y1="49" x2="47" y2="39">
          <animate attributeName="stroke-width" values="1;1.5;1" dur="3s" begin="2.4s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.6;0.9;0.6" dur="3s" begin="2.4s" repeatCount="indefinite"/>
        </line>
      </g>
    </g>
    
    {/* 量化图表 */}
    <g opacity="0.9">
      <rect x="52" y="12" width="2" height="8" fill="#F59E0B"/>
      <rect x="55" y="15" width="2" height="6" fill="#EF4444"/>
      <rect x="58" y="10" width="2" height="10" fill="#F59E0B"/>
    </g>
    
    {/* 抽象AI标识 */}
    <g transform="translate(32, 32)">
      <path d="M -6 4 L -4 -4 L -2 -4 L 0 4 L -2 4 L -3 1 L -5 1 Z" fill="white" opacity="0.95"/>
      
      <g transform="translate(4, 0)">
        <path d="M -1 -4 L 1 -4 L 1.5 -3 L 1.5 3 L 1 4 L -1 4 L -1.5 3 L -1.5 -3 Z" fill="white" opacity="0.95"/>
        <circle cx="0" cy="-2" r="0.5" fill="url(#aiGradient)" opacity="0.8"/>
        <circle cx="0" cy="0" r="0.5" fill="url(#aiGradient)" opacity="0.8"/>
        <circle cx="0" cy="2" r="0.5" fill="url(#aiGradient)" opacity="0.8"/>
      </g>
      
      <path d="M -3 0 L 3 0" stroke="url(#aiGradient)" strokeWidth="0.5" opacity="0.6"/>
    </g>
    
    {/* 装饰圆环 */}
    <circle cx="32" cy="32" r="28" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3" strokeDasharray="3,3">
      <animateTransform attributeName="transform" type="rotate" values="0 32 32;360 32 32" dur="15s" repeatCount="indefinite"/>
    </circle>
  </svg>
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
        QuantAI Pro
      </h1>
      {variant !== 'footer' && (
        <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
          智能策略回测系统
        </p>
      )}
    </div>
  );

  return (
    <Link to={ROUTES.HOME} className={`flex items-center space-x-3 group ${className}`}>
      <LogoIcon />
      <LogoText />
    </Link>
  );
}; 