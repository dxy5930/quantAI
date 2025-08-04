import { makeAutoObservable, runInAction } from "mobx";
// import { strategyStore } from './StrategyStore'; // 移除直接导入避免循环依赖
import { userStore } from "./UserStore";
import { systemApi, SystemStats } from "../services/api/systemApi";
import { addThemeListener, Theme } from "../hooks/useTheme";

export class AppStore {
  // UI状态
  currentView:
    | "home"
    | "config"
    | "results"
    | "login"
    | "register"
    | "profile" = "home";
  isInitialized: boolean = false;
  globalLoading: boolean = false;
  globalError: string | null = null;

  // 主题和布局
  theme: Theme = "dark";
  sidebarCollapsed: boolean = false;

  // 通知系统
  notifications: Notification[] = [];

  // Toast 通知系统（用于全局提示）
  toastNotifications: ToastNotification[] = [];

  // 系统统计数据
  systemStats: SystemStats | null = null;
  statsLoading: boolean = false;
  statsError: string | null = null;

  private themeUnsubscribe: (() => void) | null = null;

  constructor() {
    try {
      makeAutoObservable(this, {}, { autoBind: true });
      this.initializeStore();
    } catch (error) {
      console.error("AppStore 初始化失败:", error);
      throw error;
    }
  }

  private initializeStore() {
    runInAction(() => {
      this.currentView = "home";
      this.isInitialized = true;
      this.globalLoading = false;
      this.globalError = null;
      this.theme = this.getStoredTheme();
      this.sidebarCollapsed = false;
      this.notifications = [];
      this.toastNotifications = [];
      this.systemStats = null;
      this.statsLoading = false;
      this.statsError = null;
    });

    // 监听主题变化
    this.themeUnsubscribe = addThemeListener((theme: Theme) => {
      runInAction(() => {
        this.theme = theme;
      });
    });
  }

  // UI操作
  setCurrentView = (
    view: "home" | "config" | "results" | "login" | "register" | "profile"
  ) => {
    runInAction(() => {
      this.currentView = view;
    });
  };

  setGlobalLoading = (loading: boolean) => {
    runInAction(() => {
      this.globalLoading = loading;
    });
  };

  setGlobalError = (error: string | null) => {
    runInAction(() => {
      this.globalError = error;
    });
  };

  clearGlobalError = () => {
    runInAction(() => {
      this.globalError = null;
    });
  };

  // 主题管理 - 现在只是读取状态，不再管理主题
  private getStoredTheme(): Theme {
    const stored = localStorage.getItem("theme") as Theme;
    return stored === "light" || stored === "dark" ? stored : "dark";
  }

  // 移除主题设置方法，这些现在由useTheme hook处理
  // setTheme 和 toggleTheme 方法已删除

  // 清理方法
  destroy = () => {
    if (this.themeUnsubscribe) {
      this.themeUnsubscribe();
      this.themeUnsubscribe = null;
    }
  };

  // 侧边栏管理
  setSidebarCollapsed = (collapsed: boolean) => {
    runInAction(() => {
      this.sidebarCollapsed = collapsed;
    });
  };

  toggleSidebar = () => {
    this.setSidebarCollapsed(!this.sidebarCollapsed);
  };

  // 系统统计数据管理
  loadSystemStats = async () => {
    if (this.statsLoading) return;

    runInAction(() => {
      this.statsLoading = true;
      this.statsError = null;
    });

    try {
      const response = await systemApi.getSystemStats();

      runInAction(() => {
        if (response.success && response.data) {
          this.systemStats = response.data;
          this.statsError = null;
        } else {
          this.statsError = response.message || "获取系统统计数据失败";
          this.showError(this.statsError);
        }
      });
    } catch (error) {
      runInAction(() => {
        this.statsError = "网络错误，无法获取系统统计数据";
        this.showError(this.statsError);
        console.error("加载系统统计数据失败:", error);
      });
    } finally {
      runInAction(() => {
        this.statsLoading = false;
      });
    }
  };

  refreshSystemStats = async () => {
    await this.loadSystemStats();
  };

  // 通知系统
  private notificationCounter = 0;

  // Toast 通知系统
  private toastCounter = 0;

  addNotification = (notification: Omit<Notification, "id" | "timestamp">) => {
    runInAction(() => {
      // 生成唯一ID：时间戳 + 计数器 + 随机数
      const uniqueId = `${Date.now()}-${++this
        .notificationCounter}-${Math.random().toString(36).substring(2, 11)}`;

      const newNotification: Notification = {
        ...notification,
        id: uniqueId,
        timestamp: new Date().toISOString(),
        read: false, // 新通知默认为未读
      };
      this.notifications.unshift(newNotification);

      // 限制通知数量
      if (this.notifications.length > 10) {
        this.notifications = this.notifications.slice(0, 10);
      }
    });
  };

  removeNotification = (id: string) => {
    runInAction(() => {
      this.notifications = this.notifications.filter((n) => n.id !== id);
    });
  };

