// 路由路径常量
export const ROUTES = {
  // 公共路由
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  
  // 策略相关路由
  STRATEGY_DETAIL: '/strategy/:id',
  STRATEGY_CONFIG: '/strategy/:id/config',
  STRATEGY_STOCK_SELECTION_CONFIG: '/strategy/:id/stock-selection-config',
  STRATEGY_BACKTEST_CONFIG: '/strategy/:id/backtest-config',
  
  // 回测相关路由
  BACKTEST_RESULTS: '/backtest/results',
  BACKTEST_HISTORY: '/backtest/history',
  
  // 用户相关路由
  PROFILE: '/profile',
  SETTINGS: '/settings',
  CHANGE_PASSWORD: '/change-password',
  
  // 策略广场相关路由
  STRATEGY_SQUARE: '/strategy-square',
  STRATEGY_SQUARE_DETAIL: '/strategy-square/:shareId',
  MY_STRATEGIES: '/my-strategies',
  MY_STRATEGIES_CREATE: '/my-strategies/create',
  MY_STRATEGIES_EDIT: '/my-strategies/edit/:id',
  
  // 创建策略配置路由
  CREATE_STOCK_SELECTION: '/create/stock-selection',
  CREATE_BACKTEST: '/create/backtest',
  
  // 智能体工作流
  AI_WORKFLOW: '/ai-workflow',
  
  // 其他功能路由
  HELP: '/help',
  ABOUT: '/about',
  NOTIFICATION_DETAIL: '/notification/:id',
  RANKING: '/ranking',
  
  // 错误页面
  NOT_FOUND: '/404',
  UNAUTHORIZED: '/401',
  SERVER_ERROR: '/500'
} as const;

// 路由元数据类型
export interface RouteMetadata {
  path: string;
  title: string;
  description?: string;
  requiresAuth?: boolean;
  roles?: string[];
  layout?: 'default' | 'auth' | 'minimal';
  icon?: string;
  showInNav?: boolean;
  order?: number;
}

