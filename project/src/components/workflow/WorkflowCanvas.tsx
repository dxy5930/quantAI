import React, { useState, useRef, useCallback, useEffect } from "react";
import { observer } from "mobx-react-lite";
import {
  Database,
  BarChart3,
  Target,
  Shield,
  Zap,
  Plus,
  Play,
  Save,
  Settings,
  Trash2,
  Bot,
  Loader2,
  Layout,
  Move,
  History,
  X,
} from "lucide-react";
import NodeConfigPanel from "./NodeConfigPanel";
import WorkflowTemplates from "./WorkflowTemplates";
import WorkflowHistoryPopover from "./WorkflowHistoryPopover";
import WorkflowResultsDisplay from "./WorkflowResultsDisplay";
import WorkflowResultsModal from "./WorkflowResultsModal";
import Modal from "../common/Modal";
import { aiWorkflowApi } from "../../services/api/aiWorkflowApi";
import { nodeConfigApi, NodeTemplate } from "../../services/api/nodeConfigApi";
import { useStore } from "../../hooks/useStore";

// 节点类型定义
interface WorkflowNode {
  id: string;
  type: "data" | "analysis" | "strategy" | "risk" | "output" | "custom";
  name: string;
  description: string;
  position: { x: number; y: number };
  config: Record<string, any>;
  inputs: string[];
  outputs: string[];
  status: "idle" | "running" | "completed" | "error";
  progress: number;
  result?: any;
}

// 连接线定义
interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  sourcePort: string;
  targetPort: string;
}

// 工作流定义
interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  connections: Connection[];
  status: "idle" | "running" | "completed" | "error";
  createdAt: Date;
  updatedAt: Date;
}

// 节点模板类型定义
type NodeTemplateType = Omit<WorkflowNode, "id" | "position" | "status" | "progress">;

// 获取节点图标
const getNodeIcon = (type: string) => {
  const iconMap = {
    data: Database,
    analysis: BarChart3,
    strategy: Target,
    risk: Shield,
    output: Zap,
    custom: Bot,
  };
  return iconMap[type as keyof typeof iconMap] || Bot;
};

// 获取节点颜色
const getNodeColor = (type: string, status: string) => {
  const baseColors = {
    data: "blue",
    analysis: "green",
    strategy: "purple",
    risk: "orange",
    output: "red",
    custom: "gray",
  };

  const statusColors = {
    idle: "100",
    running: "200",
    completed: "500",
    error: "600",
  };

  const base = baseColors[type as keyof typeof baseColors] || "gray";
  const intensity = statusColors[status as keyof typeof statusColors] || "100";

  return `bg-${base}-${intensity} border-${base}-${parseInt(intensity) + 100}`;
};

interface WorkflowCanvasProps {
  onWorkflowRun?: (
    workflow: Workflow,
    startPolling?: (executionId: string) => void
  ) => void;
  onWorkflowSave?: (workflow: Workflow) => Promise<Workflow | null> | void;
  initialWorkflow?: Workflow | null;
}

