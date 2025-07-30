import React, { memo } from 'react';
import { LucideIcon } from 'lucide-react';

interface BaseCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  selected?: boolean;
  disabled?: boolean;
}

interface CardHeaderProps {
  icon?: LucideIcon;
  iconColor?: string;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const BaseCard: React.FC<BaseCardProps> = memo(({
  children,
  className = '',
  onClick,
  hoverable = false,
  selected = false,
  disabled = false,
}) => {
  const baseClasses = `
    bg-white dark:bg-gray-800 
    rounded-xl 
    border border-gray-200 dark:border-gray-700 
    shadow-sm 
    transition-all duration-300
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${selected ? 'border-blue-500 ring-2 ring-blue-500/20' : ''}
    ${hoverable && !disabled ? 'hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/20 hover:scale-105 cursor-pointer' : ''}
    ${className}
  `;

  return (
    <div 
      className={baseClasses}
      onClick={disabled ? undefined : onClick}
    >
      {children}
    </div>
  );
});

export const CardHeader: React.FC<CardHeaderProps> = ({
  icon: Icon,
  iconColor = 'from-blue-600 to-purple-600',
  title,
  subtitle,
  badge,
  actions,
}) => {
  return (
    <div className="flex items-start justify-between p-6 pb-4">
      <div className="flex items-center space-x-3 flex-1">
        {Icon && (
          <div className={`bg-gradient-to-r ${iconColor} p-3 rounded-lg group-hover:shadow-glow transition-all duration-300`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
            {title}
          </h3>
          {subtitle && (
            <div className="flex items-center space-x-2 mt-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
              {badge}
            </div>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center space-x-2">
          {actions}
        </div>
      )}
    </div>
  );
};

export const CardContent: React.FC<CardContentProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`px-6 ${className}`}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`px-6 pb-6 ${className}`}>
      {children}
    </div>
  );
}; 