import React, { useState } from "react";
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2,
  ChevronDown,
  ChevronRight,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Eye,
  Download,
} from "lucide-react";

interface WorkflowNode {
  id: string;
  type: "data" | "analysis" | "strategy" | "risk" | "output" | "custom";
  name: string;
  description: string;
  status: "idle" | "running" | "completed" | "error";
  progress: number;
  result?: any;
}

interface WorkflowResultsDisplayProps {
  nodes: WorkflowNode[];
  workflowStatus: "idle" | "running" | "completed" | "error";
  onViewNodeResult: (nodeId: string) => void;
  onExportResults: () => void;
  className?: string;
}

const WorkflowResultsDisplay: React.FC<WorkflowResultsDisplayProps> = ({
  nodes,
  workflowStatus,
  onViewNodeResult,
  onExportResults,
  className = "",
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const toggleNodeExpanded = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "running":
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "已完成";
      case "running":
        return "执行中";
      case "error":
        return "执行失败";
      default:
        return "等待中";
    }
  };

  const formatResult = (result: any, type: string) => {
    if (!result) return "暂无数据";

    try {
      if (typeof result === 'string') {
        return result;
      }
      
      if (type === "analysis" && result.analysis) {
        return result.analysis.substring(0, 100) + "...";
      }
      
      if (type === "data" && result.data) {
        const dataCount = Array.isArray(result.data) ? result.data.length : Object.keys(result.data).length;
        return `已获取 ${dataCount} 条数据`;
      }
      
      if (type === "strategy" && result.recommendations) {
        return `生成 ${result.recommendations.length} 个推荐`;
      }
      
      return JSON.stringify(result).substring(0, 100) + "...";
    } catch (error) {
      return "数据格式错误";
    }
  };

  const completedNodes = nodes.filter(n => n.status === "completed");
  const runningNodes = nodes.filter(n => n.status === "running");
  const errorNodes = nodes.filter(n => n.status === "error");
  const totalProgress = nodes.length > 0 ? nodes.reduce((sum, n) => sum + n.progress, 0) / nodes.length : 0;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col h-full ${className}`}>
      {/* 头部统计 */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Activity className="w-5 h-5 text-blue-600" />
            <h3 className="font-medium text-gray-900 dark:text-white">执行结果</h3>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              总体进度: {Math.round(totalProgress)}%
            </div>
            {workflowStatus === "completed" && (
              <button
                onClick={onExportResults}
                className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30"
              >
                <Download className="w-3 h-3" />
                <span>导出</span>
              </button>
            )}
          </div>
        </div>
        
        {/* 总体进度条 */}
        <div className="mt-2">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${totalProgress}%` }}
            />
          </div>
        </div>

        {/* 统计信息 */}
        <div className="flex items-center space-x-4 mt-3 text-sm">
          <div className="flex items-center space-x-1">
            <CheckCircle className="w-3 h-3 text-green-500" />
            <span className="text-gray-600 dark:text-gray-400">完成: {completedNodes.length}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Loader2 className="w-3 h-3 text-blue-500" />
            <span className="text-gray-600 dark:text-gray-400">运行中: {runningNodes.length}</span>
          </div>
          {errorNodes.length > 0 && (
            <div className="flex items-center space-x-1">
              <AlertCircle className="w-3 h-3 text-red-500" />
              <span className="text-gray-600 dark:text-gray-400">失败: {errorNodes.length}</span>
            </div>
          )}
        </div>
      </div>

      {/* 节点列表 */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {nodes.map((node) => {
          const isExpanded = expandedNodes.has(node.id);
          
          return (
            <div key={node.id} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0">
              <div className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <button
                      onClick={() => toggleNodeExpanded(node.id)}
                      className="flex-shrink-0"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                    
                    {getStatusIcon(node.status)}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900 dark:text-white truncate">
                          {node.name}
                        </span>
                        <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded flex-shrink-0">
                          {getStatusText(node.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {node.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {node.status === "running" && (
                      <div className="text-xs text-blue-600 dark:text-blue-400">
                        {node.progress}%
                      </div>
                    )}
                    
                    {node.result && (
                      <button
                        onClick={() => {
                          console.log('查看按钮被点击，节点ID:', node.id, '节点数据:', node.result);
                          onViewNodeResult(node.id);
                        }}
                        className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        <span>查看</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 进度条 */}
                {node.status === "running" && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                      <div
                        className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                        style={{ width: `${node.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* 展开的详细信息 */}
                {isExpanded && (
                  <div className="mt-3 pl-7 space-y-2">
                    {node.result && (
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          执行结果:
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded p-2 break-words overflow-wrap-anywhere">
                          {formatResult(node.result, node.type)}
                        </div>
                      </div>
                    )}
                    
                    {node.status === "error" && (
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">
                          错误信息:
                        </div>
                        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded p-2 break-words">
                          节点执行失败，请检查配置或重新运行
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 空状态 */}
      {nodes.length === 0 && (
        <div className="px-4 py-8 text-center flex-shrink-0">
          <Activity className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 dark:text-gray-400">暂无执行数据</p>
        </div>
      )}
    </div>
  );
};

export default WorkflowResultsDisplay; 