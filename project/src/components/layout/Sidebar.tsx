import React, { useState, useRef } from "react";
import { observer } from "mobx-react-lite";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Bot,
  Workflow,
  User,
  Settings,
  LogOut,
  ChevronDown, 
  ChevronRight, 
  Home,
  Plus,
  PlayCircle,
  X,
  Delete,
  Trash,
  Bell,
  MessageCircle, 
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Logo } from "../common/Logo";
import { useUserStore, useAppStore } from "../../hooks/useStore";
import { ROUTES } from "../../constants/routes";
import { useTaskContext } from "../../router/layouts/WorkflowLayout";
import { pythonApiClient } from '../../services/pythonApiClient';


interface SidebarProps {
  className?: string;
  selectedWorkflowId?: string | null;
  onWorkflowSelect?: (workflowId: string) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  path?: string;
  children?: MenuItem[];
  requiresAuth?: boolean;
}

interface WorkflowItem {
  id: string;
  name: string;
  description: string;
  status: "idle" | "running" | "completed";
  lastRun?: Date;
}

interface TaskItem {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed";
  dueDate?: Date;
  createdAt: Date;
}

export const Sidebar: React.FC<SidebarProps> = observer(
  ({ className = "", selectedWorkflowId, onWorkflowSelect }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const userStore = useUserStore();
    const appStore = useAppStore();
    const { tasks, addTask, updateTask } = useTaskContext();
    const [expandedItems, setExpandedItems] = useState<Set<string>>(
      new Set(["tasks"])
    );


    const menuItems: MenuItem[] = [
      {
        id: "home",
        label: "首页",
        icon: Home,
        path: ROUTES.HOME,
      },
    ];

    const toggleExpanded = (itemId: string) => {
      const newExpanded = new Set(expandedItems);
      if (newExpanded.has(itemId)) {
        newExpanded.delete(itemId);
      } else {
        newExpanded.add(itemId);
      }
      setExpandedItems(newExpanded);
    };

    const handleLogout = async () => {
      try {
        await userStore.logout();
        navigate(ROUTES.AI_WORKFLOW);
      } catch (error) {
        console.error("登出失败:", error);
      }
    };

    const handleTaskClick = (taskId: string) => {
      // 切换任务前，清理当前的流式连接
      try {
        if (pythonApiClient.getActiveConnectionCount() > 0) {
          console.log('切换任务，清理活跃连接');
          pythonApiClient.closeAllConnections();
        }
      } catch (error) {
        console.error('切换任务时清理连接失败:', error);
      }
      
      if (onWorkflowSelect) {
        onWorkflowSelect(taskId);
      }
    };

    // 新建工作流处理函数
    const handleCreateNewWorkflow = () => {
      // 新建工作流前，清理当前的流式连接
      try {
        if (pythonApiClient.getActiveConnectionCount() > 0) {
          console.log('新建工作流，清理活跃连接');
          pythonApiClient.closeAllConnections();
        }
      } catch (error) {
        console.error('新建工作流时清理连接失败:', error);
      }
      
      const newTaskId = `task_${Date.now()}`;
      const newTask: TaskItem = {
        id: newTaskId,
        title: "新工作流", // 临时名称，等待AI生成
        description: "等待开始对话...",
        status: "pending",
        createdAt: new Date(),
      };

      console.log("创建新任务:", newTask);
      addTask(newTask);

      // 自动选择新创建的工作流
      if (onWorkflowSelect) {
        onWorkflowSelect(newTaskId);
        console.log("选择新工作流:", newTaskId);
      }

      // 导航到AI工作流页面
      if (location.pathname !== ROUTES.AI_WORKFLOW) {
        navigate(ROUTES.AI_WORKFLOW);
      }
    };

    // 将更新方法暴露给其他组件
    React.useEffect(() => {
      // 在全局对象上暴露更新方法，供其他组件调用
      (window as any).updateSidebarTask = (
        taskId: string,
        title: string,
        description?: string
      ) => {
        console.log("Sidebar收到更新请求:", { taskId, title, description });
        console.log("当前任务列表:", tasks);
        updateTask(taskId, {
          title,
          description: description || undefined,
          status: "in_progress",
        });
      };

      console.log("updateSidebarTask方法已设置");

      return () => {
        delete (window as any).updateSidebarTask;
      };
    }, [updateTask, tasks]);

    const handleNotificationClick = () => {
      navigate(ROUTES.NOTIFICATIONS);
    };

    const handleUserInfoClick = () => {
      navigate(ROUTES.PROFILE);
    };

    const renderMenuItem = (item: MenuItem, level: number = 0) => {
      const isActive = item.path && location.pathname === item.path;
      const isExpanded = expandedItems.has(item.id);
      const hasChildren = item.children && item.children.length > 0;

      // 如果需要登录但用户未登录，则不显示该项
      if (item.requiresAuth && !userStore.isLoggedIn) {
        return null;
      }

      const paddingLeft = level === 0 ? "pl-4" : "pl-8";

      return (
        <div key={item.id}>
          <div
            className={`
            flex items-center justify-between w-full px-2 py-2 mx-2 rounded-lg text-left transition-all duration-200 cursor-pointer
            ${
              isActive
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }
            ${paddingLeft}
          `}
            onClick={() => {
              if (hasChildren) {
                toggleExpanded(item.id);
              } else if (item.path) {
                navigate(item.path);
              }
            }}
          >
            <div className="flex items-center space-x-3">
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </div>
            {hasChildren && (
              <div className="flex-shrink-0">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </div>
            )}
          </div>

          {hasChildren && isExpanded && (
            <div className="mt-1">
              {item.children!.map((child) => renderMenuItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    };

    const renderTaskItem = (task: TaskItem) => {
      const isSelected = selectedWorkflowId === task.id;
      const statusColor = {
        pending: "text-gray-500",
        in_progress: "text-blue-500",
        completed: "text-green-500",
      }[task.status];

      function handleDeleteTask(id: string): void {
        console.log("删除任务:", id);
        // 需要从Context中添加deleteTask方法
        // 临时禁用删除功能，等待实现
        alert("删除功能暂未实现");
      }

      return (
        <div
          key={task.id}
          className={`
           py-3 rounded-lg cursor-pointer transition-all duration-200
          ${
            isSelected
              ? "bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700"
              : "hover:bg-gray-100 dark:hover:bg-gray-700"
          }
        `}
          onClick={() => handleTaskClick(task.id)}
        >
          <div className="flex items-start space-x-3">
            <div className={`w-2 h-2 rounded-full mt-2 ${statusColor}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {task.title}
                </h4>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                {task.description}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {task.createdAt.toLocaleString()}
              </p>
            </div>
            <Trash className="w-4 h-4 text-red-500 self-end items-start mr-2" onClick={()=>handleDeleteTask(task.id)}/>
          </div>
        </div>
      );
    };

    return (
      <div
        className={`h-full w-64 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-gray-700 flex flex-col ${className}`}
      >
        {/* 顶部Logo区域 */}
        <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
          <Logo variant="header" showText={true} />
        </div>

        {/* 中间内容区域 - 添加 overflow-x-hidden 防止横向滚动条 */}
        <div className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
          {/* 基础导航 */}
          <nav className="space-y-1 mb-4">
            {menuItems.map((item) => renderMenuItem(item))}
          </nav>

          {/* AI助手区域 */}
          {/* <div className="px-2 mt-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white px-2 mb-3">
              AI助手
            </h3>
            <div className="space-y-1">
              <div className="mx-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                <div className="flex items-center space-x-3">
                  <Bot className="w-5 h-5 text-blue-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    智能对话
                  </span>
                </div>
              </div>
              <div className="mx-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                <div className="flex items-center space-x-3">
                  <Bot className="w-5 h-5 text-purple-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    数据分析
                  </span>
                </div>
              </div>
            </div>
          </div> */}

          {/* 任务列表区域 */}
          <div className="px-2 mt-6">
            <div className="flex items-center justify-between mb-3 px-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                任务
              </h3>
              <button
                onClick={handleCreateNewWorkflow}
                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                title="新建工作流"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {tasks.map((task) => renderTaskItem(task))}
            </div>
          </div>
        </div>

        {/* 底部用户区域 */}
        <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-4">
          {userStore.isLoggedIn ? (
            <div className="space-y-2">
              {/* 用户信息 */}
              <div 
                onClick={handleUserInfoClick}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
              >
                {userStore.userAvatar ? (
                  <img
                    src={userStore.userAvatar}
                    alt={userStore.userDisplayName}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {userStore.userDisplayName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {userStore.currentUser?.email}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>

              {/* 操作按钮 */}
              <div className="flex space-x-1">
                <div className="relative flex-1">
                  <button
                    onClick={handleNotificationClick}
                    className="w-full flex items-center justify-center space-x-1 p-2 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Bell className="w-4 h-4" />
                    <span>通知</span>
                    {appStore.hasUnreadNotifications && (
                      <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white font-bold">
                          {appStore.unreadNotificationCount > 9
                            ? "9+"
                            : appStore.unreadNotificationCount}
                        </span>
                      </span>
                    )}
                  </button>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex-1 flex items-center justify-center space-x-1 p-2 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>退出</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => navigate(ROUTES.LOGIN)}
              className="w-full flex items-center justify-center space-x-2 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <User className="w-4 h-4" />
              <span className="text-sm font-medium">登录</span>
            </button>
          )}
        </div>
      </div>
    );
  }
);
