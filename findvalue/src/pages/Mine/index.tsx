import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { observer } from 'mobx-react-lite';
import { useStore } from '../../store';
import { useNavigation } from '../../hooks';
import { MineService } from '../../services';
import { userStore } from '../../store/userStore';
import type { TabScreenProps } from '../../router';

const MinePageBase = ({ navigation }: TabScreenProps) => {
  const { counterStore } = useStore();
  const { navigateTo } = useNavigation();

  // 获取菜单项
  const loggedInMenuItems = MineService.getLoggedInMenuItems(navigation);
  const guestMenuItems = MineService.getGuestMenuItems(navigation);

  // 处理登录按钮点击
  const handleLoginPress = () => {
    navigateTo('Login');
  };

  // 处理登出
  const handleLogout = async () => {
    await MineService.handleLogout(userStore.logout.bind(userStore));
  };

  // 渲染未登录状态的用户区域
  const renderGuestUserSection = () => (
    <View style={styles.userSection}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>👤</Text>
      </View>
      <Text style={styles.userName}>未登录</Text>
      <Text style={styles.userInfo}>登录后享受更多功能</Text>
      
      <TouchableOpacity 
        style={styles.loginButton}
        onPress={handleLoginPress}
      >
        <Text style={styles.loginButtonText}>立即登录</Text>
      </TouchableOpacity>
    </View>
  );

  // 渲染已登录状态的用户区域
  const renderLoggedInUserSection = () => (
    <View style={styles.userSection}>
      <View style={[styles.avatar, userStore.isVipUser && styles.vipAvatar]}>
        <Text style={styles.avatarText}>
          {userStore.userInfo?.avatar || (userStore.isVipUser ? '👑' : '👤')}
        </Text>
      </View>
      <View style={styles.userNameContainer}>
        <Text style={styles.userName}>{userStore.displayName}</Text>
        {userStore.isVipUser && (
          <View style={styles.vipBadge}>
            <Text style={styles.vipBadgeText}>VIP</Text>
          </View>
        )}
      </View>
      <Text style={styles.userInfo}>
        等级 Lv.{userStore.userLevel} | {userStore.userInfo?.email}
      </Text>
      <Text style={styles.userInfo}>当前计数值：{counterStore.value}</Text>
      
      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutButtonText}>退出登录</Text>
      </TouchableOpacity>
    </View>
  );

  // 渲染登录用户的统计卡片
  const renderStatsCards = () => (
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
        <Text style={styles.statNumber}>{userStore.isVipUser ? 'VIP' : '普通'}</Text>
        <Text style={styles.statLabel}>用户类型</Text>
      </View>
    </View>
  );

  // 渲染菜单项
  const renderMenuItems = (items: any[]) => (
    <View style={styles.menuSection}>
      <Text style={styles.sectionTitle}>功能菜单</Text>
      {items.map((item, index) => {
        // 如果是VIP专属功能且用户不是VIP，则不显示或显示为灰色
        if (item.vipOnly && !userStore.isVipUser && userStore.isAuthenticated) {
          return (
            <TouchableOpacity 
              key={index} 
              style={[styles.menuItem, styles.disabledMenuItem]}
              onPress={() => MineService.handleVipFeatureClick()}
            >
              <View style={styles.menuLeft}>
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <Text style={[styles.menuTitle, styles.disabledMenuTitle]}>{item.title}</Text>
                <View style={styles.vipTag}>
                  <Text style={styles.vipTagText}>VIP</Text>
                </View>
              </View>
              <View style={styles.menuRight}>
                <Text style={styles.menuArrow}>›</Text>
              </View>
            </TouchableOpacity>
          );
        }

        // 跳过VIP专属功能（对于未登录用户）
        if (item.vipOnly && !userStore.isAuthenticated) {
          return null;
        }

        return (
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
        );
      })}
    </View>
  );

  const menuItems = userStore.isAuthenticated ? loggedInMenuItems : guestMenuItems;

  return (
    <ScrollView style={styles.container}>
      {/* 用户信息区域 */}
      {userStore.isAuthenticated ? renderLoggedInUserSection() : renderGuestUserSection()}

      {/* 统计卡片 - 仅登录用户显示 */}
      {userStore.isAuthenticated && renderStatsCards()}

      {/* 菜单项 */}
      {renderMenuItems(menuItems)}

      {/* 底部信息 */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>FindValue v1.0.0</Text>
        <Text style={styles.footerText}>让计数变得更有价值</Text>
        {userStore.isAuthenticated && (
          <Text style={styles.footerText}>
            欢迎回来，{userStore.displayName}！
          </Text>
        )}
      </View>
    </ScrollView>
  );
};

const MinePage = observer(MinePageBase);

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
  vipAvatar: {
    backgroundColor: '#f39c12',
    borderWidth: 3,
    borderColor: '#ffd700',
  },
  avatarText: {
    fontSize: 32,
    color: '#ffffff',
  },
  userNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    marginRight: 8,
  },
  vipBadge: {
    backgroundColor: '#f39c12',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  vipBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  userInfo: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  loginButton: {
    marginTop: 16,
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: '#3498db',
    borderRadius: 25,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  logoutButton: {
    marginTop: 16,
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: '#e74c3c',
    borderRadius: 25,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
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
  disabledMenuItem: {
    opacity: 0.6,
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
  disabledMenuTitle: {
    color: '#bdc3c7',
  },
  vipTag: {
    marginLeft: 8,
    backgroundColor: '#f39c12',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  vipTagText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#ffffff',
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

export default MinePage; 