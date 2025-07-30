import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, LogIn, Home } from 'lucide-react';
import { ROUTES } from '../../constants/routes';

const UnauthorizedPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="mx-auto h-16 w-16 bg-red-600 rounded-full flex items-center justify-center mb-6">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-6xl font-bold text-red-600 mb-4">401</h1>
          <h2 className="text-3xl font-bold text-white mb-4">未授权访问</h2>
          <p className="text-gray-400 text-lg mb-8">
            您没有权限访问此页面，请先登录您的账户。
          </p>
        </div>
        
        <div className="space-y-4">
          <Link
            to={ROUTES.LOGIN}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6 py-3 rounded-lg text-white font-medium transition-all"
          >
            <LogIn className="w-5 h-5" />
            <span>立即登录</span>
          </Link>
          
          <Link
            to={ROUTES.HOME}
            className="block text-gray-400 hover:text-white transition-colors"
          >
            <Home className="w-4 h-4 inline mr-2" />
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage; 