const WorkflowCanvas: React.FC<WorkflowCanvasProps> = observer(
  ({ onWorkflowRun, onWorkflowSave, initialWorkflow }) => {
    const [workflow, setWorkflow] = useState<Workflow>({
      id: "", // 运行时不创建ID，保存时才创建
      name: "新建工作流",
      description: "",
      nodes: [],
      connections: [],
      status: "idle",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [draggedNode, setDraggedNode] = useState<NodeTemplateType | null>(null);
    const { app } = useStore();
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionStart, setConnectionStart] = useState<{
      nodeId: string;
      port: string;
      type: "input" | "output";
    } | null>(null);
    const [showNodePanel, setShowNodePanel] = useState(true);
    const [showConfigPanel, setShowConfigPanel] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [showResultsPanel, setShowResultsPanel] = useState(false);
    const [selectedNodeForResults, setSelectedNodeForResults] =
      useState<WorkflowNode | null>(null);
    const [showResultsModal, setShowResultsModal] = useState(false);

    // 工作流执行状态
    const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(
      null
    );
    const [isPolling, setIsPolling] = useState(false);
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [showTemplates, setShowTemplates] = useState(false);
    
    // 节点模板相关状态
    const [nodeTemplates, setNodeTemplates] = useState<NodeTemplateType[]>([]);
    const [templatesLoading, setTemplatesLoading] = useState(true);

    // 历史按钮引用
    const historyButtonRef = useRef<HTMLButtonElement>(null);

    const canvasRef = useRef<HTMLDivElement>(null);
    const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    
    // 加载节点模板
    useEffect(() => {
      const loadNodeTemplates = async () => {
        try {
          setTemplatesLoading(true);
          const response = await nodeConfigApi.getNodeTemplates();
          if (response.success && response.data) {
            // 转换NodeTemplate为NodeTemplateType
            const templates: NodeTemplateType[] = response.data.map(template => ({
              type: template.type as any,
              name: template.name,
              description: template.description,
              config: template.config,
              inputs: template.inputs,
              outputs: template.outputs,
            }));
            setNodeTemplates(templates);
          }
        } catch (error) {
          console.error('加载节点模板失败:', error);
          // 如果加载失败，使用空数组作为后备
          setNodeTemplates([]);
        } finally {
          setTemplatesLoading(false);
        }
      };

      loadNodeTemplates();
    }, []);

    // 画布拖动状态
    const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
    const [canvasDragStart, setCanvasDragStart] = useState({ x: 0, y: 0 });
    const [canvasOffsetStart, setCanvasOffsetStart] = useState({ x: 0, y: 0 });

    // 节点拖动状态
    const [isDraggingNode, setIsDraggingNode] = useState(false);
    const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
    const [nodeDragStart, setNodeDragStart] = useState({ x: 0, y: 0 });
    const [nodePositionStart, setNodePositionStart] = useState({ x: 0, y: 0 });
    const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

    // 清理轮询
    const stopPolling = useCallback(() => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      setIsPolling(false);
    }, []);

    // 开始轮询工作流执行状态
    const startPolling = useCallback(
      (executionId: string) => {
        setCurrentExecutionId(executionId);
        setIsPolling(true);

        const pollStatus = async () => {
          try {
            const response = await aiWorkflowApi.getWorkflowExecutionStatus(
              executionId
            );
            if (response.success && response.data) {
              const { status, progress, nodeStatuses, results } = response.data;

              // 更新工作流状态
              setWorkflow((prev) => ({
                ...prev,
                status: status as any,
              }));

              // 更新节点状态
              if (nodeStatuses) {
                setWorkflow((prev) => ({
                  ...prev,
                  nodes: prev.nodes.map((node) => {
                    const nodeStatus = nodeStatuses[node.id];
                    if (nodeStatus) {
                      return {
                        ...node,
                        status: nodeStatus.status || node.status,
                        progress: nodeStatus.progress || node.progress,
                        result: nodeStatus.result || node.result,
                      };
                    }
                    return node;
                  }),
                }));
              }

              // 如果完成或出错，停止轮询
              if (status === "completed" || status === "error") {
                stopPolling();
                console.log("工作流执行完成:", { status, results });
                // 自动显示结果面板
                if (status === "completed") {
                  setShowResultsPanel(true);
                }
              }
            }
          } catch (error) {
            console.error("获取工作流执行状态失败:", error);
            // 继续轮询，除非是致命错误
          }
        };

        // 立即执行一次
        pollStatus();

        // 每2秒轮询一次
        pollingIntervalRef.current = setInterval(pollStatus, 2000);
      },
      [stopPolling]
    );

    // 组件卸载时清理轮询
    useEffect(() => {
      return () => {
        stopPolling();
      };
    }, [stopPolling]);

    // 处理初始工作流加载
    useEffect(() => {
      if (initialWorkflow) {
        console.log("收到初始工作流:", {
          name: initialWorkflow.name,
          nodeCount: initialWorkflow.nodes?.length || 0,
          connectionCount: initialWorkflow.connections?.length || 0
        });
        setWorkflow(initialWorkflow);
        // 重置画布状态
        setCanvasOffset({ x: 0, y: 0 });
        setZoom(1);
        setSelectedNode(null);
      }
    }, [initialWorkflow]);

    // 添加节点到画布
    const addNode = useCallback(
      (
        template: NodeTemplateType,
        position: { x: number; y: number }
      ) => {
        const newNode: WorkflowNode = {
          ...template,
          id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          position,
          status: "idle",
          progress: 0,
        };

        setWorkflow((prev) => ({
          ...prev,
          nodes: [...prev.nodes, newNode],
          updatedAt: new Date(),
        }));
      },
      []
    );

    // 删除节点
    const deleteNode = useCallback((nodeId: string) => {
      setWorkflow((prev) => ({
        ...prev,
        nodes: prev.nodes.filter((n) => n.id !== nodeId),
        connections: prev.connections.filter(
          (c) => c.sourceId !== nodeId && c.targetId !== nodeId
        ),
        updatedAt: new Date(),
      }));
      setSelectedNode(null);
    }, []);

    // 更新节点位置
    const updateNodePosition = useCallback(
      (nodeId: string, position: { x: number; y: number }) => {
        setWorkflow((prev) => ({
          ...prev,
          nodes: prev.nodes.map((n) =>
            n.id === nodeId ? { ...n, position } : n
          ),
          updatedAt: new Date(),
        }));
      },
      []
    );

    // 更新节点配置
    const updateNodeConfig = useCallback(
      (nodeId: string, config: Record<string, any>) => {
        setWorkflow((prev) => ({
          ...prev,
          nodes: prev.nodes.map((n) =>
            n.id === nodeId ? { ...n, config } : n
          ),
          updatedAt: new Date(),
        }));
      },
      []
    );

    // 创建连接
    const createConnection = useCallback(
      (
        sourceId: string,
        targetId: string,
        sourcePort: string,
        targetPort: string
      ) => {
        const connectionId = `conn_${sourceId}_${targetId}_${Date.now()}`;
        const newConnection: Connection = {
          id: connectionId,
          sourceId,
          targetId,
          sourcePort,
          targetPort,
        };

        setWorkflow((prev) => ({
          ...prev,
          connections: [...prev.connections, newConnection],
          updatedAt: new Date(),
        }));
      },
      []
    );

    // 删除连接
    const deleteConnection = useCallback((connectionId: string) => {
      setWorkflow((prev) => ({
        ...prev,
        connections: prev.connections.filter((c) => c.id !== connectionId),
        updatedAt: new Date(),
      }));
    }, []);

    // 处理画布拖放
    const handleCanvasDrop = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        if (!draggedNode || !canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const position = {
          x: (e.clientX - rect.left - canvasOffset.x) / zoom,
          y: (e.clientY - rect.top - canvasOffset.y) / zoom,
        };

        addNode(draggedNode, position);
        setDraggedNode(null);
      },
      [draggedNode, canvasOffset, zoom, addNode]
    );

    // 画布拖动事件处理
    const handleCanvasMouseDown = useCallback(
      (e: React.MouseEvent) => {
        // 只有在空白区域点击时才开始画布拖动
        if (e.target === canvasRef.current) {
          setIsDraggingCanvas(true);
          setCanvasDragStart({ x: e.clientX, y: e.clientY });
          setCanvasOffsetStart(canvasOffset);
        }
      },
      [canvasOffset]
    );

    const handleCanvasMouseMove = useCallback(
      (e: React.MouseEvent) => {
        if (isDraggingCanvas) {
          const deltaX = e.clientX - canvasDragStart.x;
          const deltaY = e.clientY - canvasDragStart.y;
          setCanvasOffset({
            x: canvasOffsetStart.x + deltaX,
            y: canvasOffsetStart.y + deltaY,
          });
        }

        if (isDraggingNode && draggingNodeId) {
          const rect = canvasRef.current?.getBoundingClientRect();
          if (rect) {
            const deltaX = e.clientX - nodeDragStart.x;
            const deltaY = e.clientY - nodeDragStart.y;
            const newPosition = {
              x: nodePositionStart.x + deltaX / zoom,
              y: nodePositionStart.y + deltaY / zoom,
            };
            updateNodePosition(draggingNodeId, newPosition);
          }
        }
      },
      [
        isDraggingCanvas,
        canvasDragStart,
        canvasOffsetStart,
        isDraggingNode,
        draggingNodeId,
        nodeDragStart,
        nodePositionStart,
        zoom,
        updateNodePosition,
      ]
    );

    const handleCanvasMouseUp = useCallback(() => {
      setIsDraggingCanvas(false);
      setIsDraggingNode(false);
      setDraggingNodeId(null);
    }, []);

    // 节点拖动事件处理
    const handleNodeMouseDown = useCallback(
      (e: React.MouseEvent, nodeId: string) => {
        e.stopPropagation();
        const node = workflow.nodes.find((n) => n.id === nodeId);
        if (node) {
          setIsDraggingNode(true);
          setDraggingNodeId(nodeId);
          setNodeDragStart({ x: e.clientX, y: e.clientY });
          setNodePositionStart(node.position);
          setSelectedNode(nodeId);
        }
      },
      [workflow.nodes]
    );

    // 添加全局鼠标事件监听
    useEffect(() => {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        if (isDraggingCanvas) {
          const deltaX = e.clientX - canvasDragStart.x;
          const deltaY = e.clientY - canvasDragStart.y;
          setCanvasOffset({
            x: canvasOffsetStart.x + deltaX,
            y: canvasOffsetStart.y + deltaY,
          });
        }

        if (isDraggingNode && draggingNodeId) {
          const rect = canvasRef.current?.getBoundingClientRect();
          if (rect) {
            const deltaX = e.clientX - nodeDragStart.x;
            const deltaY = e.clientY - nodeDragStart.y;
            const newPosition = {
              x: nodePositionStart.x + deltaX / zoom,
              y: nodePositionStart.y + deltaY / zoom,
            };
            updateNodePosition(draggingNodeId, newPosition);
          }
        }
      };

      const handleGlobalMouseUp = () => {
        setIsDraggingCanvas(false);
        setIsDraggingNode(false);
        setDraggingNodeId(null);
      };

      if (isDraggingCanvas || isDraggingNode) {
        document.addEventListener("mousemove", handleGlobalMouseMove);
        document.addEventListener("mouseup", handleGlobalMouseUp);
      }

      return () => {
        document.removeEventListener("mousemove", handleGlobalMouseMove);
        document.removeEventListener("mouseup", handleGlobalMouseUp);
      };
    }, [
      isDraggingCanvas,
      isDraggingNode,
      draggingNodeId,
      canvasDragStart,
      canvasOffsetStart,
      nodeDragStart,
      nodePositionStart,
      zoom,
      updateNodePosition,
    ]);

    // 运行工作流
    const runWorkflow = useCallback(() => {
      if (workflow.nodes.length === 0) {
        app.showError("请先添加节点到工作流中");
        return;
      }

      // 运行时不需要ID，直接传递工作流定义
      const workflowToRun = {
        ...workflow,
        // 运行时使用空字符串，让后端知道这是临时运行
        id: "",
      };

      setWorkflow((prev) => ({ ...prev, status: "running" }));
      onWorkflowRun?.(workflowToRun, startPolling);
    }, [workflow, onWorkflowRun, startPolling]);

    // 保存工作流
    const saveWorkflow = useCallback(async () => {
      if (onWorkflowSave) {
        const result = await onWorkflowSave(workflow);
        // 如果保存成功并返回了更新后的工作流，更新本地状态
        if (result) {
          setWorkflow((prev) => ({
            ...prev,
            id: result.id,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
          }));
        }
      }
    }, [workflow, onWorkflowSave]);

    // 加载模板
    const loadTemplate = useCallback((template: any) => {
      const newWorkflow: Workflow = {
        id: "", // 模板加载时也不创建ID，保存时才创建
        name: template.name,
        description: template.description,
        nodes: template.nodes.map((node: any) => ({
          ...node,
          id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          status: "idle",
          progress: 0,
        })),
        connections: template.connections.map((conn: any) => ({
          ...conn,
          id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        })),
        status: "idle",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setWorkflow(newWorkflow);
      setShowTemplates(false);
    }, []);

    // 处理历史记录重新运行
    const handleRerunFromHistory = useCallback(
      (execution: any) => {
        // 创建临时工作流定义并运行
        const tempWorkflow: Workflow = {
          id: "",
          name: execution.workflowName,
          description: "从历史记录重新运行",
          nodes: [],
          connections: [],
          status: "idle",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        onWorkflowRun?.(tempWorkflow, startPolling);
        setShowHistoryModal(false);
      },
      [onWorkflowRun, startPolling]
    );

    // 查看执行详情
    const handleViewDetails = useCallback((execution: any) => {
      console.log("查看执行详情:", execution);
      // 这里可以实现详情查看逻辑
    }, []);

    // 加载工作流
    const handleLoadWorkflow = useCallback((workflowId: string) => {
      console.log("加载工作流:", workflowId);
      // 这里可以实现加载工作流逻辑
      setShowHistoryModal(false);
    }, []);

    // 查看节点结果
    const handleViewNodeResult = useCallback(
      (nodeId: string) => {
        console.log("handleViewNodeResult 被调用，节点ID:", nodeId);
        const node = workflow.nodes.find((n) => n.id === nodeId);
        console.log("找到的节点:", node);
        if (node) {
          console.log("设置模态框状态，显示节点结果");
          setSelectedNodeForResults(node);
          setShowResultsModal(true);
        } else {
          console.log("未找到对应的节点");
        }
      },
      [workflow.nodes]
    );

    // 导出工作流结果
    const handleExportResults = useCallback(() => {
      const results = workflow.nodes
        .filter((node) => node.result)
        .reduce((acc, node) => {
          acc[node.id] = {
            name: node.name,
            type: node.type,
            status: node.status,
            result: node.result,
          };
          return acc;
        }, {} as Record<string, any>);

      const content = JSON.stringify(
        {
          workflowId: workflow.id,
          workflowName: workflow.name,
          status: workflow.status,
          timestamp: new Date().toISOString(),
          results,
        },
        null,
        2
      );

      const blob = new Blob([content], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `workflow_results_${workflow.name.replace(/\s+/g, "_")}_${
        new Date().toISOString().split("T")[0]
      }.json`;
      a.click();
      URL.revokeObjectURL(url);
    }, [workflow]);

    return (
      <div className="flex h-full bg-gray-50 dark:bg-gray-900">
        {/* 节点面板 */}
        {showNodePanel && (
          <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col flex-shrink-0">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Plus className="w-5 h-5 mr-2" />
                节点库
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                拖拽节点到画布中构建工作流
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {templatesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">加载节点模板...</span>
                </div>
              ) : (
              <div className="space-y-3">
                {nodeTemplates.map((template: NodeTemplateType, index: number) => {
                  const IconComponent = getNodeIcon(template.type);
                  return (
                    <div
                      key={index}
                      draggable
                      onDragStart={() => setDraggedNode(template)}
                      className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-move hover:shadow-md transition-shadow bg-white dark:bg-gray-700"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`p-2 rounded-lg ${getNodeColor(
                            template.type,
                            "idle"
                          )}`}
                        >
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                            {template.name}
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {template.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              )}
            </div>
          </div>
        )}

        {/* 主画布区域 */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* 工具栏 */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 min-w-0">
                <input
                  type="text"
                  value={workflow.name}
                  onChange={(e) =>
                    setWorkflow((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="text-lg font-semibold bg-transparent border-none outline-none text-gray-900 dark:text-white min-w-0 flex-shrink"
                  placeholder="工作流名称"
                />
                <div
                  className={`px-2 py-1 rounded text-xs flex-shrink-0 ${
                    workflow.status === "running"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                      : workflow.status === "completed"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
                  }`}
                >
                  {workflow.status === "running"
                    ? "运行中"
                    : workflow.status === "completed"
                    ? "已完成"
                    : "空闲"}
                </div>
              </div>

              <div className="flex items-center space-x-2 flex-shrink-0">
                <button
                  onClick={() => setShowNodePanel(!showNodePanel)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  title="切换节点面板"
                >
                  <Plus className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setShowTemplates(true)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  title="工作流模板"
                >
                  <Layout className="w-4 h-4" />
                </button>

                {/* <button
                  ref={historyButtonRef}
                  onClick={() => setShowHistoryModal(true)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  title="执行历史"
                >
                  <History className="w-4 h-4" />
                </button> */}

                <button
                  onClick={() => setShowResultsPanel(!showResultsPanel)}
                  className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg ${
                    showResultsPanel
                      ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                  title="执行结果"
                >
                  <BarChart3 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    if (!selectedNode) {
                      app.showError("请先选择一个节点进行配置");
                      return;
                    }
                    setShowConfigPanel(!showConfigPanel);
                  }}
                  className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg ${
                    showConfigPanel
                      ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                  title="配置面板"
                >
                  <Settings className="w-4 h-4" />
                </button>

                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

                <button
                  onClick={saveWorkflow}
                  className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <Save className="w-4 h-4" />
                  <span>保存</span>
                </button>

                <button
                  onClick={runWorkflow}
                  disabled={workflow.status === "running"}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {workflow.status === "running" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  <span>
                    {workflow.status === "running" ? "运行中" : "运行"}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* 画布 */}
          <div className="flex-1 relative overflow-hidden min-h-0">
            <div
              ref={canvasRef}
              className="w-full h-full bg-gray-50 dark:bg-gray-900 relative"
              onDrop={handleCanvasDrop}
              onDragOver={(e) => e.preventDefault()}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              style={{
                backgroundImage: `radial-gradient(circle, #e5e7eb 1px, transparent 1px)`,
                backgroundSize: "20px 20px",
                backgroundPosition: `${canvasOffset.x}px ${canvasOffset.y}px`,
                cursor: isDraggingCanvas ? "grabbing" : "grab",
              }}
            >
              {/* 渲染节点 */}
              {workflow.nodes.map((node) => {
                const IconComponent = getNodeIcon(node.type);
                const isSelected = selectedNode === node.id;
                const isHovered = hoveredNodeId === node.id;

                return (
                  <div
                    key={node.id}
                    className={`absolute bg-white dark:bg-gray-800 border-2 rounded-lg shadow-lg select-none group ${
                      isSelected
                        ? "border-blue-500 shadow-blue-200"
                        : "border-gray-200 dark:border-gray-600"
                    } ${getNodeColor(node.type, node.status)}`}
                    style={{
                      left: node.position.x * zoom + canvasOffset.x,
                      top: node.position.y * zoom + canvasOffset.y,
                      transform: `scale(${zoom})`,
                      transformOrigin: "top left",
                      width: "200px",
                      minHeight: "120px",
                      cursor:
                        isDraggingNode && draggingNodeId === node.id
                          ? "grabbing"
                          : "grab",
                    }}
                    onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNode(node.id);
                    }}
                  >
                    {/* 节点头部 */}
                    <div className="p-3 border-b border-gray-200 dark:border-gray-600 relative">
                      <div className="flex items-center space-x-2">
                        <IconComponent className="w-4 h-4" />
                        <span className="font-medium text-sm text-gray-900 dark:text-white flex-1">
                          {node.name}
                        </span>
                        {/* 拖动图标 - 悬停时显示 */}
                        {(isHovered ||
                          (isDraggingNode && draggingNodeId === node.id)) && (
                          <Move className="w-4 h-4 text-gray-400 cursor-grab" />
                        )}
                        {node.status === "running" && (
                          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {node.description}
                      </p>
                    </div>

                    {/* 输入端口 */}
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1/2">
                      {node.inputs.map((input, index) => (
                        <div
                          key={input}
                          className="w-3 h-3 bg-blue-500 rounded-full border-2 border-white cursor-pointer hover:scale-110 transition-transform"
                          style={{ marginTop: index * 20 }}
                          title={input}
                        />
                      ))}
                    </div>

                    {/* 输出端口 */}
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2">
                      {node.outputs.map((output, index) => (
                        <div
                          key={output}
                          className="w-3 h-3 bg-green-500 rounded-full border-2 border-white cursor-pointer hover:scale-110 transition-transform"
                          style={{ marginTop: index * 20 }}
                          title={output}
                        />
                      ))}
                    </div>

                    {/* 进度条 */}
                    {node.status === "running" && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-600">
                        <div
                          className="h-full bg-blue-500 transition-all duration-300"
                          style={{ width: `${node.progress}%` }}
                        />
                      </div>
                    )}

                    {/* 删除按钮 */}
                    {isSelected && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNode(node.id);
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}

              {/* 渲染连接线 */}
              <svg className="absolute inset-0 pointer-events-none">
                {workflow.connections.map((connection) => {
                  const sourceNode = workflow.nodes.find(
                    (n) => n.id === connection.sourceId
                  );
                  const targetNode = workflow.nodes.find(
                    (n) => n.id === connection.targetId
                  );

                  if (!sourceNode || !targetNode) return null;

                  const startX =
                    (sourceNode.position.x + 200) * zoom + canvasOffset.x;
                  const startY =
                    (sourceNode.position.y + 60) * zoom + canvasOffset.y;
                  const endX = targetNode.position.x * zoom + canvasOffset.x;
                  const endY =
                    (targetNode.position.y + 60) * zoom + canvasOffset.y;

                  const midX = (startX + endX) / 2;

                  return (
                    <g key={connection.id}>
                      <path
                        d={`M ${startX} ${startY} C ${midX} ${startY} ${midX} ${endY} ${endX} ${endY}`}
                        stroke="#6b7280"
                        strokeWidth="2"
                        fill="none"
                        className="hover:stroke-blue-500 cursor-pointer"
                        onClick={() => deleteConnection(connection.id)}
                      />
                      <circle cx={endX} cy={endY} r="4" fill="#6b7280" />
                    </g>
                  );
                })}
              </svg>

              {/* 空状态提示 */}
              {workflow.nodes.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      开始构建你的 AI 工作流
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      从左侧节点库拖拽节点到画布中，然后连接它们创建工作流
                    </p>
                    <button
                      onClick={() => setShowNodePanel(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      打开节点库
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 结果面板 */}
        {showResultsPanel && (
          <div className="w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col flex-shrink-0">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  执行结果
                </h3>
                <button
                  onClick={() => setShowResultsPanel(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden min-h-0">
              <WorkflowResultsDisplay
                nodes={workflow.nodes}
                workflowStatus={workflow.status}
                onViewNodeResult={handleViewNodeResult}
                onExportResults={handleExportResults}
                className="h-full border-0 rounded-none"
              />
            </div>
          </div>
        )}

        {/* 配置面板 */}
        {showConfigPanel &&
          selectedNode &&
          (() => {
            const node = workflow.nodes.find((n) => n.id === selectedNode);
            return node ? (
              <div className="flex-shrink-0">
                <NodeConfigPanel
                  nodeId={node.id}
                  nodeType={node.type}
                  nodeName={node.name}
                  config={node.config}
                  onConfigChange={updateNodeConfig}
                  onClose={() => setShowConfigPanel(false)}
                />
              </div>
            ) : null;
          })()}

        {/* 工作流模板 */}
        {showTemplates && (
          <WorkflowTemplates
            onTemplateSelect={loadTemplate}
            onClose={() => setShowTemplates(false)}
          />
        )}

        {/* 执行历史 */}
        <Modal
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          title="执行历史"
          mode="popover"
          triggerElement={historyButtonRef.current}
          position="bottom"
        >
          <WorkflowHistoryPopover
            onLoadWorkflow={handleLoadWorkflow}
            onRerun={handleRerunFromHistory}
            onViewDetails={handleViewDetails}
          />
        </Modal>

        {/* 节点结果详情弹窗 */}
        <WorkflowResultsModal
          isOpen={showResultsModal}
          onClose={() => setShowResultsModal(false)}
          node={selectedNodeForResults}
        />
      </div>
    );
  }
);

export default WorkflowCanvas;
