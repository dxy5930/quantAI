import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SuccessResponse } from '../types';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, SuccessResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<SuccessResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // 如果数据已经包含success字段，说明已经是统一格式，直接返回
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // 否则包装为统一格式
        return {
          code: 200,
          message: 'Success',
          data,
          success: true,
          timestamp: new Date().toISOString(),
        } as SuccessResponse<T>;
      }),
    );
  }
} 