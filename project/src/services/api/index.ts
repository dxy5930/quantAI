// API 服务导出
import { authApi } from './authApi';
import { stickyNoteApi } from './stickyNoteApi';
import { userApi } from './userApi';
import { systemApi } from './systemApi';
import { notificationApi } from './notificationApi';


// 统一API客户端
export const api = {
  auth: authApi,
  stickyNote: stickyNoteApi,
  user: userApi,
  system: systemApi,
  notification: notificationApi,
};

// 单独导出API服务
export { authApi } from './authApi';
export { stickyNoteApi } from './stickyNoteApi';
export { userApi } from './userApi';
export { systemApi } from './systemApi';
export { notificationApi } from './notificationApi';


// 导出API类型
export * from './types'; 