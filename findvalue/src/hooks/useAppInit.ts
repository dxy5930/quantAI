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
  networkTimeout: 5000,
  adConfigApi: '/api/ad-config',
  enableAd: true,
  debugMode: __DEV__,
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
    initializeApp();
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
      
      // 3. 决定初始路由
      const initialRoute = shouldShowSplash(hasNetwork, adConfig) ? 'Splash' : 'MainTabs';
      
      // 4. 更新状态
      setState({
        isInitialized: true,
        hasNetwork,
        initialRoute,
        adConfig,
        error: null,
      });

      // 5. 启动屏关闭逻辑：不显示广告时直接关闭
      if (!shouldShowSplash(hasNetwork, adConfig)) {
        if (SplashScreen && typeof SplashScreen.hide === 'function') {
          SplashScreen.hide();
        }
      }
      
      if (finalConfig.debugMode) {
        console.log('App initialization completed:', {
          hasNetwork,
          initialRoute,
          adConfig,
        });
      }
    } catch (error) {
      console.error('App initialization error:', error);
      
      // 初始化失败时的降级处理
      setState({
        isInitialized: true,
        hasNetwork: false,
        initialRoute: 'MainTabs',
        adConfig: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // 初始化失败时立即关闭启动屏
      if (SplashScreen && typeof SplashScreen.hide === 'function') {
        SplashScreen.hide();
      }
    }
  };

  // 检测网络状态
  const checkNetworkStatus = async (): Promise<boolean> => {
    try {
      const timeoutPromise = new Promise<boolean>((_, reject) => {
        setTimeout(() => reject(new Error('Network check timeout')), finalConfig.networkTimeout);
      });

      const networkPromise = NetInfo.fetch().then(state => {
        return state.isConnected === true && state.isInternetReachable === true;
      });

      return await Promise.race([networkPromise, timeoutPromise]);
    } catch (error) {
      console.warn('Network check failed:', error);
      return false;
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

  // 判断是否需要显示Splash页面
  const shouldShowSplash = (hasNetwork: boolean, adConfig: AdConfig | null): boolean => {
    // 没有网络时不显示
    if (!hasNetwork) return false;
    
    // 没有广告配置时不显示
    if (!adConfig) return false;
    
    // 根据广告配置决定
    return adConfig.showAd === true && !!adConfig.imageUrl;
  };

  return state;
}; 