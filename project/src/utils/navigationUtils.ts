import { NavigateFunction } from "react-router-dom";

/**
 * 智能返回导航工具
 * 提供简单可靠的返回逻辑
 */
export class SmartNavigationHelper {
  private navigate: NavigateFunction;

  constructor(navigate: NavigateFunction) {
    this.navigate = navigate;
  }

  /**
   * 智能返回逻辑 - 优化版，避免页面刷新和重复返回
   * @param options 返回选项配置
   */
  smartGoBack(
    options: {
      shareId?: string;
      strategyId?: string;
      fallbackPath?: string;
      strategySquarePath?: string;
      myStrategiesPath?: string;
    } = {}
  ) {
    const {
      shareId,
      strategyId,
      fallbackPath = "/",
      strategySquarePath = "/strategy-square",
      myStrategiesPath = "/my-strategies",
    } = options;

    // 如果是通过分享链接访问的，返回策略广场
    if (shareId) {
      this.navigate(strategySquarePath);
      return;
    }

    // 检查当前路径，如果是配置页面，智能判断返回目标
    const currentPath = window.location.pathname;
    
    // 如果是配置页面，优先返回到对应的列表页面
    if (currentPath.includes('/config') || currentPath.includes('/create/')) {
      // 检查referrer来判断来源
      const referrer = document.referrer;
      
      if (referrer && referrer.includes('/my-strategies')) {
        // 从我的策略页面进入的，返回我的策略页面
        this.navigate(myStrategiesPath);
        return;
      } else if (referrer && referrer.includes('/strategy-square')) {
        // 从策略广场进入的，返回策略广场
        this.navigate(strategySquarePath);
        return;
      } else if (currentPath.includes('/create/')) {
        // 创建页面，返回我的策略页面
        this.navigate(myStrategiesPath);
        return;
      }
    }

    // 简单可靠的返回逻辑
    try {
      // 检查是否有可用的历史记录
      const hasHistory = window.history.length > 1;
      const hasReferrer =
        document.referrer &&
        document.referrer.startsWith(window.location.origin);

      if (hasHistory || hasReferrer) {
        // 有历史记录或有效的referrer，尝试返回
        this.navigate(-1);
      } else {
        // 没有历史记录，使用fallback路径
        this.navigate(fallbackPath);
      }
    } catch (error) {
      console.warn("返回操作失败，使用fallback路径:", error);
      this.navigate(fallbackPath);
    }
  }

  /**
   * 检查路径是否是有效的应用内路径
   */
  private isValidInternalPath(path: string): boolean {
    const validPaths = [
      "/",
      "/strategy-square",
      "/my-strategies",
      "/ranking",
      "/backtest",
      "/profile",
    ];

    // 检查是否是根路径或已知的有效路径
    if (validPaths.includes(path)) {
      return true;
    }

    // 检查是否是动态路径
    const dynamicPatterns = [
      /^\/strategy\/[^/]+$/,
      /^\/strategy\/[^/]+\/[^/]+$/,
      /^\/backtest\/[^/]+$/,
      /^\/user\/[^/]+$/,
    ];

    return dynamicPatterns.some((pattern) => pattern.test(path));
  }

  /**
   * 带确认的返回
   * 在用户有未保存的更改时使用
   */
  smartGoBackWithConfirmation(
    hasUnsavedChanges: boolean,
    confirmMessage: string = "您有未保存的更改，确定要离开吗？",
    options: Parameters<typeof this.smartGoBack>[0] = {}
  ) {
    if (hasUnsavedChanges) {
      if (window.confirm(confirmMessage)) {
        this.smartGoBack(options);
      }
    } else {
      this.smartGoBack(options);
    }
  }

  /**
   * 保存当前页面状态并返回
   * 用于需要记住用户操作状态的场景
   */
  smartGoBackWithState(
    state: Record<string, any>,
    options: Parameters<typeof this.smartGoBack>[0] = {}
  ) {
    // 保存状态到sessionStorage
    const stateKey = `navigation_state_${Date.now()}`;
    sessionStorage.setItem(stateKey, JSON.stringify(state));

    // 在URL中添加状态键，以便返回时恢复
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set("state_key", stateKey);
    window.history.replaceState(null, "", currentUrl.toString());

    this.smartGoBack(options);
  }

  /**
   * 恢复保存的状态
   */
  static restoreState(stateKey?: string): Record<string, any> | null {
    if (!stateKey) {
      const urlParams = new URLSearchParams(window.location.search);
      stateKey = urlParams.get("state_key") || undefined;
    }

    if (stateKey) {
      try {
        const stateJson = sessionStorage.getItem(stateKey);
        if (stateJson) {
          sessionStorage.removeItem(stateKey); // 清理已使用的状态
          return JSON.parse(stateJson);
        }
      } catch (error) {
        console.warn("恢复导航状态失败:", error);
      }
    }

    return null;
  }
}

/**
 * 创建智能导航助手的便捷函数
 */
export const createSmartNavigationHelper = (navigate: NavigateFunction) => {
  return new SmartNavigationHelper(navigate);
};

/**
 * 简化的智能返回函数
 * 适用于大多数简单场景
 */
export const smartGoBack = (
  navigate: NavigateFunction,
  options: {
    shareId?: string;
    strategyId?: string;
    fallbackPath?: string;
  } = {}
) => {
  const helper = new SmartNavigationHelper(navigate);
  helper.smartGoBack(options);
};
