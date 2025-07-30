import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ToastContainer } from '../../components/common/Toast';

export const MinimalLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-300">
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" text="加载中..." />
        </div>
      }>
        <Outlet />
      </Suspense>
      <ToastContainer />
    </div>
  );
}; 