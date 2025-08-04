import React, { useState, useEffect } from "react";
import { StickyNote as StickyNoteIcon, Plus, Edit3, Trash2 } from "lucide-react";
import StickyNote from "../common/StickyNote";
import { stickyNoteApi, StickyNoteResponse, CreateStickyNoteData, UpdateStickyNoteData } from "../../services/api/stickyNoteApi";
import { useStore } from "../../hooks/useStore";
import { getListColorClasses, StickyNoteColor } from "../../utils/stickyNoteColors";

interface OpenNote {
  id: string;
  mode: "create" | "edit";
  noteData?: StickyNoteResponse;
}

const StickyNoteManager: React.FC = () => {
  const { app } = useStore();
  const [savedNotes, setSavedNotes] = useState<StickyNoteResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [openNote, setOpenNote] = useState<OpenNote | null>(null); // 只允许一个便利贴打开

  // 加载已保存的便利贴
  const loadSavedNotes = async () => {
    setLoading(true);
    try {
      const response = await stickyNoteApi.getAll();
      if (response.success && response.data) {
        setSavedNotes(response.data);
      }
    } catch (error) {
      console.error('加载便利贴失败:', error);
      app.showError('加载便利贴失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始化时加载便利贴
  useEffect(() => {
    loadSavedNotes();
  }, []);

  // 创建新便利贴
  const handleCreateNew = async () => {
    // 如果已经有打开的便利贴，先关闭它
    if (openNote) {
      setOpenNote(null);
    }

    try {
      // 只传递必要的参数，位置和大小由后端提供默认值
      const createData: CreateStickyNoteData = {
        title: "新建便利贴",
        content: "<p>欢迎使用便利贴功能！</p><p>你可以在这里记录任何想法和笔记。</p>",
        color: "yellow",
      };

      const response = await stickyNoteApi.create(createData);
      if (response.success && response.data) {
        // 创建成功后直接打开编辑模式
        const newNote: OpenNote = {
          id: `note-${response.data.noteId}`,
          mode: "edit",
          noteData: response.data,
        };
        setOpenNote(newNote);
        app.showSuccess('便利贴创建成功');
        // 刷新保存的便利贴列表
        loadSavedNotes();
      }
    } catch (error) {
      console.error('创建便利贴失败:', error);
      app.showError('创建便利贴失败');
    }
  };

  // 编辑便利贴
  const handleEditNote = (note: StickyNoteResponse) => {
    // 如果已经有打开的便利贴，先关闭它
    if (openNote) {
      setOpenNote(null);
    }

    // 打开新的编辑窗口
    const newNote: OpenNote = {
      id: `note-${note.noteId}`,
      mode: "edit",
      noteData: note,
    };
    setOpenNote(newNote);
  };

  // 关闭便利贴窗口
  const closeNote = () => {
    setOpenNote(null);
  };

  // 更新便利贴数据
  const updateNoteData = async (noteId: string, data: {
    title: string;
    content: string;
    color: "yellow" | "pink" | "blue" | "green" | "orange";
    isMinimized: boolean;
  }, silent: boolean = false) => {
    if (!openNote || !openNote.noteData) return;

    try {
      const updateData: UpdateStickyNoteData = {
        title: data.title,
        content: data.content,
        color: data.color,
        isMinimized: data.isMinimized,
      };

      const response = await stickyNoteApi.update(noteId, updateData);
      if (response.success && response.data) {
        // 更新本地状态
        setOpenNote({
          ...openNote,
          noteData: response.data
        });
        // 刷新保存的便利贴列表
        loadSavedNotes();
        // 只有在非静默模式下才显示成功提示
        if (!silent) {
          app.showSuccess('便利贴更新成功');
        }
      }
    } catch (error) {
      console.error('更新便利贴失败:', error);
      app.showError('更新便利贴失败');
    }
  };

  // 直接删除便利贴（从列表中）
  const handleDirectDelete = async (noteId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!confirm('确定要删除这个便利贴吗？')) return;

    try {
      const response = await stickyNoteApi.delete(noteId);
      if (response.success) {
        setSavedNotes(prev => prev.filter(note => note.noteId !== noteId));
        // 如果删除的是当前打开的便利贴，关闭它
        if (openNote && openNote.noteData?.noteId === noteId) {
          setOpenNote(null);
        }
        app.showSuccess('便利贴删除成功');
      }
    } catch (error) {
      console.error('删除便利贴失败:', error);
      app.showError('删除便利贴失败');
    }
  };

  return (
    <div className="relative">
      {/* 便利贴按钮 */}
      <div className="flex items-center space-x-2">
        <div className="relative group">
          <button
            // onClick={handleCreateNew}
            className="p-2 text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-900 dark:hover:bg-opacity-20 rounded-lg transition-colors"
            title="便利贴"
          >
            <StickyNoteIcon className="w-5 h-5" />
          </button>
          
          {/* 便利贴列表下拉菜单 */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            <div className="p-3 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">我的便利贴</h3>
                <button
                  onClick={handleCreateNew}
                  className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>新建</span>
                </button>
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto scrollbar-thin">
              {loading ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  <div className="w-4 h-4 border border-gray-300 dark:border-gray-600 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
                  加载中...
                </div>
              ) : savedNotes.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  <StickyNoteIcon className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm">暂无便利贴</p>
                  <button
                    onClick={handleCreateNew}
                    className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    立即创建一个
                  </button>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {savedNotes.map((note) => (
                    <div
                      key={note.noteId}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer group/item"
                      onClick={() => handleEditNote(note)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <div
                            className={getListColorClasses(note.color as StickyNoteColor)}
                          />
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {note.title}
                          </span>
                        </div>
                        <div 
                          className="text-xs text-gray-500 dark:text-gray-400 truncate mb-1"
                          dangerouslySetInnerHTML={{ 
                            __html: note.content.replace(/<[^>]*>/g, '').substring(0, 50) + '...'
                          }}
                        />
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          {new Date(note.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditNote(note);
                          }}
                          className="p-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900 dark:hover:bg-opacity-20 rounded transition-colors"
                          title="编辑"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => handleDirectDelete(note.noteId, e)}
                          className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900 dark:hover:bg-opacity-20 rounded transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 历史记录按钮 */}
            <div className="p-3 border-t border-gray-100 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                共 {savedNotes.length} 个便利贴
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 渲染当前打开的便利贴 */}
      {openNote && openNote.noteData && (
        <StickyNote
          key={openNote.id}
          id={openNote.id}
          mode={openNote.mode}
          isOpen={true}
          onClose={closeNote}
          title={openNote.noteData.title}
          content={openNote.noteData.content}
          color={openNote.noteData.color}
          isMinimized={openNote.noteData.isMinimized}
          noteId={openNote.noteData.noteId}
          onSave={(data, silent) => updateNoteData(openNote.noteData!.noteId, data, silent)}
        />
      )}
    </div>
  );
};

export default StickyNoteManager; 