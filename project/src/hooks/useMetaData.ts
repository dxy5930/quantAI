import { useState, useEffect } from 'react';
import { useStore } from './useStore';

interface UseMetaDataReturn {
  categories: { value: string; label: string }[];
  strategyTypes: { value: string; label: string; description?: string }[];
  sortOptions: { value: string; label: string }[];
  loading: boolean;
  error: string | null;
}

export const useMetaData = (): UseMetaDataReturn => {
  const { meta } = useStore();
  
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
  const [strategyTypes, setStrategyTypes] = useState<{ value: string; label: string; description?: string }[]>([]);
  const [sortOptions, setSortOptions] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMetaData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        await meta.loadMeta();

        // 将meta数据分别赋值给三个数组
        setCategories(meta.getStrategyCategories());
        setStrategyTypes(meta.getStrategyTypes());
        setSortOptions(meta.getSortOptions());
      } catch (error) {
        console.error("加载meta数据失败:", error);
        setError('加载meta数据失败');
        
        // 设置默认数据
        setCategories([{ value: "all", label: "全部分类" }]);
        setStrategyTypes([{ value: "all", label: "全部类型" }]);
        setSortOptions([{ value: "popularity", label: "热度排序" }]);
      } finally {
        setLoading(false);
      }
    };

    loadMetaData();
  }, []); // 移除meta依赖项，只在组件挂载时执行一次

  return {
    categories,
    strategyTypes,
    sortOptions,
    loading,
    error
  };
}; 