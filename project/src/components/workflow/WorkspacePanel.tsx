import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { FileText } from 'lucide-react';
import { ResourcesTab } from './tabs';
import PythonApiStatus from '../common/PythonApiStatus';
import { workflowResourceManager } from '../../services/workflowResourceManager';
import { TaskContext, AgentStatus } from './types';

interface ExecutionStep {
  id: string;
  content: string;
  stepNumber: number;
  totalSteps: number;
  category: 'analysis' | 'strategy' | 'general' | 'result' | 'error';
  timestamp: Date;
  isClickable?: boolean;
  isCompleted?: boolean; // 新增：标识步骤是否已完成
}

interface WorkspacePanelProps {
  selectedWorkflowId: string | null;
  taskContext?: TaskContext;
  currentAgent?: AgentStatus;
  nodeResource?: any; // 临时类型，稍后会用正确的类型
  selectedNodeId?: string | null;
  targetTab?: string | null;
}

export const WorkspacePanel: React.FC<WorkspacePanelProps> = observer(({
  selectedWorkflowId,
  taskContext,
  currentAgent,
  nodeResource,
  selectedNodeId,
  targetTab
}) => {
  const [selectedStep, setSelectedStep] = useState<ExecutionStep | null>(null);

  // 监听全局的步骤选择事件
  useEffect(() => {
    const handleStepSelection = (data: any) => {
      if (data.type === 'step_details') {
        setSelectedStep(data.step);
      } else if (data.type === 'current_step') {
        // 处理当前执行步骤
        setSelectedStep(data.step);
      }
    };

    // 设置全局函数以接收步骤选择
    (window as any).updateWorkspacePanel = handleStepSelection;

    return () => {
      if ((window as any).updateWorkspacePanel === handleStepSelection) {
        delete (window as any).updateWorkspacePanel;
      }
    };
  }, []);



  // 使用传入的任务上下文或空数据
  const defaultTaskContext: TaskContext = {
    taskType: 'general',
    webResources: [],
    charts: [],
    files: [],
    databases: [],
    apis: []
  };
  
  const currentTaskContext = taskContext || defaultTaskContext;

  // 移除tab切换逻辑，直接显示资源列表



  if (!selectedWorkflowId) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>选择一个工作流</p>
          <p className="text-sm">查看任务资源</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Python API状态显示 */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <PythonApiStatus />
      </div>

      {/* 直接显示工作流资源列表 */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <ResourcesTab 
          taskContext={currentTaskContext} 
          workflowId={selectedWorkflowId}
          workflowResources={selectedWorkflowId ? workflowResourceManager.getWorkflowResources(selectedWorkflowId) : []}
        />
      </div>
    </div>
  );
});

export default WorkspacePanel; 