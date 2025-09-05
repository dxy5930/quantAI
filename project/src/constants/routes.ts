// 应用路由常量
export const ROUTES = {
  // 首页
  HOME: '/',
  
  // 用户相关路由
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  PROFILE: '/profile',
  CHANGE_PASSWORD: '/change-password',
  
  // AI工作流
  AI_WORKFLOW: '/ai-workflow',
  
  // 复盘功能
  REVIEW: '/review',
  
  // 直播
  LIVE: '/live',
  
  // 其他页面
  ABOUT: '/about',
  HELP: '/help',
  PRICING: '/pricing',
  FEEDBACK: '/feedback',
  
  // 通知相关
  NOTIFICATIONS: '/notifications',
  NOTIFICATION_DETAIL: '/notifications/:id',
  
  // 错误页面
  NOT_FOUND: '/404',
  UNAUTHORIZED: '/401',
  SERVER_ERROR: '/500',
} as const;

// 页面元数据配置
export const PAGE_METADATA = {
  [ROUTES.HOME]: {
    path: ROUTES.HOME,
    title: '首页',
    description: '智能投资助手平台首页',
    requiresAuth: false,
    layout: 'default',
  },
  [ROUTES.LOGIN]: {
    path: ROUTES.LOGIN,
    title: '登录',
    description: '用户登录页面',
    requiresAuth: false,
    layout: 'auth',
  },
  [ROUTES.REGISTER]: {
    path: ROUTES.REGISTER,
    title: '注册',
    description: '用户注册页面',
    requiresAuth: false,
    layout: 'auth',
  },
  [ROUTES.FORGOT_PASSWORD]: {
    path: ROUTES.FORGOT_PASSWORD,
    title: '忘记密码',
    description: '忘记密码页面',
    requiresAuth: false,
    layout: 'auth',
  },
  [ROUTES.RESET_PASSWORD]: {
    path: ROUTES.RESET_PASSWORD,
    title: '重置密码',
    description: '重置密码页面',
    requiresAuth: false,
    layout: 'auth',
  },
  [ROUTES.PROFILE]: {
    path: ROUTES.PROFILE,
    title: '个人资料',
    description: '用户个人资料页面',
    requiresAuth: true,
    layout: 'default',
  },
  [ROUTES.CHANGE_PASSWORD]: {
    path: ROUTES.CHANGE_PASSWORD,
    title: '修改密码',
    description: '修改密码页面',
    requiresAuth: true,
    layout: 'default',
  },
  [ROUTES.AI_WORKFLOW]: {
    path: ROUTES.AI_WORKFLOW,
    title: 'AI工作流',
    description: 'AI工作流编辑器',
    requiresAuth: true,
    layout: 'default',
  },
  [ROUTES.REVIEW]: {
    path: ROUTES.REVIEW,
    title: '复盘',
    description: '交易复盘分析页面',
    requiresAuth: true,
    layout: 'default',
  },
  [ROUTES.LIVE]: {
    path: ROUTES.LIVE,
    title: '直播',
    description: '实时直播与评论',
    requiresAuth: false,
    layout: 'default',
  },
  [ROUTES.ABOUT]: {
    path: ROUTES.ABOUT,
    title: '关于我们',
    description: '关于平台的介绍页面',
    requiresAuth: false,
    layout: 'default',
  },
  [ROUTES.HELP]: {
    path: ROUTES.HELP,
    title: '帮助中心',
    description: '平台使用帮助页面',
    requiresAuth: false,
    layout: 'default',
  },
  [ROUTES.PRICING]: {
    path: ROUTES.PRICING,
    title: '价格方案',
    description: '服务价格方案页面',
    requiresAuth: false,
    layout: 'default',
  },
  [ROUTES.FEEDBACK]: {
    path: ROUTES.FEEDBACK,
    title: '意见反馈',
    description: '用户意见反馈页面',
    requiresAuth: false,
    layout: 'default',
  },
  [ROUTES.NOTIFICATIONS]: {
    path: ROUTES.NOTIFICATIONS,
    title: '通知中心',
    description: '系统通知页面',
    requiresAuth: true,
    layout: 'default',
  },
  [ROUTES.NOTIFICATION_DETAIL]: {
    path: ROUTES.NOTIFICATION_DETAIL,
    title: '通知详情',
    description: '通知详情页面',
    requiresAuth: true,
    layout: 'default',
  },
  [ROUTES.NOT_FOUND]: {
    path: ROUTES.NOT_FOUND,
    title: '页面未找到',
    description: '404错误页面',
    requiresAuth: false,
    layout: 'minimal',
  },
  [ROUTES.UNAUTHORIZED]: {
    path: ROUTES.UNAUTHORIZED,
    title: '未授权访问',
    description: '401错误页面',
    requiresAuth: false,
    layout: 'minimal',
  },
  [ROUTES.SERVER_ERROR]: {
    path: ROUTES.SERVER_ERROR,
    title: '服务器错误',
    description: '500错误页面',
    requiresAuth: false,
    layout: 'minimal',
  },
} as const;

// 获取页面标题的工具函数
export const getPageTitle = (path: string): string => {
  const metadata = Object.values(PAGE_METADATA).find(meta => 
    meta.path === path || (meta.path.includes(':') && 
      new RegExp('^' + meta.path.replace(/:[^/]+/g, '[^/]+') + '$').test(path))
  );
  return metadata?.title || '未知页面';
};

// 检查路由是否需要认证的工具函数
export const isAuthRequired = (path: string): boolean => {
  const metadata = Object.values(PAGE_METADATA).find(meta => 
    meta.path === path || (meta.path.includes(':') && 
      new RegExp('^' + meta.path.replace(/:[^/]+/g, '[^/]+') + '$').test(path))
  );
  return metadata?.requiresAuth || false;
};

// isProtectedRoute 作为 isAuthRequired 的别名，保持API一致性
export const isProtectedRoute = isAuthRequired;