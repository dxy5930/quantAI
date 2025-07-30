import { NestFactory } from "@nestjs/core";
import { ValidationPipe, ClassSerializerInterceptor } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import * as express from 'express';
import { AppModule } from "./app.module";
import { ApiPrefixService, ApiPrefixUtil } from "./shared/config";
import { DEV_CONSTANTS } from "./shared/constants";
import { GlobalExceptionFilter } from "./shared/filters/global-exception.filter";
import { ResponseInterceptor } from "./shared/interceptors/response.interceptor";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
  });

  const configService = app.get(ConfigService);
  const port = configService.get("PORT", 3001);
  
  // 从依赖注入容器获取API前缀服务
  const apiPrefixService = app.get(ApiPrefixService);
  
  // 设置全局API前缀
  app.setGlobalPrefix(apiPrefixService.getGlobalPrefix());
  
  // 设置工具类实例，方便全局访问
  ApiPrefixUtil.setInstance(apiPrefixService);

  // 增加请求体大小限制，支持base64图片上传
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // 启用CORS - 允许所有域名跨域
  app.enableCors({
    origin: '*',
    credentials: false, // 当origin为*时，credentials必须为false
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // 全局异常过滤器 - 统一错误响应格式
  app.useGlobalFilters(new GlobalExceptionFilter());

  // 全局响应拦截器 - 统一成功响应格式
  app.useGlobalInterceptors(new ResponseInterceptor());

  // 全局序列化拦截器，确保虚拟属性被序列化
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // Swagger文档配置
  const config = new DocumentBuilder()
    .setTitle("超股量化交易策略平台 API")
    .setDescription("提供用户认证、策略管理、回测服务等功能的RESTful API")
    .setVersion("1.0")
    .addBearerAuth()
    .addTag("auth", "用户认证")
    .addTag("users", "用户管理")
    .addTag("strategies", "策略管理")
    .addTag("backtest", "回测服务")
    .addTag("stocks", "股票数据")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  await app.listen(port, '0.0.0.0');
  
  // 获取本机IP地址用于显示
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  let localIP = 'localhost';
  
  // 查找本机IP地址
  for (const interfaceName in networkInterfaces) {
    const interfaces = networkInterfaces[interfaceName];
    for (const iface of interfaces) {
      if (iface.family === 'IPv4' && !iface.internal) {
        localIP = iface.address;
        break;
      }
    }
    if (localIP !== 'localhost') break;
  }
  
  console.log(`🚀 应用程序运行在:`);
  console.log(`   - 本地访问: http://localhost:${port}/${apiPrefixService.getGlobalPrefix()}`);
  console.log(`   - 局域网访问: http://${localIP}:${port}/${apiPrefixService.getGlobalPrefix()}`);
  console.log(`📚 API文档地址:`);
  console.log(`   - 本地访问: http://localhost:${port}/api/docs`);
  console.log(`   - 局域网访问: http://${localIP}:${port}/api/docs`);
}

bootstrap();
