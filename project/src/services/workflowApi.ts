import axios, { AxiosResponse } from 'axios';
import { PythonApiClient } from './pythonApiClient';

const pythonApiClient = PythonApiClient.getInstance();

// 工作流相关的API接口
export interface WorkflowInstance {
  id: string;
  title: string;
  description?: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  progress_percentage: number;
  current_step: number;
  total_steps: number;
  start_time: string;
  end_time?: string;
  last_activity: string;
  context_data?: any;
  error_message?: string;
  created_at: string;
}

export interface WorkflowStep {
  id: string;
  step_number: number;
  step_id: string;
  content: string;
  category: string;
  resource_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  start_time?: string;
  end_time?: string;
  execution_details?: any;
  results?: any[];
  urls?: string[];
  files?: string[];
  error_message?: string;
  created_at: string;
}

export interface WorkflowMessage {
  message_id: string;
  message_type: 'user' | 'system' | 'task' | 'result' | 'assistant';
  content: string;
  status?: string;
  data?: any;
  timestamp: string;
}

export interface WorkflowResource {
  id: string;
  resource_type: 'web' | 'database' | 'api' | 'file' | 'chart' | 'general';
  title: string;
  description?: string;
  data: any;
  category?: string;
}

export interface WorkflowState {
  workflow: WorkflowInstance;
  steps: WorkflowStep[];
  messages: WorkflowMessage[];
  resources: WorkflowResource[];
}

class WorkflowApiService {
  private baseURL = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:8000';

