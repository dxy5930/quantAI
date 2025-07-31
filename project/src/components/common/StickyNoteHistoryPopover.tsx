import React, { useState, useEffect } from "react";
import { StickyNote as StickyNoteIcon, Plus, Edit3, Trash2, Loader2 } from "lucide-react";
import { stickyNoteApi, StickyNoteResponse } from "../../services/api/stickyNoteApi";
import { useStore } from "../../hooks/useStore";
import { getListColorClasses, StickyNoteColor } from "../../utils/stickyNoteColors";

interface StickyNoteHistoryPopoverProps {
  onOpenNote?: (note: StickyNoteResponse) => void;
  onCreateNew?: () => void;
}

const StickyNoteHistoryPopover: React.FC<StickyNoteHistoryPopoverProps> = ({
  onOpenNote,
  onCreateNew,
}) => {
  const { app } = useStore();
  const [notes, setNotes] = useState<StickyNoteResponse[]>([]);
  const [loading, setLoading] = useState(false);

  // 获取便利贴列表
  const fetchNotes = async () => {
    setLoading(true);
    try {
      const response = await stickyNoteApi.getAll();
      if (response.success && response.data) {
        // 按更新时间倒序排列
        const sortedNotes = response.data.sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        setNotes(sortedNotes);
      }
    } catch (error) {
      console.error("获取便利贴列表失败:", error);
      app.showError("获取便利贴列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  // 处理打开便利贴
  const handleOpenNote = (note: StickyNoteResponse) => {
    if (onOpenNote) {
      onOpenNote(note);
    }
  };

  // 处理创建新便利贴
  const handleCreateNew = () => {
    if (onCreateNew) {
      onCreateNew();
    }
  };

  // 处理删除便利贴
  const handleDelete = async (noteId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!confirm('确定要删除这个便利贴吗？')) return;

    try {
      const response = await stickyNoteApi.delete(noteId);
      if (response.success) {
        setNotes(prev => prev.filter(note => note.noteId !== noteId));
        app.showSuccess('便利贴删除成功');
      }
    } catch (error) {
      console.error('删除便利贴失败:', error);
      app.showError('删除便利贴失败');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
        <span className="ml-2 text-sm text-gray-600">加载中...</span>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="text-center py-6">
        <StickyNoteIcon className="w-6 h-6 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-500 mb-3">暂无便利贴</p>
        <button
          onClick={handleCreateNew}
          className="text-xs text-blue-600 hover:text-blue-700"
        >
          立即创建一个
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1 min-h-0">
      {notes.map((note) => (
        <div
          key={note.noteId}
          className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer group/item"
          onClick={() => handleOpenNote(note)}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <div
                className={getListColorClasses(note.color as StickyNoteColor)}
              />
              <span className="text-sm font-medium text-gray-900 truncate">
                {note.title}
              </span>
            </div>
            <div 
              className="text-xs text-gray-500 truncate mb-1"
              dangerouslySetInnerHTML={{ 
                __html: note.content.replace(/<[^>]*>/g, '').substring(0, 50) + '...'
              }}
            />
            <div className="text-xs text-gray-400">
              {new Date(note.updatedAt).toLocaleDateString()}
            </div>
          </div>
          
          <div className="flex items-center space-x-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpenNote(note);
              }}
              className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
              title="编辑"
            >
              <Edit3 className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => handleDelete(note.noteId, e)}
              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
              title="删除"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StickyNoteHistoryPopover; 