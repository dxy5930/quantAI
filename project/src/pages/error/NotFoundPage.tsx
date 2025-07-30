import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { ROUTES } from '../../constants/routes';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-blue-600 mb-4">404</h1>
          <h2 className="text-3xl font-bold text-white mb-4">页面未找到</h2>
          <p className="text-gray-400 text-lg mb-8">
            抱歉，您访问的页面不存在或已被移除。
          </p>
        </div>
        
        <div className="space-y-4">
          <Link
            to={ROUTES.HOME}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6 py-3 rounded-lg text-white font-medium transition-all"
          >
            <Home className="w-5 h-5" />
            <span>返回首页</span>
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="block w-full text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 inline mr-2" />
            返回上一页
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage; 