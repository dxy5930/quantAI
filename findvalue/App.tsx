import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import SplashScreen from 'react-native-splash-screen';
import { useAppInit } from './src/hooks/useAppInit';
import { StoreProvider } from './src/store';
import AppNavigator from './src/router';

function App(): React.JSX.Element {
  // 使用 Hook 处理所有启动逻辑
  const { isInitialized, hasNetwork, initialRoute, adConfig, error } = useAppInit({
    networkTimeout: 10000, // 增加网络检测超时时间到10秒
    enableAd: true, // 启用广告功能
    debugMode: __DEV__,
    fastStart: false, // 禁用快速启动，使用正常初始化流程
  });

  // 在初始化完成后隐藏原生启动屏
  useEffect(() => {
    if (isInitialized) {
      SplashScreen.hide();
    }
  }, [isInitialized]);

  // 在初始化完成前不渲染应用，让原生启动屏继续显示
  if (!isInitialized) {
    return <></>;
  }

  // 如果有错误，在开发模式下显示错误信息，生产模式下直接进入主页面
  if (error && __DEV__) {
    console.warn('App initialization error:', error);
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right', 'bottom']}>
          <StatusBar
            barStyle="dark-content"
            backgroundColor="#ffffff"
            translucent={false}
          />
          <StoreProvider>
            <AppNavigator 
              initialRoute={initialRoute} // 传递初始路由
              hasNetwork={hasNetwork}
              adConfig={adConfig} // 传递广告配置
            />
          </StoreProvider>
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
