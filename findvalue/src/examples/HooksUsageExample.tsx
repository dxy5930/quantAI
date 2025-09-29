import React, { useEffect } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { useAsyncStorage, useSimpleStorage, useNavigation, useSimpleNavigation } from '../hooks';

export const HooksUsageExample: React.FC = () => {
  // AsyncStorage hooks 使用示例
  const { data: userInfo, setData: setUserInfo, loading, error } = useAsyncStorage('userInfo', {
    defaultValue: { name: '', email: '' }
  });
  
  // 简化版本的AsyncStorage hook
  const [token, setToken, { loading: tokenLoading }] = useSimpleStorage('authToken', '');
  
  // Navigation hooks 使用示例 (uniapp风格)
  const { navigateTo, redirectTo, reLaunch, switchTab, navigateBack, canGoBack, getCurrentRoute } = useNavigation();
  
  // 简化版本的Navigation hook
  const simpleNav = useSimpleNavigation();

  useEffect(() => {
    console.log('当前路由:', getCurrentRoute());
  }, [getCurrentRoute]);

  const handleSaveUserInfo = async () => {
    const success = await setUserInfo({
      name: '张三',
      email: 'zhangsan@example.com',
    });
    
    if (success) {
      Alert.alert('成功', '用户信息已保存');
    } else {
      Alert.alert('错误', '保存失败');
    }
  };

  const handleSaveToken = async () => {
    const success = await setToken('new_auth_token_123');
    if (success) {
      Alert.alert('成功', 'Token已保存');
    }
  };

  const handleNavigateToDetails = () => {
    navigateTo('Details', { id: '123', title: '详情页面' });
  };

  const handleRedirectToProfile = () => {
    redirectTo('Profile');
  };

  const handleReLaunchToHome = () => {
    reLaunch('Home');
  };

  const handleSwitchToHomeTab = () => {
    switchTab('Home');
  };

  const handleNavigateBack = () => {
    navigateBack(); // 返回上一页
  };

  const handleNavigateBackMultiple = () => {
    navigateBack(2); // 返回2级页面
  };

  if (loading || tokenLoading) {
    return (
      <View style={styles.container}>
        <Text>加载中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hooks 使用示例</Text>
      
      {/* AsyncStorage 示例 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AsyncStorage 示例</Text>
        <Text>用户信息: {JSON.stringify(userInfo)}</Text>
        <Text>Token: {token}</Text>
        {error && <Text style={styles.error}>错误: {error.message}</Text>}
        
        <Button title="保存用户信息" onPress={handleSaveUserInfo} />
        <Button title="保存Token" onPress={handleSaveToken} />
      </View>

      {/* Navigation 示例 (uniapp风格) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Navigation 示例 (uniapp风格)</Text>
        <Text>当前页面: {getCurrentRoute().name}</Text>
        <Text>可以返回: {canGoBack() ? '是' : '否'}</Text>
        
        <Button title="navigateTo - 保留当前页面跳转" onPress={handleNavigateToDetails} />
        <Button title="redirectTo - 关闭当前页面跳转" onPress={handleRedirectToProfile} />
        <Button title="reLaunch - 关闭所有页面跳转" onPress={handleReLaunchToHome} />
        <Button title="switchTab - 切换Tab页面" onPress={handleSwitchToHomeTab} />
        {canGoBack() && <Button title="navigateBack - 返回上一页" onPress={handleNavigateBack} />}
        {canGoBack() && <Button title="navigateBack(2) - 返回2级" onPress={handleNavigateBackMultiple} />}
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
  },
  section: {
    marginBottom: 30,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  error: {
    color: 'red',
    marginVertical: 5,
  },
}); 