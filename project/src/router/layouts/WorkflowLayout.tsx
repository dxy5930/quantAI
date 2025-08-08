import React, { Suspense, useState, createContext, useContext, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../../components/layout/Sidebar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ToastContainer } from '../../components/common/Toast';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { workflowApi } from '../../services/workflowApi';
import { useUserStore } from '../../hooks/useStore';

interface TaskItem {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed";
  dueDate?: Date;
  createdAt: Date;
}

interface TaskContextType {
  tasks: TaskItem[];
  updateTask: (taskId: string, updates: Partial<TaskItem>) => void;
  addTask: (task: TaskItem) => void;
  loadTasks: () => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
}

const TaskContext = createContext<TaskContextType | null>(null);

export const useTaskContext = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
};

export const WorkflowPageLayout: React.FC = () => {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const userStore = useUserStore();

  const handleWorkflowSelect = (workflowId: string) => {
    setSelectedWorkflowId(workflowId);
  };

  const updateTask = (taskId: string, updates: Partial<TaskItem>) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    ));
  };

  const addTask = (task: TaskItem) => {
    setTasks(prev => [task, ...prev]);
  };

  const deleteTask = async (taskId: string) => {
    const previousTasks = tasks;
    // 乐观更新：先从本地移除
    setTasks(prev => prev.filter(t => t.id !== taskId));
    try {
      await workflowApi.deleteWorkflow(taskId);
      // 如果当前选中的是被删除的任务，则清空选中
      if (selectedWorkflowId === taskId) {
        setSelectedWorkflowId(null);
      }
      // 可选刷新，保持与后端一致（此处省略以减少不必要请求）
    } catch (error) {
      console.error('软删除工作流失败:', error);
      // 回滚本地状态
      setTasks(previousTasks);
      throw error;
    }
  };

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      if (userStore.currentUser?.id) {
        const workflows = await workflowApi.getWorkflows({
          user_id: userStore.currentUser.id,
          limit: 100
        });
        
        const formattedTasks: TaskItem[] = workflows.map(workflow => ({
          id: workflow.id,
          title: workflow.title,
          description: workflow.description || "无描述",
          status: workflow.status === 'running' ? "in_progress" 
                : workflow.status === 'completed' ? "completed"
                : "pending",
          createdAt: new Date(workflow.created_at)
        }));
        
        setTasks(formattedTasks);
        console.log('已加载工作流列表:', formattedTasks);
      }
    } catch (error) {
      console.error('加载工作流列表失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 页面初始化时加载任务列表
  useEffect(() => {
    if (userStore.isLoggedIn) {
      loadTasks();
    } else {
      setIsLoading(false);
    }
  }, [userStore.isLoggedIn, userStore.currentUser?.id]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const taskContextValue: TaskContextType = {
    tasks,
    updateTask,
    addTask,
    loadTasks,
    deleteTask
  };

  return (
    <TaskContext.Provider value={taskContextValue}>
      <div className="h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-300 page-container-stable flex overflow-hidden">
        {/* 左侧边栏 */}
        <div className={`transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-0' : 'w-64'} flex-shrink-0`}>
          <Sidebar 
            className={`${isSidebarCollapsed ? 'hidden' : 'block'}`}
            selectedWorkflowId={selectedWorkflowId}
            onWorkflowSelect={handleWorkflowSelect}
          />
        </div>
        
        {/* 侧边栏折叠/展开按钮 */}
        <div className="relative flex-shrink-0">
          <button
            onClick={toggleSidebar}
            className="absolute top-1/2 -translate-y-1/2 z-10  h-16 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-r-lg shadow-lg hover:bg-gray-50 dark:hover:bg-slate-700 hover:shadow-xl flex items-center justify-center transition-all duration-200 group"
            title={isSidebarCollapsed ? "展开侧边栏" : "收起侧边栏"}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
            )}
          </button>
        </div>
        
        {/* 右侧内容区域 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Suspense fallback={
            <div className="flex-1 flex items-center justify-center">
              <LoadingSpinner size="lg" text="加载中..." />
            </div>
          }>
            <main className="flex-1 overflow-hidden">
              <Outlet context={{ selectedWorkflowId, onWorkflowSelect: handleWorkflowSelect }} />
            </main>
          </Suspense>
        </div>
        
        <ToastContainer />
      </div>
    </TaskContext.Provider>
  );
}; 