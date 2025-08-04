import { appStore } from '../stores/AppStore';
import { userStore } from '../stores/UserStore';
import { HomeStore } from '../stores/HomeStore';

// 主要的store hook，返回所有store的组合
export const useStore = () => {
  return {
    app: appStore,
    user: userStore,
    home: HomeStore
  };
};

// 单独的store hooks，用于只需要特定store的组件
export const useAppStore = () => {
  if (!appStore) {
    throw new Error('AppStore 未正确初始化');
  }
  return appStore;
};

export const useUserStore = () => {
  if (!userStore) {
    throw new Error('UserStore 未正确初始化');
  }
  return userStore;
};



export const useHomeStore = () => {
  if (!HomeStore) {
    throw new Error('HomeStore 未正确初始化');
  }
  return HomeStore;
};