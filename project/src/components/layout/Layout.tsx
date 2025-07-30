import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { ToastContainer } from '../common/Toast';

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-300 page-container-stable">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in route-transition-stable">
        <Outlet />
      </main>
      <ToastContainer />
    </div>
  );
};