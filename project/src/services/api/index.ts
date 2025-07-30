// 导入所有API模块
import { authApi } from './authApi';
import { userApi } from './userApi';
import { strategyApi } from './strategyApi';
import { backtestApi } from './backtestApi';
import { stockApi } from './stockApi';
import { stocksApi } from './stocksApi';
import { notificationApi } from './notificationApi';
import { systemApi } from './systemApi';
import { strategyDetailApi } from './strategyDetailApi';
import { stockSelectionApi } from './stockSelectionApi';
import { aiWorkflowApi } from './aiWorkflowApi';
import { homeApi } from './homeApi';
import { nodeConfigApi } from './nodeConfigApi';

// 导出所有类型
export * from './types';
export * from './homeApi';
export * from './userApi';
export * from './strategyDetailApi';
export * from './aiWorkflowApi';
export * from './nodeConfigApi';

// 导出各个API模块
export { authApi } from './authApi';
export { userApi } from './userApi';
export { strategyApi } from './strategyApi';
export { backtestApi } from './backtestApi';
export { stockApi } from './stockApi';
export { stocksApi } from './stocksApi';
export { notificationApi } from './notificationApi';
export { systemApi } from './systemApi';
export { strategyDetailApi } from './strategyDetailApi';
export { stockSelectionApi } from './stockSelectionApi';
export { aiWorkflowApi } from './aiWorkflowApi';
export { homeApi } from './homeApi';
export { nodeConfigApi } from './nodeConfigApi';

// 统一导出所有API
export const api = {
  auth: authApi,
  user: userApi,
  strategy: strategyApi,
  backtest: backtestApi,
  stock: stockApi,
  stocks: stocksApi,
  notification: notificationApi,
  system: systemApi,
  stockSelection: stockSelectionApi,
  aiWorkflow: aiWorkflowApi,
  home: homeApi,
  nodeConfig: nodeConfigApi,
};

// 默认导出
export default api; 