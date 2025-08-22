import React, { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { Layout } from '../components/layout/Layout';
import { AuthLayout } from './layouts/AuthLayout';
import { MinimalLayout } from './layouts/MinimalLayout';
import { WorkflowPageLayout } from './layouts/WorkflowLayout';
import { RouteGuard } from './RouteGuard';

// 懒加载页面组件
const HomePage = lazy(() => import('../pages/home'));
const LoginPage = lazy(() => import('../pages/auth/Login'));
const RegisterPage = lazy(() => import('../pages/auth/Register'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPassword'));
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPassword'));
const ProfilePage = lazy(() => import('../pages/user/ProfilePage'));
const ChangePasswordPage = lazy(() => import('../pages/user/ChangePasswordPage'));
const AIWorkflowPage = lazy(() => import('../pages/ai-workflow'));
const ReviewPage = lazy(() => import('../pages/review/ReviewPage'));
const PricingPage = lazy(() => import('../pages/pricing'));
const FeedbackPage = lazy(() => import('../pages/feedback'));
const AboutPage = lazy(() => import('../pages/about'));
const NotificationCenter = lazy(() => import('../pages/notification'));

// 错误页面组件
const NotFoundPage = lazy(() => import('../pages/error/NotFoundPage'));
const UnauthorizedPage = lazy(() => import('../pages/error/UnauthorizedPage'));
const ServerErrorPage = lazy(() => import('../pages/error/ServerErrorPage'));

// 路由配置
export const routes: RouteObject[] = [
  // 认证相关路由（不需要Layout）
  {
    path: ROUTES.LOGIN,
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: <LoginPage />
      }
    ]
  },
  {
    path: ROUTES.REGISTER,
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: <RegisterPage />
      }
    ]
  },
  {
    path: ROUTES.FORGOT_PASSWORD,
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: <ForgotPasswordPage />
      }
    ]
  },
  {
    path: ROUTES.RESET_PASSWORD,
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: <ResetPasswordPage />
      }
    ]
  },

  // 主要应用路由（使用默认Layout）
  {
    path: ROUTES.HOME,
    element: <Layout />,
    children: [
      // 首页
      {
        index: true,
        element: <HomePage />
      },
      
      // 用户相关页面
      {
        path: ROUTES.PROFILE,
        element: <RouteGuard><ProfilePage /></RouteGuard>
      },
      {
        path: ROUTES.CHANGE_PASSWORD,
        element: <RouteGuard><ChangePasswordPage /></RouteGuard>
      },
      
      // 复盘页面
      {
        path: ROUTES.REVIEW,
        element: <RouteGuard><ReviewPage /></RouteGuard>
      },

      
      // 其他页面
      {
        path: ROUTES.ABOUT,
        element: <AboutPage />
      },
      {
        path: ROUTES.PRICING,
        element: <PricingPage />
      },
      {
        path: ROUTES.FEEDBACK,
        element: <FeedbackPage />
      },
      
      // 通知相关
      {
        path: ROUTES.NOTIFICATIONS,
        element: <RouteGuard><NotificationCenter /></RouteGuard>
      }
    ]
  },

  // AI工作流路由（使用工作流布局）
  {
    path: ROUTES.AI_WORKFLOW,
    element: <WorkflowPageLayout />,
    children: [
      {
        index: true,
        element: <RouteGuard><AIWorkflowPage /></RouteGuard>
      }
    ]
  },



  // 错误页面路由（使用最小布局）
  {
    path: ROUTES.NOT_FOUND,
    element: <MinimalLayout />,
    children: [
      {
        index: true,
        element: <NotFoundPage />
      }
    ]
  },
  {
    path: ROUTES.UNAUTHORIZED,
    element: <MinimalLayout />,
    children: [
      {
        index: true,
        element: <UnauthorizedPage />
      }
    ]
  },
  {
    path: ROUTES.SERVER_ERROR,
    element: <MinimalLayout />,
    children: [
      {
        index: true,
        element: <ServerErrorPage />
      }
    ]
  },

  // 404 兜底路由
  {
    path: '*',
    element: <MinimalLayout />,
    children: [
      {
        index: true,
        element: <NotFoundPage />
      }
    ]
  }
];

export default routes; 