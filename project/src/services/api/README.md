# API 模块化结构说明

## 文件结构

```
src/services/api/
├── index.ts              # 统一入口文件
├── types.ts              # 通用类型定义
├── authApi.ts            # 认证相关API
├── userApi.ts            # 用户相关API
├── strategyApi.ts        # 策略相关API
├── backtestApi.ts        # 回测相关API
├── stockApi.ts           # 股票相关API
├── notificationApi.ts    # 通知相关API
├── systemApi.ts          # 系统相关API
└── README.md             # 说明文档
```

## 模块说明

### 1. types.ts - 通用类型定义
包含所有API模块共用的类型定义：
- 分页参数和响应类型
- 用户信息类型
- 策略相关类型
- 回测相关类型
- 股票信息类型
- 认证相关类型
- 通知类型
- 系统状态类型

### 2. authApi.ts - 认证API模块
```typescript
import { authApi } from '../services/api/authApi';

// 用户登录
const response = await authApi.login({ username: 'username', password: 'password' });

// 用户注册
const response = await authApi.register({ username: 'username', email: 'user@example.com', password: 'password', confirmPassword: 'password' });

// 刷新token
const response = await authApi.refreshToken('refresh_token');

// 获取当前用户信息
const response = await authApi.getCurrentUser();

// 登出
await authApi.logout();
```

### 3. userApi.ts - 用户API模块
```typescript
import { userApi } from '../services/api/userApi';

// 获取用户资料
const response = await userApi.getProfile();

// 更新用户资料
const response = await userApi.updateProfile({ username: 'newname' });

// 获取用户统计信息
const response = await userApi.getUserStats();

// 根据ID获取用户信息
const response = await userApi.getUserById('user_id');

// 上传头像
const response = await userApi.uploadAvatar(file);
```

### 4. strategyApi.ts - 策略API模块
```typescript
import { strategyApi } from '../services/api/strategyApi';

// 获取策略列表
const response = await strategyApi.getStrategies({ page: 1, limit: 10, search: 'MA' });

// 获取我的策略
const response = await strategyApi.getMyStrategies({ page: 1, limit: 10 });

// 获取热门策略
const response = await strategyApi.getPopularStrategies();

// 根据ID获取策略
const response = await strategyApi.getStrategyById('strategy_id');

// 创建策略
const response = await strategyApi.createStrategy({
  name: '测试策略',
  description: '这是一个测试策略',
  type: 'momentum',
  parameters: { lookback_period: 20 },
  is_public: false
});

// 更新策略
const response = await strategyApi.updateStrategy('strategy_id', { name: '新名称' });

// 删除策略
await strategyApi.deleteStrategy('strategy_id');

// 分享策略
const response = await strategyApi.shareStrategy('strategy_id');

// 点赞策略
await strategyApi.likeStrategy('strategy_id');

// 收藏策略
await strategyApi.favoriteStrategy('strategy_id');

// 复制策略
const response = await strategyApi.cloneStrategy('strategy_id');
```

### 5. backtestApi.ts - 回测API模块
```typescript
import { backtestApi } from '../services/api/backtestApi';

// 运行回测
const response = await backtestApi.runBacktest({
  strategy_id: 'strategy_id',
  start_date: '2023-01-01',
  end_date: '2023-12-31',
  initial_capital: 100000,
  symbols: ['AAPL', 'GOOGL']
});

// 获取回测历史
const response = await backtestApi.getBacktestHistory({ page: 1, limit: 10 });

// 根据ID获取回测结果
const response = await backtestApi.getBacktestResult('backtest_id');

// 删除回测结果
await backtestApi.deleteBacktestResult('backtest_id');

// 导出回测结果
await backtestApi.exportBacktestResult('backtest_id', 'csv');
```

### 6. stockApi.ts - 股票API模块
```typescript
import { stockApi } from '../services/api/stockApi';

// 获取股票推荐
const response = await stockApi.getRecommendations({
  strategy_type: 'momentum',
  market_cap_min: 1000000000,
  limit: 20
});

// 股票筛选
const response = await stockApi.screenStocks({
  market_cap_min: 1000000000,
  sector: 'Technology',
  page: 1,
  limit: 50
});

// 搜索股票
const response = await stockApi.searchStocks('AAPL', 10);

// 根据代码获取股票信息
const response = await stockApi.getStockBySymbol('AAPL');

// 获取股票历史数据
const response = await stockApi.getStockHistory('AAPL', {
  start_date: '2023-01-01',
  end_date: '2023-12-31',
  interval: '1d'
});

// 获取股票实时数据
const response = await stockApi.getStockRealtime(['AAPL', 'GOOGL', 'MSFT']);
```

