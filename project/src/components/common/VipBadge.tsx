import React from "react";
import { Crown, Star, Zap } from "lucide-react";
import { UserLevel } from "../../types";

interface VipBadgeProps {
  level: UserLevel;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export const VipBadge: React.FC<VipBadgeProps> = ({
  level = 1,
  size = "md",
  showText = true,
  className = "",
}) => {
  // 根据用户等级返回不同的配置
  const getBadgeConfig = (level: UserLevel) => {
    switch (level) {
      case UserLevel.PREMIUM:
        return {
          icon: Star,
          text: "VIP",
          bgColor: "bg-gradient-to-r from-yellow-400 to-orange-500",
          textColor: "text-white",
          borderColor: "border-yellow-400",
          shadowColor: "shadow-yellow-400/30",
        };
      case UserLevel.SUPER:
        return {
          icon: Crown,
          text: "SVIP",
          bgColor: "bg-gradient-to-r from-purple-500 to-pink-600",
          textColor: "text-white",
          borderColor: "border-purple-500",
          shadowColor: "shadow-purple-500/30",
        };
      default:
        return null;
    }
  };

  // 根据尺寸返回样式类
  const getSizeClasses = (size: string) => {
    switch (size) {
      case "sm":
        return {
          container: "px-1.5 py-0.5 text-xs",
          icon: "w-3 h-3",
          gap: "gap-1",
        };
      case "lg":
        return {
          container: "px-3 py-1.5 text-sm",
          icon: "w-5 h-5",
          gap: "gap-2",
        };
      default: // md
        return {
          container: "px-2 py-1 text-xs",
          icon: "w-4 h-4",
          gap: "gap-1.5",
        };
    }
  };

  const config = getBadgeConfig(level);
  const sizeClasses = getSizeClasses(size);

  // 如果是普通用户，不显示VIP标识
  if (!config) {
    return null;
  }

  const IconComponent = config.icon;

  return (
    <div
      className={`
        inline-flex items-center ${sizeClasses.gap} ${sizeClasses.container}
        ${config.bgColor} ${config.textColor}
        rounded-full font-bold
        border ${config.borderColor}
        shadow-lg ${config.shadowColor}
        animate-pulse
        ${className}
      `}
    >
      <IconComponent className={sizeClasses.icon} />
      {showText && <span>{config.text}</span>}
    </div>
  );
};
