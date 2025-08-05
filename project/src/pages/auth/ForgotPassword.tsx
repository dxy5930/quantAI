import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, AlertCircle, CheckCircle } from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Logo } from '../../components/common/Logo';
import { authService } from '../../services/authService';
import { ROUTES } from '../../constants/routes';
import { useAppStore } from '../../hooks/useStore';

const ForgotPasswordPage: React.FC = () => {
  const appStore = useAppStore();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      appStore.showError('请输入邮箱地址');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      appStore.showError('请输入有效的邮箱地址');
      return;
    }

    setIsLoading(true);

    try {
      await authService.forgotPassword(email);
      setSuccess(true);
    } catch (error: any) {
      appStore.showError(error.message || '请求失败，请稍后重试', '发送失败');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center px-4">
        <div className="relative z-10 max-w-md w-full space-y-8">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">
                邮件已发送
              </h2>
              <p className="text-gray-200 mb-6">
                如果该邮箱存在，我们已向您发送了重置密码的链接。请检查您的邮箱并按照说明操作。
              </p>
              <p className="text-sm text-gray-300 mb-8">
                没有收到邮件？请检查垃圾邮件文件夹，或者5分钟后重试。
              </p>
              <Link
                to={ROUTES.LOGIN}
                className="inline-flex items-center justify-center w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回登录
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center px-4">
      <div className="relative z-10 max-w-md w-full space-y-8">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20">
          {/* 头部 */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo variant="auth" showText={false} />
            </div>
            <h2 className="text-3xl font-bold text-white">
              忘记密码
            </h2>
            <p className="mt-2 text-gray-200">
              输入您的邮箱地址，我们将发送重置密码的链接
            </p>
          </div>

          {/* 忘记密码表单 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
                邮箱地址
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400 z-10" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                  placeholder="请输入您的邮箱地址"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* 错误提示 - 移除内联错误显示 */}
            {/* {error && (
              <div className="flex items-center space-x-2 text-red-200 bg-red-500/20 border border-red-400/30 rounded-lg p-3 backdrop-blur-sm">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )} */}

            {/* 发送按钮 */}
            <button
              type="submit"
              disabled={isLoading || !email}
              className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  发送重置链接
                </>
              )}
            </button>

            {/* 返回登录链接 */}
            <div className="text-center">
              <Link
                to={ROUTES.LOGIN}
                className="inline-flex items-center text-sm text-blue-300 hover:text-blue-200 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                返回登录
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage; 