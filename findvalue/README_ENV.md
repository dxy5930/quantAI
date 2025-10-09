# 多环境构建配置说明

本项目支持多环境配置，包括开发环境(dev)、测试环境(test)、预发布环境(staging)和生产环境(prod)。

## 环境文件

- `.env.dev` - 开发环境配置
- `.env.test` - 测试环境配置  
- `.env.staging` - 预发布环境配置
- `.env.prod` - 生产环境配置
- `.env.example` - 环境配置模板

## 构建配置

### Android构建配置
- 使用Gradle构建变体(Product Flavors)
- 每个环境有独立的包名和应用名称
- 支持同时安装多个环境的应用

### iOS构建配置
- 使用不同的Info.plist文件
- 每个环境有独立的显示名称
- 支持同时安装多个环境的应用

## 使用方法

### 1. 启动开发服务器

```bash
# 开发环境
npm run start:dev

# 测试环境
npm run start:test

# 预发布环境
npm run start:staging

# 生产环境
npm run start:prod
```

### 2. 运行Android应用

```bash
# 开发环境
npm run android:dev

# 测试环境
npm run android:test

# 预发布环境
npm run android:staging

# 生产环境
npm run android:prod
```

### 3. 运行iOS应用

```bash
# 开发环境
npm run ios:dev

# 测试环境
npm run ios:test

# 预发布环境
npm run ios:staging

# 生产环境
npm run ios:prod
```

### 4. 构建应用

```bash
# 单个环境构建
npm run build:android:dev    # Android开发版本
npm run build:android:test   # Android测试版本
npm run build:android:staging # Android预发布版本
npm run build:android:prod   # Android生产版本

npm run build:ios:dev        # iOS开发版本
npm run build:ios:test       # iOS测试版本
npm run build:ios:staging    # iOS预发布版本
npm run build:ios:prod       # iOS生产版本

# 批量构建
npm run build:all:android    # 构建所有Android环境
npm run build:all:ios        # 构建所有iOS环境
npm run build:all            # 构建所有环境

# 使用构建脚本
npm run build:script         # 使用Node.js脚本构建所有环境
npm run build:script:android # 使用脚本构建Android所有环境
npm run build:script:ios     # 使用脚本构建iOS所有环境

# 直接使用脚本文件
node scripts/build-all.js [android|ios|all]
```

### 5. 清理缓存

```bash
npm run clean          # 清理所有缓存
npm run clean:android  # 清理Android缓存
npm run clean:ios      # 清理iOS缓存
npm run reset-cache    # 重置Metro缓存
```

## 环境配置说明

### 开发环境 (dev)
- 使用本地API服务器
- 启用调试模式
- 详细的日志输出
- 启用调试工具

### 测试环境 (test)
- 使用测试API服务器
- 关闭调试模式
- 中等详细度的日志
- 关闭调试工具

### 预发布环境 (staging)
- 使用预发布API服务器
- 关闭调试模式
- 警告级别日志
- 关闭调试工具

### 生产环境 (prod)
- 使用生产API服务器
- 关闭调试模式
- 仅错误级别日志
- 关闭调试工具

## 在代码中使用环境配置

```typescript
// 直接使用环境变量
const apiUrl = process.env.API_BASE_URL || 'http://localhost:3000';
const debugMode = process.env.DEBUG_MODE === 'true';
const nodeEnv = process.env.NODE_ENV || 'development';

// 环境判断
const isDevelopment = nodeEnv === 'development';
const isProduction = nodeEnv === 'production';

// 日志输出
if (debugMode) {
  console.log('调试模式已启用');
}

// 根据环境使用不同的配置
const config = {
  apiUrl,
  timeout: isDevelopment ? 10000 : 30000,
  enableLogging: debugMode,
};
```

## 注意事项

1. **默认环境**: 系统默认使用生产环境，防止在生产环境中意外使用测试数据。所有默认脚本都指向生产环境。

2. **Android测试环境**: 由于Android中"test"是保留字段，我们使用"testing"作为构建变体名称，避免与Android的test目录冲突。

3. **环境变量**: 确保在部署前正确配置各环境的敏感信息（如API密钥、数据库密码等）。

4. **版本管理**: 不同环境使用不同的版本号标识，便于区分和追踪。

5. **安全考虑**: 默认环境设置为生产环境，避免在生产环境中意外使用开发或测试配置。

6. **安全**: 生产环境的敏感信息应通过安全的密钥管理系统管理，不要直接写在配置文件中。

## 部署建议

1. 开发环境：用于本地开发和调试
2. 测试环境：用于功能测试和集成测试
3. 预发布环境：用于生产前的最终验证
4. 生产环境：正式发布环境

每个环境都应该有独立的数据库和API服务，确保环境隔离。
