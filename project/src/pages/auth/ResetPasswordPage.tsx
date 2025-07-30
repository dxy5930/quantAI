import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, ArrowLeft, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Logo } from '../../components/common/Logo';
import { authService } from '../../services/authService';
import { ROUTES } from '../../constants/routes';
import { useAppStore } from '../../hooks/useStore';

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const appStore = useAppStore();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate(ROUTES.LOGIN);
    }
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      appStore.showError('请填写所有字段');
      return;
    }

    if (password.length < 8) {
      appStore.showError('密码长度至少8位');
      return;
    }

    if (password !== confirmPassword) {
      appStore.showError('两次输入的密码不一致');
      return;
    }

    if (!token) {
      appStore.showError('重置令牌无效');
      return;
    }

    setIsLoading(true);

    try {
      await authService.resetPassword(token, password, confirmPassword);
      setSuccess(true);
    } catch (error: any) {
      appStore.showError(error.message || '重置失败，请稍后重试', '重置失败');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
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
                密码重置成功
              </h2>
              <p className="text-gray-200 mb-8">
                您的密码已成功重置。现在您可以使用新密码登录您的账户。
              </p>
              <button
                onClick={() => navigate(ROUTES.LOGIN)}
                className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                前往登录
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center px-4">
        <div className="relative z-10 max-w-md w-full space-y-8">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-red-400" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">
                链接无效
              </h2>
              <p className="text-gray-200 mb-8">
                重置密码链接无效或已过期。请重新申请密码重置。
              </p>
              <Link
                to={ROUTES.FORGOT_PASSWORD}
                className="w-full inline-flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                重新申请
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
              重置密码
            </h2>
            <p className="mt-2 text-gray-200">
              请输入您的新密码
            </p>
          </div>

          {/* 重置密码表单 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {/* 新密码输入 */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-2">
                  新密码
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-white" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                    }}
                    className="w-full pl-10 pr-12 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                    placeholder="请输入新密码"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200 transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* 确认密码输入 */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-200 mb-2">
                  确认新密码
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-white" />
                  </div>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                    }}
                    className="w-full pl-10 pr-12 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                    placeholder="请再次输入新密码"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={toggleConfirmPasswordVisibility}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200 transition-colors"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* 密码要求提示 */}
            <div className="text-sm text-gray-300 bg-blue-500/10 border border-blue-400/30 rounded-lg p-3">
              <p className="mb-1">密码要求：</p>
              <ul className="list-disc list-inside space-y-1">
                <li>至少8个字符</li>
                <li>建议包含字母、数字和特殊字符</li>
              </ul>
            </div>

            {/* 错误提示 - 移除内联错误显示 */}
            {/* {error && (
              <div className="flex items-center space-x-2 text-red-200 bg-red-500/20 border border-red-400/30 rounded-lg p-3 backdrop-blur-sm">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )} */}

            {/* 重置按钮 */}
            <button
              type="submit"
              disabled={isLoading || !password || !confirmPassword}
              className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  重置密码
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

export default ResetPasswordPage; 