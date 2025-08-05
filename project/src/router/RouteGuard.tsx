import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useStore } from '../hooks/useStore';
import { ROUTES, isProtectedRoute } from '../constants/routes';

interface RouteGuardProps {
  children: React.ReactNode;
}

export const RouteGuard: React.FC<RouteGuardProps> = observer(({ children }) => {
  const { user } = useStore();
  const location = useLocation();

  // 检查当前路由是否需要认证
  const requiresAuth = isProtectedRoute(location.pathname);

  // 如果还未初始化完成，显示加载状态
  if (!user.isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 dark:text-gray-400">正在加载...</p>
        </div>
      </div>
    );
  }

  // 如果路由需要认证但用户未登录，重定向到登录页
  if (requiresAuth && !user.isLoggedIn) {
    return (
      <Navigate
        to={ROUTES.LOGIN}
        state={{ from: location }}
        replace
      />
    );
  }

  // 如果用户已登录但访问登录或注册页面，重定向到首页
  if (user.isLoggedIn && (location.pathname === ROUTES.LOGIN || location.pathname === ROUTES.REGISTER)) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return <>{children}</>;
});

export default RouteGuard; 