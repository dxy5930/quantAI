import React, { useState, useEffect } from 'react';
import { ArrowRight, MessageSquare, TrendingUp, AlertTriangle, HelpCircle, Sparkles } from 'lucide-react';
import './SuggestionOptions.css';

interface SuggestionOption {
  id: string;
  text: string;
  description?: string;
  category: 'followup' | 'analysis' | 'action' | 'question';
  content: string;
}

interface SuggestionOptionsProps {
  suggestions: SuggestionOption[];
  onSuggestionClick: (suggestion: SuggestionOption) => void;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'followup':
      return <MessageSquare className="w-4 h-4" />;
    case 'analysis':
      return <TrendingUp className="w-4 h-4" />;
    case 'action':
      return <AlertTriangle className="w-4 h-4" />;
    case 'question':
      return <HelpCircle className="w-4 h-4" />;
    default:
      return <MessageSquare className="w-4 h-4" />;
  }
};

const getCategoryStyle = (category: string) => {
  switch (category) {
    case 'followup':
      return {
        gradient: 'from-blue-500 to-blue-600',
        shadow: 'shadow-blue-500/20',
        glow: 'hover:shadow-blue-500/40'
      };
    case 'analysis':
      return {
        gradient: 'from-green-500 to-emerald-600',
        shadow: 'shadow-green-500/20',
        glow: 'hover:shadow-green-500/40'
      };
    case 'action':
      return {
        gradient: 'from-orange-500 to-red-500',
        shadow: 'shadow-orange-500/20',
        glow: 'hover:shadow-orange-500/40'
      };
    case 'question':
      return {
        gradient: 'from-purple-500 to-pink-600',
        shadow: 'shadow-purple-500/20',
        glow: 'hover:shadow-purple-500/40'
      };
    default:
      return {
        gradient: 'from-gray-500 to-gray-600',
        shadow: 'shadow-gray-500/20',
        glow: 'hover:shadow-gray-500/40'
      };
  }
};

export const SuggestionOptions: React.FC<SuggestionOptionsProps> = ({
  suggestions,
  onSuggestionClick
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [animatedItems, setAnimatedItems] = useState<number[]>([]);

  useEffect(() => {
    if (suggestions && suggestions.length > 0) {
      setIsVisible(true);
      // 逐个动画显示建议选项
      suggestions.forEach((_, index) => {
        setTimeout(() => {
          setAnimatedItems(prev => [...prev, index]);
        }, index * 150);
      });
    } else {
      setIsVisible(false);
      setAnimatedItems([]);
    }
  }, [suggestions]);

  if (!suggestions || suggestions.length === 0 || !isVisible) {
    return null;
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 z-50 pointer-events-none">
      {/* 背景模糊层 */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/50 to-transparent dark:from-slate-900/90 dark:via-slate-900/50 dark:to-transparent backdrop-blur-md" />
      
      {/* 主内容 */}
      <div className="relative px-4 py-6 pointer-events-auto">
        {/* 标题 */}
        <div className="flex items-center gap-2 mb-4 fade-in-up">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 shadow-lg">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 drop-shadow-sm">
            你可能还想了解
          </span>
        </div>

        {/* 建议按钮 */}
        <div className="flex flex-wrap gap-3 justify-center">
          {suggestions.map((suggestion, index) => {
            const style = getCategoryStyle(suggestion.category);
            const isAnimated = animatedItems.includes(index);
            
            return (
              <button
                key={suggestion.id}
                onClick={() => onSuggestionClick(suggestion)}
                className={`
                  group relative overflow-hidden
                  px-4 py-3 rounded-xl
                  bg-gradient-to-r ${style.gradient}
                  text-white font-medium text-sm
                  shadow-lg ${style.shadow}
                  hover:shadow-xl ${style.glow}
                  hover:scale-105 hover:-translate-y-1
                  transition-all duration-300 ease-out
                  transform ${
                    isAnimated 
                      ? 'translate-y-0 opacity-100' 
                      : 'translate-y-4 opacity-0'
                  }
                  cursor-pointer
                  backdrop-blur-sm
                  border border-white/30
                  min-w-0 max-w-xs
                  ${isAnimated ? 'slide-in-up' : ''}
                `}
                title={suggestion.description}
                style={{
                  transitionDelay: `${index * 100}ms`,
                  animationDelay: `${index * 100}ms`
                }}
              >
                {/* 背景光效 */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* 内容 */}
                <div className="relative flex items-center gap-2">
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-white/30 flex-shrink-0">
                    {getCategoryIcon(suggestion.category)}
                  </div>
                  <span className="font-medium truncate">{suggestion.text}</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200 flex-shrink-0" />
                </div>
                
                {/* 底部高光 */}
                <div className="absolute bottom-0 left-0 right-0 h-px bg-white/40" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SuggestionOptions;