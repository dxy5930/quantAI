import { NavigateFunction } from "react-router-dom";
import { ROUTES } from "../constants/routes";

// 导航工具类
export class NavigationHelper {
  private navigate: NavigateFunction;

  constructor(navigate: NavigateFunction) {
    this.navigate = navigate;
  }

  // 导航到首页
  toHome = () => {
    this.navigate(ROUTES.HOME);
  };

  // 导航到登录页
  toLogin = (from?: string) => {
    this.navigate(ROUTES.LOGIN, { state: { from } });
  };

  // 导航到注册页
  toRegister = () => {
    this.navigate(ROUTES.REGISTER);
  };

  // 导航到个人资料页
  toProfile = () => {
    this.navigate(ROUTES.PROFILE);
  };

  // 导航到帮助页
  toHelp = () => {
    this.navigate(ROUTES.HELP);
  };

  // 导航到关于页
  toAbout = () => {
    this.navigate(ROUTES.ABOUT);
  };

  // 导航到错误页面
  toNotFound = () => {
    this.navigate(ROUTES.NOT_FOUND);
  };

  toUnauthorized = () => {
    this.navigate(ROUTES.UNAUTHORIZED);
  };

  toServerError = () => {
    this.navigate(ROUTES.SERVER_ERROR);
  };

  // 返回上一页
  back = () => {
    window.history.back();
  };

  // 前进到下一页
  forward = () => {
    window.history.forward();
  };

  // 替换当前页面
  replace = (path: string) => {
    this.navigate(path, { replace: true });
  };

  // 通用导航方法
  to = (path: string, options?: { replace?: boolean; state?: any }) => {
    this.navigate(path, options);
  };
}

// 创建导航助手的Hook
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";

export const useNavigation = () => {
  const navigate = useNavigate();

  return useMemo(() => new NavigationHelper(navigate), [navigate]);
};

// 导出常用的导航方法
export const createNavigationHelper = (navigate: NavigateFunction) => {
  return new NavigationHelper(navigate);
};
