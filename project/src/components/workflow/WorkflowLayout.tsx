import React, { useState, useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { useOutletContext } from 'react-router-dom';
import { WorkflowCanvas } from './WorkflowCanvas';
import { WorkspacePanel } from './WorkspacePanel';
import { ResizableDivider } from '../common/ResizableDivider';
import { useResizable } from '../../hooks/useResizable';
import { WorkflowNode, NodeResource } from '../../types/workflow-types';
import { TaskContext, AgentStatus } from './types';

interface WorkflowLayoutProps {
  className?: string;
}

interface OutletContext {
  selectedWorkflowId: string | null;
  onWorkflowSelect: (workflowId: string) => void;
}

export const WorkflowLayout: React.FC<WorkflowLayoutProps> = observer(({ className = '' }) => {
  const { selectedWorkflowId } = useOutletContext<OutletContext>();
  const [taskContext, setTaskContext] = useState<TaskContext | undefined>(undefined);
  const [agentStatus, setAgentStatus] = useState<AgentStatus | undefined>(undefined);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [nodeResource, setNodeResource] = useState<NodeResource | null>(null);
  const [targetTab, setTargetTab] = useState<string | null>(null);
  const [isTaskRunning, setIsTaskRunning] = useState(false);
  
  // 使用useResizable Hook替换原有的分隔条逻辑
  const {
    width: rightPanelWidth,
    isResizing,
    containerRef,
    handleMouseDown
  } = useResizable({
    initialWidth: 320,
    minWidth: 280,
    maxWidth: undefined
  });

  // 监听任务执行状态，用于控制右侧面板显示
  useEffect(() => {
    const handleTaskStatusUpdate = (data: any) => {
      if (data.type === 'current_step' && data.isFirstStep) {
        setIsTaskRunning(true);
        setTargetTab('info');
      } else if (data.type === 'task_start') {
        setIsTaskRunning(true);
        setTargetTab('info');
      } else if (data.type === 'task_complete') {
        // 任务完成时可以选择保持面板打开或关闭
      }
    };

    // 设置全局函数以接收任务状态更新
    const originalUpdateFunction = (window as any).updateWorkspacePanel;
    (window as any).updateWorkspacePanel = (data: any) => {
      handleTaskStatusUpdate(data);
      
      if (originalUpdateFunction) {
        originalUpdateFunction(data);
      }
    };

    return () => {
      if ((window as any).updateWorkspacePanel && !originalUpdateFunction) {
        delete (window as any).updateWorkspacePanel;
      } else if (originalUpdateFunction) {
        (window as any).updateWorkspacePanel = originalUpdateFunction;
      }
    };
  }, []);

  // 当选择的工作流改变时加载任务上下文
  useEffect(() => {
    if (selectedWorkflowId) {
      loadWorkflowContext(selectedWorkflowId);
    } else {
      setTaskContext(undefined);
    }
  }, [selectedWorkflowId]);

  const loadWorkflowContext = async (workflowId: string) => {
    try {
      setTaskContext({
        taskType: 'stock-analysis',
        webResources: [],
        databases: [],
        apis: [],
        charts: [],
        files: []
      });

      // 关闭本地模拟Agent状态，等待真实SSE驱动
      setAgentStatus(undefined as any);
    } catch (error) {
      console.error('Failed to load workflow context:', error);
      setTaskContext(undefined);
      setAgentStatus(undefined);
    }
  };

  // 模拟实时更新Agent状态
  useEffect(() => {
    if (!agentStatus || !agentStatus.isRunning) return;

    const interval = setInterval(() => {
      setAgentStatus(prev => {
        if (!prev) return prev;

        const updatedAgents = prev.agents.map(agent => {
          if (agent.status === 'running' && agent.progress < 100) {
            return {
              ...agent,
              progress: Math.min(agent.progress + Math.random() * 10, 100),
              outputs: agent.outputs ? [
                ...agent.outputs,
                `处理进度: ${Math.min(agent.progress + Math.random() * 10, 100).toFixed(0)}%`
              ].slice(-5) : undefined
            };
          }
          return agent;
        });

        return {
          ...prev,
          agents: updatedAgents
        };
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [agentStatus?.isRunning]);

  // 节点点击处理
  const handleNodeClick = (nodeId: string, nodeType: string) => {
    setSelectedNodeId(nodeId);
    
    // 只设置目标tab，不改变taskContext的数据
    if (['browser', 'database', 'apis', 'resources'].includes(nodeType)) {
      setTargetTab(nodeType);
      setNodeResource(null);
    } else {
      // 对于其他类型的节点，保持原有逻辑
      const resource = generateNodeResource(nodeId, nodeType);
      setNodeResource(resource);
    }
  };

  // 生成节点资源数据
  const generateNodeResource = (nodeId: string, nodeType: string): NodeResource => {
    switch (nodeType) {
      case 'browser':
        return {
          id: nodeId,
          type: 'browser',
          tabs: [
            {
              id: 'tab1',
              title: '苹果公司财报 - 东方财富',
              url: 'https://quote.eastmoney.com/us/AAPL.html',
              status: 'loaded',
              timestamp: new Date(),
              content: 'Apple Inc. 股价信息和财务数据...'
            },
            {
              id: 'tab2', 
              title: 'Apple Inc. - Yahoo Finance',
              url: 'https://finance.yahoo.com/quote/AAPL',
              status: 'loaded',
              timestamp: new Date(),
              content: 'AAPL stock quote and analysis...'
            }
          ],
          activeTabId: 'tab1'
        };
      
      case 'database':
        return {
          id: nodeId,
          type: 'database',
          name: '股票数据库',
          connectionInfo: {
            host: 'localhost:3306',
            database: 'stock_data',
            status: 'connected'
          },
          tables: [
            {
              id: 'stocks',
              name: 'stocks',
              rowCount: 4832,
              columns: [
                { name: 'id', type: 'INT', nullable: false },
                { name: 'symbol', type: 'VARCHAR(10)', nullable: false },
                { name: 'name', type: 'VARCHAR(100)', nullable: false },
                { name: 'price', type: 'DECIMAL(10,2)', nullable: true }
              ]
            }
          ],
          queries: [
            {
              id: 'q1',
              sql: 'SELECT * FROM stocks WHERE price > 100',
              timestamp: new Date(),
              status: 'completed',
              results: [],
              rowCount: 234,
              executionTime: 156
            }
          ]
        };
      
      case 'api':
        return {
          id: nodeId,
          type: 'api',
          name: 'Yahoo Finance API',
          endpoint: '/v8/finance/chart/AAPL',
          method: 'GET',
          requests: [
            {
              id: 'req1',
              timestamp: new Date(),
              status: 'success',
              responseTime: 234,
              request: {
                params: { interval: '1d', range: '1mo' }
              },
              response: {
                status: 200,
                body: { chart: { result: [] } }
              }
            }
          ],
          documentation: 'Yahoo Finance Chart API documentation'
        };
      
      default:
        return {
          id: nodeId,
          type: 'browser',
          tabs: [],
          activeTabId: undefined
        };
    }
  };

  // 判断是否应该显示右侧面板
  const shouldShowRightPanel = selectedNodeId || (agentStatus && agentStatus.isRunning) || taskContext || isTaskRunning;

  return (
    <div ref={containerRef} className={`h-full flex bg-gray-50 dark:bg-slate-900 p-4 ${className}`}>
      {/* 中间画布区域 */}
      <div 
        className="flex flex-col min-w-0 h-full transition-all duration-300 ease-in-out"
        style={{
          width: shouldShowRightPanel 
            ? `calc(100% - ${rightPanelWidth}px - 8px)` 
            : '100%'
        }}
      >
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 h-full rounded-xl shadow-sm overflow-hidden">
          <WorkflowCanvas 
            workflowId={selectedWorkflowId}
            onNodeClick={handleNodeClick}
            selectedNodeId={selectedNodeId}
          />
        </div>
      </div>

      {/* 可调整大小的分隔条 - 仅在有右侧面板时显示 */}
      {shouldShowRightPanel && (
        <ResizableDivider
          onMouseDown={handleMouseDown}
          isResizing={isResizing}
          orientation="vertical"
        />
      )}

      {/* 右侧工作空间 - 从右到左拉开动画 */}
      <div 
        className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 flex-shrink-0 transition-all duration-300 ease-in-out rounded-xl shadow-sm overflow-hidden"
        style={{
          width: shouldShowRightPanel ? `${rightPanelWidth}px` : '0px',
          transform: shouldShowRightPanel ? 'translateX(0)' : `translateX(${rightPanelWidth}px)`,
          opacity: shouldShowRightPanel ? 1 : 0
        }}
      >
        <div 
          className="h-full"
          style={{
            width: `${rightPanelWidth}px`,
            minWidth: '280px'
          }}
        >
          <WorkspacePanel 
            selectedWorkflowId={selectedWorkflowId}
            taskContext={taskContext}
            currentAgent={agentStatus}
            nodeResource={nodeResource}
            selectedNodeId={selectedNodeId}
            targetTab={targetTab}
          />
        </div>
      </div>
    </div>
  );
});

export default WorkflowLayout; 