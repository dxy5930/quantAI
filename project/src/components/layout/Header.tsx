import React, { useState, useRef } from "react";
import { observer } from "mobx-react-lite";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  User,
  Bell,

  LogOut,
  LogIn,
  Menu,
  X,
  Bot,
} from "lucide-react";
import { ROUTES } from "../../constants/routes";
import { useUserStore, useAppStore } from "../../hooks/useStore";

import { ThemeToggle } from "../common/ThemeToggle";
import { Logo } from "../common/Logo";
import { Badge } from "../common/Badge";


export const Header: React.FC = observer(() => {
  const location = useLocation();
  const navigate = useNavigate();
  const userStore = useUserStore();
  const appStore = useAppStore();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);


  const navItems = [
    { path: ROUTES.AI_WORKFLOW, label: "工作流", icon: Bot, requiresAuth: true },
    // 定价功能已移至意见反馈页面
  ];

  const handleLogout = async () => {
    try {
      await userStore.logout();
      appStore.showSuccess("已成功登出");
      navigate(ROUTES.AI_WORKFLOW);
      setShowUserMenu(false);
    } catch (error) {
      appStore.showError("登出失败，请重试");
    }
  };

  const handleLogin = () => {
    navigate(ROUTES.LOGIN);
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  const handleNotificationClick = () => {
    // 检查是否已经在通知中心页面
    if (location.pathname === ROUTES.NOTIFICATIONS) {
      // 如果已经在通知中心页面，直接返回，不进行导航
      return;
    }
    navigate(ROUTES.NOTIFICATIONS);
  };

  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 transition-all duration-300">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo和标题 */}
          <div className="flex items-center space-x-8">
            <Logo variant="header" />

            {/* 桌面端导航 */}
            <nav className="hidden md:flex space-x-6">
              {navItems
                .map((item) => {
                  // 如果需要登录但用户未登录，则不显示该导航项
                  if (item.requiresAuth && !userStore.isLoggedIn) {
                    return null;
                  }

                  const IconComponent = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 relative ${
                        isActive
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                      <span>{item.label}</span>
                      {/* 在工作流按钮右上角显示徽章 */}
                      {item.path === ROUTES.AI_WORKFLOW && (
                        <div className="absolute -top-2 -right-2">
                          <Badge
                            icon="Sparkles"
                            text="VIP"
                            variant="gold"
                            radius={4}
                            size="sm"
                            showText={true}
                          />
                        </div>
                      )}
                    </Link>
                  );
                })
                .filter(Boolean)}
            </nav>
          </div>

          {/* 右侧操作区域 */}
          <div className="flex items-center space-x-4">
            {/* 主题切换按钮 */}
            <ThemeToggle />



            {/* 通知按钮 */}
            <button
              onClick={handleNotificationClick}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Bell className="w-5 h-5" />
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

            {/* 设置按钮 */}
            {/* <button className="text-gray-400 hover:text-white transition-colors">
              <Settings className="w-5 h-5" />
            </button> */}

            {/* 用户区域 */}
            {userStore.isLoggedIn ? (
              <div className="relative">
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 p-2 rounded-lg transition-all duration-300 border border-gray-300 dark:border-gray-600"
                >
                  {userStore.userAvatar ? (
                    <img
                      src={userStore.userAvatar}
                      alt={userStore.userDisplayName}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <User className="w-5 h-5 text-gray-700 dark:text-white" />
                  )}
                  <span className="text-gray-700 dark:text-white text-sm hidden sm:block">
                    {userStore.userDisplayName}
                  </span>
                </button>

                {/* 用户菜单下拉 */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 animate-slide-up">
                    <div className="py-2">
                      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {userStore.userDisplayName}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {userStore.currentUser?.email}
                        </p>
                      </div>

                      <Link
                        to={ROUTES.PROFILE}
                        className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User className="w-4 h-4" />
                        <span>个人资料</span>
                      </Link>

                  
                      <hr className="border-gray-200 dark:border-gray-700 my-2" />

                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-700 hover:text-red-700 dark:hover:text-red-300 transition-colors w-full text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>退出登录</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-4 py-2 rounded-lg text-white text-sm font-medium  shadow-sm hover:shadow-glow"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:block">登录</span>
              </button>
            )}

            {/* 移动端菜单按钮 */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {showMobileMenu ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* 移动端导航菜单 */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-700 py-4">
            <nav className="space-y-2">
              {navItems.map((item) => {
                // 如果需要登录但用户未登录，则不显示该导航项
                if (item.requiresAuth && !userStore.isLoggedIn) {
                  return null;
                }

                const IconComponent = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors relative ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-gray-400 hover:text-white hover:bg-gray-800"
                    }`}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <IconComponent className="w-5 h-5" />
                    <span>{item.label}</span>
                    {/* 在移动端工作流按钮右侧显示徽章 */}
                    {item.path === ROUTES.AI_WORKFLOW && (
                      <div className="ml-auto">
                        <Badge
                          icon="Sparkles"
                          text="VIP"
                          variant="gold"
                          radius={4}
                          size="sm"
                          showText={true}
                        />
                      </div>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* 点击外部关闭菜单 */}
      {(showUserMenu || showMobileMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowUserMenu(false);
            setShowMobileMenu(false);
          }}
        />
      )}




    </header>
  );
});
