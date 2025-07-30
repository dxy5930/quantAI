import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorCode, ERROR_MESSAGES, ErrorResponse } from '../types';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let errorResponse: ErrorResponse;

    if (exception instanceof HttpException) {
      errorResponse = this.handleHttpException(exception, request);
    } else if (exception instanceof Error) {
      errorResponse = this.handleGenericError(exception, request);
    } else {
      errorResponse = this.handleUnknownError(exception, request);
    }

    // 记录错误日志
    this.logError(exception, request, errorResponse);

    response.status(this.getHttpStatus(errorResponse.code)).json(errorResponse);
  }

  private handleHttpException(exception: HttpException, request: Request): ErrorResponse {
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();
    
    let message: string;
    let code: ErrorCode;
    let data: any = null;

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const responseObj = exceptionResponse as any;
      message = responseObj.message || exception.message;
      
      // 如果是数组消息（通常来自验证管道），取第一个
      if (Array.isArray(message)) {
        message = message[0];
      }
      
      // 设置详细数据
      if (responseObj.details) {
        data = responseObj.details;
      }
    } else {
      message = exceptionResponse as string || exception.message;
    }

    // 根据HTTP状态码映射错误代码
    switch (status) {
      case HttpStatus.UNAUTHORIZED:
        code = ErrorCode.UNAUTHORIZED;
        break;
      case HttpStatus.FORBIDDEN:
        code = ErrorCode.PERMISSION_DENIED;
        break;
      case HttpStatus.NOT_FOUND:
        code = ErrorCode.RESOURCE_NOT_FOUND;
        break;
      case HttpStatus.BAD_REQUEST:
        code = ErrorCode.VALIDATION_ERROR;
        break;
      case HttpStatus.CONFLICT:
        // 检查消息内容确定具体错误
        if (message.includes('用户名')) {
          code = ErrorCode.USERNAME_EXISTS;
        } else if (message.includes('邮箱')) {
          code = ErrorCode.EMAIL_EXISTS;
        } else {
          code = ErrorCode.VALIDATION_ERROR;
        }
        break;
      default:
        code = ErrorCode.UNKNOWN_ERROR;
    }

    return {
      code,
      message,
      data,
      success: false,
      timestamp: new Date().toISOString(),
      path: request.url,
    };
  }

  private handleGenericError(exception: Error, request: Request): ErrorResponse {
    let code: ErrorCode;
    let message: string;

    // 检查特定错误类型
    if (exception.message.includes('数据库')) {
      code = ErrorCode.DATABASE_ERROR;
    } else if (exception.message.includes('网络') || exception.message.includes('timeout')) {
      code = ErrorCode.NETWORK_ERROR;
    } else if (exception.message.includes('外部服务')) {
      code = ErrorCode.EXTERNAL_SERVICE_ERROR;
    } else {
      code = ErrorCode.UNKNOWN_ERROR;
    }

    message = ERROR_MESSAGES[code] + (exception.message ? `: ${exception.message}` : '');

    return {
      code,
      message,
      data: null,
      success: false,
      timestamp: new Date().toISOString(),
      path: request.url,
    };
  }

  private handleUnknownError(exception: unknown, request: Request): ErrorResponse {
    return {
      code: ErrorCode.UNKNOWN_ERROR,
      message: ERROR_MESSAGES[ErrorCode.UNKNOWN_ERROR],
      data: null,
      success: false,
      timestamp: new Date().toISOString(),
      path: request.url,
    };
  }

  private logError(exception: unknown, request: Request, errorResponse: ErrorResponse): void {
    const { method, url, body, query, params } = request;
    
    const errorLog = {
      timestamp: errorResponse.timestamp,
      method,
      url,
      code: errorResponse.code,
      message: errorResponse.message,
      body,
      query,
      params,
      stack: exception instanceof Error ? exception.stack : undefined,
    };

    if (this.getHttpStatus(errorResponse.code) >= 500) {
      this.logger.error('服务器错误', errorLog);
    } else {
      this.logger.warn('客户端错误', errorLog);
    }
  }

  private getHttpStatus(code: ErrorCode | number | string): number {
    // 如果已经是HTTP状态码，直接返回
    if (typeof code === 'number' && code >= 100 && code < 600) {
      return code;
    }

    // 根据错误代码映射HTTP状态码
    switch (code) {
      case ErrorCode.UNAUTHORIZED:
      case ErrorCode.TOKEN_EXPIRED:
      case ErrorCode.INVALID_CREDENTIALS:
        return HttpStatus.UNAUTHORIZED;
      
      case ErrorCode.PERMISSION_DENIED:
      case ErrorCode.STRATEGY_PERMISSION_DENIED:
        return HttpStatus.FORBIDDEN;
      
      case ErrorCode.RESOURCE_NOT_FOUND:
      case ErrorCode.USER_NOT_FOUND:
      case ErrorCode.STRATEGY_NOT_FOUND:
      case ErrorCode.STOCK_NOT_FOUND:
        return HttpStatus.NOT_FOUND;
      
      case ErrorCode.VALIDATION_ERROR:
      case ErrorCode.USERNAME_EXISTS:
      case ErrorCode.EMAIL_EXISTS:
      case ErrorCode.BACKTEST_LIMIT_EXCEEDED:
        return HttpStatus.BAD_REQUEST;
      
      case ErrorCode.DATABASE_ERROR:
      case ErrorCode.EXTERNAL_SERVICE_ERROR:
      case ErrorCode.NETWORK_ERROR:
      case ErrorCode.BACKTEST_FAILED:
      case ErrorCode.STOCK_DATA_UNAVAILABLE:
        return HttpStatus.INTERNAL_SERVER_ERROR;
      
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }
} 