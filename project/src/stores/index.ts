import { autorun, makeAutoObservable } from "mobx";
import { createContext, useContext } from "react";
import { AppStore } from "./AppStore";
import { HomeStore } from "./HomeStore";
import { UserStore } from "./UserStore";
import { StickyNoteStore } from "./stickyNoteStore";

// 全局可观察状态
export class RootStore {
  appStore: AppStore;
  homeStore: HomeStore;
  userStore: UserStore;
  stickyNoteStore: StickyNoteStore;
  fullLoading = false;

  constructor() {
    makeAutoObservable(this);
    this.appStore = new AppStore();
    this.homeStore = new HomeStore();
    this.userStore = new UserStore();
    this.stickyNoteStore = new StickyNoteStore();
    
    // 自动保存用户认证状态
    autorun(() => {
      if (this.userStore.currentUser) {
        localStorage.setItem(
          "currentUser",
          JSON.stringify(this.userStore.currentUser)
        );
      }
    });
  }

  setFullLoading(status: boolean, cb?: () => void) {
    this.fullLoading = status;
    cb?.();
  }
}

const rootStore = new RootStore();
const StoreContext = createContext(rootStore);
const useStore = () => useContext(StoreContext);

// 导出新的统一store系统
export { useStore, StoreContext, rootStore };

// 保持向后兼容，导出单独的store实例
export const appStore = rootStore.appStore;
export const homeStore = rootStore.homeStore;
export const userStore = rootStore.userStore;
export const stickyNoteStore = rootStore.stickyNoteStore;

// 导出store类
export { AppStore } from "./AppStore";
export { HomeStore } from "./HomeStore";
export { UserStore } from "./UserStore";
export { StickyNoteStore } from "./stickyNoteStore";