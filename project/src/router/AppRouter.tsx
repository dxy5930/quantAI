import React, { Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { routes } from './routes';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

// 创建路由器实例
const router = createBrowserRouter(routes);

// 全局路由加载组件
const GlobalRouterFallback: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-300">
    <LoadingSpinner size="lg" text="正在加载应用..." />
  </div>
);

// 应用路由器组件
export const AppRouter: React.FC = () => {
  return (
    <Suspense fallback={<GlobalRouterFallback />}>
      <RouterProvider router={router} />
    </Suspense>
  );
};

export default AppRouter; 