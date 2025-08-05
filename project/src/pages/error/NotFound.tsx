import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { ROUTES } from '../../constants/routes';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center px-4">
      <div className="text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-9xl font-bold text-white opacity-20">404</h1>
          <h2 className="text-4xl font-bold text-white">页面未找到</h2>
          <p className="text-xl text-gray-300 max-w-md mx-auto">
            抱歉，您访问的页面不存在或已被移动
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Link
            to={ROUTES.HOME}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>返回首页</span>
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="flex items-center space-x-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回上页</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;