# Pages 目录结构

本目录包含所有页面组件，按功能模块组织到不同的文件夹中。

## 目录结构

```
src/pages/
├── home/                    # 首页
│   └── index.tsx           # 首页组件
├── auth/                    # 认证相关页面
│   ├── LoginPage.tsx       # 登录页面
│   ├── RegisterPage.tsx    # 注册页面
│   └── index.ts            # 统一导出
├── strategy/                # 策略相关页面
│   ├── StrategyConfigPage.tsx  # 策略配置页面
│   └── index.ts            # 统一导出
├── backtest/               # 回测相关页面
│   ├── BacktestResultsPage.tsx    # 回测结果页面
│   ├── BacktestHistoryPage.tsx    # 回测历史页面
│   └── index.ts            # 统一导出
├── user/                   # 用户相关页面
│   ├── ProfilePage.tsx     # 个人资料页面
│   ├── SettingsPage.tsx    # 设置页面
│   └── index.ts            # 统一导出
├── ranking/                # 排行榜页面
│   └── index.tsx          # 排行榜组件
├── help/                   # 帮助页面
│   └── index.tsx          # 帮助组件
├── about/                  # 关于页面
│   └── index.tsx          # 关于组件
└── error/                  # 错误页面
    ├── NotFoundPage.tsx    # 404页面
    ├── UnauthorizedPage.tsx # 401页面
    └── ServerErrorPage.tsx # 500页面
```

## 设计原则

1. **模块化组织**: 每个功能模块都有自己的文件夹
2. **便于扩展**: 每个文件夹都可以添加子组件和相关文件
3. **统一导出**: 复杂模块提供index.ts统一导出
4. **默认导出**: 所有页面组件都使用默认导出

## 添加新页面

### 1. 简单页面（如about、help）
直接在对应文件夹下创建index.tsx文件：

```typescript
import React from 'react';

const NewPage: React.FC = () => {
  return (
    <div>
      {/* 页面内容 */}
    </div>
  );
};

export default NewPage;
```

### 2. 复杂页面（如auth、user）
1. 创建具体的页面文件（如NewPage.tsx）
2. 在index.ts中添加导出：

```typescript
// index.ts
export { default as NewPage } from './NewPage';
```

## 导入方式

### 从路由中导入（推荐）
```typescript
const NewPage = lazy(() => import('../pages/module/NewPage'));
// 或者对于index.tsx
const NewPage = lazy(() => import('../pages/module'));
```

### 从其他组件中导入
```typescript
import NewPage from '../pages/module/NewPage';
// 或者
import { NewPage } from '../pages/module';
```

## 注意事项

1. 所有页面组件都应该使用React.memo或observer包装
2. 导入路径相对于src目录，注意使用正确的相对路径
3. 页面组件应该处理自己的加载状态和错误状态
4. 遵循统一的命名规范（PascalCase） 