import React, { useState } from "react";
import {
  X,
  Download,
  Copy,
  BarChart3,
  FileText,
  Database,
  Target,
  Shield,
  Zap,
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Modal } from "../../components";
import { NODE_TYPE_LABELS } from "../../constants/workflowConstants";

interface WorkflowNode {
  id: string;
  type: "data" | "analysis" | "strategy" | "risk" | "output" | "custom";
  name: string;
  description: string;
  status: "idle" | "running" | "completed" | "error";
  progress: number;
  result?: any;
}

interface WorkflowResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  node: WorkflowNode | null;
}

const WorkflowResultsModal: React.FC<WorkflowResultsModalProps> = ({
  isOpen,
  onClose,
  node,
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "details" | "raw">(
    "overview"
  );

  if (!node) return null;

  const getNodeIcon = (type: string) => {
    switch (type) {
      case "data":
        return Database;
      case "analysis":
        return BarChart3;
      case "strategy":
        return Target;
      case "risk":
        return Shield;
      case "output":
        return FileText;
      default:
        return Zap;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "running":
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };



  const formatResultOverview = (result: any, type: string) => {
    if (!result) return null;

    try {
      if (type === "analysis" && result.analysis) {
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                分析结果
              </h4>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-gray-700 dark:text-gray-300">
                  {result.analysis}
                </p>
              </div>
            </div>
            {result.metrics && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  关键指标
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(result.metrics).map(([key, value]) => (
                    <div
                      key={key}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3"
                    >
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {key}
                      </div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {typeof value === "number"
                          ? value.toFixed(2)
                          : String(value)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }

      if (type === "data" && result.data) {
        const dataArray = Array.isArray(result.data)
          ? result.data
          : [result.data];
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                数据概览
              </h4>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      数据量:
                    </span>
                    <span className="ml-2 font-medium">
                      {dataArray.length} 条
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      数据类型:
                    </span>
                    <span className="ml-2 font-medium">
                      {typeof dataArray[0] === "object"
                        ? "结构化数据"
                        : "文本数据"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {dataArray.length > 0 && typeof dataArray[0] === "object" && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  数据样本
                </h4>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <pre className="text-sm text-gray-700 dark:text-gray-300">
                    {JSON.stringify(dataArray.slice(0, 3), null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        );
      }

      if (type === "strategy" && result.recommendations) {
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                策略推荐
              </h4>
              <div className="space-y-3">
                {result.recommendations
                  .slice(0, 5)
                  .map((rec: any, index: number) => (
                    <div
                      key={index}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {rec.name || rec.symbol || `推荐 ${index + 1}`}
                        </span>
                        {rec.score && (
                          <span className="text-sm bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                            评分: {rec.score}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {rec.reason || rec.description || "暂无详细说明"}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              执行结果
            </h4>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-gray-700 dark:text-gray-300">
                {typeof result === "string"
                  ? result
                  : "数据已生成，查看详细信息获取完整内容"}
              </p>
            </div>
          </div>
        </div>
      );
    } catch (error) {
      return (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-300">数据解析错误</p>
        </div>
      );
    }
  };

  const handleCopyResult = () => {
    if (node.result) {
      navigator.clipboard.writeText(JSON.stringify(node.result, null, 2));
      // 这里可以添加toast提示
    }
  };

  const handleDownloadResult = () => {
    if (node.result) {
      const content = JSON.stringify(node.result, null, 2);
      const blob = new Blob([content], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${node.name.replace(/\s+/g, "_")}_result.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const IconComponent = getNodeIcon(node.type);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="" 
      mode="modal" 
      className="max-w-4xl"
      showCloseButton={false}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-h-[85vh] flex flex-col overflow-hidden">
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <IconComponent className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {node.name}
                </h2>
                <div className="flex items-center space-x-2 mt-1">
                  {getStatusIcon(node.status)}
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {node.description}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {node.result && (
                <>
                  <button
                    onClick={handleCopyResult}
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    <Copy className="w-4 h-4" />
                    <span>复制</span>
                  </button>
                  <button
                    onClick={handleDownloadResult}
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/30"
                  >
                    <Download className="w-4 h-4" />
                    <span>下载</span>
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* 标签栏 */}
        <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-3 py-1 text-sm font-medium rounded-lg ${
                activeTab === "overview"
                  ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              概览
            </button>
            <button
              onClick={() => setActiveTab("details")}
              className={`px-3 py-1 text-sm font-medium rounded-lg ${
                activeTab === "details"
                  ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              详细信息
            </button>
            <button
              onClick={() => setActiveTab("raw")}
              className={`px-3 py-1 text-sm font-medium rounded-lg ${
                activeTab === "raw"
                  ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              原始数据
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="px-6 py-4 flex-1 overflow-y-auto min-h-0">
          {activeTab === "overview" && (
            <div>
              {node.status === "completed" && node.result ? (
                formatResultOverview(node.result, node.type)
              ) : node.status === "running" ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    节点正在执行中...
                  </p>
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${node.progress}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      进度: {node.progress}%
                    </p>
                  </div>
                </div>
              ) : node.status === "error" ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
                  <p className="text-red-600 dark:text-red-400">节点执行失败</p>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    请检查节点配置或重新运行工作流
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    节点尚未执行
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "details" && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  节点信息
                </h4>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        节点ID:
                      </span>
                      <span className="ml-2 font-mono">{node.id}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        节点类型:
                      </span>
                      <span className="ml-2">{NODE_TYPE_LABELS[node.type] || node.type}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        执行状态:
                      </span>
                      <span className="ml-2">{node.status}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        执行进度:
                      </span>
                      <span className="ml-2">{node.progress}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {node.result && (
                <>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      结果摘要
                    </h4>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        数据类型: {typeof node.result}
                        <br />
                        数据大小: {JSON.stringify(node.result).length} 字节
                        <br />
                        包含字段:{" "}
                        {typeof node.result === "object"
                          ? Object.keys(node.result).length
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* 分析结果详细信息 */}
                  {node.type === "analysis" && node.result.analysis && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        分析结果详情
                      </h4>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {node.result.analysis}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 策略推荐详细信息 */}
                  {node.type === "strategy" && node.result.recommendations && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        策略推荐详情
                      </h4>
                      <div className="space-y-3">
                        {node.result.recommendations.map((rec: any, index: number) => (
                          <div
                            key={index}
                            className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="font-medium text-gray-900 dark:text-white">
                                {rec.name || rec.symbol || `推荐 ${index + 1}`}
                              </h5>
                              {rec.score && (
                                <span className="text-sm bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                                  评分: {rec.score}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                              {rec.reason || rec.description || "暂无详细说明"}
                            </p>
                            
                            {/* 显示额外的详细信息 */}
                            {rec.details && (
                              <div className="border-t border-gray-200 dark:border-gray-600 pt-3 mt-3">
                                <h6 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  详细信息:
                                </h6>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  {typeof rec.details === 'string' ? (
                                    <p className="whitespace-pre-wrap">{rec.details}</p>
                                  ) : (
                                    <pre className="whitespace-pre-wrap">
                                      {JSON.stringify(rec.details, null, 2)}
                                    </pre>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* 显示指标信息 */}
                            {rec.metrics && (
                              <div className="border-t border-gray-200 dark:border-gray-600 pt-3 mt-3">
                                <h6 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  相关指标:
                                </h6>
                                <div className="grid grid-cols-2 gap-2">
                                  {Object.entries(rec.metrics).map(([key, value]) => (
                                    <div key={key} className="text-xs">
                                      <span className="text-gray-600 dark:text-gray-400">{key}:</span>
                                      <span className="ml-1 font-medium text-gray-900 dark:text-white">
                                        {typeof value === "number" ? value.toFixed(2) : String(value)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 数据分析详细信息 */}
                  {node.type === "data" && node.result.data && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        数据分析详情
                      </h4>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="space-y-3">
                          {Array.isArray(node.result.data) && node.result.data.length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                数据结构分析:
                              </h5>
                              <div className="text-sm text-gray-700 dark:text-gray-300">
                                <p>总记录数: {node.result.data.length}</p>
                                {typeof node.result.data[0] === 'object' && (
                                  <p>数据字段: {Object.keys(node.result.data[0]).join(', ')}</p>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {node.result.summary && (
                            <div>
                              <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                数据摘要:
                              </h5>
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                {node.result.summary}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 通用结果详细信息 */}
                  {node.result.details && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        执行详情
                      </h4>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {typeof node.result.details === 'string' 
                            ? node.result.details 
                            : JSON.stringify(node.result.details, null, 2)}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === "raw" && (
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                原始数据
              </h4>
              {node.result ? (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-96 overflow-auto">
                  <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                    {JSON.stringify(node.result, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                  <p className="text-gray-600 dark:text-gray-400">
                    暂无结果数据
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default WorkflowResultsModal;
