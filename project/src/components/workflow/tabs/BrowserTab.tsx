import React from "react";
import { Globe, RefreshCw, ExternalLink } from "lucide-react";
import { TaskContext } from "../types";

interface BrowserTabProps {
  taskContext?: TaskContext;
}

export const BrowserTab: React.FC<BrowserTabProps> = ({ taskContext }) => {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900 dark:text-white">相关网页</h3>
        <button className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded">
          <RefreshCw className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div className="space-y-3">
        {taskContext?.webResources?.map((resource) => (
          <div
            key={resource.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <Globe className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                    {resource.title}
                  </h4>
                  {resource.status === "loading" && (
                    <RefreshCw className="w-3 h-3 text-blue-600 animate-spin flex-shrink-0" />
                  )}
                </div>

                {resource.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
                    {resource.description}
                  </p>
                )}

                <div>
                  <div className="text-xs text-gray-400 truncate mb-2">
                    {resource.url}
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatDate(resource.timestamp)}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-1 ml-2">
                <button
                  onClick={() => window.open(resource.url, "_blank")}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors"
                  title="打开链接"
                >
                  <ExternalLink className="w-3 h-3 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
