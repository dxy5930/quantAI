import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, Move, Maximize2, Minimize2, Save } from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

interface StickyNoteProps {
  id: string;
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  onContentChange: (content: string) => void;
  position: { x: number; y: number };
  onPositionChange: (position: { x: number; y: number }) => void;
  size: { width: number; height: number };
  onSizeChange: (size: { width: number; height: number }) => void;
  color: "yellow" | "pink" | "blue" | "green" | "orange";
  isMinimized: boolean;
  onToggleMinimize: () => void;
  zIndex: number;
  onBringToFront: () => void;
  onSave?: () => void;
}

const StickyNote: React.FC<StickyNoteProps> = ({
  id,
  isOpen,
  onClose,
  title,
  content,
  onContentChange,
  position,
  onPositionChange,
  size,
  onSizeChange,
  color,
  isMinimized,
  onToggleMinimize,
  zIndex,
  onBringToFront,
  onSave,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string>("");
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  const noteRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<ReactQuill>(null);

  // 颜色主题配置
  const colorThemes = {
    yellow: {
      bg: "bg-yellow-200",
      border: "border-yellow-300",
      shadow: "shadow-yellow-200/50",
      header: "bg-yellow-300",
      toolbarBg: "bg-yellow-100/50",
    },
    pink: {
      bg: "bg-pink-200",
      border: "border-pink-300",
      shadow: "shadow-pink-200/50",
      header: "bg-pink-300",
      toolbarBg: "bg-pink-100/50",
    },
    blue: {
      bg: "bg-blue-200",
      border: "border-blue-300",
      shadow: "shadow-blue-200/50",
      header: "bg-blue-300",
      toolbarBg: "bg-blue-100/50",
    },
    green: {
      bg: "bg-green-200",
      border: "border-green-300",
      shadow: "shadow-green-200/50",
      header: "bg-green-300",
      toolbarBg: "bg-green-100/50",
    },
    orange: {
      bg: "bg-orange-200",
      border: "border-orange-300",
      shadow: "shadow-orange-200/50",
      header: "bg-orange-300",
      toolbarBg: "bg-orange-100/50",
    },
  };

  const theme = colorThemes[color];

  // 处理内容变化
  const handleContentChange = useCallback(
    (newContent: string) => {
      onContentChange(newContent);
    },
    [onContentChange]
  );

  // 图片处理函数
  const imageHandler = useCallback(() => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = () => {
      const file = input.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          const quill = quillRef.current?.getEditor();
          if (quill) {
            const range = quill.getSelection();
            const index = range ? range.index : quill.getLength();
            quill.insertEmbed(index, "image", reader.result);
            quill.setSelection(index + 1);
          }
        };
        reader.readAsDataURL(file);
      }
    };
  }, []);

  // 处理粘贴图片
  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf("image") !== -1) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = () => {
              const quill = quillRef.current?.getEditor();
              if (quill) {
                const range = quill.getSelection();
                const index = range ? range.index : quill.getLength();
                quill.insertEmbed(index, "image", reader.result);
                quill.setSelection(index + 1);
              }
            };
            reader.readAsDataURL(file);
          }
          break;
        }
      }
    }
  }, []);

  // ReactQuill 配置
  const modules = {
    toolbar: {
      container: [
        [{ header: [1, 2, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ color: [] }, { background: [] }],
        ["link", "image"],
        ["clean"],
      ],
      handlers: {
        image: imageHandler,
      },
    },
  };

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "bullet",
    "color",
    "background",
    "link",
    "image",
  ];

  // 拖拽功能 - 只在表头区域可拖拽
  const handleHeaderMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // 检查是否点击在按钮上
      const target = e.target as HTMLElement;
      if (target.closest("button")) return;

      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
      onBringToFront();
    },
    [position, onBringToFront]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        const newPosition = {
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        };
        onPositionChange(newPosition);
      }
      if (isResizing) {
        let newWidth = size.width;
        let newHeight = size.height;
        let newX = position.x;
        let newY = position.y;

        // 根据缩放方向计算新的尺寸和位置
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;

        if (resizeDirection.includes("right")) {
          newWidth = Math.max(200, resizeStart.width + deltaX);
        }
        if (resizeDirection.includes("left")) {
          const newWidthCalc = Math.max(200, resizeStart.width - deltaX);
          newWidth = newWidthCalc;
          newX = resizeStart.x - newWidthCalc + resizeStart.width;
        }
        if (resizeDirection.includes("bottom")) {
          newHeight = Math.max(150, resizeStart.height + deltaY);
        }
        if (resizeDirection.includes("top")) {
          const newHeightCalc = Math.max(150, resizeStart.height - deltaY);
          newHeight = newHeightCalc;
          newY = resizeStart.y - newHeightCalc + resizeStart.height;
        }

        onSizeChange({ width: newWidth, height: newHeight });
        if (newX !== position.x || newY !== position.y) {
          onPositionChange({ x: newX, y: newY });
        }
      }
    },
    [
      isDragging,
      isResizing,
      dragStart,
      resizeStart,
      resizeDirection,
      size,
      position,
      onPositionChange,
      onSizeChange,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  // 缩放功能
  const handleResizeStart = useCallback(
    (direction: string) => (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsResizing(true);
      setResizeDirection(direction);
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: size.width,
        height: size.height,
      });
      onBringToFront();
    },
    [size, onBringToFront]
  );

  // 点击便利贴时置顶
  const handleNoteClick = useCallback(() => {
    onBringToFront();
  }, [onBringToFront]);

  // 全局鼠标事件监听
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  // 防止拖拽时选中文本
  useEffect(() => {
    if (isDragging) {
      document.body.style.userSelect = "none";
      return () => {
        document.body.style.userSelect = "";
      };
    }
  }, [isDragging]);

  // 添加粘贴事件监听器
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const timer = setTimeout(() => {
      const quillContainer = quillRef.current?.getEditor().container;
      if (quillContainer) {
        quillContainer.addEventListener("paste", handlePaste);
        cleanup = () => {
          quillContainer.removeEventListener("paste", handlePaste);
        };
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      cleanup?.();
    };
  }, [handlePaste]);

  if (!isOpen) return null;

  return (
    <div
      ref={noteRef}
      onTouchStart={stop}
      className={`fixed ${theme.bg} ${theme.border} border-2 rounded-lg shadow-2xl ${theme.shadow}  `}
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: isMinimized ? "auto" : size.height,
        zIndex: zIndex,
      }}
      onClick={handleNoteClick}
    >
      {/* 便利贴头部 */}
      <div
        className={`${theme.header} px-3 py-2 rounded-t-lg border-b ${theme.border} flex items-center justify-between cursor-grab active:cursor-grabbing select-none`}
        onMouseDown={handleHeaderMouseDown}
      >
        <div className="flex items-center gap-2">
          <Move size={14} className="text-gray-600" />
          <span className="text-sm font-medium text-gray-700 select-none">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSave?.();
            }}
            className="p-1 hover:bg-green-200 rounded transition-colors"
            title="保存到数据库"
          >
            <Save size={12} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleMinimize();
            }}
            className="p-1 hover:bg-black/10 rounded transition-colors"
            title={isMinimized ? "展开" : "最小化"}
          >
            {isMinimized ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1 hover:bg-red-200 rounded transition-colors"
            title="关闭"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* 便利贴内容区域 */}
      {!isMinimized && (
        <div className="relative flex-1 p-3">
          {/* ReactQuill 富文本编辑器 */}
          <div className="relative">
            <div className="quill-container">
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={content}
                onChange={handleContentChange}
                modules={modules}
                formats={formats}
                placeholder="在这里写下你的笔记..."
                style={{
                  height: size.height - 120,
                  minHeight: "150px",
                }}
              />
            </div>

            {/* 自定义样式覆盖 */}
            <style
              dangerouslySetInnerHTML={{
                __html: `
                .quill-container .ql-toolbar {
                  border: none !important;
                  border-bottom: 1px solid rgba(0, 0, 0, 0.1) !important;
                  padding: 8px !important;
                  border-radius: 4px 4px 0 0 !important;
                  background: ${
                    color === "yellow"
                      ? "rgba(254, 240, 138, 0.5)"
                      : color === "pink"
                      ? "rgba(251, 207, 232, 0.5)"
                      : color === "blue"
                      ? "rgba(191, 219, 254, 0.5)"
                      : color === "green"
                      ? "rgba(187, 247, 208, 0.5)"
                      : "rgba(254, 215, 170, 0.5)"
                  } !important;
                }
                .quill-container .ql-toolbar .ql-formats {
                  margin-right: 8px !important;
                }
                .quill-container .ql-toolbar button {
                  width: 24px !important;
                  height: 24px !important;
                  padding: 2px !important;
                  margin: 1px !important;
                  border-radius: 3px !important;
                }
                .quill-container .ql-toolbar button:hover {
                  background: rgba(0, 0, 0, 0.1) !important;
                }
                .quill-container .ql-toolbar button.ql-active {
                  background: rgba(0, 0, 0, 0.15) !important;
                }
                .quill-container .ql-container {
                  border: none !important;
                  font-family: cursive, sans-serif !important;
                  font-size: 14px !important;
                  line-height: 1.5 !important;
                }
                .quill-container .ql-editor {
                  padding: 12px !important;
                  min-height: 100px !important;
                  background: transparent !important;
                  color: #374151 !important;
                }
                .quill-container .ql-editor.ql-blank::before {
                  color: #9CA3AF !important;
                  font-style: italic !important;
                  left: 12px !important;
                  right: 12px !important;
                }
                .quill-container .ql-editor p {
                  margin-bottom: 8px !important;
                }
                .quill-container .ql-editor ul, 
                .quill-container .ql-editor ol {
                  margin-bottom: 8px !important;
                  padding-left: 20px !important;
                }
                .quill-container .ql-editor h1 {
                  font-size: 18px !important;
                  font-weight: bold !important;
                  margin-bottom: 8px !important;
                }
                .quill-container .ql-editor h2 {
                  font-size: 16px !important;
                  font-weight: bold !important;
                  margin-bottom: 6px !important;
                }
                .quill-container .ql-editor::-webkit-scrollbar {
                  width: 6px !important;
                }
                .quill-container .ql-editor::-webkit-scrollbar-track {
                  background: rgba(0, 0, 0, 0.05) !important;
                  border-radius: 3px !important;
                }
                .quill-container .ql-editor::-webkit-scrollbar-thumb {
                  background: rgba(0, 0, 0, 0.2) !important;
                  border-radius: 3px !important;
                }
                .quill-container .ql-editor::-webkit-scrollbar-thumb:hover {
                  background: rgba(0, 0, 0, 0.3) !important;
                }
              `,
              }}
            />
          </div>
        </div>
      )}

      {/* 边框缩放手柄 - 避免遮挡按钮 */}
      {/* 顶部边框 - 避开头部按钮区域 */}
      <div
        className="absolute top-0 left-8 right-16 h-1 cursor-n-resize opacity-0 hover:opacity-40 bg-gray-500 transition-opacity"
        onMouseDown={handleResizeStart("top")}
      />

      {/* 底部边框 */}
      <div
        className="absolute bottom-0 left-2 right-2 h-1 cursor-s-resize opacity-0 hover:opacity-40 bg-gray-500 transition-opacity"
        onMouseDown={handleResizeStart("bottom")}
      />

      {/* 左侧边框 - 避开头部区域 */}
      <div
        className="absolute left-0 top-8 bottom-2 w-1 cursor-w-resize opacity-0 hover:opacity-40 bg-gray-500 transition-opacity"
        onMouseDown={handleResizeStart("left")}
      />

      {/* 右侧边框 - 避开头部区域 */}
      <div
        className="absolute right-0 top-8 bottom-2 w-1 cursor-e-resize opacity-0 hover:opacity-40 bg-gray-500 transition-opacity"
        onMouseDown={handleResizeStart("right")}
      />

      {/* 角落缩放手柄 - 缩小尺寸 */}
      {/* 左上角 - 避开头部 */}
      <div
        className="absolute top-8 left-0 w-4 h-4 cursor-nw-resize opacity-0 hover:opacity-50  transition-opacity"
        onMouseDown={handleResizeStart("top-left")}
      />

      {/* 右上角 - 避开头部按钮 */}
      <div
        className="absolute top-8 right-0 w-4 h-4 cursor-ne-resize opacity-0 hover:opacity-50  transition-opacity"
        onMouseDown={handleResizeStart("top-right")}
      />

      {/* 左下角 */}
      <div
        className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize opacity-0 hover:opacity-50  transition-opacity"
        onMouseDown={handleResizeStart("bottom-left")}
      />

      {/* 右下角 */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-0 hover:opacity-50  transition-opacity"
        onMouseDown={handleResizeStart("bottom-right")}
      />
    </div>
  );
};

export default StickyNote;
