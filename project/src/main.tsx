import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { configure } from 'mobx';
import App from './App.tsx';
import './index.css';
import { authService } from './services/authService';
import { pythonApiClient } from './services/pythonApiClient';

// 配置 MobX 以在现代 JavaScript 环境中正常工作
configure({
  enforceActions: "never",
  computedRequiresReaction: false,
  reactionRequiresObservable: false,
  observableRequiresReaction: false,
  disableErrorBoundaries: true,
  useProxies: "always", // 强制使用Proxy，避免ES5兼容性问题
  isolateGlobalState: true
});

// 初始化认证状态
authService.initializeAuth();

// 添加全局连接清理机制
const setupGlobalCleanup = () => {
  // 页面卸载时清理所有连接（关闭网页、刷新页面）
  const handleBeforeUnload = () => {
    try {
      if (pythonApiClient.getActiveConnectionCount() > 0) {
        console.log('页面关闭，清理所有活跃连接');
        pythonApiClient.closeAllConnections();
      }
    } catch (error) {
      console.error('页面关闭时清理连接失败:', error);
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);

  // 返回清理函数
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
};

// 设置全局清理
setupGlobalCleanup();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
