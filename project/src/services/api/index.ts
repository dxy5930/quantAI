// API 服务导出
import { authApi } from "./authApi";

import { userApi } from "./userApi";
import { systemApi } from "./systemApi";
import { notificationApi } from "./notificationApi";
import { reviewApi } from "./reviewApi";
import { liveApi } from "./liveApi";

// 统一API客户端
export const api = {
  auth: authApi,

  user: userApi,
  system: systemApi,
  notification: notificationApi,
  review: reviewApi,
  live: liveApi,
};

// 单独导出API服务
export { authApi } from "./authApi";

export { userApi } from "./userApi";
export { systemApi } from "./systemApi";
export { notificationApi } from "./notificationApi";
export { reviewApi } from "./reviewApi";
export { liveApi } from "./liveApi";

// 导出API类型
export * from "./types";
