import React, { useEffect } from 'react';
import { Brain } from 'lucide-react';

interface AIAnalysisLoaderProps {
  isVisible: boolean;
  onComplete?: () => void;
  isApiComplete?: boolean; // 新增：API是否完成的标志
  title?: string; // 自定义标题
  description?: string; // 自定义描述
}

const AIAnalysisLoader: React.FC<AIAnalysisLoaderProps> = ({ 
  isVisible, 
  onComplete,
  isApiComplete = false,
  title = "AI 正在分析",
  description = "请耐心等待分析结果..."
}) => {
  // 监听API完成状态 - 直接关闭动画
  useEffect(() => {
    if (isApiComplete && isVisible) {
      // API完成后稍微延迟一下再关闭，让用户看到完成状态
      setTimeout(() => {
        onComplete?.();
      }, 500);
    }
  }, [isApiComplete, isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6">
      {/* AI大脑动画 */}
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full bg-blue-500/10 flex items-center justify-center relative overflow-hidden">
          {/* 脉冲圆环 */}
          <div className="absolute inset-0 rounded-full border-2 border-blue-500 opacity-20 animate-ping"></div>
          <div className="absolute inset-2 rounded-full border border-blue-500 opacity-40 animate-pulse"></div>
          
          {/* 中心图标 */}
          <Brain className="w-10 h-10 text-blue-500 animate-pulse" />
          
          {/* 旋转扫描线 */}
          <div className="absolute inset-0 rounded-full">
            <div 
              className="absolute top-0 left-1/2 w-0.5 h-1/2 bg-gradient-to-t from-blue-500 to-transparent transform -translate-x-0.5 origin-bottom animate-spin"
              style={{ animationDuration: '2s' }}
            />
          </div>
        </div>

        {/* 外圈进度环 */}
        <svg className="absolute inset-0 w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="2"
            fill="transparent"
            className="text-gray-200 dark:text-gray-700"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="2"
            fill="transparent"
            className="text-blue-500"
            strokeDasharray={`${2 * Math.PI * 45}`}
            strokeDashoffset={`${2 * Math.PI * 45 * 0.25}`}
            strokeLinecap="round"
            style={{ 
              animation: 'spin 3s linear infinite',
              transformOrigin: 'center'
            }}
          />
        </svg>
      </div>

      {/* 背景粒子效果 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-blue-500 rounded-full opacity-30 animate-ping"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* 分析状态文案 */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {description}
        </p>
      </div>
    </div>
  );
};

export default AIAnalysisLoader;