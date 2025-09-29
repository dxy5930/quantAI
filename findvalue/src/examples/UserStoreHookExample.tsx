import React from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { useUserStore, useNavigation } from '../hooks';
import type { LoginData } from '../hooks/useUserStore';

export const UserStoreHookExample: React.FC = () => {
  const userStore = useUserStore();
  const { navigateTo, reLaunch } = useNavigation();

  // 模拟登录数据
  const mockLoginData: LoginData = {
    userInfo: {
      id: '1001',
      username: 'testuser',
      email: 'test@example.com',
      nickname: '测试用户',
      avatar: 'https://example.com/avatar.jpg',
      phone: '13800138000',
      isVip: true,
      level: 5,
    },
    authToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    refreshToken: 'refresh_token_12345',
  };

  // 模拟登录
  const handleLogin = async () => {
    const success = await userStore.login(mockLoginData);
    if (success) {
      Alert.alert('成功', '登录成功！', [
        { text: '确定', onPress: () => navigateTo('Home') }
      ]);
    } else {
      Alert.alert('错误', '登录失败');
    }
  };

  // 登出并返回登录页
  const handleLogout = async () => {
    Alert.alert(
      '确认登出',
      '确定要退出登录吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            const success = await userStore.logout();
            if (success) {
              reLaunch('Login');
              Alert.alert('提示', '已退出登录');
            } else {
              Alert.alert('错误', '登出失败');
            }
          },
        },
      ]
    );
  };

  // 更新用户信息
  const handleUpdateUserInfo = async () => {
    const newInfo = {
      nickname: '新昵称' + Date.now(),
      level: (userStore.userLevel || 0) + 1,
    };

    const success = await userStore.updateUserInfo(newInfo);
    if (success) {
      Alert.alert('成功', '用户信息已更新');
    } else {
      Alert.alert('错误', '更新失败');
    }
  };

  // 切换VIP状态
  const handleToggleVip = async () => {
    const success = await userStore.updateUserInfo({
      isVip: !userStore.isVipUser,
    });
    if (success) {
      Alert.alert('成功', `已${userStore.isVipUser ? '开通' : '取消'}VIP`);
    } else {
      Alert.alert('错误', '操作失败');
    }
  };

  // 更新Token
  const handleUpdateToken = async () => {
    const newToken = 'new_token_' + Date.now();
    const success = await userStore.updateToken(newToken);
    if (success) {
      Alert.alert('成功', 'Token已更新');
    } else {
      Alert.alert('错误', 'Token更新失败');
    }
  };

  if (userStore.isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>加载中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>用户Store Hook示例</Text>

      {/* 错误信息显示 */}
      {userStore.error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{userStore.error.message}</Text>
        </View>
      )}

      {/* 登录状态显示 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>登录状态</Text>
        <Text>认证状态: {userStore.isAuthenticated ? '已登录' : '未登录'}</Text>
        <Text>登录状态: {userStore.isLoggedIn ? '是' : '否'}</Text>
        <Text>Token: {userStore.authToken ? '已设置' : '未设置'}</Text>
      </View>

      {/* 用户信息显示 */}
      {userStore.userInfo && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>用户信息</Text>
          <Text>用户ID: {userStore.userInfo.id}</Text>
          <Text>用户名: {userStore.userInfo.username}</Text>
          <Text>显示名称: {userStore.displayName}</Text>
          <Text>邮箱: {userStore.userInfo.email}</Text>
          <Text>手机: {userStore.userInfo.phone}</Text>
          <Text>VIP状态: {userStore.isVipUser ? 'VIP用户' : '普通用户'}</Text>
          <Text>用户等级: {userStore.userLevel}</Text>
        </View>
      )}

      {/* 操作按钮 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>操作</Text>
        
        {!userStore.isAuthenticated ? (
          <Button title="模拟登录" onPress={handleLogin} />
        ) : (
          <>
            <View style={styles.buttonSpacing}>
              <Button title="更新用户信息" onPress={handleUpdateUserInfo} />
            </View>
            <View style={styles.buttonSpacing}>
              <Button title={`${userStore.isVipUser ? '取消' : '开通'}VIP`} onPress={handleToggleVip} />
            </View>
            <View style={styles.buttonSpacing}>
              <Button title="更新Token" onPress={handleUpdateToken} />
            </View>
            <View style={styles.buttonSpacing}>
              <Button title="登出" onPress={handleLogout} color="#ff4444" />
            </View>
          </>
        )}
      </View>

      {/* 计算属性展示 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hook计算属性</Text>
        <Text>显示名称: {userStore.displayName}</Text>
        <Text>VIP用户: {userStore.isVipUser ? '是' : '否'}</Text>
        <Text>用户等级: {userStore.userLevel}</Text>
        <Text>完整认证: {userStore.isAuthenticated ? '是' : '否'}</Text>
        <Text>加载状态: {userStore.isLoading ? '加载中' : '已完成'}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#495057',
  },
  loading: {
    textAlign: 'center',
    fontSize: 18,
    color: '#6c757d',
  },
  errorContainer: {
    backgroundColor: '#f8d7da',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f5c6cb',
  },
  errorText: {
    color: '#721c24',
  },
  buttonSpacing: {
    marginBottom: 10,
  },
}); 