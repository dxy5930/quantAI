import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export interface TabBarItem {
  key: string;
  title: string;
  // 图标支持两种状态
  icon: {
    active: string;   // 已点击状态的图标
    inactive: string; // 未点击状态的图标
  };
  // 文字颜色支持两种状态
  textColor?: {
    active: string;   // 已点击状态的文字颜色
    inactive: string; // 未点击状态的文字颜色
  };
  badge?: number;
}

interface TabBarProps {
  items: TabBarItem[];
  activeKey: string;
  onTabPress: (key: string) => void;
  backgroundColor?: string;
  // 全局默认颜色（如果单个item没有设置textColor时使用）
  defaultActiveColor?: string;
  defaultInactiveColor?: string;
  style?: any;
}

const TabBar: React.FC<TabBarProps> = ({
  items,
  activeKey,
  onTabPress,
  backgroundColor = '#ffffff',
  defaultActiveColor = '#3498db',
  defaultInactiveColor = '#7f8c8d',
  style
}) => {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor }, style]} edges={['bottom']}>
      <View style={styles.tabContainer}>
        {items.map((item) => {
          const isActive = item.key === activeKey;
          
          // 确定当前状态的图标
          const currentIcon = isActive ? item.icon.active : item.icon.inactive;
          
          // 确定当前状态的文字颜色（优先使用item自定义颜色，否则使用全局默认颜色）
          const currentTextColor = isActive 
            ? (item.textColor?.active || defaultActiveColor)
            : (item.textColor?.inactive || defaultInactiveColor);
          
          return (
            <TouchableOpacity
              key={item.key}
              style={styles.tabItem}
              onPress={() => onTabPress(item.key)}
              activeOpacity={1}
            >
              <View style={styles.tabContent}>
                <Text style={[
                  styles.tabIcon,
                  { color: currentTextColor }
                ]}>
                  {currentIcon}
                </Text>
                
                <Text style={[
                  styles.tabTitle,
                  { color: currentTextColor }
                ]}>
                  {item.title}
                </Text>
                
                {item.badge && item.badge > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {item.badge > 99 ? '99+' : item.badge}
                    </Text>
                  </View>
                )}
              </View>
              
              {/* {isActive && (
                <View style={[
                  styles.activeIndicator, 
                  { backgroundColor: item.textColor?.active || defaultActiveColor }
                ]} />
              )} */}
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    width: '100%',
  },
  tabContainer: {
    flexDirection: 'row',
    height: 60,
    width: '100%',
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  tabTitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -12,
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    height: 3,
    width: 30,
    borderRadius: 2,
  },
});

export default TabBar; 