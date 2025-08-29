import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { ToastContainer } from '../common/Toast';

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-300 page-container-stable flex flex-col">
      <Header />
      <main className="flex-1 max-w-9xl mx-auto  animate-fade-in route-transition-stable w-full">
        <Outlet />
      </main>
      <Footer />
      <ToastContainer />
    </div>
  );
};