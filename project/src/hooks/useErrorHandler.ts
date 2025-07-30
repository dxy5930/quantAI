import { useState, useCallback } from 'react';
import { HttpError } from '../utils/httpClient';
import { ErrorResponse, ErrorCode } from '../types';
import { message } from '../utils/message';

interface ErrorState {
  error: Error | HttpError | ErrorResponse | string | null;
  isError: boolean;
}

interface UseErrorHandlerReturn extends ErrorState {
  setError: (error: Error | HttpError | ErrorResponse | string | null) => void;
  clearError: () => void;
  handleError: (error: unknown) => void;
  handleApiError: (error: unknown) => void;
  retry: (fn: () => Promise<void> | void) => Promise<void>;
}

export const useErrorHandler = (initialError: Error | HttpError | ErrorResponse | string | null = null): UseErrorHandlerReturn => {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: initialError,
    isError: !!initialError,
  });

  const setError = useCallback((error: Error | HttpError | ErrorResponse | string | null) => {
    setErrorState({
      error,
      isError: !!error,
    });
  }, []);

  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isError: false,
    });
  }, []);

  const handleError = useCallback((error: unknown) => {
    console.error('Error handled:', error);
    
    if (error instanceof Error || error instanceof HttpError) {
      setError(error);
    } else if (typeof error === 'string') {
      setError(error);
    } else if (error && typeof error === 'object' && 'success' in error && (error as any).success === false) {
      // 统一错误响应格式
      setError(error as ErrorResponse);
    } else {
      setError('发生未知错误');
    }
  }, [setError]);

  const handleApiError = useCallback((error: unknown) => {
    // 设置本地错误状态
    handleError(error);
    
    // 显示全局错误提示
    if (error instanceof HttpError) {
      // 根据HTTP状态码进行特殊处理
      if (error.isAuthError()) {
        // 认证错误，可能需要重新登录
        console.log('Authentication error, redirecting to login...');
        message.errorByCode(ErrorCode.UNAUTHORIZED, error.message);
      } else if (error.isNetworkError()) {
        // 网络错误
        message.errorByCode(ErrorCode.NETWORK_ERROR, error.message);
      } else if (error.isServerError()) {
        // 服务器错误
        message.errorByCode(ErrorCode.EXTERNAL_SERVICE_ERROR, error.message);
      } else if (error.isValidationError()) {
        // 验证错误
        message.errorByCode(ErrorCode.VALIDATION_ERROR, error.message);
      } else {
        message.error(error.message);
      }
    } else if (error && typeof error === 'object' && 'success' in error && (error as any).success === false) {
      // 统一错误响应格式
      const errorResponse = error as ErrorResponse;
      if (errorResponse.code) {
        message.errorByCode(errorResponse.code, errorResponse.message);
      } else {
        message.error(errorResponse.message);
      }
    } else if (typeof error === 'string') {
      message.error(error);
    } else {
      message.error('操作失败，请稍后重试');
    }
  }, [handleError]);

  const retry = useCallback(async (fn: () => Promise<void> | void) => {
    try {
      clearError();
      await fn();
    } catch (error) {
      handleApiError(error);
    }
  }, [clearError, handleApiError]);

  return {
    ...errorState,
    setError,
    clearError,
    handleError,
    handleApiError,
    retry,
  };
};

// 专门用于API请求的错误处理Hook
export const useApiErrorHandler = () => {
  const errorHandler = useErrorHandler();

  const handleApiError = useCallback((error: unknown) => {
    errorHandler.handleApiError(error);
  }, [errorHandler]);

  return {
    ...errorHandler,
    handleApiError,
  };
};

// 用于异步操作的错误处理Hook
export const useAsyncError = () => {
  const [isLoading, setIsLoading] = useState(false);
  const errorHandler = useErrorHandler();

  const execute = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    onSuccess?: (result: T) => void,
    onError?: (error: unknown) => void
  ): Promise<T | null> => {
    try {
      setIsLoading(true);
      errorHandler.clearError();
      
      const result = await asyncFn();
      onSuccess?.(result);
      return result;
    } catch (error) {
      errorHandler.handleError(error);
      onError?.(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [errorHandler]);

  const retry = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    onSuccess?: (result: T) => void
  ): Promise<T | null> => {
    return execute(asyncFn, onSuccess);
  }, [execute]);

  return {
    ...errorHandler,
    isLoading,
    execute,
    retry,
  };
};