  // 获取工作流列表 - 使用持久化API
  async getWorkflows(params?: {
    user_id?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<WorkflowInstance[]> {
    const response = await axios.get(`${this.baseURL}/api/v1/workflows`, { params });
    return response.data;
  }

  // 获取单个工作流详情 - 使用持久化API
  async getWorkflow(workflowId: string): Promise<WorkflowInstance> {
    const response = await axios.get(`${this.baseURL}/api/v1/workflows/${workflowId}`);
    return response.data;
  }

  // 创建工作流（立即落库） - 使用持久化API
  async createWorkflow(data: {
    title: string;
    description?: string;
    user_id?: string;
  }): Promise<{ id: string; title: string; description?: string; status: string; created_at: string }> {
    const response = await axios.post(`${this.baseURL}/api/v1/workflows`, data);
    return response.data;
  }

  // 立即创建空工作流实例（点击加号时调用） - 使用持久化API
  async createEmptyWorkflow(user_id?: string): Promise<{ id: string; title: string; description?: string; status: string; created_at: string }> {
    const data = {
      title: '新建工作流...',
      description: '正在生成工作流描述...',
      user_id
    };
    const response = await axios.post(`${this.baseURL}/api/v1/workflows`, data);
    return response.data;
  }

  // 增量更新工作流标题和描述 - 使用持久化API
  async updateWorkflowBasicInfo(workflowId: string, data: {
    title?: string;
    description?: string;
  }): Promise<{ message: string }> {
    const response = await axios.put(`${this.baseURL}/api/v1/workflows/${workflowId}`, data);
    return response.data;
  }

  // 更新工作流 - 使用持久化API
  async updateWorkflow(workflowId: string, data: {
    title?: string;
    description?: string;
    status?: string;
    progress_percentage?: number;
    current_step?: number;
    total_steps?: number;
    context_data?: any;
    error_message?: string;
  }): Promise<{ message: string }> {
    const response = await axios.put(`${this.baseURL}/api/v1/workflows/${workflowId}`, data);
    return response.data;
  }

  // 获取工作流步骤 - 使用持久化API
  async getWorkflowSteps(workflowId: string): Promise<WorkflowStep[]> {
    const response = await axios.get(`${this.baseURL}/api/v1/workflows/${workflowId}/steps`);
    return response.data;
  }

  // 获取工作流消息 - 使用持久化API
  async getWorkflowMessages(workflowId: string): Promise<WorkflowMessage[]> {
    const response = await axios.get(`${this.baseURL}/api/v1/workflows/${workflowId}/messages`);
    return response.data;
  }

  // 【新增】获取工作流最新消息 - 支持增量更新
  async getLatestWorkflowMessages(workflowId: string, since?: string, limit: number = 50): Promise<{
    messages: WorkflowMessage[];
    count: number;
    has_more: boolean;
  }> {
    const params: any = { limit };
    if (since) {
      params.since = since;
    }
    const response = await axios.get(`${this.baseURL}/api/v1/workflows/${workflowId}/messages/latest`, { params });
    return response.data;
  }

  // 【新增】获取工作流消息统计信息
  async getWorkflowMessagesStats(workflowId: string): Promise<{
    total_messages: number;
    by_type: Record<string, number>;
    latest_timestamp: string | null;
  }> {
    const response = await axios.get(`${this.baseURL}/api/v1/workflows/${workflowId}/messages/stats`);
    return response.data;
  }

  // 获取工作流资源 - 使用持久化API
  async getWorkflowResources(workflowId: string): Promise<WorkflowResource[]> {
    const response = await axios.get(`${this.baseURL}/api/v1/workflows/${workflowId}/resources`);
    return response.data;
  }

  // 保存工作流资源 - 使用持久化API
  async saveWorkflowResource(workflowId: string, resource: {
    id?: string;
    type: string;
    title: string;
    description?: string;
    data: any;
    category?: string;
    stepId?: string;
    sourceStepId?: string;
  }): Promise<{ message: string; resource_id: string }> {
    const response = await axios.post(`${this.baseURL}/api/v1/workflows/${workflowId}/resources`, resource);
    return response.data;
  }

  // 批量保存工作流资源 - 使用持久化API
  async saveWorkflowResourcesBatch(workflowId: string, resources: Array<{
    id?: string;
    type: string;
    title: string;
    description?: string;
    data: any;
    category?: string;
    stepId?: string;
    sourceStepId?: string;
  }>): Promise<{ message: string }> {
    const response = await axios.post(`${this.baseURL}/api/v1/workflows/${workflowId}/resources/batch`, resources);
    return response.data;
  }

  // 软删除工作流 - 使用软删除API（注意：这里使用正确的路径前缀）
  async deleteWorkflow(workflowId: string): Promise<{ message: string; deleted_at?: string }> {
    const response = await axios.post(`${this.baseURL}/api/workflow/workflows/${workflowId}/soft-delete`);
    return response.data;
  }

  // 恢复已删除的工作流 - 使用软删除API
  async restoreWorkflow(workflowId: string): Promise<{ message: string }> {
    const response = await axios.post(`${this.baseURL}/api/workflow/workflows/${workflowId}/restore`);
    return response.data;
  }

  // 获取已删除的工作流列表 - 使用软删除API
  async getDeletedWorkflows(): Promise<WorkflowInstance[]> {
    const response = await axios.get(`${this.baseURL}/api/workflow/workflows/deleted`);
    return response.data;
  }

  // 获取完整的工作流状态（用于恢复）
  async getWorkflowState(workflowId: string): Promise<WorkflowState | null> {
    try {
      const [workflow, steps, messages, resources] = await Promise.all([
        this.getWorkflow(workflowId),
        this.getWorkflowSteps(workflowId),
        this.getWorkflowMessages(workflowId),
        this.getWorkflowResources(workflowId)
      ]);

      return {
        workflow,
        steps,
        messages,
        resources
      };
    } catch (error) {
      console.error('获取工作流状态失败:', error);
      return null;
    }
  }
}

export const workflowApi = new WorkflowApiService();

// 获取工作流历史
export const getWorkflowHistory = async (workflowId: string) => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:8000'}/api/v1/workflows/${workflowId}/history`);
    return response.data;
  } catch (error) {
    console.error('获取工作流历史失败:', error);
    throw error;
  }
}; 