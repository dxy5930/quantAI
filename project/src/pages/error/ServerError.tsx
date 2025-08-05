import React from 'react';
import { Link } from 'react-router-dom';
import { Home, RefreshCw } from 'lucide-react';
import { ROUTES } from '../../constants/routes';

const ServerErrorPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-purple-900 flex items-center justify-center px-4">
      <div className="text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-9xl font-bold text-white opacity-20">500</h1>
          <h2 className="text-4xl font-bold text-white">服务器错误</h2>
          <p className="text-xl text-gray-300 max-w-md mx-auto">
            服务器遇到了一些问题，请稍后再试
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center space-x-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>刷新页面</span>
          </button>
          
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

export default ServerErrorPage;