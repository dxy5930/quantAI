import React, { useState, useEffect } from "react";
import { 
  History, 
  CheckCircle, 
  XCircle, 
  Play, 
  Eye, 
  Loader2,
  Clock 
} from "lucide-react";
import { aiWorkflowApi } from "../../services/api/aiWorkflowApi";

interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: "running" | "completed" | "error";
  startTime: Date;
  endTime?: Date;
  progress: number;
  result?: any;
  error?: string;
  nodeCount: number;
  duration?: number;
}

interface WorkflowHistoryPopoverProps {
  onLoadWorkflow?: (workflowId: string) => void;
  onRerun?: (execution: WorkflowExecution) => void;
  onViewDetails?: (execution: WorkflowExecution) => void;
}

const WorkflowHistoryPopover: React.FC<WorkflowHistoryPopoverProps> = ({
  onLoadWorkflow,
  onRerun,
  onViewDetails,
}) => {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(false);

  // 获取执行历史（显示所有记录）
  const fetchExecutions = async () => {
    setLoading(true);
    try {
      const response = await aiWorkflowApi.getWorkflowHistory();

      if (response.success && response.data) {
        // 转换数据格式，显示所有记录
        const mappedExecutions = (response.data.workflows || [])
          .map((workflow: any) => ({
            id: workflow.workflowId || workflow.id,
            workflowId: workflow.workflowId || workflow.id,
            workflowName: workflow.message || workflow.name || "未命名工作流",
            status: workflow.status,
            startTime: new Date(workflow.timestamp || workflow.createdAt || Date.now()),
            endTime: workflow.status === "completed" ? new Date() : undefined,
            progress: workflow.progress || 100,
            result: workflow.results,
            error: workflow.status === "error" ? "执行出错" : undefined,
            nodeCount: workflow.agents?.length || workflow.nodeCount || 0,
          }));

        setExecutions(mappedExecutions);
      }
    } catch (error) {
      console.error("获取工作流执行历史失败:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExecutions();
  }, []);

  // 处理加载工作流
  const handleLoadWorkflow = (workflowId: string) => {
    if (onLoadWorkflow) {
      onLoadWorkflow(workflowId);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-3 h-3 text-green-600" />;
      case "error":
        return <XCircle className="w-3 h-3 text-red-600" />;
      case "running":
        return <Loader2 className="w-3 h-3 text-blue-600 animate-spin" />;
      default:
        return <Clock className="w-3 h-3 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">加载中...</span>
      </div>
    );
  }

  if (executions.length === 0) {
    return (
      <div className="text-center py-6">
        <History className="w-6 h-6 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-500 dark:text-gray-400">暂无执行历史</p>
      </div>
    );
  }

  return (
    <div className="space-y-1 min-h-0">
      {executions.map((execution, index) => (
        <div 
          key={execution.id} 
          className={`flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors ${
            index < executions.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
          }`}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              {getStatusIcon(execution.status)}
              <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {execution.workflowName}
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {execution.startTime.toLocaleDateString()} {execution.startTime.toLocaleTimeString()}
            </div>
          </div>
          
          <div className="flex items-center space-x-1 ml-2">
            <button
              onClick={() => handleLoadWorkflow(execution.workflowId)}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              title="加载"
            >
              加载
            </button>
            {onRerun && execution.status === "completed" && (
              <button
                onClick={() => onRerun(execution)}
                className="p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                title="重新运行"
              >
                <Play className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default WorkflowHistoryPopover; 