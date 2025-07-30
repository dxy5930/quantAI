import { useCallback, useEffect, useState } from "react";
import { reaction } from "mobx";
import { stickyNoteStore, StickyNoteConfig } from "../stores/stickyNoteStore";
import { stickyNoteApi } from "../services/api/stickyNoteApi";

interface UseStickyNoteOptions {
  id: string;
  initialContent?: string;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
  initialColor?: "yellow" | "pink" | "blue" | "green" | "orange";
  initialTitle?: string;
}

export const useStickyNote = (options: UseStickyNoteOptions) => {
  const {
    id,
    initialContent = "<p>欢迎使用便利贴功能！</p><p>你可以在这里记录任何想法和笔记。</p>",
    initialPosition = { x: 100, y: 100 },
    initialSize = { width: 400, height: 300 },
    initialColor = "yellow",
    initialTitle = "我的便利贴",
  } = options;

  // 使用 useState 来触发重新渲染
  const [, forceUpdate] = useState({});
  const triggerUpdate = useCallback(() => forceUpdate({}), []);

  // 获取或创建便利贴配置
  const getOrCreateNote = useCallback(() => {
    let existingNote = stickyNoteStore.getNote(id);
    if (!existingNote) {
      existingNote = stickyNoteStore.createNote(id, {
        content: initialContent,
        position: initialPosition,
        size: initialSize,
        color: initialColor,
        title: initialTitle,
      });
    }
    return existingNote;
  }, [
    id,
    initialContent,
    initialPosition,
    initialSize,
    initialColor,
    initialTitle,
  ]);

  // 确保便利贴存在
  const note = getOrCreateNote();

  // 使用 MobX reaction 监听 store 变化
  useEffect(() => {
    const dispose = reaction(
      () => stickyNoteStore.getNote(id),
      () => {
        triggerUpdate();
      }
    );

    return dispose;
  }, [id, triggerUpdate]);

  // 打开便利贴
  const openNote = useCallback(() => {
    stickyNoteStore.openNote(id);
  }, [id]);

  // 关闭便利贴
  const closeNote = useCallback(() => {
    stickyNoteStore.closeNote(id);
  }, [id]);

  // 切换显示状态
  const toggleNote = useCallback(() => {
    stickyNoteStore.toggleNote(id);
  }, [id]);

  // 更新内容
  const updateContent = useCallback(
    (content: string) => {
      stickyNoteStore.updateContent(id, content);
    },
    [id]
  );

  // 更新位置
  const updatePosition = useCallback(
    (position: { x: number; y: number }) => {
      stickyNoteStore.updatePosition(id, position);
    },
    [id]
  );

  // 更新大小
  const updateSize = useCallback(
    (size: { width: number; height: number }) => {
      stickyNoteStore.updateSize(id, size);
    },
    [id]
  );

  // 最小化/展开
  const toggleMinimize = useCallback(() => {
    stickyNoteStore.toggleMinimize(id);
  }, [id]);

  // 置顶
  const bringToFront = useCallback(() => {
    stickyNoteStore.bringToFront(id);
  }, [id]);

  // 重置便利贴
  const resetNote = useCallback(() => {
    stickyNoteStore.deleteNote(id);
    stickyNoteStore.createNote(id, {
      content: initialContent,
      position: initialPosition,
      size: initialSize,
      color: initialColor,
      title: initialTitle,
    });
  }, [
    id,
    initialContent,
    initialPosition,
    initialSize,
    initialColor,
    initialTitle,
  ]);

  // 保存到数据库
  const saveToDatabase = useCallback(async () => {
    try {
      const currentNote = stickyNoteStore.getNote(id);
      if (!currentNote) return;

      await stickyNoteApi.save(id, {
        noteId: id,
        title: currentNote.title,
        content: currentNote.content,
        positionX: currentNote.position.x,
        positionY: currentNote.position.y,
        width: currentNote.size.width,
        height: currentNote.size.height,
        color: currentNote.color,
        isMinimized: currentNote.isMinimized,
        zIndex: currentNote.zIndex,
      });

      // 可以添加成功提示
      console.log('便利贴保存成功');
    } catch (error) {
      console.error('保存便利贴失败:', error);
      // 可以添加错误提示
    }
  }, [id]);

  return {
    // 状态
    isOpen: note.isOpen,
    content: note.content,
    position: note.position,
    size: note.size,
    color: note.color,
    title: note.title,
    isMinimized: note.isMinimized,
    zIndex: note.zIndex,

    // 操作方法
    openNote,
    closeNote,
    toggleNote,
    updateContent,
    updatePosition,
    updateSize,
    toggleMinimize,
    bringToFront,
    resetNote,
    saveToDatabase,
  };
};
