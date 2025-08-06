// 资源类型配置
export const RESOURCE_TYPE_CONFIG = {
  database: {
    tabType: 'database',
    label: '数据库',
    color: 'yellow',
    icon: 'database'
  },
  browser: {
    tabType: 'browser', 
    label: '网页',
    color: 'blue',
    icon: 'globe'
  },
  api: {
    tabType: 'apis',
    label: 'API',
    color: 'green', 
    icon: 'zap'
  },
  general: {
    tabType: 'info',
    label: '通用',
    color: 'gray',
    icon: 'info'
  }
} as const;

// 步骤类别配置
export const STEP_CATEGORY_CONFIG = {
  analysis: {
    label: '分析',
    color: 'green'
  },
  strategy: {
    label: '策略', 
    color: 'purple'
  },
  error: {
    label: '错误',
    color: 'red'
  },
  general: {
    label: '通用',
    color: 'gray'
  }
} as const;

// 资源类型
export type ResourceType = keyof typeof RESOURCE_TYPE_CONFIG;
export type StepCategory = keyof typeof STEP_CATEGORY_CONFIG;

// 获取资源类型配置
export const getResourceTypeConfig = (resourceType: ResourceType) => {
  return RESOURCE_TYPE_CONFIG[resourceType] || RESOURCE_TYPE_CONFIG.general;
};

// 获取步骤类别配置  
export const getStepCategoryConfig = (category: StepCategory) => {
  return STEP_CATEGORY_CONFIG[category] || STEP_CATEGORY_CONFIG.general;
};

// 生成样式类名
export const getResourceTypeClasses = (resourceType: ResourceType) => {
  const config = getResourceTypeConfig(resourceType);
  const colorMap = {
    yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    gray: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
  };
  return colorMap[config.color];
};

export const getStepCategoryClasses = (category: StepCategory) => {
  const config = getStepCategoryConfig(category);
  const colorMap = {
    green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', 
    red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    gray: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
  };
  return colorMap[config.color];
}; 