import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import { UserService, BusinessError } from '../services';
import type { UpdateProfileRequest } from '../services';
import { useUserStore } from '../hooks';

/**
 * 服务使用示例组件
 * 
 * 展示新的 axios + service 架构如何简化错误处理：
 * 1. service 层直接返回业务数据
 * 2. 错误统一在 axios 层处理
 * 3. 组件层只需要关心业务逻辑
 */
const ServiceUsageExampleBase = () => {
  const { userInfo } = useUserStore();
  const [nickname, setNickname] = useState(userInfo?.nickname || '');
  const [email, setEmail] = useState(userInfo?.email || '');
  const [loading, setLoading] = useState(false);

  /**
   * 更新用户资料 - 展示简洁的错误处理
   */
  const handleUpdateProfile = async () => {
    if (!userInfo?.id) {
      Alert.alert('错误', '用户未登录');
      return;
    }

    try {
      setLoading(true);
      
      // 准备更新数据
      const updateData: UpdateProfileRequest = {
        nickname: nickname.trim(),
        email: email.trim(),
      };

      // 调用服务 - 直接拿到数据，无需处理HTTP状态
      const updatedUser = await UserService.updateProfile(userInfo.id, updateData);
      
      // 成功处理
      Alert.alert('成功', '资料更新成功');
      console.log('更新后的用户信息:', updatedUser);
      
    } catch (error) {
      // 错误已经被 axios 层统一处理，这里只需要展示给用户
      if (error instanceof BusinessError) {
        Alert.alert('更新失败', error.message);
      } else {
        Alert.alert('更新失败', '未知错误，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * 获取用户统计 - 展示成功场景的简洁性
   */
  const handleGetUserStats = async () => {
    if (!userInfo?.id) {
      Alert.alert('错误', '用户未登录');
      return;
    }

    try {
      setLoading(true);
      
      // 直接拿到数据，无需判断 response.success
      const stats = await UserService.getUserStats(userInfo.id);
      
      Alert.alert(
        '用户统计', 
        `总登录次数: ${stats.totalLogins}\n` +
        `最后登录: ${stats.lastLoginAt}\n` +
        `账户年龄: ${stats.accountAge} 天\n` +
        `活跃度: ${stats.activityScore}`
      );
      
    } catch (error) {
      if (error instanceof BusinessError) {
        Alert.alert('获取统计失败', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * 修改密码 - 展示复杂业务逻辑的处理
   */
  const handleChangePassword = async () => {
    if (!userInfo?.id) {
      Alert.alert('错误', '用户未登录');
      return;
    }

    // 这里可以弹出一个模态框获取密码信息
    // 为了演示，我们用固定值
    const passwordData = {
      oldPassword: '123456',
      newPassword: '654321',
      confirmPassword: '654321'
    };

    try {
      setLoading(true);
      
      // 调用服务，客户端验证和服务端验证都会在 service 层处理
      await UserService.changePassword(userInfo.id, passwordData);
      
      Alert.alert('成功', '密码修改成功，请重新登录');
      
    } catch (error) {
      if (error instanceof BusinessError) {
        // BusinessError 包含了友好的错误消息
        Alert.alert('密码修改失败', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * 上传头像 - 展示文件上传的处理
   */
  const handleUploadAvatar = async () => {
    if (!userInfo?.id) {
      Alert.alert('错误', '用户未登录');
      return;
    }

    // 这里应该使用图片选择器，为了演示使用固定URI
    const imageUri = 'file://path/to/image.jpg';

    try {
      setLoading(true);
      
      const result = await UserService.uploadAvatar(userInfo.id, imageUri);
      
      Alert.alert('成功', '头像上传成功');
      console.log('新头像地址:', result.avatarUrl);
      
    } catch (error) {
      if (error instanceof BusinessError) {
        Alert.alert('上传失败', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>服务使用示例</Text>
      <Text style={styles.subtitle}>展示新的错误处理架构</Text>

      {/* 用户资料更新 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>更新用户资料</Text>
        
        <TextInput
          style={styles.input}
          placeholder="昵称"
          value={nickname}
          onChangeText={setNickname}
        />
        
        <TextInput
          style={styles.input}
          placeholder="邮箱"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleUpdateProfile}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? '更新中...' : '更新资料'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 其他功能 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>其他功能</Text>
        
        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]}
          onPress={handleGetUserStats}
          disabled={loading}
        >
          <Text style={styles.buttonText}>获取用户统计</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]}
          onPress={handleChangePassword}
          disabled={loading}
        >
          <Text style={styles.buttonText}>修改密码（演示）</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]}
          onPress={handleUploadAvatar}
          disabled={loading}
        >
          <Text style={styles.buttonText}>上传头像（演示）</Text>
        </TouchableOpacity>
      </View>

      {/* 架构说明 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>架构优势</Text>
        <Text style={styles.description}>
          • 错误处理统一在 axios 层{'\n'}
          • Service 层直接返回业务数据{'\n'}
          • 组件层专注业务逻辑{'\n'}
          • BusinessError 包含友好错误消息{'\n'}
          • 代码更简洁，维护性更好
        </Text>
      </View>
    </View>
  );
};

const ServiceUsageExample = observer(ServiceUsageExampleBase);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  secondaryButton: {
    backgroundColor: '#34C759',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default ServiceUsageExample; 