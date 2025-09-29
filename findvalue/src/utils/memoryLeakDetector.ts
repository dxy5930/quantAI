/**
 * React Native 内存泄漏检测和清理工具
 */
import React from 'react';

interface TimerInfo {
  id: NodeJS.Timeout;
  type: 'timeout' | 'interval';
  created: number;
  componentName?: string;
}

/**
 * 简单的内存泄漏检测器
 */
class SimpleMemoryLeakDetector {
  private static instance: SimpleMemoryLeakDetector;
  private trackedTimers: Map<string, TimerInfo> = new Map();
  private isEnabled: boolean = __DEV__;

  private constructor() {}

  static getInstance(): SimpleMemoryLeakDetector {
    if (!SimpleMemoryLeakDetector.instance) {
      SimpleMemoryLeakDetector.instance = new SimpleMemoryLeakDetector();
    }
    return SimpleMemoryLeakDetector.instance;
  }

  /**
   * 跟踪定时器
   */
  trackTimer(id: NodeJS.Timeout, type: 'timeout' | 'interval', componentName?: string) {
    if (!this.isEnabled) return;

    this.trackedTimers.set(String(id), {
      id,
      type,
      created: Date.now(),
      componentName
    });
  }

  /**
   * 取消跟踪定时器
   */
  untrackTimer(id: NodeJS.Timeout) {
    this.trackedTimers.delete(String(id));
  }

  /**
   * 检查潜在的内存泄漏
   */
  checkForLeaks(): {
    suspiciousTimers: TimerInfo[];
    totalTimers: number;
  } {
    const now = Date.now();
    const SUSPICIOUS_TIMER_AGE = 30000; // 30秒

    const suspiciousTimers = Array.from(this.trackedTimers.values()).filter(
      timer => now - timer.created > SUSPICIOUS_TIMER_AGE
    );

    return {
      suspiciousTimers,
      totalTimers: this.trackedTimers.size
    };
  }

  /**
   * 强制清理所有跟踪的定时器
   */
  clearAllTimers() {
    this.trackedTimers.forEach((timer) => {
      if (timer.type === 'timeout') {
        clearTimeout(timer.id);
      } else {
        clearInterval(timer.id);
      }
    });
    this.trackedTimers.clear();
    console.log('已清理所有跟踪的定时器');
  }

  /**
   * 获取内存使用报告
   */
  getMemoryReport() {
    const leakCheck = this.checkForLeaks();
    
    console.group('内存泄漏检测报告');
    console.log(`总定时器数量: ${leakCheck.totalTimers}`);
    console.log(`可疑定时器数量: ${leakCheck.suspiciousTimers.length}`);
    
    if (leakCheck.suspiciousTimers.length > 0) {
      console.group('可疑定时器详情');
      leakCheck.suspiciousTimers.forEach((timer, index) => {
        console.log(`定时器 ${index + 1}:`, {
          type: timer.type,
          age: Date.now() - timer.created,
          component: timer.componentName || 'Unknown'
        });
      });
      console.groupEnd();
    }
    
    console.groupEnd();
    
    return leakCheck;
  }
}

// 创建单例实例
export const memoryLeakDetector = SimpleMemoryLeakDetector.getInstance();

/**
 * 安全的定时器工具
 */
export class SafeTimer {
  private static timers: Set<NodeJS.Timeout> = new Set();

  /**
   * 安全的 setTimeout
   */
  static setTimeout(callback: () => void, delay?: number): NodeJS.Timeout {
    const id = setTimeout(() => {
      SafeTimer.timers.delete(id);
      callback();
    }, delay);
    
    SafeTimer.timers.add(id);
    memoryLeakDetector.trackTimer(id, 'timeout', 'SafeTimer');
    return id;
  }

  /**
   * 安全的 setInterval
   */
  static setInterval(callback: () => void, delay?: number): NodeJS.Timeout {
    const id = setInterval(callback, delay);
    SafeTimer.timers.add(id);
    memoryLeakDetector.trackTimer(id, 'interval', 'SafeTimer');
    return id;
  }

  /**
   * 清理定时器
   */
  static clearTimeout(id: NodeJS.Timeout) {
    clearTimeout(id);
    SafeTimer.timers.delete(id);
    memoryLeakDetector.untrackTimer(id);
  }

  /**
   * 清理定时器
   */
  static clearInterval(id: NodeJS.Timeout) {
    clearInterval(id);
    SafeTimer.timers.delete(id);
    memoryLeakDetector.untrackTimer(id);
  }

  /**
   * 清理所有定时器
   */
  static clearAll() {
    SafeTimer.timers.forEach(id => {
      clearTimeout(id);
      clearInterval(id);
      memoryLeakDetector.untrackTimer(id);
    });
    SafeTimer.timers.clear();
  }
}

/**
 * 用于组件的清理hook
 */
export const useMemoryLeakDetection = (componentName?: string) => {
  const timersRef = React.useRef<Set<NodeJS.Timeout>>(new Set());

  const safeSetTimeout = React.useCallback((callback: () => void, delay?: number): NodeJS.Timeout => {
    const id = setTimeout(() => {
      timersRef.current.delete(id);
      memoryLeakDetector.untrackTimer(id);
      callback();
    }, delay);
    
    timersRef.current.add(id);
    memoryLeakDetector.trackTimer(id, 'timeout', componentName);
    return id;
  }, [componentName]);

  const safeSetInterval = React.useCallback((callback: () => void, delay?: number): NodeJS.Timeout => {
    const id = setInterval(callback, delay);
    timersRef.current.add(id);
    memoryLeakDetector.trackTimer(id, 'interval', componentName);
    return id;
  }, [componentName]);

  const safeClearTimeout = React.useCallback((id: NodeJS.Timeout) => {
    clearTimeout(id);
    timersRef.current.delete(id);
    memoryLeakDetector.untrackTimer(id);
  }, []);

  const safeClearInterval = React.useCallback((id: NodeJS.Timeout) => {
    clearInterval(id);
    timersRef.current.delete(id);
    memoryLeakDetector.untrackTimer(id);
  }, []);

  // 组件卸载时清理所有资源
  React.useEffect(() => {
    return () => {
      // 清理定时器
      timersRef.current.forEach(id => {
        clearTimeout(id);
        clearInterval(id);
        memoryLeakDetector.untrackTimer(id);
      });
      timersRef.current.clear();
    };
  }, []);

  return {
    safeSetTimeout,
    safeSetInterval,
    safeClearTimeout,
    safeClearInterval,
  };
};

// 开发环境下启用自动监控
if (__DEV__) {
  setInterval(() => {
    const leakCheck = memoryLeakDetector.checkForLeaks();
    
    if (leakCheck.suspiciousTimers.length > 10) {
      console.warn('检测到可能的内存泄漏！');
      memoryLeakDetector.getMemoryReport();
    }
  }, 30000);
} 