import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, DollarSign } from 'lucide-react';
import { Logo } from '../common/Logo';
import { ROUTES } from '../../constants/routes';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center justify-center space-y-6">
          {/* Logo */}
          <div className="flex items-center">
            <Logo variant="footer" />
          </div>
          
          {/* 链接区域 */}
          <div className="flex items-center space-x-6">
            <Link
              to={ROUTES.PRICING}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300 group"
            >
              <DollarSign className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
              <span>定价方案</span>
            </Link>
            <Link
              to={ROUTES.FEEDBACK}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300 group"
            >
              <MessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
              <span>意见反馈</span>
            </Link>
          </div>
          
          {/* 版权信息 */}
          <div className="text-center text-sm text-gray-500 dark:text-gray-500">
            <p>&copy; 2024 FindValue. 专业的量化交易策略平台</p>
          </div>
        </div>
      </div>
    </footer>
  );
}; 