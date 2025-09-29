import { useNavigation as useRNNavigation, useRoute } from '@react-navigation/native';
import { useCallback } from 'react';

export function useNavigation() {
  const navigation = useRNNavigation();
  const route = useRoute();

  // 保留在导航栈中的跳转，类似uniapp的navigateTo
  const navigateTo = useCallback(
    (screenName: string, params?: any) => {
      // @ts-ignore
      navigation.navigate(screenName, params);
    },
    [navigation]
  );

  // 关闭当前页面，跳转到应用内的某个页面，类似uniapp的redirectTo
  const redirectTo = useCallback(
    (screenName: string, params?: any) => {
      // @ts-ignore
      navigation.replace(screenName, params);
    },
    [navigation]
  );

  // 关闭所有页面，打开到应用内的某个页面，类似uniapp的reLaunch
  const reLaunch = useCallback(
    (screenName: string, params?: any) => {
      navigation.reset({
        index: 0,
        // @ts-ignore
        routes: [{ name: screenName, params }],
      });
    },
    [navigation]
  );

  // 跳转到 tabBar 页面，并关闭其他所有非 tabBar 页面，类似uniapp的switchTab
  const switchTab = useCallback(
    (screenName: string) => {
      // 对于Tab页面，通常不需要参数
      navigation.reset({
        index: 0,
        // @ts-ignore
        routes: [{ name: screenName }],
      });
    },
    [navigation]
  );

  // 关闭当前页面，返回上一页面或多级页面，类似uniapp的navigateBack
  const navigateBack = useCallback(
    (delta: number = 1) => {
      if (delta === 1) {
        // 返回上一页
        if (navigation.canGoBack()) {
          navigation.goBack();
        }
      } else {
        // 返回多级页面
        // @ts-ignore
        navigation.pop(delta);
      }
    },
    [navigation]
  );

  // 获取当前路由信息
  const getCurrentRoute = useCallback(() => {
    return {
      name: route.name,
      params: route.params || {},
      key: route.key,
    };
  }, [route]);

  // 检查是否可以返回
  const canGoBack = useCallback(() => {
    return navigation.canGoBack();
  }, [navigation]);

  // 设置导航选项
  const setOptions = useCallback(
    (options: any) => {
      navigation.setOptions(options);
    },
    [navigation]
  );

  return {
    // uniapp风格的导航方法
    navigateTo,     // 保留当前页面，跳转到应用内的某个页面
    redirectTo,     // 关闭当前页面，跳转到应用内的某个页面
    reLaunch,       // 关闭所有页面，打开到应用内的某个页面
    switchTab,      // 跳转到 tabBar 页面
    navigateBack,   // 关闭当前页面，返回上一页面或多级页面
    
    // 状态查询方法
    getCurrentRoute,
    canGoBack,
    
    // 配置方法
    setOptions,
    
    // 原始navigation对象（用于高级用法）
    navigation,
    route,
  };
}

// 简化版本的hook，只包含最常用的方法
export function useSimpleNavigation() {
  const { navigateTo, navigateBack, canGoBack } = useNavigation();
  
  return {
    navigateTo,
    navigateBack,
    canGoBack,
  };
} 