import { useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark';

// 全局主题状态
let globalTheme: Theme = (() => {
  // 检查本地存储
  const savedTheme = localStorage.getItem('theme') as Theme;
  if (savedTheme) {
    return savedTheme;
  }
  
  // 检查系统偏好
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  
  return 'light';
})();

// 主题变化监听器
const themeListeners: Array<(theme: Theme) => void> = [];

// 更新全局主题
const updateGlobalTheme = (newTheme: Theme) => {
  globalTheme = newTheme;
  
  const root = window.document.documentElement;
  
  // 移除之前的主题类
  root.classList.remove('light', 'dark');
  
  // 添加新的主题类
  root.classList.add(newTheme);
  
  // 保存到本地存储
  localStorage.setItem('theme', newTheme);
  
  // 通知所有监听器
  themeListeners.forEach(listener => listener(newTheme));
};

// 初始化主题
updateGlobalTheme(globalTheme);

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(globalTheme);

  useEffect(() => {
    const listener = (newTheme: Theme) => {
      setTheme(newTheme);
    };
    
    themeListeners.push(listener);
    
    return () => {
      const index = themeListeners.indexOf(listener);
      if (index > -1) {
        themeListeners.splice(index, 1);
      }
    };
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = globalTheme === 'light' ? 'dark' : 'light';
    updateGlobalTheme(newTheme);
  }, []);

  const setLightTheme = useCallback(() => {
    updateGlobalTheme('light');
  }, []);
  
  const setDarkTheme = useCallback(() => {
    updateGlobalTheme('dark');
  }, []);

  return {
    theme,
    toggleTheme,
    setLightTheme,
    setDarkTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light'
  };
};

// 添加主题变化监听器
export const addThemeListener = (listener: (theme: Theme) => void) => {
  themeListeners.push(listener);
  return () => {
    const index = themeListeners.indexOf(listener);
    if (index > -1) {
      themeListeners.splice(index, 1);
    }
  };
}; 