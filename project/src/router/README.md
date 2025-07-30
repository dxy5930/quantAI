# 路由系统说明

## 概述

本项目采用了统一的路由管理架构，基于React Router v6构建，提供了完整的路由配置、守卫、导航工具等功能。

## 目录结构

```
src/router/
├── index.ts              # 统一导出
├── AppRouter.tsx         # 主路由组件
├── RouteGuard.tsx        # 路由守卫
├── routes.tsx            # 路由配置
├── navigation.ts         # 导航工具
├── layouts/              # 布局组件
│   ├── AuthLayout.tsx    # 认证页面布局
│   └── MinimalLayout.tsx # 简化布局
└── README.md            # 说明文档
```

## 主要特性

### 1. 统一路由配置
- 所有路由配置集中在 `routes.tsx` 中
- 支持懒加载，提高应用性能
- 路由元数据管理，支持权限控制

### 2. 路由守卫
- 自动保护需要认证的路由
- 未登录用户自动重定向到登录页
- 已登录用户访问登录页时重定向到首页

### 3. 多种布局支持
- `AuthLayout`: 认证页面专用布局
- `MinimalLayout`: 错误页面简化布局
- `Layout`: 主应用布局（带导航栏等）

### 4. 类型安全的导航
- 提供 `useNavigation` Hook
- 类型安全的路由参数
- 丰富的导航方法

## 使用方法

### 1. 基本使用

```tsx
import { AppRouter } from './router';

function App() {
  return <AppRouter />;
}
```

### 2. 路由常量

```tsx
import { ROUTES } from './router';

// 使用路由常量
const loginPath = ROUTES.LOGIN;
const strategyPath = ROUTES.STRATEGY_CONFIG; // '/strategy/:id'
```

### 3. 导航工具

```tsx
import { useNavigation } from './router';

function MyComponent() {
  const nav = useNavigation();

  const handleLogin = () => {
    nav.toLogin();
  };

  const handleViewStrategy = (id: string) => {
    nav.toStrategyConfig(id);
  };

  return (
    <div>
      <button onClick={handleLogin}>登录</button>
      <button onClick={() => handleViewStrategy('123')}>查看策略</button>
    </div>
  );
}
```

### 4. 路由守卫

路由守卫会自动工作，无需手动配置：

```tsx
// 访问受保护的路由时，未登录用户会被重定向到登录页
// 已登录用户访问登录页时，会被重定向到首页
```

## 路由配置

### 路由元数据

每个路由都可以配置元数据：

```tsx
export const ROUTE_METADATA: Record<string, RouteMetadata> = {
  [ROUTES.HOME]: {
    path: ROUTES.HOME,
    title: '首页',
    description: '量化交易策略平台首页',
    layout: 'default',
    icon: 'Home',
    showInNav: true,
    requiresAuth: false,
    order: 1
  }
};
```

### 添加新路由

1. 在 `constants/routes.ts` 中添加路由常量
2. 在 `ROUTE_METADATA` 中添加元数据
3. 在 `routes.tsx` 中添加路由配置
4. 创建对应的页面组件

## 工具函数

### 路由工具

```tsx
import { buildPath, isProtectedRoute, getRouteTitle } from './router';

// 构建带参数的路径
const strategyPath = buildPath(ROUTES.STRATEGY_CONFIG, { id: '123' });

// 检查路由是否需要认证
const needsAuth = isProtectedRoute('/profile');

// 获取路由标题
const title = getRouteTitle('/');
```

### 导航助手

```tsx
import { useNavigation } from './router';

function MyComponent() {
  const nav = useNavigation();

  // 各种导航方法
  nav.toHome();
  nav.toLogin();
  nav.toStrategyConfig('123');
  nav.back();
  nav.forward();
  nav.replace('/new-path');
  nav.to('/custom-path', { state: { data: 'value' } });
}
```

## 最佳实践

1. **使用路由常量**: 避免硬编码路径字符串
2. **类型安全**: 使用提供的导航工具而不是直接使用 `useNavigate`
3. **懒加载**: 大型页面组件应该使用懒加载
4. **路由守卫**: 依赖自动路由守卫，不要手动检查认证状态
5. **元数据**: 为每个路由配置完整的元数据信息

## 扩展功能

### 添加新的布局

1. 在 `layouts/` 目录下创建新的布局组件
2. 在 `routes.tsx` 中使用新布局
3. 在 `index.ts` 中导出新布局

### 添加路由中间件

可以扩展 `RouteGuard` 组件来添加更多的路由中间件功能：

```tsx
// 例如：角色权限检查、页面访问统计等
```

### 自定义导航行为

可以扩展 `NavigationHelper` 类来添加自定义导航行为：

```tsx
class CustomNavigationHelper extends NavigationHelper {
  // 添加自定义方法
  toCustomPage = (params: any) => {
    // 自定义逻辑
  };
}
``` 