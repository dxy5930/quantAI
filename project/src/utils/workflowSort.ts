export type StepLike = {
  stepNumber?: number;
  timestamp?: Date;
};

export function sortStepsGeneric<T extends StepLike>(steps: T[]): T[] {
  return [...steps].sort((a, b) => {
    const byNo = (a.stepNumber || 0) - (b.stepNumber || 0);
    if (byNo !== 0) return byNo;
    const at = a.timestamp ? a.timestamp.getTime() : 0;
    const bt = b.timestamp ? b.timestamp.getTime() : 0;
    return at - bt;
  });
}

export type MessageLike = {
  timestamp: Date;
  type?: string; // user | system | task | result | assistant
  status?: string; // pending | running | completed | failed
  content?: string;
  data?: {
    isStep?: boolean;
    step?: {
      stepNumber?: number;
      id?: string;
    };
    taskId?: string;
    relatedStepId?: string;
    sequence?: number; // 新增：后端顺序号
  };
};

// 为不同阶段设置排序权重，数值越小越靠前
function getPhaseWeight(m: MessageLike): number {
  const content = (m.content || '').trim();
  const isCompletedText = /^已完成|^步骤完成/.test(content);
  const isRunningText = /^正在/.test(content);

  if (m.data?.isStep) return 2; // 步骤正文
  if (m.data?.relatedStepId) return 3; // 资源/衍生消息

  // 任务阶段优先展示在步骤前
  if (m.type === 'task') {
    if (m.status === 'running' || m.status === 'pending' || isRunningText) return 1;
    if (m.status === 'completed' || isCompletedText) return 4;
    return 1.5; // 其它任务态
  }

  // 结果与完成靠后
  if (m.type === 'result' || m.status === 'completed' || isCompletedText) return 4;

  // 助手总结再靠后一些
  if (m.type === 'assistant') return 5;

  // 默认系统/用户消息按时间排在最前/中间
  return 0;
}

function getRelatedStepId(m: MessageLike): string | undefined {
  return (
    m.data?.step?.id ||
    m.data?.relatedStepId
  );
}

export function sortMessagesByStepAndTime<T extends MessageLike>(messages: T[]): T[] {
  return [...messages].sort((a, b) => {
    // 1) 若后端提供 sequence，则优先按 sequence 排序
    const sa = a.data?.sequence;
    const sb = b.data?.sequence;
    if (typeof sa === 'number' && typeof sb === 'number' && sa !== sb) {
      return sa - sb;
    }

    const aIsStep = !!a.data?.isStep;
    const bIsStep = !!b.data?.isStep;

    const aRel = getRelatedStepId(a);
    const bRel = getRelatedStepId(b);

    // 同一关联步骤内，按阶段权重排序（保证“任务->步骤->资源->结果/完成->助手”）
    if (aRel && bRel && aRel === bRel) {
      const wa = getPhaseWeight(a);
      const wb = getPhaseWeight(b);
      if (wa !== wb) return wa - wb;
      // 阶段一致时再按步骤号与时间
      const aStepNo = a.data?.step?.stepNumber || 0;
      const bStepNo = b.data?.step?.stepNumber || 0;
      if (aStepNo !== bStepNo) return aStepNo - bStepNo;
      const at = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const bt = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return at - bt;
    }

    // 若一条是步骤，另一条是它的关联资源，则保证步骤在前
    if (aIsStep && b.data?.relatedStepId && b.data.relatedStepId === a.data?.step?.id) {
      return -1;
    }
    if (bIsStep && a.data?.relatedStepId && a.data.relatedStepId === b.data?.step?.id) {
      return 1;
    }

    // 阶段权重优先级（处理“先完成再分析”一类错序）
    const wa = getPhaseWeight(a);
    const wb = getPhaseWeight(b);
    if (wa !== wb) return wa - wb;

    // 两条都是步骤：按步骤号
    if (aIsStep && bIsStep) {
      const aStepNo = a.data?.step?.stepNumber || 0;
      const bStepNo = b.data?.step?.stepNumber || 0;
      if (aStepNo !== bStepNo) return aStepNo - bStepNo;
    }

    // 其他情况：按时间
    const at = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const bt = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return at - bt;
  });
} 