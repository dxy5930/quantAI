import React from "react";
import { Star, Crown, Sparkles } from "lucide-react";

const iconMap = {
  Star,
  Crown,
  Sparkles,
};

interface BadgeProps {
  /** Lucide 图标库中的图标名称 */
  icon: keyof typeof iconMap;
  /** 可选的文本内容，显示在图标旁边 */
  text?: string;
  /** 徽章的颜色变体 */
  variant?: "gold" | "purple" | "blue" | "green" | "red";
  /** 徽章的尺寸大小 */
  size?: "sm" | "md" | "lg";
  /** 是否显示文本标签 */
  showText?: boolean;
  /** 是否启用悬停动画效果 */
  animate?: boolean;
  /** 额外的 CSS 类名 */
  className?: string;
  /** 边框圆角半径（像素） */
  radius?: number;
  /** 是否图标组件 */
  showIcon?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  icon,
  text,
  variant = "gold",
  size = "md",
  showText = true,
  animate = true,
  className = "",
  radius,
  showIcon = false,
}) => {
  // 根据变体返回不同的配置
  const getVariantConfig = (variant: string) => {
    switch (variant) {
      case "gold":
        return {
          bgColor: "bg-gradient-to-r from-yellow-400 to-orange-500",
          textColor: "text-white",
          borderColor: "border-yellow-400",
          shadowColor: "shadow-yellow-400/30",
        };
      case "purple":
        return {
          bgColor: "bg-gradient-to-r from-purple-500 to-pink-600",
          textColor: "text-white",
          borderColor: "border-purple-500",
          shadowColor: "shadow-purple-500/30",
        };
      case "blue":
        return {
          bgColor: "bg-gradient-to-r from-blue-500 to-cyan-600",
          textColor: "text-white",
          borderColor: "border-blue-500",
          shadowColor: "shadow-blue-500/30",
        };
      case "green":
        return {
          bgColor: "bg-gradient-to-r from-green-500 to-emerald-600",
          textColor: "text-white",
          borderColor: "border-green-500",
          shadowColor: "shadow-green-500/30",
        };
      case "red":
        return {
          bgColor: "bg-gradient-to-r from-red-500 to-pink-600",
          textColor: "text-white",
          borderColor: "border-red-500",
          shadowColor: "shadow-red-500/30",
        };
      default:
        return {
          bgColor: "bg-gradient-to-r from-gray-500 to-gray-600",
          textColor: "text-white",
          borderColor: "border-gray-500",
          shadowColor: "shadow-gray-500/30",
        };
    }
  };

  // 根据尺寸返回样式类
  const getSizeClasses = (size: string) => {
    switch (size) {
      case "sm":
        return {
          container: "px-1.5  text-xs",
          icon: "w-3 h-3",
          gap: "gap-1",
        };
      case "lg":
        return {
          container: "px-3  text-sm",
          icon: "w-5 h-5",
          gap: "gap-2",
        };
      default: // md
        return {
          container: "px-2  text-xs",
          icon: "w-4 h-4",
          gap: "gap-1.5",
        };
    }
  };

  const config = getVariantConfig(variant);
  const sizeClasses = getSizeClasses(size);

  // 动态获取图标组件
  const IconComponent = iconMap[icon] as React.ComponentType<{
    className?: string;
  }>;

  if (!IconComponent) {
    console.warn(`Icon "${icon}" not found in lucide-react`);
    return null;
  }

  return (
    <div
      className={`
        inline-flex items-center ${sizeClasses.gap} ${sizeClasses.container}
        ${config.bgColor} ${config.textColor}
        font-bold
        border ${config.borderColor}
        shadow-lg ${config.shadowColor}
        ${animate ? "animate-pulse" : ""}
        ${className}
      `}
      style={radius ? { borderRadius: `${radius}px` } : undefined}
    >
      {showIcon && <IconComponent className={sizeClasses.icon} />}
      {showText && text && <span>{text}</span>}
    </div>
  );
};
