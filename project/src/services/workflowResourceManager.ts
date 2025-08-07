import { makeAutoObservable } from 'mobx';

export interface WorkflowResource {
  id: string;
  type: 'web' | 'database' | 'api' | 'file' | 'chart' | 'general';
  title: string;
  description?: string;
  timestamp: Date;
  data: any;
  stepId?: string;
  category?: string;
  workflowId: string;
  resourceType?: string;
  executionDetails?: Record<string, any>;
}

class WorkflowResourceManager {
  private resources: Map<string, WorkflowResource[]> = new Map();

  constructor() {
    makeAutoObservable(this);
  }

  // 从步骤中添加资源
  addResourcesFromStep(
    workflowId: string, 
    stepId: string, 
    stepData: {
      content: string;
      category?: string;
      resourceType?: string;
      results?: any[];
      executionDetails?: Record<string, any>;
      urls?: string[];
      files?: string[];
    }
  ) {
    const workflowResources = this.resources.get(workflowId) || [];
    const timestamp = new Date();

    // 从URLs添加Web资源
    if (stepData.urls && stepData.urls.length > 0) {
      stepData.urls.forEach((url, index) => {
        const webResource: WorkflowResource = {
          id: `${stepId}_web_${index}`,
          type: 'web',
          title: this.extractTitleFromUrl(url),
          description: `从步骤"${stepData.content}"中获取`,
          timestamp,
          data: {
            url,
            status: 'loaded',
            source: 'step_execution'
          },
          stepId,
          category: stepData.category,
          workflowId,
          resourceType: stepData.resourceType,
          executionDetails: stepData.executionDetails
        };
        workflowResources.push(webResource);
      });
    }

    // 从文件添加文件资源
    if (stepData.files && stepData.files.length > 0) {
      stepData.files.forEach((file, index) => {
        const fileResource: WorkflowResource = {
          id: `${stepId}_file_${index}`,
          type: 'file',
          title: this.extractFilename(file),
          description: `从步骤"${stepData.content}"中生成`,
          timestamp,
          data: {
            downloadUrl: file,
            name: this.extractFilename(file),
            type: this.extractFileType(file),
            size: '未知',
            source: 'step_execution'
          },
          stepId,
          category: stepData.category,
          workflowId,
          resourceType: stepData.resourceType,
          executionDetails: stepData.executionDetails
        };
        workflowResources.push(fileResource);
      });
    }

    // 从执行详情添加API或数据库资源
    if (stepData.executionDetails) {
      if (stepData.resourceType === 'api' && stepData.executionDetails.endpoint) {
        const apiResource: WorkflowResource = {
          id: `${stepId}_api`,
          type: 'api',
          title: `API: ${stepData.executionDetails.endpoint}`,
          description: stepData.content,
          timestamp,
          data: {
            endpoint: stepData.executionDetails.endpoint,
            method: stepData.executionDetails.method || 'GET',
            documentation: stepData.executionDetails.documentation,
            source: 'step_execution'
          },
          stepId,
          category: stepData.category,
          workflowId,
          resourceType: stepData.resourceType,
          executionDetails: stepData.executionDetails
        };
        workflowResources.push(apiResource);
      }

      if (stepData.resourceType === 'database' && stepData.executionDetails.dataSource) {
        const dbResource: WorkflowResource = {
          id: `${stepId}_database`,
          type: 'database',
          title: `数据库: ${stepData.executionDetails.dataSource}`,
          description: stepData.content,
          timestamp,
          data: {
            name: stepData.executionDetails.dataSource,
            tables: stepData.executionDetails.tables || [],
            queryUrl: stepData.executionDetails.queryUrl,
            source: 'step_execution'
          },
          stepId,
          category: stepData.category,
          workflowId,
          resourceType: stepData.resourceType,
          executionDetails: stepData.executionDetails
        };
        workflowResources.push(dbResource);
      }
    }

    // 从结果添加图表资源
    if (stepData.results && stepData.results.length > 0) {
      stepData.results.forEach((result, index) => {
        if (typeof result === 'object' && result.type === 'chart') {
          const chartResource: WorkflowResource = {
            id: `${stepId}_chart_${index}`,
            type: 'chart',
            title: result.title || `图表 ${index + 1}`,
            description: `从步骤"${stepData.content}"中生成`,
            timestamp,
            data: {
              title: result.title,
              type: result.chartType || 'line',
              imageUrl: result.imageUrl,
              dataUrl: result.dataUrl,
              source: 'step_execution'
            },
            stepId,
            category: stepData.category,
            workflowId,
            resourceType: stepData.resourceType,
            executionDetails: stepData.executionDetails
          };
          workflowResources.push(chartResource);
        }
      });
    }

    this.resources.set(workflowId, workflowResources);
  }

  // 获取指定工作流的所有资源
  getWorkflowResources(workflowId: string): WorkflowResource[] {
    return this.resources.get(workflowId) || [];
  }

  // 按类型获取资源
  getResourcesByType(workflowId: string, type: WorkflowResource['type']): WorkflowResource[] {
    const workflowResources = this.getWorkflowResources(workflowId);
    return workflowResources.filter(resource => resource.type === type);
  }

  // 清除指定工作流的资源
  clearWorkflowResources(workflowId: string) {
    this.resources.delete(workflowId);
  }

  // 删除指定资源
  removeResource(workflowId: string, resourceId: string) {
    const workflowResources = this.resources.get(workflowId);
    if (workflowResources) {
      const filteredResources = workflowResources.filter(r => r.id !== resourceId);
      this.resources.set(workflowId, filteredResources);
    }
  }

  // 辅助方法：从URL提取标题
  private extractTitleFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname + urlObj.pathname;
    } catch {
      return url;
    }
  }

  // 辅助方法：从文件路径提取文件名
  private extractFilename(filePath: string): string {
    return filePath.split('/').pop() || filePath;
  }

  // 辅助方法：从文件路径提取文件类型
  private extractFileType(filePath: string): string {
    const extension = filePath.split('.').pop();
    return extension ? extension.toUpperCase() : '未知';
  }

  // 获取所有工作流资源的统计信息
  getResourceStats(workflowId: string) {
    const resources = this.getWorkflowResources(workflowId);
    const stats = {
      total: resources.length,
      web: resources.filter(r => r.type === 'web').length,
      database: resources.filter(r => r.type === 'database').length,
      api: resources.filter(r => r.type === 'api').length,
      file: resources.filter(r => r.type === 'file').length,
      chart: resources.filter(r => r.type === 'chart').length,
      general: resources.filter(r => r.type === 'general').length
    };
    return stats;
  }
}

// 创建全局实例
export const workflowResourceManager = new WorkflowResourceManager();

// 在window对象上暴露管理器，供其他组件使用
if (typeof window !== 'undefined') {
  (window as any).workflowResourceManager = workflowResourceManager;
} 