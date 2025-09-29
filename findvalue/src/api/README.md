# API 层架构说明

## 📁 目录结构

```
src/api/
├── README.md           # 架构说明文档
├── index.ts           # API 统一入口
├── auth/              # 认证模块
│   └── index.ts       # 认证相关 API
├── user/              # 用户模块  
│   └── index.ts       # 用户相关 API
└── mine/              # Mine 模块
    └── index.ts       # 业务对象相关 API
```

## 🏗️ 分层架构

### 1. HTTP 层 (`src/utils/axios.ts`)
- **职责**：统一错误处理、请求拦截、响应拦截
- **特点**：BusinessError 友好错误消息、自动重试、Token 管理
- **输出**：BusinessResult<T> 包含 data 和 message

### 2. API 层 (`src/api/`)
- **职责**：封装 HTTP 接口调用、定义请求响应类型
- **特点**：按模块组织、函数导出、类型安全
- **输出**：Promise<BusinessResult<T>>

### 3. Service 层 (`src/services/`)
- **职责**：业务逻辑处理、数据验证转换、调用 API 层
- **特点**：直接获取业务数据、专注业务逻辑
- **输出**：Promise<T> 业务数据

### 4. Component 层 (`src/components/`, `src/pages/`)
- **职责**：UI 交互、调用 Service 层、状态管理
- **特点**：只处理 BusinessError、专注用户体验

## 📝 使用示例

### API 层示例

```typescript
// src/api/user/index.ts
export const getUserInfo = (userId: string) => {
  return api.get<UserInfo>(`/users/${userId}`);
};

export const updateProfile = (userId: string, data: UpdateProfileRequest) => {
  return api.put<UserInfo>(`/users/${userId}/profile`, data);
};
```

### Service 层示例

```typescript
// src/services/user.ts
import * as UserApi from '../api/user';

export class UserService {
  static async getUserInfo(userId: string): Promise<UserInfo> {
    const result = await UserApi.getUserInfo(userId);
    return result.data; // 直接拿到业务数据
  }

  static async updateProfile(userId: string, data: UpdateProfileRequest): Promise<UserInfo> {
    // 客户端验证
    if (data.email && !this.isValidEmail(data.email)) {
      throw new BusinessError('邮箱格式不正确');
    }

    const result = await UserApi.updateProfile(userId, data);
    return result.data;
  }
}
```

### Component 层示例

```typescript
// 组件中使用
import { UserService, BusinessError } from '../services';

const handleUpdateProfile = async () => {
  try {
    const updatedUser = await UserService.updateProfile(userId, formData);
    setUserInfo(updatedUser); // 直接使用业务数据
    showSuccess('更新成功');
  } catch (error) {
    if (error instanceof BusinessError) {
      showError(error.message); // 友好错误消息
    }
  }
};
```

## ✅ 架构优势

### 1. 关注点分离
- 每层职责清晰，互不干扰
- HTTP 错误处理集中在 axios 层
- 业务逻辑集中在 Service 层
- UI 交互集中在 Component 层

### 2. 错误处理统一
- 所有错误转换为 BusinessError
- 友好的中文错误消息
- 网络错误自动重试
- 401 错误自动跳转登录

### 3. 类型安全
- 完整的 TypeScript 类型定义
- 请求参数和响应数据类型化
- 编译时错误检查

### 4. 代码简洁
- Service 层代码减少 50% 以上
- 成功场景代码更简洁
- 无需重复的 try-catch 和状态判断

### 5. 易于维护
- 按模块组织，结构清晰
- API 接口变更只需修改 API 层
- 错误处理逻辑修改一处影响全局

## 🔧 添加新模块

### 1. 创建 API 层

```typescript
// src/api/newModule/index.ts
import { api } from '../../utils/axios';

export interface NewModuleRequest {
  // 请求参数类型
}

export interface NewModuleResponse {
  // 响应数据类型  
}

export const getNewModuleData = (id: string) => {
  return api.get<NewModuleResponse>(`/new-module/${id}`);
};
```

### 2. 创建 Service 层

```typescript
// src/services/newModule.ts
import * as NewModuleApi from '../api/newModule';

export class NewModuleService {
  static async getData(id: string) {
    const result = await NewModuleApi.getNewModuleData(id);
    return result.data;
  }
}
```

### 3. 更新入口文件

```typescript
// src/api/index.ts
export * as NewModuleApi from './newModule';

// src/services/index.ts
export { NewModuleService } from './newModule';
```

## 🚀 最佳实践

1. **API 层**：只负责接口调用，不包含业务逻辑
2. **Service 层**：进行数据验证和转换，组合多个 API 调用
3. **错误处理**：统一使用 BusinessError，提供友好错误消息
4. **类型定义**：为所有请求参数和响应数据定义类型
5. **命名规范**：使用清晰的函数和类型命名 