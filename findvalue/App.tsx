import React from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useAppInit } from './src/hooks/useAppInit';
import { StoreProvider } from './src/store';
import AppNavigator from './src/router';

function App(): React.JSX.Element {
  // 使用 Hook 处理所有启动逻辑
  const { isInitialized, hasNetwork, initialRoute, adConfig, error } = useAppInit({
    networkTimeout: 5000,
    enableAd: true,
    debugMode: __DEV__,
  });

  // 在初始化完成前不渲染应用，让原生启动屏继续显示
  if (!isInitialized) {
    return <></>;
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
              initialRoute={initialRoute}
              hasNetwork={hasNetwork}
              adConfig={adConfig}
            />
          </StoreProvider>
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
