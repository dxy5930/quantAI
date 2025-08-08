import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock, User, LogIn, AlertCircle } from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { useUserStore, useAppStore } from '../../hooks/useStore';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Logo } from '../../components/common/Logo';
import { message } from '../../utils/message';

const LoginPage: React.FC = observer(() => {
  const userStore = useUserStore();
  const appStore = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // 获取返回URL
  const getReturnUrl = () => {
    // 1. 从URL参数获取
    const searchParams = new URLSearchParams(location.search);
    const returnUrl = searchParams.get('returnUrl');
    if (returnUrl) return returnUrl;
    
    // 2. 从localStorage获取
    const savedReturnUrl = localStorage.getItem('returnUrl');
    if (savedReturnUrl) return savedReturnUrl;
    
    // 3. 默认返回首页
    return ROUTES.HOME;
  };

  const handleInputChange = (field: 'username' | 'password', value: string) => {
    userStore.setLoginForm({ [field]: value });
    // 清除错误信息
    if (userStore.error) {
      userStore.clearError();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await userStore.login(undefined, rememberMe);
      appStore.showSuccess('登录成功！', '欢迎回来');
      
      // 获取返回URL并跳转
      const returnUrl = getReturnUrl();
      
      // 清除保存的返回URL
      localStorage.removeItem('returnUrl');
      
      // 跳转到目标页面
      navigate(returnUrl, { replace: true });
    } catch (error: any) {
      // 优先显示后端返回的 message
      const backendMsg = error?.message || userStore.error;
      if (backendMsg) {
        appStore.showError(backendMsg, '登录失败');
      } else {
        message.handleApiError(error);
      }
      console.error('登录失败:', error);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const isFormValid = userStore.loginForm.username.length > 0 && 
                     userStore.loginForm.password.length > 0;

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4">
      {/* 动态背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        {/* 动态渐变层 */}
        <div 
          className="absolute inset-0 opacity-80"
          style={{
            background: 'linear-gradient(45deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)',
            backgroundSize: '400% 400%',
            animation: 'gradientShift 15s ease infinite'
          }}
        />
        
        {/* 浮动几何图形 */}
        <div className="absolute inset-0">
          {/* 大圆形 */}
          <div 
            className="absolute w-96 h-96 bg-white/5 rounded-full blur-3xl"
            style={{
              top: '10%',
              left: '10%',
              animation: 'float 20s ease-in-out infinite'
            }}
          />
          <div 
            className="absolute w-80 h-80 bg-purple-500/10 rounded-full blur-2xl"
            style={{
              top: '60%',
              right: '15%',
              animation: 'float 25s ease-in-out infinite reverse'
            }}
          />
          <div 
            className="absolute w-64 h-64 bg-blue-500/10 rounded-full blur-2xl"
            style={{
              bottom: '20%',
              left: '20%',
              animation: 'float 18s ease-in-out infinite'
            }}
          />
          
          {/* 小装饰圆点 */}
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `twinkle ${3 + Math.random() * 4}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 5}s`
              }}
            />
          ))}
        </div>
        
        {/* 网格背景 */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            animation: 'gridMove 30s linear infinite'
          }}
        />
      </div>

      {/* 登录表单容器 */}
      <div className="relative z-10 max-w-md w-full space-y-8">
        {/* 表单背景 */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20">
          {/* 头部 */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo variant="auth" showText={false} />
            </div>
            <h2 className="text-3xl font-bold text-white">
              Welcome!
            </h2>
            <p className="mt-2 text-gray-200">
              登录您的策略回测账户
            </p>
          </div>

          {/* 登录表单 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {/* 用户名输入 */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-200 mb-2">
                  用户名
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <input
                    id="username"
                    type="text"
                    value={userStore.loginForm.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                    placeholder="请输入用户名"
                    disabled={userStore.isLoading}
                  />
                </div>
              </div>

              {/* 密码输入 */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-2">
                  密码
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-white" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={userStore.loginForm.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                    placeholder="请输入密码"
                    disabled={userStore.isLoading}
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200 transition-colors"
                    disabled={userStore.isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* 错误提示 - 移除内联错误显示 */}
            {/* {userStore.error && (
              <div className="flex items-center space-x-2 text-red-200 bg-red-500/20 border border-red-400/30 rounded-lg p-3 backdrop-blur-sm">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">{userStore.error}</span>
              </div>
            )} */}

            {/* 记住我和忘记密码 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-blue-400 focus:ring-blue-400 border-gray-400 rounded bg-white/10"
                  disabled={userStore.isLoading}
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-200">
                  记住我
                </label>
              </div>
              <Link
                to={ROUTES.FORGOT_PASSWORD}
                className="text-sm text-blue-300 hover:text-blue-200 transition-colors"
              >
                忘记密码？
              </Link>
            </div>

            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={!isFormValid || userStore.isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
            >
              {userStore.isLoading ? (
                <LoadingSpinner size="sm" text="登录中..." />
              ) : (
                <>
                  <LogIn className="h-5 w-5 mr-2" />
                  登录
                </>
              )}
            </button>

            {/* 注册链接 */}
            <div className="text-center">
              <span className="text-gray-200">还没有账户？</span>
              <Link
                to={ROUTES.REGISTER}
                className="ml-1 text-blue-300 hover:text-blue-200 transition-colors"
              >
                立即注册
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* CSS 动画样式 */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            33% { transform: translateY(-20px) rotate(120deg); }
            66% { transform: translateY(20px) rotate(240deg); }
          }
          
          @keyframes twinkle {
            0%, 100% { opacity: 0.2; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.2); }
          }
          
          @keyframes gridMove {
            0% { transform: translate(0, 0); }
            100% { transform: translate(50px, 50px); }
          }
        `
      }} />
    </div>
  );
});

export default LoginPage;