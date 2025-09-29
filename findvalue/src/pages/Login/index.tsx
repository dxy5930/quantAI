import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { useNavigation } from '../../hooks';
import { LoginService } from '../../services';
import { userStore } from '../../store/userStore';
import type { UserInfo } from '../../types/user';

interface LoginPageProps {
  navigation?: any;
  route?: any;
}

const LoginPageBase: React.FC<LoginPageProps> = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // 直接使用userStore
  const { navigateBack } = useNavigation();

  const handleLogin = async () => {
    // 执行登录流程
    const result = await LoginService.perform(
      { username, password },
      userStore.login,
      setIsLoading
    );

    if (result.success) {
      Alert.alert('登录成功', '欢迎回来！', [
        {
          text: '确定',
          onPress: () => {
            // 登录成功后返回上一页（我的页面）
            navigateBack();
          },
        },
      ]);
    } else {
      Alert.alert('登录失败', result.message || '登录失败');
    }
  };

  const handleQuickLogin = (type: 'demo' | 'vip') => {
    const quickData = LoginService.getQuickData(type);
    setUsername(quickData.username);
    setPassword(quickData.password);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 头部Logo区域 */}
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>🔍</Text>
          </View>
          <Text style={styles.title}>FindValue</Text>
          <Text style={styles.subtitle}>发现价值，成就未来</Text>
        </View>

        {/* 登录表单 */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>用户名</Text>
            <TextInput
              style={styles.input}
              placeholder="请输入用户名"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>密码</Text>
            <TextInput
              style={styles.input}
              placeholder="请输入密码"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.loginButtonText}>登录</Text>
            )}
          </TouchableOpacity>

          {/* 快速登录按钮 */}
          <View style={styles.quickLoginContainer}>
            <Text style={styles.quickLoginTitle}>快速体验：</Text>
            <View style={styles.quickLoginButtons}>
              <TouchableOpacity
                style={styles.quickLoginButton}
                onPress={() => handleQuickLogin('demo')}
                disabled={isLoading}
              >
                <Text style={styles.quickLoginButtonText}>普通用户</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickLoginButton, styles.vipButton]}
                onPress={() => handleQuickLogin('vip')}
                disabled={isLoading}
              >
                <Text style={[styles.quickLoginButtonText, styles.vipButtonText]}>VIP用户</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 底部链接 */}
        <View style={styles.footer}>
          <TouchableOpacity disabled={isLoading}>
            <Text style={styles.footerLink}>忘记密码？</Text>
          </TouchableOpacity>
          <TouchableOpacity disabled={isLoading}>
            <Text style={styles.footerLink}>注册新账号</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3498db',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    color: '#ffffff',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#2c3e50',
  },
  loginButton: {
    height: 52,
    backgroundColor: '#3498db',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  quickLoginContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  quickLoginTitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 12,
  },
  quickLoginButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  quickLoginButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3498db',
    backgroundColor: '#ffffff',
  },
  vipButton: {
    borderColor: '#f39c12',
    backgroundColor: '#fff3cd',
  },
  quickLoginButtonText: {
    fontSize: 12,
    color: '#3498db',
    fontWeight: '500',
  },
  vipButtonText: {
    color: '#f39c12',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLink: {
    fontSize: 14,
    color: '#3498db',
    textDecorationLine: 'underline',
  },
});

const LoginPage = observer(LoginPageBase);

export default LoginPage; 