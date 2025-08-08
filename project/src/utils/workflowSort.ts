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
  data?: {
    isStep?: boolean;
    step?: {
      stepNumber?: number;
    };
  };
};

export function sortMessagesByStepAndTime<T extends MessageLike>(messages: T[]): T[] {
  return [...messages].sort((a, b) => {
    const aStep = a.data?.isStep ? (a.data?.step?.stepNumber || 0) : null;
    const bStep = b.data?.isStep ? (b.data?.step?.stepNumber || 0) : null;
    if (aStep !== null && bStep !== null && aStep !== bStep) {
      return aStep - bStep;
    }
    const at = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const bt = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return at - bt;
  });
} 