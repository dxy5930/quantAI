import React, { useState, useCallback, useRef } from "react";
import { observer } from "mobx-react-lite";
import {
  Bot,
  Workflow as WorkflowIcon,
  History,
  Download,
  Share2,
  Settings,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { useStore } from "../../hooks/useStore";
import { aiWorkflowApi } from "../../services/api/aiWorkflowApi";
import { WorkflowCanvas } from "../../components/workflow";
import { Modal } from "../../components";
import WorkflowHistoryPopover from "../../components/workflow/WorkflowHistoryPopover";

// 工作流定义接口
interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: any[];
  connections: any[];
  status: "idle" | "running" | "completed" | "error";
  createdAt: Date;
  updatedAt: Date;
}

const AIWorkflowPage: React.FC = observer(() => {
  const { user, app } = useStore();
  const [showHistory, setShowHistory] = useState(false);
  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow | null>(null);
  
  // 历史按钮引用
  const historyButtonRef = useRef<HTMLButtonElement>(null);

  // 处理历史记录按钮点击
  const handleHistoryClick = () => {
    setShowHistory(!showHistory);
  };

  // 运行工作流
  const handleWorkflowRun = useCallback(
    async (workflow: Workflow, startPolling?: (executionId: string) => void) => {
      try {
        console.log("运行工作流:", workflow);

        // 调用后端API运行工作流定义
        const workflowResponse = await aiWorkflowApi.runWorkflow({
          workflowDefinition: workflow,
          userId: user.currentUser?.id,
          context: {
            userPreferences: {
              riskTolerance:
                user.currentUser?.profile?.riskTolerance || "medium",
              tradingExperience:
                user.currentUser?.profile?.tradingExperience || "intermediate",
            },
          },
        });

        if (workflowResponse.success) {
          console.log("工作流启动成功:", workflowResponse.data);
          app.showSuccess("工作流启动成功！", "运行成功");
          
          // 如果返回了执行ID，开始轮询状态
          if (workflowResponse.data?.executionId && startPolling) {
            console.log("开始轮询执行状态:", workflowResponse.data.executionId);
            startPolling(workflowResponse.data.executionId);
          }
        } else {
          console.error("工作流启动失败:", workflowResponse.message);
          app.showError(
            workflowResponse.message || "未知错误",
            "工作流启动失败"
          );
        }
      } catch (error: any) {
        console.error("运行工作流失败:", error);
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          "网络错误或服务不可用";
        app.showError(errorMessage, "运行工作流失败");
      }
    },
    [user.currentUser, app]
  );

  // 保存工作流
  const handleWorkflowSave = useCallback(
    async (workflow: Workflow) => {
      try {
        console.log("保存工作流:", workflow);

        let saveResponse;
        
        // 判断是创建新工作流还是更新现有工作流
        // 如果工作流ID为空或者是临时生成的ID，则创建新工作流
        const isNewWorkflow = !workflow.id || 
          workflow.id === "" || 
          workflow.id.startsWith('temp_workflow_') || 
          workflow.id.startsWith('workflow_');

        if (isNewWorkflow) {
          console.log("创建新工作流");
          saveResponse = await aiWorkflowApi.createWorkflow({
            workflow,
            userId: user.currentUser?.id,
          });
        } else {
          console.log("更新现有工作流:", workflow.id);
          saveResponse = await aiWorkflowApi.updateWorkflow(workflow.id, {
            workflow,
            userId: user.currentUser?.id,
          });
        }

        if (saveResponse.success) {
          console.log("工作流保存成功:", saveResponse.data);
          // 更新工作流ID（对于新创建的工作流）
          const updatedWorkflow = {
            ...workflow,
            id: saveResponse.data.id,
            createdAt: new Date(saveResponse.data.createdAt),
            updatedAt: new Date(saveResponse.data.updatedAt),
          };
          setCurrentWorkflow(updatedWorkflow);
          
          // 保存成功
          
          app.showSuccess(
            isNewWorkflow ? "工作流创建成功！" : "工作流更新成功！", 
            "保存成功"
          );
          
          // 返回更新后的工作流，让 WorkflowCanvas 组件也能获取到新的ID
          return updatedWorkflow;
        } else {
          console.error("工作流保存失败:", saveResponse.message);
          app.showError(saveResponse.message || "未知错误", "工作流保存失败");
          return null;
        }
      } catch (error: any) {
        console.error("保存工作流失败:", error);
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          "网络错误或服务不可用";
        app.showError(errorMessage, "保存工作流失败");
        return null;
      }
    },
    [user.currentUser, app]
  );

  // 加载历史工作流
  const loadHistoryWorkflow = async (workflowId: string) => {
    try {
      console.log("开始加载工作流:", workflowId);
      
      const workflowResponse = await aiWorkflowApi.getWorkflow(workflowId);
      console.log("工作流API响应:", workflowResponse);
      
      if (workflowResponse.success && workflowResponse.data) {
        const data = workflowResponse.data;
        const validStatuses = ['idle', 'running', 'completed', 'error'];
        
        const loadedWorkflow = {
          ...data,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
          status: ((data.status as string) === 'draft' ? 'idle' : 
                  (validStatuses.includes(data.status as string) ? data.status : 'idle')) as any,
          nodes: data.nodes || [],
          connections: data.connections || [],
        };
        
        console.log("工作流加载完成:", {
          name: loadedWorkflow.name,
          nodeCount: loadedWorkflow.nodes.length,
          connectionCount: loadedWorkflow.connections.length
        });
        
        setCurrentWorkflow(loadedWorkflow);
        setShowHistory(false);
        app.showSuccess(
          `${loadedWorkflow.name} (${loadedWorkflow.nodes.length}个节点)`, 
          "加载成功"
        );
      } else {
        console.error("工作流加载失败:", workflowResponse.message);
        app.showError(workflowResponse.message || "加载失败", "错误");
      }
    } catch (error) {
      console.error("加载历史工作流失败:", error);
      app.showError("网络或服务异常", "加载失败");
    }
  };

  // 导出工作流
  const exportWorkflow = () => {
    if (!currentWorkflow) return;

    const content = JSON.stringify(currentWorkflow, null, 2);
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `workflow-${currentWorkflow.name}-${
      new Date().toISOString().split("T")[0]
    }.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 分享工作流
  const shareWorkflow = () => {
    if (!currentWorkflow) return;

    // 这里可以实现分享功能，比如生成分享链接
    navigator.clipboard.writeText(window.location.href);
    // 可以添加一个toast提示
    console.log("工作流链接已复制到剪贴板");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-full mx-auto px-4 py-6">
        {/* 页面标题 */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <WorkflowIcon className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  FindValue AI 工作流
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  拖拽式可视化工作流编辑器，发现你的投资优势和超额收益
                </p>
              </div>
            </div>

            {/* 工具栏 */}
            <div className="flex items-center space-x-2">
              <button
                ref={historyButtonRef}
                onClick={handleHistoryClick}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <History className="w-4 h-4" />
                <span>历史记录</span>
              </button>

              {currentWorkflow && (
                <>
                  <button
                    onClick={exportWorkflow}
                    className="flex items-center space-x-2 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>导出</span>
                  </button>

                  <button
                    onClick={shareWorkflow}
                    className="flex items-center space-x-2 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>分享</span>
                  </button>
                </>
              )}

              <button
                onClick={() => window.location.reload()}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>重置</span>
              </button>
            </div>
          </div>
        </div>

        {/* 历史记录弹框 */}
        <Modal
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          title="工作流历史记录"
          mode="popover"
          triggerElement={historyButtonRef.current}
          position="bottom"
        >
          <WorkflowHistoryPopover
            onLoadWorkflow={loadHistoryWorkflow}
          />
        </Modal>

        {/* 工作流画布 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-[calc(100vh-200px)]">
          <WorkflowCanvas
            onWorkflowRun={handleWorkflowRun}
            onWorkflowSave={handleWorkflowSave}
            initialWorkflow={currentWorkflow}
          />
        </div>

        {/* 使用提示 */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Bot className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                如何使用 FindValue AI 工作流
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• 从左侧节点库拖拽节点到画布中</li>
                <li>• 连接节点创建数据流向</li>
                <li>• 配置每个节点的参数</li>
                <li>• 点击运行按钮执行工作流</li>
                <li>• 保存和分享你的工作流模板</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default AIWorkflowPage;
