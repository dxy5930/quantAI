import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate, Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { Eye, EyeOff, Lock, User, Mail, UserPlus, AlertCircle, Check } from 'lucide-react';
import { useUserStore, useAppStore } from '../../hooks/useStore';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Logo } from '../../components/common/Logo';

const RegisterPage: React.FC = observer(() => {
  const userStore = useUserStore();
  const appStore = useAppStore();
  const navigate = useNavigate();
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleInputChange = (field: keyof typeof userStore.registerForm, value: string) => {
    userStore.setRegisterForm({ [field]: value });
    // 清除错误信息
    if (userStore.error) {
      userStore.clearError();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acceptTerms) {
      appStore.showError('请先阅读并同意用户协议');
      return;
    }

    try {
      await userStore.register();
      appStore.showSuccess('注册成功！', '欢迎加入量化交易平台');
      navigate(ROUTES.HOME);
    } catch (error: any) {
      // 错误通过Toast弹框显示，不再需要内联错误处理
      if (userStore.error) {
        appStore.showError(error.message, '注册失败');
      }
      console.error('注册失败:', error);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // 表单验证
  const isUsernameValid = userStore.registerForm.username.length >= 3;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userStore.registerForm.email);
  const isPasswordValid = userStore.registerForm.password.length >= 8;
  const isPasswordMatch = userStore.registerForm.password === userStore.registerForm.confirmPassword;
  const isFormValid = isUsernameValid && isEmailValid && isPasswordValid && isPasswordMatch && acceptTerms;

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

      {/* 注册表单容器 */}
      <div className="relative z-10 max-w-md w-full space-y-8">
        {/* 表单背景 */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20">
          {/* 头部 */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo variant="auth" showText={false} />
            </div>
            <h2 className="text-3xl font-bold text-white">
              创建账户
            </h2>
            <p className="mt-2 text-gray-200">
              开始您的量化交易之旅
            </p>
          </div>

          {/* 注册表单 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {/* 用户名输入 */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-200 mb-2">
                  用户名
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="username"
                    type="text"
                    value={userStore.registerForm.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className={`w-full pl-10 pr-10 py-3 bg-white/10 backdrop-blur-sm border rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all ${
                      userStore.registerForm.username.length > 0 
                        ? isUsernameValid 
                          ? 'border-green-400' 
                          : 'border-red-400'
                        : 'border-white/20'
                    }`}
                    placeholder="请输入用户名（至少3个字符）"
                    disabled={userStore.isLoading}
                  />
                  {userStore.registerForm.username.length > 0 && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      {isUsernameValid ? (
                        <Check className="h-5 w-5 text-green-400" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-400" />
                      )}
                    </div>
                  )}
                </div>
                {/* 用户名要求提示 */}
                {userStore.registerForm.username.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className={`text-xs flex items-center space-x-2 ${
                      isUsernameValid ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {isUsernameValid ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <AlertCircle className="h-3 w-3" />
                      )}
                      <span>至少3个字符 ({userStore.registerForm.username.length}/3)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 邮箱输入 */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
                  邮箱地址
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={userStore.registerForm.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full pl-10 pr-10 py-3 bg-white/10 backdrop-blur-sm border rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all ${
                      userStore.registerForm.email.length > 0 
                        ? isEmailValid 
                          ? 'border-green-400' 
                          : 'border-red-400'
                        : 'border-white/20'
                    }`}
                    placeholder="请输入邮箱地址"
                    disabled={userStore.isLoading}
                  />
                  {userStore.registerForm.email.length > 0 && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      {isEmailValid ? (
                        <Check className="h-5 w-5 text-green-400" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-400" />
                      )}
                    </div>
                  )}
                </div>
                {/* 邮箱格式提示 */}
                {userStore.registerForm.email.length > 0 && !isEmailValid && (
                  <div className="mt-2 space-y-1">
                    <div className="text-xs flex items-center space-x-2 text-red-400">
                      <AlertCircle className="h-3 w-3" />
                      <span>请输入有效的邮箱格式（如：example@domain.com）</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 密码输入 */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-2">
                  密码
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={userStore.registerForm.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`w-full pl-10 pr-20 py-3 bg-white/10 backdrop-blur-sm border rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all ${
                      userStore.registerForm.password.length > 0 
                        ? isPasswordValid 
                          ? 'border-green-400' 
                          : 'border-red-400'
                        : 'border-white/20'
                    }`}
                    placeholder="请输入密码（至少8个字符）"
                    disabled={userStore.isLoading}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center space-x-2">
                    {userStore.registerForm.password.length > 0 && (
                      <>
                        {isPasswordValid ? (
                          <Check className="h-5 w-5 text-green-400" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-400" />
                        )}
                      </>
                    )}
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="text-gray-400 hover:text-gray-200 transition-colors"
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
                {/* 密码要求提示 */}
                {userStore.registerForm.password.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className={`text-xs flex items-center space-x-2 ${
                      isPasswordValid ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {isPasswordValid ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <AlertCircle className="h-3 w-3" />
                      )}
                      <span>至少8个字符 ({userStore.registerForm.password.length}/8)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 确认密码输入 */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-200 mb-2">
                  确认密码
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={userStore.registerForm.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={`w-full pl-10 pr-20 py-3 bg-white/10 backdrop-blur-sm border rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all ${
                      userStore.registerForm.confirmPassword.length > 0 
                        ? isPasswordMatch 
                          ? 'border-green-400' 
                          : 'border-red-400'
                        : 'border-white/20'
                    }`}
                    placeholder="请再次输入密码"
                    disabled={userStore.isLoading}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center space-x-2">
                    {userStore.registerForm.confirmPassword.length > 0 && (
                      <>
                        {isPasswordMatch ? (
                          <Check className="h-5 w-5 text-green-400" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-400" />
                        )}
                      </>
                    )}
                    <button
                      type="button"
                      onClick={toggleConfirmPasswordVisibility}
                      className="text-gray-400 hover:text-gray-200 transition-colors"
                      disabled={userStore.isLoading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                {/* 密码匹配提示 */}
                {userStore.registerForm.confirmPassword.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className={`text-xs flex items-center space-x-2 ${
                      isPasswordMatch ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {isPasswordMatch ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <AlertCircle className="h-3 w-3" />
                      )}
                      <span>{isPasswordMatch ? '密码匹配' : '密码不匹配'}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 错误提示 - 移除内联错误显示 */}
            {/* {userStore.error && (
              <div className="flex items-center space-x-2 text-red-200 bg-red-500/20 border border-red-400/30 rounded-lg p-3 backdrop-blur-sm">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">{userStore.error}</span>
              </div>
            )} */}

            {/* 用户协议 */}
            <div className="flex items-center">
              <input
                id="accept-terms"
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="h-4 w-4 text-blue-400 focus:ring-blue-400 border-gray-400 rounded bg-white/10"
                disabled={userStore.isLoading}
              />
              <label htmlFor="accept-terms" className="ml-2 block text-sm text-gray-200">
                我已阅读并同意
                <button type="button" className="text-blue-300 hover:text-blue-200 transition-colors mx-1">
                  用户协议
                </button>
                和
                <button type="button" className="text-blue-300 hover:text-blue-200 transition-colors mx-1">
                  隐私政策
                </button>
              </label>
            </div>

            {/* 表单验证提示 */}
            {!isFormValid && (
              <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-3 backdrop-blur-sm">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-200">
                    <p className="font-medium mb-1">请完成以下步骤：</p>
                    <ul className="space-y-1 text-xs">
                      {!isUsernameValid && (
                        <li>• 用户名至少需要3个字符</li>
                      )}
                      {!isEmailValid && (
                        <li>• 请输入有效的邮箱地址</li>
                      )}
                      {!isPasswordValid && (
                        <li>• 密码至少需要8个字符</li>
                      )}
                      {!isPasswordMatch && userStore.registerForm.confirmPassword.length > 0 && (
                        <li>• 两次输入的密码不一致</li>
                      )}
                      {!acceptTerms && (
                        <li>• 请阅读并同意用户协议</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* 注册按钮 */}
            <button
              type="submit"
              disabled={!isFormValid || userStore.isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
            >
              {userStore.isLoading ? (
                <LoadingSpinner size="sm" text="注册中..." />
              ) : (
                <>
                  <UserPlus className="h-5 w-5 mr-2" />
                  创建账户
                </>
              )}
            </button>

            {/* 登录链接 */}
            <div className="text-center">
              <span className="text-gray-200">已有账户？</span>
              <Link
                to={ROUTES.LOGIN}
                className="ml-1 text-blue-300 hover:text-blue-200 transition-colors"
              >
                立即登录
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

export default RegisterPage; 