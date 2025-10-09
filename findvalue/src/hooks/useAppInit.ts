import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import SplashScreen from 'react-native-splash-screen';

export interface AppInitConfig {
  // 网络检测超时时间（毫秒）
  networkTimeout?: number;
  // 广告配置API端点
  adConfigApi?: string;
  // 是否启用广告功能
  enableAd?: boolean;
  // 调试模式
  debugMode?: boolean;
  // 是否启用快速启动（跳过所有初始化检查）
  fastStart?: boolean;
}

export interface AppInitState {
  // 是否初始化完成
  isInitialized: boolean;
  // 是否有网络连接
  hasNetwork: boolean;
  // 初始路由
  initialRoute: 'Splash' | 'MainTabs';
  // 广告配置
  adConfig: AdConfig | null;
  // 错误信息
  error: string | null;
}

export interface AdConfig {
  // 是否显示广告
  showAd: boolean;
  // 广告图片URL
  imageUrl?: string;
  // 显示时长
  duration?: number;
  // 跳过按钮配置
  skipConfig?: {
    enabled: boolean;
    delay: number;
  };
  // 其他广告相关配置
  [key: string]: any;
}

const defaultConfig: Required<AppInitConfig> = {
  networkTimeout: 10000, // 增加默认网络超时时间到10秒
  adConfigApi: '/api/ad-config',
  enableAd: true,
  debugMode: __DEV__,
  fastStart: false,
};

export const useAppInit = (config: AppInitConfig = {}): AppInitState => {
  const finalConfig = { ...defaultConfig, ...config };
  
  const [state, setState] = useState<AppInitState>({
    isInitialized: false,
    hasNetwork: false,
    initialRoute: 'MainTabs',
    adConfig: null,
    error: null,
  });

  useEffect(() => {
    // 如果启用快速启动，直接初始化
    if (finalConfig.fastStart) {
      setState({
        isInitialized: true,
        hasNetwork: true,
        initialRoute: 'MainTabs',
        adConfig: null,
        error: null,
      });
      
      return;
    }

    // 设置超时机制，确保应用不会卡在启动屏
    const timeoutId = setTimeout(() => {
      if (!state.isInitialized) {
        console.warn('App initialization timeout, forcing initialization');
        setState({
          isInitialized: true,
          hasNetwork: false,
          initialRoute: 'MainTabs',
          adConfig: null,
          error: 'Initialization timeout',
        });
        
      }
    }, 15000); // 15秒超时

    initializeApp();

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  const initializeApp = async () => {
    try {
      // 1. 检测网络状态
      const hasNetwork = await checkNetworkStatus();
      
      // 2. 获取广告配置（只有在有网络且启用广告时）
      let adConfig: AdConfig | null = null;
      if (hasNetwork && finalConfig.enableAd) {
        adConfig = await fetchAdConfig();
      }
      
      // 3. 决定初始路由 - 根据广告配置决定
      const initialRoute = shouldShowSplash(hasNetwork, adConfig) ? 'Splash' : 'MainTabs';
      
      // 4. 更新状态
      setState({
        isInitialized: true,
        hasNetwork,
        initialRoute,
        adConfig,
        error: null,
      });

      // 5. 启动屏关闭逻辑：由App.tsx统一控制
      
      if (finalConfig.debugMode) {
        console.log('App initialization completed:', {
          hasNetwork,
          initialRoute,
          adConfig,
        });
      }
    } catch (error) {
      console.error('App initialization error:', error);
      
      // 初始化失败时的降级处理 - 确保应用能正常启动
      setState({
        isInitialized: true,
        hasNetwork: false,
        initialRoute: 'MainTabs', // 即使出错也直接进入主页面
        adConfig: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

    }
  };

  // 检测网络状态
  const checkNetworkStatus = async (): Promise<boolean> => {
    try {
      const timeoutPromise = new Promise<boolean>((_, reject) => {
        setTimeout(() => reject(new Error('Network check timeout')), finalConfig.networkTimeout);
      });

      const networkPromise = NetInfo.fetch().then(state => {
        // 更宽松的网络检测条件
        if (state.isConnected === true) {
          // 如果有连接，即使无法确定互联网可达性也认为有网络
          return state.isInternetReachable !== false;
        }
        return false;
      });

      return await Promise.race([networkPromise, timeoutPromise]);
    } catch (error) {
      console.warn('Network check failed:', error);
      // 网络检测失败时，假设有网络连接，让应用继续运行
      return true;
    }
  };

  // 获取广告配置
  const fetchAdConfig = async (): Promise<AdConfig | null> => {
    try {
      // 这里可以调用真实的API
      // const response = await fetch(finalConfig.adConfigApi);
      // const config = await response.json();
      
      // 模拟API调用
      const mockApiCall = (): Promise<AdConfig | null> => {
        return new Promise((resolve) => {
          setTimeout(() => {
            // 模拟不同的返回结果
            const configs = [
              {
                showAd: true,
                imageUrl: 'https://picsum.photos/400/800?random=1',
                duration: 5,
                skipConfig: { enabled: true, delay: 2 },
              },
              {
                showAd: true,
                imageUrl: 'https://picsum.photos/400/800?random=2',
                duration: 3,
                skipConfig: { enabled: true, delay: 1 },
              },
              {
                showAd: false,
              },
            ];
            
            // 随机选择一个配置
            // 增加一个可能返回null的选项
            const allOptions = [...configs, null];
            const randomConfig = allOptions[Math.floor(Math.random() * allOptions.length)];
            resolve(randomConfig);
          }, 500); // 模拟网络延迟
        });
      };

      return await mockApiCall();
    } catch (error) {
      console.warn('Failed to fetch ad config:', error);
      return null;
    }
  };

  // 判断是否需要显示Splash页面 - 根据广告配置决定
  const shouldShowSplash = (hasNetwork: boolean, adConfig: AdConfig | null): boolean => {
    // 如果有网络且有广告配置，则显示Splash页面
    return hasNetwork && adConfig !== null && adConfig.showAd === true;
  };

  return state;
}; 