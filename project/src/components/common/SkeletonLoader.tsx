import React from 'react';

interface SkeletonLoaderProps {
  className?: string;
  variant?: 'text' | 'card' | 'grid' | 'stats' | 'ranking';
  count?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  className = '',
  variant = 'text',
  count = 1
}) => {
  const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-700 rounded';
  
  const renderSkeleton = () => {
    switch (variant) {
      case 'text':
        return <div className={`${baseClasses} h-4 w-full ${className}`} />;
      
      case 'card':
        return (
          <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 ${className}`}>
            <div className="animate-pulse space-y-4">
              <div className="flex items-center space-x-3">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-10 w-10" />
                <div className="flex-1 space-y-2">
                  <div className="bg-gray-200 dark:bg-gray-700 rounded h-4 w-3/4" />
                  <div className="bg-gray-200 dark:bg-gray-700 rounded h-3 w-1/2" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="bg-gray-200 dark:bg-gray-700 rounded h-3 w-full" />
                <div className="bg-gray-200 dark:bg-gray-700 rounded h-3 w-5/6" />
              </div>
              <div className="flex justify-between items-center">
                <div className="bg-gray-200 dark:bg-gray-700 rounded h-6 w-16" />
                <div className="bg-gray-200 dark:bg-gray-700 rounded h-6 w-20" />
              </div>
            </div>
          </div>
        );
      
      case 'grid':
        return (
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${className}`}>
            {Array.from({ length: count }).map((_, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="animate-pulse space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-10 w-10" />
                    <div className="flex-1 space-y-2">
                      <div className="bg-gray-200 dark:bg-gray-700 rounded h-4 w-3/4" />
                      <div className="bg-gray-200 dark:bg-gray-700 rounded h-3 w-1/2" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="bg-gray-200 dark:bg-gray-700 rounded h-3 w-full" />
                    <div className="bg-gray-200 dark:bg-gray-700 rounded h-3 w-5/6" />
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="bg-gray-200 dark:bg-gray-700 rounded h-6 w-16" />
                    <div className="bg-gray-200 dark:bg-gray-700 rounded h-6 w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      
      case 'stats':
        return (
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="animate-pulse space-y-3 text-center">
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-12 w-12 mx-auto" />
                  <div className="bg-gray-200 dark:bg-gray-700 rounded h-6 w-16 mx-auto" />
                  <div className="bg-gray-200 dark:bg-gray-700 rounded h-4 w-20 mx-auto" />
                </div>
              </div>
            ))}
          </div>
        );
      
      case 'ranking':
        return (
          <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 ${className}`}>
            <div className="animate-pulse space-y-4">
              <div className="flex items-center justify-between">
                <div className="bg-gray-200 dark:bg-gray-700 rounded h-6 w-32" />
                <div className="bg-gray-200 dark:bg-gray-700 rounded h-8 w-20" />
              </div>
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 border border-gray-100 dark:border-gray-700 rounded-lg">
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-6 w-6" />
                    <div className="flex-1 space-y-1">
                      <div className="bg-gray-200 dark:bg-gray-700 rounded h-4 w-3/4" />
                      <div className="bg-gray-200 dark:bg-gray-700 rounded h-3 w-1/2" />
                    </div>
                    <div className="bg-gray-200 dark:bg-gray-700 rounded h-4 w-12" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      
      default:
        return <div className={`${baseClasses} h-4 w-full ${className}`} />;
    }
  };

  if (variant === 'grid' || variant === 'stats' || variant === 'ranking') {
    return renderSkeleton();
  }

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={index > 0 ? 'mt-2' : ''}>
          {renderSkeleton()}
        </div>
      ))}
    </>
  );
}; 