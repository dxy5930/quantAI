import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Maximize2,
  Minimize2,
  Palette,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link2,
} from "lucide-react";
import {
  getColorOptions,
  getStickyNoteClasses,
  StickyNoteColor,
} from "../../utils/stickyNoteColors";

interface StickyNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    content: string;
    color: "yellow" | "pink" | "blue" | "green" | "orange";
  }) => void;
  onDelete?: () => void;
  initialData?: {
    title: string;
    content: string;
    color: "yellow" | "pink" | "blue" | "green" | "orange";
  };
  mode: "create" | "edit";
}

const StickyNoteModal: React.FC<StickyNoteModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
  mode,
}) => {
  const [title, setTitle] = useState(initialData?.title || "新建便利贴");
  const [content, setContent] = useState(initialData?.content || "");
  const [color, setColor] = useState<
    "yellow" | "pink" | "blue" | "green" | "orange"
  >(initialData?.color || "yellow");
  const [isMinimized, setIsMinimized] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setContent(initialData.content);
      setColor(initialData.color);
    } else {
      setTitle("新建便利贴");
      setContent(
        "<p>欢迎使用便利贴功能！</p><p>你可以在这里记录任何想法和笔记。</p>"
      );
      setColor("yellow");
    }
  }, [initialData, isOpen]);

  const handleSave = () => {
    if (!title.trim()) {
      alert("请输入便利贴标题");
      return;
    }

    onSave({
      title: title.trim(),
      content: contentRef.current?.innerHTML || content,
      color,
    });
    onClose();
  };

  const handleDelete = () => {
    if (confirm("确定要删除这个便利贴吗？")) {
      onDelete?.();
      onClose();
    }
  };

  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (contentRef.current) {
      setContent(contentRef.current.innerHTML);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className={`w-full max-w-2xl mx-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden  ${
          isMinimized ? "h-16" : "h-auto max-h-[90vh]"
        }`}
      >
        {/* 标题栏 */}
        <div
          className={`px-4 py-3 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between ${
            getStickyNoteClasses(color).bg
          }`}
        >
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`flex-1 bg-transparent ${
              getStickyNoteClasses(color).text
            } font-medium text-lg border-none outline-none placeholder-gray-500 dark:placeholder-gray-400`}
            placeholder="便利贴标题..."
          />

          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-white hover:bg-opacity-50 dark:hover:bg-gray-700 dark:hover:bg-opacity-50 rounded"
              title={isMinimized ? "展开" : "最小化"}
            >
              {isMinimized ? (
                <Maximize2 className="w-4 h-4" />
              ) : (
                <Minimize2 className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={onClose}
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
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  便利贴颜色：
                </span>
                <div className="flex items-center space-x-2">
                  <Palette className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  <div className="flex space-x-1">
                    {getColorOptions().map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setColor(option.value)}
                        className={`w-6 h-6 rounded-full border-2 ${
                          option.bg
                        } ${option.border} ${
                          color === option.value
                            ? "ring-2 ring-gray-400 dark:ring-gray-500"
                            : ""
                        }`}
                        title={option.label}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 工具栏 */}
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => formatText("bold")}
                  className="p-1 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  title="加粗"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  onClick={() => formatText("italic")}
                  className="p-1 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  title="斜体"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  onClick={() => formatText("underline")}
                  className="p-1 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  title="下划线"
                >
                  <Underline className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
                <button
                  onClick={() => formatText("justifyLeft")}
                  className="p-1 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  title="左对齐"
                >
                  <AlignLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => formatText("justifyCenter")}
                  className="p-1 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  title="居中对齐"
                >
                  <AlignCenter className="w-4 h-4" />
                </button>
                <button
                  onClick={() => formatText("justifyRight")}
                  className="p-1 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  title="右对齐"
                >
                  <AlignRight className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
                <button
                  onClick={() => {
                    const url = prompt("请输入链接地址:");
                    if (url) formatText("createLink", url);
                  }}
                  className="p-1 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  title="插入链接"
                >
                  <Link2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 编辑区域 */}
            <div className="flex-1 p-4 min-h-[200px]">
              <div
                ref={contentRef}
                contentEditable
                className="w-full h-full min-h-[200px] outline-none text-gray-900 dark:text-gray-100"
                dangerouslySetInnerHTML={{ __html: content }}
                onInput={(e) => setContent(e.currentTarget.innerHTML)}
                style={{ wordWrap: "break-word" }}
              />
            </div>

            {/* 按钮区域 */}
            <div className="flex justify-end space-x-3 p-4 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
              {mode === "edit" && onDelete && (
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  删除
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StickyNoteModal;
