import React, { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { Layout } from '../components/layout/Layout';
import { AuthLayout } from './layouts/AuthLayout';
import { MinimalLayout } from './layouts/MinimalLayout';
import { RouteGuard } from './RouteGuard';

// 懒加载页面组件
const HomePage = lazy(() => import('../pages/home'));
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage'));
const StrategyConfigPage = lazy(() => import('../pages/strategy/StrategyConfigPage'));
const StockSelectionConfigPage = lazy(() => import('../pages/strategy/StockSelectionConfigPage'));
const BacktestConfigPage = lazy(() => import('../pages/strategy/BacktestConfigPage'));
const BacktestResultsPage = lazy(() => import('../pages/backtest/BacktestResultsPage'));

// 其他页面组件
const BacktestHistoryPage = lazy(() => import('../pages/backtest/BacktestHistoryPage'));
const ProfilePage = lazy(() => import('../pages/user/ProfilePage'));
const SettingsPage = lazy(() => import('../pages/user/SettingsPage'));
const ChangePasswordPage = lazy(() => import('../pages/user/ChangePasswordPage'));
const StrategySquarePage = lazy(() => import('../pages/ranking')); // 重命名为策略广场
const StrategyDetailPage = lazy(() => import('../pages/strategy/StrategyDetailPage'));
const MyStrategiesPage = lazy(() => import('../pages/strategy/MyStrategiesPage'));
const AIWorkflowPage = lazy(() => import('../pages/ai-workflow'));
const HelpPage = lazy(() => import('../pages/help'));
const AboutPage = lazy(() => import('../pages/about'));
const NotificationDetailPage = lazy(() => import('../pages/notification/NotificationDetailPage'));

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

  // 主要应用路由（使用默认Layout和路由守卫）
  // 策略详情页路由（不需要登录验证）
  {
    path: ROUTES.STRATEGY_DETAIL,
    element: <Layout />,
    children: [
      {
        index: true,
        element: <StrategyDetailPage />
      }
    ]
  },
  {
    path: ROUTES.STRATEGY_SQUARE_DETAIL,
    element: <Layout />,
    children: [
      {
        index: true,
        element: <StrategyDetailPage />
      }
    ]
  },

  {
    path: '/',
    element: (
      <RouteGuard>
        <Layout />
      </RouteGuard>
    ),
    children: [
      // 首页
      {
        index: true,
        element: <HomePage />
      },
      
      // 策略配置路由（需要登录验证）
      {
        path: ROUTES.STRATEGY_CONFIG,
        element: <StrategyConfigPage />
      },
      {
        path: ROUTES.STRATEGY_STOCK_SELECTION_CONFIG,
        element: <StockSelectionConfigPage />
      },
      {
        path: ROUTES.STRATEGY_BACKTEST_CONFIG,
        element: <BacktestConfigPage />
      },
      
      // 创建策略配置路由
      {
        path: ROUTES.CREATE_STOCK_SELECTION,
        element: <StockSelectionConfigPage />
      },
      {
        path: ROUTES.CREATE_BACKTEST,
        element: <BacktestConfigPage />
      },
      
      // 回测相关路由
      {
        path: ROUTES.BACKTEST_RESULTS,
        element: <BacktestResultsPage />
      },
      {
        path: ROUTES.BACKTEST_HISTORY,
        element: <BacktestHistoryPage />
      },
      
      // 用户相关路由
      {
        path: ROUTES.PROFILE,
        element: <ProfilePage />
      },
      {
        path: ROUTES.SETTINGS,
        element: <SettingsPage />
      },
      {
        path: ROUTES.CHANGE_PASSWORD,
        element: <ChangePasswordPage />
      },
      
      // 策略广场相关路由
      {
        path: ROUTES.STRATEGY_SQUARE,
        element: <StrategySquarePage />
      },
      {
        path: ROUTES.MY_STRATEGIES,
        element: <MyStrategiesPage />
      },
      {
        path: ROUTES.MY_STRATEGIES_CREATE,
        element: <MyStrategiesPage />
      },
      {
        path: ROUTES.MY_STRATEGIES_EDIT,
        element: <MyStrategiesPage />
      },
      
      // AI智能体工作流
      {
        path: ROUTES.AI_WORKFLOW,
        element: <AIWorkflowPage />
      },
      
      // 其他功能路由
      {
        path: ROUTES.HELP,
        element: <HelpPage />
      },
      {
        path: ROUTES.ABOUT,
        element: <AboutPage />
      },
      {
        path: ROUTES.NOTIFICATION_DETAIL,
        element: <NotificationDetailPage />
      }
    ]
  },

  // 错误页面路由（使用简化Layout）
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

  // 通配符路由 - 处理所有未匹配的路由
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

// 导出路由配置以供其他地方使用
export default routes; 