// 路由元数据配置
export const ROUTE_METADATA: Record<string, RouteMetadata> = {
  [ROUTES.HOME]: {
    path: ROUTES.HOME,
    title: '首页',
    description: '量化交易策略平台首页',
    layout: 'default',
    icon: 'Home',
    showInNav: true,
    order: 1
  },
  [ROUTES.LOGIN]: {
    path: ROUTES.LOGIN,
    title: '登录',
    description: '用户登录页面',
    layout: 'auth',
    requiresAuth: false
  },
  [ROUTES.REGISTER]: {
    path: ROUTES.REGISTER,
    title: '注册',
    description: '用户注册页面',
    layout: 'auth',
    requiresAuth: false
  },
  [ROUTES.STRATEGY_DETAIL]: {
    path: ROUTES.STRATEGY_DETAIL,
    title: '策略详情',
    description: '查看策略详细信息',
    layout: 'default',
    requiresAuth: false
  },
  [ROUTES.STRATEGY_CONFIG]: {
    path: ROUTES.STRATEGY_CONFIG,
    title: '策略配置',
    description: '策略参数配置页面',
    layout: 'default',
    requiresAuth: true
  },
  [ROUTES.BACKTEST_RESULTS]: {
    path: ROUTES.BACKTEST_RESULTS,
    title: '回测结果',
    description: '策略回测结果页面',
    layout: 'default',
    requiresAuth: true
  },
  [ROUTES.BACKTEST_HISTORY]: {
    path: ROUTES.BACKTEST_HISTORY,
    title: '回测历史',
    description: '历史回测记录页面',
    layout: 'default',
    requiresAuth: true,
    icon: 'History',
    showInNav: true,
    order: 3
  },
  [ROUTES.PROFILE]: {
    path: ROUTES.PROFILE,
    title: '个人资料',
    description: '用户个人资料页面',
    layout: 'default',
    requiresAuth: true
  },
  [ROUTES.SETTINGS]: {
    path: ROUTES.SETTINGS,
    title: '设置',
    description: '用户设置页面',
    layout: 'default',
    requiresAuth: true
  },
  [ROUTES.CHANGE_PASSWORD]: {
    path: ROUTES.CHANGE_PASSWORD,
    title: '修改密码',
    description: '修改用户密码',
    layout: 'default',
    requiresAuth: true
  },
  [ROUTES.STRATEGY_SQUARE]: {
    path: ROUTES.STRATEGY_SQUARE,
    title: '策略广场',
    description: '查看和分享策略',
    layout: 'default',
    icon: 'Grid',
    showInNav: true,
    order: 2
  },
  [ROUTES.STRATEGY_SQUARE_DETAIL]: {
    path: ROUTES.STRATEGY_SQUARE_DETAIL,
    title: '策略详情',
    description: '查看策略详细信息',
    layout: 'default',
    requiresAuth: false
  },
  [ROUTES.MY_STRATEGIES]: {
    path: ROUTES.MY_STRATEGIES,
    title: '我的策略',
    description: '管理我的策略',
    layout: 'default',
    requiresAuth: true,
    icon: 'User',
    showInNav: true,
    order: 3
  },
  [ROUTES.MY_STRATEGIES_CREATE]: {
    path: ROUTES.MY_STRATEGIES_CREATE,
    title: '创建策略',
    description: '创建新的策略',
    layout: 'default',
    requiresAuth: true
  },
  [ROUTES.MY_STRATEGIES_EDIT]: {
    path: ROUTES.MY_STRATEGIES_EDIT,
    title: '编辑策略',
    description: '编辑现有策略',
    layout: 'default',
    requiresAuth: true
  },
  [ROUTES.CREATE_STOCK_SELECTION]: {
    path: ROUTES.CREATE_STOCK_SELECTION,
    title: '创建选股策略',
    description: '创建新的选股策略',
    layout: 'default',
    requiresAuth: true
  },
  [ROUTES.CREATE_BACKTEST]: {
    path: ROUTES.CREATE_BACKTEST,
    title: '创建回测策略',
    description: '创建新的回测策略',
    layout: 'default',
    requiresAuth: true
  },
  [ROUTES.AI_WORKFLOW]: {
    path: ROUTES.AI_WORKFLOW,
    title: 'AI智能体',
    description: '智能体工作流分析',
    layout: 'default',
    requiresAuth: true,
    icon: 'Bot',
    showInNav: true,
    order: 2.5
  },
  [ROUTES.HELP]: {
    path: ROUTES.HELP,
    title: '帮助中心',
    description: '使用帮助和文档',
    layout: 'default',
    icon: 'HelpCircle',
    showInNav: true,
    order: 4
  },
  [ROUTES.ABOUT]: {
    path: ROUTES.ABOUT,
    title: '关于我们',
    description: '关于平台的信息',
    layout: 'default',
    showInNav: false
  },
  [ROUTES.NOTIFICATION_DETAIL]: {
    path: ROUTES.NOTIFICATION_DETAIL,
    title: '通知详情',
    description: '查看通知详细信息',
    layout: 'default',
    requiresAuth: true
  },
  [ROUTES.NOT_FOUND]: {
    path: ROUTES.NOT_FOUND,
    title: '页面未找到',
    description: '404错误页面',
    layout: 'minimal'
  },
  [ROUTES.UNAUTHORIZED]: {
    path: ROUTES.UNAUTHORIZED,
    title: '未授权访问',
    description: '401错误页面',
    layout: 'minimal'
  },
  [ROUTES.SERVER_ERROR]: {
    path: ROUTES.SERVER_ERROR,
    title: '服务器错误',
    description: '500错误页面',
    layout: 'minimal'
  }
};

// 获取导航路由
export const getNavRoutes = (): RouteMetadata[] => {
  return Object.values(ROUTE_METADATA)
    .filter(route => route.showInNav)
    .sort((a, b) => (a.order || 999) - (b.order || 999));
};

// 获取需要认证的路由
export const getProtectedRoutes = (): string[] => {
  return Object.values(ROUTE_METADATA)
    .filter(route => route.requiresAuth)
    .map(route => route.path);
};

// 获取公共路由
export const getPublicRoutes = (): string[] => {
  return Object.values(ROUTE_METADATA)
    .filter(route => !route.requiresAuth)
    .map(route => route.path);
};

// 路由工具函数
export const buildPath = (path: string, params: Record<string, string | number> = {}): string => {
  let result = path;
  Object.entries(params).forEach(([key, value]) => {
    result = result.replace(`:${key}`, String(value));
  });
  return result;
};

// 检查路由是否需要认证
export const isProtectedRoute = (path: string): boolean => {
  const metadata = Object.values(ROUTE_METADATA).find(route => {
    if (route.path.includes(':')) {
      const regex = new RegExp(route.path.replace(/:[^/]+/g, '[^/]+') + '$');
      return regex.test(path);
    }
    return route.path === path;
  });
  return metadata?.requiresAuth || false;
};

// 获取路由标题
export const getRouteTitle = (path: string): string => {
  const metadata = Object.values(ROUTE_METADATA).find(route => {
    if (route.path.includes(':')) {
      const regex = new RegExp(route.path.replace(/:[^/]+/g, '[^/]+') + '$');
      return regex.test(path);
    }
    return route.path === path;
  });
  return metadata?.title || 'QuantAI Pro';
};