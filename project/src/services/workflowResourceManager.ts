import { makeAutoObservable } from 'mobx';
import { workflowApi } from './workflowApi';

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

    // 规范化：确保为数组，避免 forEach 报错
    const urls = Array.isArray(stepData.urls)
      ? stepData.urls
      : stepData.urls
      ? [stepData.urls as unknown as string]
      : [];
    const files = Array.isArray(stepData.files)
      ? stepData.files
      : stepData.files
      ? [stepData.files as unknown as string]
      : [];
    const resultsArray = Array.isArray(stepData.results)
      ? stepData.results
      : stepData.results !== undefined && stepData.results !== null
      ? [stepData.results as unknown as any]
      : [];

    // 从URLs添加Web资源
    if (urls.length > 0) {
      urls.forEach((url, index) => {
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
    if (files.length > 0) {
      files.forEach((file, index) => {
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
      if (stepData.resourceType === 'api' && (stepData.executionDetails as any).endpoint) {
        const apiResource: WorkflowResource = {
          id: `${stepId}_api`,
          type: 'api',
          title: `API: ${(stepData.executionDetails as any).endpoint}`,
          description: stepData.content,
          timestamp,
          data: {
            endpoint: (stepData.executionDetails as any).endpoint,
            method: (stepData.executionDetails as any).method || 'GET',
            documentation: (stepData.executionDetails as any).documentation,
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

      if (stepData.resourceType === 'database' && (stepData.executionDetails as any).dataSource) {
        const dbResource: WorkflowResource = {
          id: `${stepId}_database`,
          type: 'database',
          title: `数据库: ${(stepData.executionDetails as any).dataSource}`,
          description: stepData.content,
          timestamp,
          data: {
            name: (stepData.executionDetails as any).dataSource,
            tables: (stepData.executionDetails as any).tables || [],
            queryUrl: (stepData.executionDetails as any).queryUrl,
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
    if (resultsArray.length > 0) {
      resultsArray.forEach((result, index) => {
        if (typeof result === 'object' && (result as any).type === 'chart') {
          const chartResource: WorkflowResource = {
            id: `${stepId}_chart_${index}`,
            type: 'chart',
            title: (result as any).title || `图表 ${index + 1}`,
            description: `从步骤"${stepData.content}"中生成`,
            timestamp,
            data: {
              title: (result as any).title,
              type: (result as any).chartType || 'line',
              imageUrl: (result as any).imageUrl,
              dataUrl: (result as any).dataUrl,
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
    
    // 异步保存新增的资源到数据库
    this.persistResourcesToDatabase(workflowId, workflowResources);
  }

  // 异步持久化资源到数据库
  private async persistResourcesToDatabase(workflowId: string, resources: WorkflowResource[]) {
    if (resources.length === 0) return;
    
    try {
      // 转换资源格式
      const resourcesData = resources.map(resource => ({
        id: resource.id,
        type: resource.type,
        title: resource.title,
        description: resource.description,
        data: resource.data,
        category: resource.category,
        stepId: resource.stepId,
        sourceStepId: resource.stepId
      }));

      // 使用批量保存接口
      await workflowApi.saveWorkflowResourcesBatch(workflowId, resourcesData);
      console.log(`批量保存 ${resources.length} 个资源成功`);
    } catch (error) {
      console.error('批量保存资源失败:', error);
      // 如果批量保存失败，尝试逐个保存
      console.log('尝试逐个保存资源...');
      for (const resource of resources) {
        try {
          await workflowApi.saveWorkflowResource(workflowId, {
            id: resource.id,
            type: resource.type,
            title: resource.title,
            description: resource.description,
            data: resource.data,
            category: resource.category,
            stepId: resource.stepId,
            sourceStepId: resource.stepId
          });
          console.log(`资源 ${resource.id} 保存成功`);
        } catch (error) {
          console.error(`保存资源 ${resource.id} 失败:`, error);
        }
      }
    }
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