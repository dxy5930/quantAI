import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useNavigate, useParams } from "react-router-dom";
import { ROUTES } from "../../constants/routes";
import { useStore, useStrategyDetail } from "../../hooks";
import { StrategyType } from "../../constants/strategyTypes";
import { Loader2 } from "lucide-react";

const StrategyConfigPage: React.FC = observer(() => {
  const { app } = useStore();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // 使用新的策略详情hook
  const { strategy: strategyItem, loading, error } = useStrategyDetail(id);

  // 根据策略类型重定向到对应的配置页面
  useEffect(() => {
    if (strategyItem && !loading) {
      console.log('策略类型:', strategyItem.strategyType);
      if (strategyItem.strategyType === StrategyType.BACKTEST) {
        console.log('重定向到回测配置页面:', `/strategy/${id}/backtest-config`);
        navigate(`/strategy/${id}/backtest-config`, { replace: true });
      } else {
        console.log('重定向到选股配置页面:', `/strategy/${id}/stock-selection-config`);
        navigate(`/strategy/${id}/stock-selection-config`, { replace: true });
      }
    }
  }, [strategyItem, loading, navigate, id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="text-lg text-gray-600 dark:text-gray-400">
            加载策略配置...
          </span>
        </div>
      </div>
    );
  }

  if (error || !strategyItem) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg">{error || "策略未找到"}</div>
        <button
          onClick={() => navigate(ROUTES.HOME)}
          className="mt-4 text-blue-400 hover:text-blue-300"
        >
          返回首页
        </button>
      </div>
    );
  }

  // 这个组件主要用于重定向，不应该渲染内容
  return null;
});

export default StrategyConfigPage;
