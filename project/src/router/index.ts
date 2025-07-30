// 路由系统统一导出
export { AppRouter } from './AppRouter';
export { RouteGuard } from './RouteGuard';
export { routes } from './routes';
export { AuthLayout } from './layouts/AuthLayout';
export { MinimalLayout } from './layouts/MinimalLayout';

// 导航工具
export { NavigationHelper, useNavigation, createNavigationHelper } from './navigation';

// 路由常量和工具函数
export * from '../constants/routes'; 