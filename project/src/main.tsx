import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { configure } from 'mobx';
import App from './App.tsx';
import './index.css';
import { authService } from './services/authService';

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

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
