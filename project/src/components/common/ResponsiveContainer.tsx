import React from 'react';
import { useResponsive } from '../../hooks/useResponsive';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  mobileClassName?: string;
  tabletClassName?: string;
  desktopClassName?: string;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className = '',
  mobileClassName = '',
  tabletClassName = '',
  desktopClassName = '',
}) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const getResponsiveClassName = () => {
    let classes = className;
    
    if (isMobile && mobileClassName) {
      classes += ` ${mobileClassName}`;
    } else if (isTablet && tabletClassName) {
      classes += ` ${tabletClassName}`;
    } else if (isDesktop && desktopClassName) {
      classes += ` ${desktopClassName}`;
    }
    
    return classes.trim();
  };

  return (
    <div className={getResponsiveClassName()}>
      {children}
    </div>
  );
};

// 响应式网格容器
export const ResponsiveGrid: React.FC<{
  children: React.ReactNode;
  cols?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: string;
  className?: string;
}> = ({
  children,
  cols = { xs: 1, sm: 2, md: 3, lg: 4 },
  gap = 'gap-4',
  className = '',
}) => {
  const getGridCols = () => {
    const colsMap = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6',
    };

    const classes = ['grid'];
    
    if (cols.xs) classes.push(colsMap[cols.xs as keyof typeof colsMap] || 'grid-cols-1');
    if (cols.sm) classes.push(`sm:${colsMap[cols.sm as keyof typeof colsMap] || 'grid-cols-2'}`);
    if (cols.md) classes.push(`md:${colsMap[cols.md as keyof typeof colsMap] || 'grid-cols-3'}`);
    if (cols.lg) classes.push(`lg:${colsMap[cols.lg as keyof typeof colsMap] || 'grid-cols-4'}`);
    if (cols.xl) classes.push(`xl:${colsMap[cols.xl as keyof typeof colsMap] || 'grid-cols-5'}`);
    
    return classes.join(' ');
  };

  return (
    <div className={`${getGridCols()} ${gap} ${className}`}>
      {children}
    </div>
  );
};