  // 标记通知为已读
  markNotificationAsRead = (id: string) => {
    runInAction(() => {
      const notification = this.notifications.find((n) => n.id === id);
      if (notification) {
        notification.read = true;
      }
    });
  };

  // 标记通知为未读
  markNotificationAsUnread = (id: string) => {
    runInAction(() => {
      const notification = this.notifications.find((n) => n.id === id);
      if (notification) {
        notification.read = false;
      }
    });
  };

  // 标记所有通知为已读
  markAllNotificationsAsRead = () => {
    runInAction(() => {
      this.notifications.forEach((notification) => {
        notification.read = true;
      });
    });
  };

  clearNotifications = () => {
    runInAction(() => {
      this.notifications = [];
    });
  };

  // Toast 通知管理方法
  addToastNotification = (
    toast: Omit<ToastNotification, "id" | "timestamp">
  ) => {
    runInAction(() => {
      // 生成唯一ID
      const uniqueId = `toast-${Date.now()}-${++this
        .toastCounter}-${Math.random().toString(36).substring(2, 11)}`;

      const newToast: ToastNotification = {
        ...toast,
        id: uniqueId,
        timestamp: new Date().toISOString(),
      };

      this.toastNotifications.unshift(newToast);

      // 限制 Toast 数量，最多显示 5 个
      if (this.toastNotifications.length > 5) {
        this.toastNotifications = this.toastNotifications.slice(0, 5);
      }
    });
  };

  removeToastNotification = (id: string) => {
    runInAction(() => {
      this.toastNotifications = this.toastNotifications.filter(
        (t) => t.id !== id
      );
    });
  };

  clearToastNotifications = () => {
    runInAction(() => {
      this.toastNotifications = [];
    });
  };

  // 便捷方法 - 类似 Ant Design 的全局提示（直接显示 Toast）
  showSuccess = (message: string, title?: string, duration: number = 3000) => {
    this.addToastNotification({
      type: "success",
      title: title || "成功",
      message,
      duration,
    });
  };

  showError = (message: string, title?: string, duration: number = 5000) => {
    this.addToastNotification({
      type: "error",
      title: title || "错误",
      message,
      duration,
    });
  };

  showWarning = (message: string, title?: string, duration: number = 4000) => {
    this.addToastNotification({
      type: "warning",
      title: title || "警告",
      message,
      duration,
    });
  };

  showInfo = (message: string, title?: string, duration: number = 3000) => {
    this.addToastNotification({
      type: "info",
      title: title || "提示",
      message,
      duration,
    });
  };

  // 带跳转链接的通知方法
  showNotificationWithLink = (
    type: "success" | "error" | "warning" | "info",
    title: string,
    message: string,
    link?: string,
    category?: "system" | "user" | "strategy" | "ranking"
  ) => {
    this.addNotification({
      type,
      title,
      message,
      link,
      category,
      duration: type === "error" ? 5000 : 3000,
    });
  };



  // 策略相关通知
  showStrategyNotification = (
    message: string,
    title?: string,
    link?: string
  ) => {
    this.showNotificationWithLink(
      "info",
      title || "策略更新",
      message,
      link || "/",
      "strategy"
    );
  };

  // 排行榜相关通知
  showRankingNotification = (
    message: string,
    title?: string,
    link?: string
  ) => {
    this.showNotificationWithLink(
      "info",
      title || "排行榜更新",
      message,
      link || "/ranking",
      "ranking"
    );
  };

  // 计算属性
  get stats() {
    // 只从接口获取统计数据
    if (this.systemStats?.stats) {
      return this.systemStats.stats;
    }

    // 如果没有数据，返回空数组或默认占位符
    return [
      { label: "总策略数", value: "-", icon: "TrendingUp" },
      { label: "活跃用户", value: "-", icon: "Users" },
      { label: "平均评分", value: "-", icon: "Star" },
      { label: "运行时间", value: "-", icon: "Clock" },
    ];
  }

  get hasUnreadNotifications() {
    return this.notifications.some((n) => !n.read);
  }

  get unreadNotificationCount() {
    return this.notifications.filter((n) => !n.read).length;
  }

  get unreadNotifications() {
    return this.notifications.filter((n) => !n.read);
  }

  get isUserLoggedIn() {
    return userStore.isLoggedIn;
  }

  get currentUser() {
    return userStore.currentUser;
  }

  get isDarkMode() {
    return this.theme === "dark";
  }

  get isLightMode() {
    return this.theme === "light";
  }
}

// 通知类型定义
interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  duration?: number;
  timestamp: string;
  link?: string; // 可选的跳转链接
  category?: "system" | "user" | "strategy" | "ranking"; // 通知分类
  read?: boolean; // 是否已读
}

// Toast 通知类型定义
interface ToastNotification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  duration: number;
  timestamp: string;
}

export const appStore = new AppStore();
