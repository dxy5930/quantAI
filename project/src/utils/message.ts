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
    let title = '错误';
    let content = customMessage || '操作失败';

    // 根据错误代码设置不同的标题和默认消息
    switch (errorCode) {
      case ErrorCode.UNAUTHORIZED:
      case ErrorCode.TOKEN_EXPIRED:
        title = '认证失败';
        content = customMessage || '登录已过期，请重新登录';
        break;
      case ErrorCode.PERMISSION_DENIED:
        title = '权限不足';
        content = customMessage || '您没有执行此操作的权限';
        break;
      case ErrorCode.VALIDATION_ERROR:
        title = '参数错误';
        content = customMessage || '请检查输入的参数是否正确';
        break;
      case ErrorCode.RESOURCE_NOT_FOUND:
        title = '资源不存在';
        content = customMessage || '请求的资源不存在';
        break;
      case ErrorCode.NETWORK_ERROR:
        title = '网络错误';
        content = customMessage || '网络连接失败，请检查网络连接';
        break;
      case ErrorCode.DATABASE_ERROR:
        title = '数据库错误';
        content = customMessage || '数据库操作失败，请稍后重试';
        break;
      case ErrorCode.EXTERNAL_SERVICE_ERROR:
        title = '服务错误';
        content = customMessage || '外部服务暂时不可用，请稍后重试';
        break;
      case ErrorCode.AI_SERVICE_UNAVAILABLE:
        title = 'AI服务错误';
        content = customMessage || 'AI分析服务暂时不可用，请稍后重试';
        break;
      case ErrorCode.BACKTEST_FAILED:
        title = '回测失败';
        content = customMessage || '回测执行失败，请检查参数后重试';
        break;
      case ErrorCode.BACKTEST_LIMIT_EXCEEDED:
        title = '回测限制';
        content = customMessage || '今日回测次数已达上限，请明日再试';
        break;
      case ErrorCode.STOCK_NOT_FOUND:
        title = '股票不存在';
        content = customMessage || '找不到指定的股票信息';
        break;
      default:
        title = '系统错误';
        content = customMessage || '系统出现未知错误，请稍后重试';
    }

    appStore.showError(content, title, duration);
  },

  // 处理API错误响应
  handleApiError: (error: any) => {
    if (error && typeof error === 'object') {
      // 统一错误响应格式
      if ('success' in error && error.success === false) {
        if (error.code) {
          message.errorByCode(error.code, error.message);
        } else {
          message.error(error.message || '操作失败');
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