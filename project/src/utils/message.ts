import { appStore } from '../stores/AppStore';
import { ErrorCode } from '../types';

// 全局消息提示工具，类似 Ant Design 的 message
export const message = {
  success: (content: string, duration: number = 3000) => {
    appStore.showSuccess(content, '成功', duration);
  },
  
  error: (content: string, duration: number = 5000) => {
    appStore.showError(content, '错误', duration);
  },
  
  warning: (content: string, duration: number = 4000) => {
    appStore.showWarning(content, '警告', duration);
  },
  
  info: (content: string, duration: number = 3000) => {
    appStore.showInfo(content, '提示', duration);
  },
  
  // 带自定义标题的方法
  successWithTitle: (content: string, title: string, duration: number = 3000) => {
    appStore.showSuccess(content, title, duration);
  },
  
  errorWithTitle: (content: string, title: string, duration: number = 5000) => {
    appStore.showError(content, title, duration);
  },
  
  warningWithTitle: (content: string, title: string, duration: number = 4000) => {
    appStore.showWarning(content, title, duration);
  },
  
  infoWithTitle: (content: string, title: string, duration: number = 3000) => {
    appStore.showInfo(content, title, duration);
  },

  // 根据错误代码显示相应的错误信息
  errorByCode: (errorCode: ErrorCode | number | string, customMessage?: string, duration: number = 5000) => {
    // 优先显示自定义信息
    if (customMessage) {
      appStore.showError(customMessage, '错误', duration);
      return;
    }

    // 基于错误码的兜底提示
    const codeNum = typeof errorCode === 'string' ? parseInt(errorCode, 10) : (errorCode as number);
    let content = '操作失败，请稍后重试';

    switch (codeNum) {
      case 11001:
        content = '用户不存在';
        break;
      case 11002:
        content = '密码错误';
        break;
      case 11003:
        content = '账户已被禁用';
        break;
      case 11004:
        content = '令牌已过期，请重新登录';
        break;
      default:
        content = '操作失败，请稍后重试';
    }

    appStore.showError(content, '错误', duration);
  },

  // 处理API错误响应
  handleApiError: (error: any) => {
    if (error && typeof error === 'object') {
      // 统一错误响应格式
      if ('success' in error && error.success === false) {
        if (error.message) {
          appStore.showError(error.message, '错误');
          return;
        }
        if (error.code) {
          message.errorByCode(error.code);
        } else {
          message.error('操作失败');
        }
        return;
      }
      
      // HTTP错误对象
      if (error.statusCode && error.message) {
        if (error.errorCode) {
          message.errorByCode(error.errorCode, error.message);
        } else {
          message.error(error.message);
        }
        return;
      }

      // 如果是Axios错误结构，尝试读取 response.data.message
      if (error.response?.data?.message) {
        appStore.showError(error.response.data.message, '错误');
        return;
      }
    }
    
    // 字符串错误
    if (typeof error === 'string') {
      message.error(error);
      return;
    }
    
    // 默认错误处理
    message.error('操作失败，请稍后重试');
  }
};

// 导出默认的 message 对象
export default message;