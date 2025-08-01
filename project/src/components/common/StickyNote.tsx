import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Palette, Minimize2, Maximize2, Save, Check } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { getColorOptions, getStickyNoteClasses, StickyNoteColor } from '../../utils/stickyNoteColors';
import ConfirmModal from './ConfirmModal';

interface StickyNoteProps {
  id: string;
  mode: "create" | "edit";
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    content: string;
    color: StickyNoteColor;
    isMinimized: boolean;
  }, silent?: boolean) => void;
  title: string;
  content: string;
  color: StickyNoteColor;
  isMinimized: boolean;
  noteId?: string;
}

const StickyNote: React.FC<StickyNoteProps> = ({
  id,
  mode,
  isOpen,
  onClose,
  onSave,
  title: initialTitle,
  content: initialContent,
  color: initialColor,
  isMinimized: initialIsMinimized,
  noteId
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [color, setColor] = useState(initialColor);
  const [isMinimized, setIsMinimized] = useState(initialIsMinimized);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [showSaved, setShowSaved] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // 防抖保存引用
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveDataRef = useRef<string>('');
  
  // 添加一个 ref 来持有最新的状态值
  const currentStateRef = useRef({ title, content, color, isMinimized });

  // 固定位置和大小，不从props读取
  const [position, setPosition] = useState(() => {
    // 计算页面中心位置
    const centerX = Math.max(0, (window.innerWidth - 400) / 2);
    const centerY = Math.max(0, (window.innerHeight - 400) / 2);
    return { x: centerX, y: centerY };
  });
  const [size, setSize] = useState({ width: 400, height: 400 });

  const noteRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<ReactQuill>(null);

  useEffect(() => {
    setTitle(initialTitle);
    setContent(initialContent);
    // 只在初始化时设置颜色，避免覆盖用户选择
    if (color === initialColor || !color) {
      setColor(initialColor);
    }
    setIsMinimized(initialIsMinimized);
    
    // 每次打开便利贴时重新居中
    const centerX = Math.max(0, (window.innerWidth - 400) / 2);
    const centerY = Math.max(0, (window.innerHeight - 400) / 2);
    setPosition({ x: centerX, y: centerY });
  }, [initialTitle, initialContent, initialIsMinimized]); // 移除 initialColor 依赖

  // 更新状态引用
  useEffect(() => {
    currentStateRef.current = { title, content, color, isMinimized };
  }, [title, content, color, isMinimized]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const colorOptions = getColorOptions();

  const colorClasses = getStickyNoteClasses(color);

  // 防抖保存函数
  const debouncedSave = useCallback((silent: boolean = false) => {
    // 清除之前的定时器
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    const currentData = JSON.stringify({ title, content, color, isMinimized });
    
    // 如果数据没有变化，不保存
    if (currentData === lastSaveDataRef.current) {
      return;
    }

    saveTimeoutRef.current = setTimeout(() => {
      lastSaveDataRef.current = currentData;
      onSave({
        title,
        content,
        color,
        isMinimized
      }, silent);
      
      if (!silent) {
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 2000);
      }
    }, 300); // 300ms 防抖延迟
  }, [onSave]); // 移除状态依赖，避免每次状态变化都重新创建函数

  // 添加一个稳定的保存触发函数
  const triggerSave = useCallback((silent: boolean = false) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    const currentData = JSON.stringify({ title, content, color, isMinimized });
    
    if (currentData === lastSaveDataRef.current) {
      return;
    }

    saveTimeoutRef.current = setTimeout(() => {
      lastSaveDataRef.current = currentData;
      onSave({
        title,
        content,
        color,
        isMinimized
      }, silent);
      
      if (!silent) {
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 2000);
      }
    }, 300);
  }, [title, content, color, isMinimized, onSave]);

  // 手动保存不使用防抖
  const handleSave = (silent: boolean = false) => {
    // 清除防抖定时器
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // 立即保存，不使用防抖
    const currentData = JSON.stringify({ title, content, color, isMinimized });
    lastSaveDataRef.current = currentData;
    
    onSave({
      title,
      content,
      color,
      isMinimized
    }, silent);
    
    if (!silent) {
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    }
  };

  const handleMinimize = () => {
    const newIsMinimized = !isMinimized;
    setIsMinimized(newIsMinimized);
    // 自动保存最小化状态
    // setTimeout(() => {
    //   onSave({
    //     title,
    //     content,
    //     color,
    //     isMinimized: newIsMinimized
    //   }, true);
    // }, 100);
  };

  const handleClose = () => {
    setShowCloseConfirm(true);
  };

  const confirmClose = () => {
    setShowCloseConfirm(false);
    onClose();
  };

  const cancelClose = () => {
    setShowCloseConfirm(false);
  };

  // ReactQuill 配置
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image'],
      ['clean']
    ]
  };

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'link', 'image'
  ];

  // 拖拽功能
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.no-drag')) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newPosition = {
        x: Math.max(0, e.clientX - dragStart.x),
        y: Math.max(0, e.clientY - dragStart.y)
      };
      setPosition(newPosition);
    }
    if (isResizing) {
      const newSize = {
        width: Math.max(300, resizeStart.width + (e.clientX - resizeStart.x)),
        height: Math.max(200, resizeStart.height + (e.clientY - resizeStart.y))
      };
      setSize(newSize);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  // 调整大小功能
  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    });
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart, resizeStart]);

  useEffect(() => {
    // 添加自定义样式
    const style = document.createElement('style');
    style.textContent = `
      .sticky-note-editor .ql-editor {
        padding: 16px 16px 64px 16px;
        min-height: 200px;
        font-size: 14px;
        line-height: 1.5;
        color: #1f2937;
      }
      
      .dark .sticky-note-editor .ql-editor {
        color: #f3f4f6;
      }
      
      .sticky-note-editor .ql-toolbar {
        border-top: none;
        border-left: none;
        border-right: none;
        border-bottom: 1px solid #e5e7eb;
        padding: 8px 16px;
        background-color: transparent;
      }
      
      .dark .sticky-note-editor .ql-toolbar {
        border-bottom-color: #4b5563;
      }
      
      .dark .sticky-note-editor .ql-toolbar .ql-stroke {
        stroke: #d1d5db;
      }
      
      .dark .sticky-note-editor .ql-toolbar .ql-fill {
        fill: #d1d5db;
      }
      
      .dark .sticky-note-editor .ql-toolbar .ql-picker-label {
        color: #d1d5db;
      }
      
      .dark .sticky-note-editor .ql-toolbar button:hover .ql-stroke,
      .dark .sticky-note-editor .ql-toolbar button.ql-active .ql-stroke {
        stroke: #f3f4f6;
      }
      
      .dark .sticky-note-editor .ql-toolbar button:hover .ql-fill,
      .dark .sticky-note-editor .ql-toolbar button.ql-active .ql-fill {
        fill: #f3f4f6;
      }
      
      .sticky-note-editor .ql-container {
        border: none;
        font-family: inherit;
        flex: 1;
        display: flex;
        flex-direction: column;
      }
      
      .sticky-note-editor .quill {
        height: 100%;
        display: flex;
        flex-direction: column;
      }
      
      .sticky-note-editor .ql-editor.ql-blank::before {
        color: #9ca3af;
        font-style: normal;
      }
      
      .dark .sticky-note-editor .ql-editor.ql-blank::before {
        color: #6b7280;
      }
    `;
    
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div
      ref={noteRef}
      className={`fixed bg-white dark:bg-gray-800 rounded-lg shadow-xl border-2 ${colorClasses.border} overflow-hidden  select-none ${
        isDragging ? 'cursor-move' : ''
      }`}
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: isMinimized ? 'auto' : size.height,
        zIndex: 9999,
        minWidth: '300px',
        minHeight: isMinimized ? 'auto' : '200px'
      }}
    >
      {/* 标题栏 */}
      <div
        className={`px-4 py-3 ${colorClasses.bg} border-b border-gray-200 dark:border-gray-600 flex items-center justify-between cursor-move`}
        onMouseDown={handleMouseDown}
      >
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          // onBlur={() => {
          //   // 只在标题真正改变时才保存
          //   const currentData = JSON.stringify(currentStateRef.current);
          //   if (currentData !== lastSaveDataRef.current) {
          //     triggerSave(true);
          //   }
          // }}
          className={`flex-1 bg-transparent ${colorClasses.text} font-medium text-lg border-none outline-none placeholder-gray-500 dark:placeholder-gray-400 no-drag`}
          placeholder="便利贴标题..."
        />
        
        <div className="flex items-center space-x-2 ml-4 no-drag">
          {/* 保存状态显示 */}
          {showSaved && (
            <div className="flex items-center space-x-1 shrink-0 text-green-600 dark:text-green-400 text-sm">
              <Check className="w-4 h-4" />
              <span>已保存</span>
            </div>
          )}
          
          <button
            onClick={() => handleSave(false)}
            className="p-1 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-white hover:bg-opacity-50 dark:hover:bg-gray-700 dark:hover:bg-opacity-50 rounded"
            title="保存"
          >
            <Save className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleMinimize}
            className="p-1 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-white hover:bg-opacity-50 dark:hover:bg-gray-700 dark:hover:bg-opacity-50 rounded"
            title={isMinimized ? '展开' : '最小化'}
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          
          <button
            onClick={handleClose}
            className="p-1 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-white hover:bg-opacity-50 dark:hover:bg-gray-700 dark:hover:bg-opacity-50 rounded"
            title="关闭"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      {!isMinimized && (
        <div className="flex flex-col h-full">
          {/* 颜色选择工具栏 */}
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 no-drag">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">便利贴颜色：</span>
              <div className="flex items-center space-x-2">
                <Palette className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                <div className="flex space-x-1">
                  {colorOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setColor(option.value);
                        // 暂时注释自动保存颜色变化
                        // setTimeout(() => {
                        //   triggerSave(true);
                        // }, 500);
                      }}
                      className={`w-6 h-6 rounded-full border-2 ${option.bg} ${option.border} ${
                        color === option.value ? 'ring-2 ring-gray-400 dark:ring-gray-500' : ''
                      }`}
                      title={option.label}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ReactQuill 编辑区域 */}
          <div className="flex-1 no-drag sticky-note-editor pb-4" style={{ minHeight: '200px' }}>
            <ReactQuill
              ref={quillRef}
              value={content}
              onChange={(value) => {
                setContent(value);
                // 暂时注释实时保存，只在手动保存时保存
                // triggerSave(true);
              }}
              // onBlur={() => {
              //   // 只在真正失去焦点且内容有变化时才保存
              //   const currentData = JSON.stringify(currentStateRef.current);
              //   if (currentData !== lastSaveDataRef.current) {
              //     triggerSave(true);
              //   }
              // }}
              modules={quillModules}
              formats={quillFormats}
              theme="snow"
              style={{ 
                height: 'calc(100% - 58px)', 
                display: 'flex',
                flexDirection: 'column'
              }}
              placeholder="在这里写下你的想法..."
            />
          </div>
        </div>
      )}

      {/* 调整大小手柄 */}
      {!isMinimized && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nw-resize bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 opacity-50 hover:opacity-100"
          onMouseDown={handleResizeStart}
          style={{ clipPath: 'polygon(100% 0, 0 100%, 100% 100%)' }}
        />
      )}

      {/* 关闭确认对话框 */}
      <ConfirmModal
        isOpen={showCloseConfirm}
        onConfirm={confirmClose}
        onCancel={cancelClose}
        title="确认关闭"
        message="关闭便利贴后，未保存的更改可能会丢失。确定要关闭吗？"
        confirmText="确认关闭"
        cancelText="取消"
        variant="danger"
      />
    </div>
  );
};

export default StickyNote; 