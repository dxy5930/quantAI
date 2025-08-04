import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { WorkflowList } from './WorkflowList';
import { WorkflowCanvas } from './WorkflowCanvas';
import { WorkspacePanel } from './WorkspacePanel';
import { WorkflowNode, NodeResource } from '../../types/workflow-types';
import { TaskContext, AgentStatus } from './types';

interface WorkflowLayoutProps {
  className?: string;
}

export const WorkflowLayout: React.FC<WorkflowLayoutProps> = observer(({ className = '' }) => {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [taskContext, setTaskContext] = useState<TaskContext | undefined>(undefined);
  const [agentStatus, setAgentStatus] = useState<AgentStatus | undefined>(undefined);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [nodeResource, setNodeResource] = useState<NodeResource | null>(null);
  const [targetTab, setTargetTab] = useState<string | null>(null);

  const handleWorkflowSelect = (workflowId: string) => {
    setSelectedWorkflowId(workflowId);
    
    // 模拟任务上下文变化 - 实际项目中这里会根据真实的任务执行情况更新
    if (workflowId === '1') {
      setTaskContext({
        taskType: 'stock-analysis',
        // 网页资源 - browser tab数据
        webResources: [
          {
            id: '1',
            title: '苹果公司财报 - 东方财富网',
            url: 'https://quote.eastmoney.com/us/AAPL.html',
            description: '苹果公司最新财报数据和股价信息',
            timestamp: new Date(),
            status: 'loaded'
          },
          {
            id: '2', 
            title: '苹果股票分析 - 雪球',
            url: 'https://xueqiu.com/S/AAPL',
            description: '专业的苹果股票投资分析和讨论',
            timestamp: new Date(Date.now() - 60000),
            status: 'loaded'
          },
          {
            id: '3',
            title: 'Apple Inc. - Yahoo Finance',
            url: 'https://finance.yahoo.com/quote/AAPL',
            description: 'Apple股票实时价格、图表和财务数据',
            timestamp: new Date(Date.now() - 120000),
            status: 'loaded'
          }
        ],
        // 数据库资源 - database tab数据
        databases: [
          {
            id: '1',
            name: '股票历史数据',
            tables: ['stocks', 'stock_prices', 'stock_dividends'],
            description: 'MySQL数据库，包含156789条记录',
            queryUrl: '/api/database/stocks'
          },
          {
            id: '2',
            name: '财务报表数据',
            tables: ['financial_reports', 'balance_sheets', 'income_statements'],
            description: 'PostgreSQL数据库，包含45632条记录',
            queryUrl: '/api/database/financial'
          }
        ],
        // API资源 - apis tab数据
        apis: [
          {
            id: '1',
            name: 'Yahoo Finance API',
            endpoint: '/v8/finance/chart/AAPL',
            method: 'GET',
            description: '获取苹果股票实时价格数据',
            documentation: 'Yahoo Finance API文档'
          },
          {
            id: '2',
            name: 'Alpha Vantage API',
            endpoint: '/query?function=TIME_SERIES_DAILY',
            method: 'GET',
            description: '获取股票日线数据',
            documentation: 'Alpha Vantage API文档'
          }
        ],
        // 图表和文件资源 - resources tab数据
        charts: [
          {
            id: '1',
            title: 'AAPL 股价走势图',
            type: 'candlestick',
            description: '苹果股票近一年K线图',
            imageUrl: '/api/charts/aapl-candlestick.png',
            dataUrl: '/api/data/aapl-ohlc.json',
            timestamp: new Date()
          },
          {
            id: '2',
            title: '技术指标分析',
            type: 'line',
            description: 'RSI, MACD, MA指标对比',
            imageUrl: '/api/charts/aapl-indicators.png',
            dataUrl: '/api/data/aapl-indicators.json',
            timestamp: new Date(Date.now() - 30000)
          }
        ],
        files: [
          {
            id: '1',
            name: 'AAPL_analysis_report.pdf',
            type: 'PDF',
            size: '2.3 MB',
            downloadUrl: '/api/files/aapl-analysis.pdf',
            timestamp: new Date()
          },
          {
            id: '2',
            name: 'financial_data.xlsx',
            type: 'Excel',
            size: '856 KB',
            downloadUrl: '/api/files/financial-data.xlsx',
            timestamp: new Date(Date.now() - 120000)
          }
        ]
      });

      // 模拟Agent状态
      setAgentStatus({
        currentStep: 2,
        totalSteps: 5,
        isRunning: true,
        startTime: new Date(Date.now() - 120000),
        agents: [
          {
            id: 'data-collector',
            name: '数据收集器',
            description: '从多个数据源收集股票相关信息',
            status: 'completed',
            startTime: new Date(Date.now() - 120000),
            endTime: new Date(Date.now() - 90000),
            duration: 30,
            progress: 100,
            outputs: ['成功获取AAPL股票数据', '收集了Yahoo Finance数据', '获取东方财富网数据'],
            logs: [
              {
                id: '1',
                timestamp: new Date(Date.now() - 120000),
                level: 'info',
                message: '开始收集股票数据...'
              },
              {
                id: '2',
                timestamp: new Date(Date.now() - 100000),
                level: 'success',
                message: 'Yahoo Finance API调用成功'
              }
            ]
          },
          {
            id: 'data-analyzer',
            name: '数据分析器',
            description: '分析股票技术指标和基本面数据',
            status: 'running',
            startTime: new Date(Date.now() - 90000),
            progress: 65,
            outputs: ['正在计算RSI指标...', '正在分析MACD走势...'],
            logs: [
              {
                id: '4',
                timestamp: new Date(Date.now() - 90000),
                level: 'info',
                message: '开始数据分析...'
              },
              {
                id: '5',
                timestamp: new Date(Date.now() - 60000),
                level: 'info',
                message: '计算技术指标中...'
              }
            ]
          }
        ]
      });
    } else {
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
              ].slice(-5) : undefined // 只保留最新5条输出
            };
          }
          return agent;
        });

        return {
          ...prev,
          agents: updatedAgents
        };
      });
    }, 3000); // 每3秒更新一次

    return () => clearInterval(interval);
  }, [agentStatus?.isRunning]);



  // 节点点击处理
  const handleNodeClick = (nodeId: string, nodeType: string) => {
    setSelectedNodeId(nodeId);
    
    // 只设置目标tab，不改变taskContext的数据
    if (['browser', 'database', 'apis', 'resources'].includes(nodeType)) {
      setTargetTab(nodeType);
      // 清空nodeResource，避免干扰tab显示
      setNodeResource(null);
    } else {
      // 对于其他类型的节点，保持原有逻辑
      const resource = generateNodeResource(nodeId, nodeType);
      setNodeResource(resource);
    }
    
    // 右侧面板现在会自动显示，无需手动控制
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
  const shouldShowRightPanel = selectedNodeId || (agentStatus && agentStatus.isRunning) || taskContext;

  return (
    <div className={`h-full flex bg-gray-50 dark:bg-slate-900 p-4 ${className}`}>
      {/* 左侧工作流列表 - 固定在左侧 */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 w-64 flex-shrink-0 h-full overflow-hidden rounded-xl shadow-sm">
        <WorkflowList 
          selectedWorkflowId={selectedWorkflowId}
          onWorkflowSelect={handleWorkflowSelect}
        />
      </div>

      {/* 中间画布区域 */}
      <div className="flex flex-col min-w-0 flex-1 h-full mx-4">
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 h-full rounded-xl shadow-sm overflow-hidden">
          <WorkflowCanvas 
            workflowId={selectedWorkflowId}
            onNodeClick={handleNodeClick}
            selectedNodeId={selectedNodeId}
          />
        </div>
      </div>

      {/* 右侧工作空间 - 动态显示 */}
      <div 
        className={`bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 flex-shrink-0 transition-all duration-500 ease-in-out rounded-xl shadow-sm overflow-hidden ${
          shouldShowRightPanel ? 'w-80 opacity-100' : 'w-0 opacity-0'
        }`}
        style={{
          minWidth: shouldShowRightPanel ? '320px' : '0px'
        }}
      >
        <div className={`${shouldShowRightPanel ? 'block' : 'hidden'} h-full transition-all duration-500`}>
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