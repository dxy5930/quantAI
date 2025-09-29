import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { observer } from 'mobx-react-lite';
import { useStore } from '../../store';
import type { TabScreenProps } from '../../router';
// import { createStyle } from '../../utils/scale';

const ProfilePageBase = ({ navigation }: TabScreenProps) => {
  const { counterStore } = useStore();

  const menuItems = [
    { icon: '⚙️', title: '设置', action: () => navigation.navigate('Details', { from: 'Profile-Settings' }) },
    { icon: '📊', title: '统计', action: () => navigation.navigate('Details', { from: 'Profile-Stats' }) },
    { icon: '🔔', title: '通知', badge: 3, action: () => navigation.navigate('Details', { from: 'Profile-Notifications' }) },
    { icon: '❓', title: '帮助', action: () => navigation.navigate('Details', { from: 'Profile-Help' }) },
    { icon: '📞', title: '联系我们', action: () => navigation.navigate('Details', { from: 'Profile-Contact' }) },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* 用户信息区域 */}
      <View style={styles.userSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>👤</Text>
        </View>
        <Text style={styles.userName}>FindValue 用户</Text>
        <Text style={styles.userInfo}>当前计数值：{counterStore.value}</Text>
      </View>

      {/* 统计卡片 */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{Math.abs(counterStore.value)}</Text>
          <Text style={styles.statLabel}>总操作数</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{counterStore.isPositive ? '正数' : '负数'}</Text>
          <Text style={styles.statLabel}>当前状态</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>100%</Text>
          <Text style={styles.statLabel}>使用率</Text>
        </View>
      </View>

      {/* 菜单项 */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>功能菜单</Text>
        {menuItems.map((item, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.menuItem}
            onPress={item.action}
          >
            <View style={styles.menuLeft}>
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuTitle}>{item.title}</Text>
            </View>
            <View style={styles.menuRight}>
              {item.badge && (
                <View style={styles.menuBadge}>
                  <Text style={styles.menuBadgeText}>{item.badge}</Text>
                </View>
              )}
              <Text style={styles.menuArrow}>›</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* 底部信息 */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>FindValue v1.0.0</Text>
        <Text style={styles.footerText}>让计数变得更有价值</Text>
      </View>
    </ScrollView>
  );
};

const ProfilePage = observer(ProfilePageBase);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  userSection: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#ffffff',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3498db',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    color: '#ffffff',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 8,
  },
  userInfo: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
    marginHorizontal: 4,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  menuSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuTitle: {
    fontSize: 16,
    color: '#2c3e50',
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuBadge: {
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  menuBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  menuArrow: {
    fontSize: 20,
    color: '#bdc3c7',
  },
  footer: {
    alignItems: 'center',
    padding: 32,
  },
  footerText: {
    fontSize: 14,
    color: '#bdc3c7',
    marginBottom: 4,
  },
});

export default ProfilePage; 