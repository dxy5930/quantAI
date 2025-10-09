import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator, type NativeStackScreenProps } from '@react-navigation/native-stack';
import SplashScreen from 'react-native-splash-screen';
import HomePage from '../pages/Home';
import DetailsPage from '../pages/Details';
import MinePage from '../pages/Mine';
import LoginPage from '../pages/Login';
import SplashPage from '../pages/Splash';
import TabBar, { TabBarItem } from '../components/common/TabBar';
import type { AdConfig } from '../hooks/useAppInit';

export type RootStackParamList = {
  Splash: { adConfig: AdConfig | null } | undefined;
  MainTabs: undefined;
  Details: { from?: string } | undefined;
  Login: undefined;
};

export type TabScreens = 'Home' | 'Mine';

interface AppNavigatorProps {
  initialRoute: 'Splash' | 'MainTabs';
  hasNetwork: boolean;
  adConfig: AdConfig | null;
}

const Stack = createNativeStackNavigator<RootStackParamList>();

// 底部导航栏配置 - 支持两种状态的图标和文字颜色
const defaultTabItems: TabBarItem[] = [
  { 
    key: 'Home', 
    title: '首页', 
    icon: {
      active: '🏠',   // 激活状态：实心房子
      inactive: '🏡'  // 未激活状态：空心房子
    },
    textColor: {
      active: '#3498db',    // 激活状态：蓝色
      inactive: '#95a5a6'   // 未激活状态：灰色
    }
  },
  { 
    key: 'Mine', 
    title: '我的', 
    icon: {
      active: '👤',   // 激活状态：实心人像
      inactive: '👥'  // 未激活状态：多人像
    },
    textColor: {
      active: '#e74c3c',    // 激活状态：红色
      inactive: '#bdc3c7'   // 未激活状态：浅灰色
    },
    badge: 3 
  },
];

// Splash页面包装器 - 使用Hook传递的广告配置
const SplashScreenWrapper = ({ navigation, route }: any) => {
  // 从路由参数中获取广告配置
  const adConfig = route.params?.adConfig as AdConfig | null;

  return (
    <SplashPage
      navigation={navigation}
      adImageUrl={adConfig?.imageUrl}
      displayDuration={adConfig?.duration || 3}
      showSkipButton={adConfig?.skipConfig?.enabled || true}
      skipButtonDelay={adConfig?.skipConfig?.delay || 1}
    />
  );
};

// 主要的Tab导航组件
const MainTabsScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState<TabScreens>('Home');


  const handleTabPress = (key: string) => {
    setActiveTab(key as TabScreens);
  };

  const renderCurrentScreen = () => {
    switch (activeTab) {
      case 'Home':
        return <HomePage navigation={navigation} route={{ key: 'Home', name: 'Home' as any }} />;
      case 'Mine':
        return <MinePage navigation={navigation} route={{ key: 'Mine', name: 'Mine' as any }} />;
      default:
        return <HomePage navigation={navigation} route={{ key: 'Home', name: 'Home' as any }} />;
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {renderCurrentScreen()}
      </View>
      <TabBar
        items={defaultTabItems}
        activeKey={activeTab}
        onTabPress={handleTabPress}
        backgroundColor="#ffffff"
        defaultActiveColor="#3498db"
        defaultInactiveColor="#7f8c8d"
      />
    </View>
  );
};

const AppNavigator: React.FC<AppNavigatorProps> = ({ initialRoute, hasNetwork, adConfig }) => {
  return (
    <NavigationContainer
      onReady={() => {
        // 不在这里关闭启动屏，让目标页面自己控制关闭时机
      }}
    >
      <Stack.Navigator 
        screenOptions={{ headerShown: false }}
        initialRouteName={initialRoute}
      >
        <Stack.Screen 
          name="Splash" 
          component={SplashScreenWrapper}
          initialParams={{ adConfig }}
        />
        <Stack.Screen name="MainTabs" component={MainTabsScreen} />
        <Stack.Screen name="Details" component={DetailsPage} />
        <Stack.Screen 
          name="Login" 
          component={LoginPage}
          options={{
            headerShown: true,
            title: '登录',
            headerStyle: { backgroundColor: '#f8f9fa' },
            headerTitleStyle: { color: '#2c3e50' },
            headerTintColor: '#3498db',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// 为了类型兼容性，扩展类型定义
export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

// 为Tab页面提供的props类型
export type TabScreenProps = {
  navigation: any;
  route: any;
};

export default AppNavigator; 