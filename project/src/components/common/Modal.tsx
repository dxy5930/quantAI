import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string | React.ReactNode;
  children: React.ReactNode;
  width?: string;
  height?: string;
  showCloseButton?: boolean;
  closeOnMaskClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  // 新增popover模式相关属性
  mode?: 'modal' | 'popover';
  triggerElement?: HTMLElement | null;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  offset?: number;
}

// Portal 容器组件
const PortalContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // 确保模态框根元素存在
    let root = document.getElementById('modal-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'modal-root';
      root.style.position = 'fixed';
      root.style.top = '0';
      root.style.left = '0';
      root.style.width = '100%';
      root.style.height = '100%';
      root.style.zIndex = '9999';
      root.style.pointerEvents = 'none';
      document.body.appendChild(root);
    }
    setModalRoot(root);

    return () => {
      if (root && root.children.length === 0 && root.parentNode) {
        document.body.removeChild(root);
      }
    };
  }, []);

  if (!modalRoot) return null;
  
  return ReactDOM.createPortal(children, modalRoot);
};

// 计算popover位置
const calculatePopoverPosition = (
  triggerElement: HTMLElement,
  position: string,
  offset: number = 8
) => {
  const rect = triggerElement.getBoundingClientRect();
  
  // 使用视口坐标，不需要添加滚动偏移量，因为我们使用固定定位
  const triggerRect = {
    top: rect.top,
    left: rect.left,
    right: rect.right,
    bottom: rect.bottom,
    width: rect.width,
    height: rect.height,
    centerX: rect.left + rect.width / 2,
    centerY: rect.top + rect.height / 2,
  };

  switch (position) {
    case 'top':
      return {
        top: triggerRect.top - offset,
        left: triggerRect.centerX,
        transform: 'translate(-50%, -100%)',
      };
    case 'bottom':
      return {
        top: triggerRect.bottom + offset,
        left: triggerRect.centerX,
        transform: 'translate(-50%, 0)',
      };
    case 'left':
      return {
        top: triggerRect.centerY,
        left: triggerRect.left - offset,
        transform: 'translate(-100%, -50%)',
      };
    case 'right':
      return {
        top: triggerRect.centerY,
        left: triggerRect.right + offset,
        transform: 'translate(0, -50%)',
      };
    default: // auto
      // 默认显示在底部，如果空间不够则显示在顶部
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      if (spaceBelow >= 200 || spaceBelow > spaceAbove) {
        return {
          top: triggerRect.bottom + offset,
          left: triggerRect.centerX,
          transform: 'translate(-50%, 0)',
        };
      } else {
        return {
          top: triggerRect.top - offset,
          left: triggerRect.centerX,
          transform: 'translate(-50%, -100%)',
        };
      }
  }
};

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  width = "max-w-4xl",
  height = "max-h-[90vh]",
  showCloseButton = true,
  closeOnMaskClick = true,
  closeOnEscape = true,
  className = "",
  mode = 'modal',
  triggerElement = null,
  position = 'auto',
  offset = 8,
}) => {
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

  // 处理ESC键关闭
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && closeOnEscape) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // 只有在modal模式下才阻止背景滚动
      if (mode === 'modal') {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        
        return () => {
          document.removeEventListener('keydown', handleEscape);
          document.body.style.overflow = originalOverflow;
        };
      } else {
        return () => {
          document.removeEventListener('keydown', handleEscape);
        };
      }
    }
  }, [isOpen, onClose, closeOnEscape, mode]);

  // 计算popover位置
  useEffect(() => {
    if (mode === 'popover' && triggerElement && isOpen) {
      const updatePosition = () => {
        const style = calculatePopoverPosition(triggerElement, position, offset);
        setPopoverStyle(style);
      };

      updatePosition();
      
      // 监听窗口大小变化和滚动事件
      const handleScroll = () => updatePosition();
      const handleResize = () => updatePosition();
      
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll, true);
      document.addEventListener('scroll', handleScroll, true);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll, true);
        document.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [mode, triggerElement, isOpen, position, offset]);

  if (!isOpen) return null;

  // 阻止点击模态框内容时关闭
  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // 处理遮罩点击关闭
  const handleMaskClick = () => {
    if (closeOnMaskClick) {
      onClose();
    }
  };

  // Popover模式渲染
  if (mode === 'popover') {
    return (
      <PortalContainer>
        {/* 透明遮罩层 */}
        <div 
          className="fixed inset-0"
          style={{
            zIndex: 10000,
            pointerEvents: 'auto',
            backgroundColor: 'transparent',
          }}
          onClick={handleMaskClick}
        >
          {/* Popover内容 */}
          <div 
            className={`fixed bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 ${className}`}
            style={{
              ...popoverStyle,
              zIndex: 10001,
              minWidth: '300px',
              maxWidth: '500px',
              maxHeight: '400px',
            }}
            onClick={handleModalClick}
          >
            {/* Popover头部 */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                {title && (
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {typeof title === 'string' ? <h3>{title}</h3> : title}
                  </div>
                )}
                {showCloseButton && (
                  <button 
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ml-auto"
                    aria-label="关闭"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
            
            {/* Popover内容 */}
            <div className="overflow-y-auto" style={{ maxHeight: '300px' }}>
              <div className="p-2">
                {children}
              </div>
            </div>
          </div>
        </div>
      </PortalContainer>
    );
  }

  // 默认Modal模式渲染
  return (
    <PortalContainer>
      {/* 全屏遮罩层 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
        style={{
          zIndex: 10000,
          pointerEvents: 'auto',
        }}
        onClick={handleMaskClick}
      >
        {/* 模态框主体 */}
        <div 
          className={`bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full ${width} ${height} overflow-hidden relative ${className}`}
          style={{
            transform: 'scale(1)',
            transition: 'all 0.3s ease-out',
          }}
          onClick={handleModalClick}
        >
          {/* 模态框头部 */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              {title && (
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {typeof title === 'string' ? <h2>{title}</h2> : title}
                </div>
              )}
              {showCloseButton && (
                <button 
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ml-auto"
                  aria-label="关闭"
                >
                  <X className="w-6 h-6" />
                </button>
              )}
            </div>
          )}
          
          {/* 模态框内容 */}
          <div className="flex-1 overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    </PortalContainer>
  );
};

export default Modal; 