### 7. notificationApi.ts - 通知API模块
```typescript
import { notificationApi } from '../services/api/notificationApi';

// 获取通知列表
const response = await notificationApi.getNotifications({ page: 1, limit: 10, read: false });

// 根据ID获取通知详情
const response = await notificationApi.getNotificationById('notification_id');

// 标记通知为已读
await notificationApi.markAsRead('notification_id');

// 标记所有通知为已读
await notificationApi.markAllAsRead();

// 删除通知
await notificationApi.deleteNotification('notification_id');

// 批量删除通知
await notificationApi.batchDeleteNotifications(['id1', 'id2', 'id3']);

// 获取未读通知数量
const response = await notificationApi.getUnreadCount();
```

### 8. systemApi.ts - 系统API模块
```typescript
import { systemApi } from '../services/api/systemApi';

// 获取系统状态
const response = await systemApi.getSystemStatus();

// 获取系统配置
const response = await systemApi.getSystemConfig();

// 健康检查
const response = await systemApi.healthCheck();

// 获取系统版本信息
const response = await systemApi.getVersionInfo();

// 获取系统指标
const response = await systemApi.getSystemMetrics();

// 获取系统日志
const response = await systemApi.getSystemLogs({
  level: 'error',
  start_date: '2023-01-01',
  limit: 100
});
```

## 使用方式

### 方式1：使用统一API对象（推荐）
```typescript
import { api } from '../services/api';

// 认证相关
const authResponse = await api.auth.login({ username: 'username', password: 'password' });

// 策略相关
const strategies = await api.strategy.getStrategies({ page: 1, limit: 10 });

// 回测相关
const backtestResult = await api.backtest.runBacktest({
  strategy_id: 'strategy_id',
  start_date: '2023-01-01',
  end_date: '2023-12-31',
  initial_capital: 100000,
  symbols: ['AAPL']
});
```

### 方式2：直接导入特定模块
```typescript
import { authApi } from '../services/api/authApi';
import { strategyApi } from '../services/api/strategyApi';

// 只使用认证API
const authResponse = await authApi.login({ username: 'username', password: 'password' });

// 只使用策略API
const strategies = await strategyApi.getStrategies({ page: 1, limit: 10 });
```

### 方式3：从统一入口导入特定模块
```typescript
import { authApi, strategyApi, backtestApi } from '../services/api';

// 使用特定模块
const authResponse = await authApi.login({ username: 'username', password: 'password' });
const strategies = await strategyApi.getStrategies({ page: 1, limit: 10 });
```

## 向后兼容性

原有的 `services/api.ts` 文件仍然存在，并重新导出了所有模块化API的内容，确保现有代码无需修改即可继续工作：

```typescript
// 原有的导入方式仍然有效
import { api, authApi, strategyApi } from '../services/api';
```

## 添加新的API模块

1. 在 `src/services/api/` 目录下创建新的API模块文件
2. 在新文件中定义API接口
3. 在 `types.ts` 中添加相关类型定义（如需要）
4. 在 `index.ts` 中导入并导出新模块
5. 更新统一API对象

例如，添加一个新的 `portfolioApi.ts`：

```typescript
// portfolioApi.ts
import { httpClient } from '../../utils/httpClient';
import { ApiResponse } from './types';

export const portfolioApi = {
  async getPortfolios(): Promise<ApiResponse<any[]>> {
    return httpClient.get('/portfolios');
  },
  
  async createPortfolio(data: any): Promise<ApiResponse<any>> {
    return httpClient.post('/portfolios', data);
  },
};

export default portfolioApi;
```

```typescript
// index.ts
import { portfolioApi } from './portfolioApi';

export { portfolioApi } from './portfolioApi';

export const api = {
  auth: authApi,
  user: userApi,
  strategy: strategyApi,
  backtest: backtestApi,
  stock: stockApi,
  notification: notificationApi,
  system: systemApi,
  portfolio: portfolioApi, // 新增
};
```

## 优势

1. **模块化**：每个API模块独立，便于维护和测试
2. **类型安全**：统一的类型定义，确保类型一致性
3. **按需导入**：可以只导入需要的API模块，减少bundle大小
4. **向后兼容**：现有代码无需修改
5. **易于扩展**：添加新API模块非常简单
6. **清晰的结构**：每个文件职责单一，代码组织清晰 