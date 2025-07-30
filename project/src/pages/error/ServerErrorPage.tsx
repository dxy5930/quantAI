import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { ROUTES } from '../../constants/routes';

const ServerErrorPage: React.FC = () => {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="mx-auto h-16 w-16 bg-yellow-600 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-6xl font-bold text-yellow-600 mb-4">500</h1>
          <h2 className="text-3xl font-bold text-white mb-4">服务器错误</h2>
          <p className="text-gray-400 text-lg mb-8">
            服务器遇到了一个错误，无法完成您的请求。我们正在努力修复这个问题。
          </p>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6 py-3 rounded-lg text-white font-medium transition-all"
          >
            <RefreshCw className="w-5 h-5" />
            <span>刷新页面</span>
          </button>
          
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

export default ServerErrorPage; 