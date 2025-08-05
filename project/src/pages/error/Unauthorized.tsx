import React from 'react';
import { Link } from 'react-router-dom';
import { Home, LogIn } from 'lucide-react';
import { ROUTES } from '../../constants/routes';

const UnauthorizedPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-yellow-900 to-orange-900 flex items-center justify-center px-4">
      <div className="text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-9xl font-bold text-white opacity-20">401</h1>
          <h2 className="text-4xl font-bold text-white">未授权访问</h2>
          <p className="text-xl text-gray-300 max-w-md mx-auto">
            您没有权限访问此页面，请先登录
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Link
            to={ROUTES.LOGIN}
            className="flex items-center space-x-2 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
          >
            <LogIn className="w-4 h-4" />
            <span>立即登录</span>
          </Link>
          
          <Link
            to={ROUTES.HOME}
            className="flex items-center space-x-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>返回首页</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;