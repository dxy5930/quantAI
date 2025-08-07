# API 路径配置说明

## 工作流相关 API 路径

本项目中工作流功能被分为两个不同的 API 模块，使用不同的路径前缀：

### 1. 工作流持久化 API (`/api/v1/workflows`)

**文件**: `python-analysis-service/api/workflow_persistence_api.py`

**功能**: 工作流的基础 CRUD 操作、步骤管理、消息管理、资源管理

**路径前缀**: `/api/v1/workflows`

**主要端点**:
- `GET /api/v1/workflows` - 获取工作流列表
- `POST /api/v1/workflows` - 创建工作流
- `GET /api/v1/workflows/{workflow_id}` - 获取单个工作流
- `PUT /api/v1/workflows/{workflow_id}` - 更新工作流
- `GET /api/v1/workflows/{workflow_id}/steps` - 获取工作流步骤
- `POST /api/v1/workflows/{workflow_id}/steps` - 创建工作流步骤
- `GET /api/v1/workflows/{workflow_id}/messages` - 获取工作流消息
- `POST /api/v1/workflows/{workflow_id}/messages` - 创建工作流消息
- `GET /api/v1/workflows/{workflow_id}/resources` - 获取工作流资源
- `POST /api/v1/workflows/{workflow_id}/resources` - 保存工作流资源
- `POST /api/v1/workflows/{workflow_id}/resources/batch` - 批量保存工作流资源

### 2. 工作流软删除 API (`/api/workflow`)

**文件**: `python-analysis-service/api/workflow_soft_delete_api.py`

**功能**: 工作流的软删除和恢复操作

**路径前缀**: `/api/workflow`

**主要端点**:
- `POST /api/workflow/workflows/{workflow_id}/soft-delete` - 软删除工作流
- `POST /api/workflow/workflows/{workflow_id}/restore` - 恢复已删除的工作流
- `GET /api/workflow/workflows/deleted` - 获取已删除的工作流列表

## 前端 API 服务映射

**文件**: `project/src/services/workflowApi.ts`

前端的 `WorkflowApiService` 类根据功能不同，调用不同的 API 路径：

```typescript
class WorkflowApiService {
  // 持久化相关操作 - 使用 /api/v1/workflows
  async getWorkflows() // GET /api/v1/workflows
  async createWorkflow() // POST /api/v1/workflows
  async updateWorkflow() // PUT /api/v1/workflows/{id}
  async getWorkflowSteps() // GET /api/v1/workflows/{id}/steps
  async getWorkflowResources() // GET /api/v1/workflows/{id}/resources
  // ... 其他持久化操作

  // 软删除相关操作 - 使用 /api/workflow
  async deleteWorkflow() // POST /api/workflow/workflows/{id}/soft-delete
  async restoreWorkflow() // POST /api/workflow/workflows/{id}/restore
  async getDeletedWorkflows() // GET /api/workflow/workflows/deleted
}
```

## 注意事项

1. **路径不统一**: 两个模块使用不同的路径前缀，这是历史原因造成的
2. **功能分离**: 持久化操作和软删除操作在不同的文件中实现
3. **前端适配**: 前端服务需要根据具体功能调用正确的 API 路径

## 建议优化

为了提高一致性，建议将来可以考虑：
1. 统一所有工作流 API 到同一个路径前缀下
2. 将软删除功能合并到持久化 API 中
3. 使用版本控制来管理 API 的变更 