import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // 重写canActivate方法，使其不会抛出异常
  canActivate(context: ExecutionContext) {
    // 调用父类的canActivate方法，但捕获异常
    return super.canActivate(context);
  }

  // 重写handleRequest方法，使其在认证失败时不抛出异常
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // 如果有用户信息，返回用户；否则返回null
    // 不抛出异常，允许请求继续处理
    return user || null;
  }
}