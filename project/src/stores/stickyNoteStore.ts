import { makeAutoObservable } from 'mobx';

export interface StickyNoteConfig {
  id: string;
  isOpen: boolean;
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  color: 'yellow' | 'pink' | 'blue' | 'green' | 'orange';
  title: string;
  isMinimized: boolean;
  zIndex: number;
  createdAt: number;
  updatedAt: number;
}

class StickyNoteStore {
  private storageKey = 'sticky-notes-config';
  private notes: Map<string, StickyNoteConfig> = new Map();

  constructor() {
    makeAutoObservable(this);
    this.loadFromStorage();
  }

  // 从 localStorage 加载数据
  private loadFromStorage() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        Object.entries(data).forEach(([id, config]) => {
          this.notes.set(id, config as StickyNoteConfig);
        });
      }
    } catch (error) {
      console.warn('Failed to load sticky notes from localStorage:', error);
    }
  }

  // 保存到 localStorage
  private saveToStorage() {
    try {
      const data: Record<string, StickyNoteConfig> = {};
      this.notes.forEach((config, id) => {
        data[id] = config;
      });
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save sticky notes to localStorage:', error);
    }
  }

  // 获取便利贴配置
  getNote(id: string): StickyNoteConfig | undefined {
    return this.notes.get(id);
  }

  // 获取所有便利贴
  getAllNotes(): StickyNoteConfig[] {
    return Array.from(this.notes.values()).sort((a, b) => b.zIndex - a.zIndex);
  }

  // 创建新便利贴
  createNote(
    id: string,
    options: Partial<Omit<StickyNoteConfig, 'id' | 'createdAt' | 'updatedAt'>> = {}
  ): StickyNoteConfig {
    const now = Date.now();
    const maxZIndex = Math.max(0, ...Array.from(this.notes.values()).map(n => n.zIndex));
    
    const defaultConfig: StickyNoteConfig = {
      id,
      isOpen: false,
      content: '<p>欢迎使用便利贴功能！</p><p>你可以在这里记录任何想法和笔记。</p>',
      position: { x: 100 + (this.notes.size * 20), y: 100 + (this.notes.size * 20) },
      size: { width: 400, height: 300 },
      color: 'yellow',
      title: '我的便利贴',
      isMinimized: false,
      zIndex: maxZIndex + 1,
      createdAt: now,
      updatedAt: now,
      ...options,
    };

    this.notes.set(id, defaultConfig);
    this.saveToStorage();
    return defaultConfig;
  }

  // 更新便利贴配置
  updateNote(id: string, updates: Partial<StickyNoteConfig>) {
    const note = this.notes.get(id);
    if (note) {
      const updatedNote = {
        ...note,
        ...updates,
        updatedAt: Date.now(),
      };
      this.notes.set(id, updatedNote);
      this.saveToStorage();
    }
  }

  // 打开便利贴
  openNote(id: string) {
    this.updateNote(id, { isOpen: true });
    this.bringToFront(id);
  }

  // 关闭便利贴
  closeNote(id: string) {
    this.updateNote(id, { isOpen: false });
  }

  // 切换便利贴显示状态
  toggleNote(id: string) {
    const note = this.notes.get(id);
    if (note) {
      if (note.isOpen) {
        this.closeNote(id);
      } else {
        this.openNote(id);
      }
    }
  }

  // 更新内容
  updateContent(id: string, content: string) {
    this.updateNote(id, { content });
  }

  // 更新位置
  updatePosition(id: string, position: { x: number; y: number }) {
    this.updateNote(id, { position });
  }

  // 更新大小
  updateSize(id: string, size: { width: number; height: number }) {
    this.updateNote(id, { size });
  }

  // 最小化/展开
  toggleMinimize(id: string) {
    const note = this.notes.get(id);
    if (note) {
      this.updateNote(id, { isMinimized: !note.isMinimized });
    }
  }

  // 置顶便利贴
  bringToFront(id: string) {
    const maxZIndex = Math.max(0, ...Array.from(this.notes.values()).map(n => n.zIndex));
    this.updateNote(id, { zIndex: maxZIndex + 1 });
  }

  // 删除便利贴
  deleteNote(id: string) {
    this.notes.delete(id);
    this.saveToStorage();
  }

  // 重置所有便利贴
  resetAll() {
    this.notes.clear();
    localStorage.removeItem(this.storageKey);
  }

  // 导出配置
  exportConfig(): string {
    const data: Record<string, StickyNoteConfig> = {};
    this.notes.forEach((config, id) => {
      data[id] = config;
    });
    return JSON.stringify(data, null, 2);
  }

  // 导入配置
  importConfig(jsonString: string) {
    try {
      const data = JSON.parse(jsonString);
      this.notes.clear();
      Object.entries(data).forEach(([id, config]) => {
        this.notes.set(id, config as StickyNoteConfig);
      });
      this.saveToStorage();
    } catch (error) {
      console.error('Failed to import sticky notes config:', error);
      throw new Error('Invalid configuration format');
    }
  }
}

export const stickyNoteStore = new StickyNoteStore();