import React, { useState } from 'react';
import { View, Text, Button, Alert, ScrollView, StyleSheet } from 'react-native';
import { useHttpClient } from '../utils/axios';

// 示例数据类型
interface UserProfile {
  id: string;
  name: string;
  email: string;
}

interface ApiListResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * HTTP客户端Hook使用示例
 * 展示如何使用useHttpClient进行各种API调用
 */
export function HttpClientExample() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  // 使用HTTP客户端Hook
  const {
    get,
    post,
    put,
    delete: del,
    patch,
    upload,
    isAuthenticated,
    userInfo,
  } = useHttpClient({
    baseURL: 'http://localhost:3000/api',
    timeout: 15000,
    onError: (message: string) => {
      Alert.alert('请求错误', message);
    },
  });

  // 显示结果
  const showResult = (title: string, data: any) => {
    setResult(`${title}:\n${JSON.stringify(data, null, 2)}`);
  };

  // GET请求示例
  const handleGetExample = async () => {
    try {
      setLoading(true);
      const response = await get<ApiListResponse<UserProfile>>('/users', {
        retry: 2,
        retryDelay: 1000,
      });
      showResult('GET请求结果', response);
    } catch (error) {
      console.error('GET请求失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // POST请求示例
  const handlePostExample = async () => {
    try {
      setLoading(true);
      const userData = {
        name: '张三',
        email: 'zhangsan@example.com',
        phone: '13800138000',
      };
      
      const response = await post<UserProfile>('/users', userData, {
        silent: false, // 显示错误提示
      });
      showResult('POST请求结果', response);
    } catch (error) {
      console.error('POST请求失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // PUT请求示例
  const handlePutExample = async () => {
    try {
      setLoading(true);
      const updateData = {
        name: '李四',
        email: 'lisi@example.com',
      };
      
      const response = await put<UserProfile>('/users/123', updateData);
      showResult('PUT请求结果', response);
    } catch (error) {
      console.error('PUT请求失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // DELETE请求示例
  const handleDeleteExample = async () => {
    try {
      setLoading(true);
      const response = await del('/users/123', {
        retry: 1,
      });
      showResult('DELETE请求结果', response);
    } catch (error) {
      console.error('DELETE请求失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // PATCH请求示例
  const handlePatchExample = async () => {
    try {
      setLoading(true);
      const patchData = {
        name: '王五',
      };
      
      const response = await patch<UserProfile>('/users/123', patchData);
      showResult('PATCH请求结果', response);
    } catch (error) {
      console.error('PATCH请求失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 文件上传示例
  const handleUploadExample = async () => {
    try {
      setLoading(true);
      // 在实际应用中，这里应该是从图片选择器获取的URI
      const fileUri = 'file://path/to/image.jpg';
      
      const response = await upload('/upload', fileUri, {
        name: 'avatar.jpg',
        type: 'image/jpeg',
        onUploadProgress: (progressEvent: any) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log(`上传进度: ${percentCompleted}%`);
        },
      });
      showResult('文件上传结果', response);
    } catch (error) {
      console.error('文件上传失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 带重试的请求示例
  const handleRetryExample = async () => {
    try {
      setLoading(true);
      const response = await get('/unreliable-endpoint', {
        retry: 3,
        retryDelay: 2000,
        retryCondition: (error) => {
          // 自定义重试条件
          return error.response?.status === 500 || !error.response;
        },
      });
      showResult('重试请求结果', response);
    } catch (error) {
      console.error('重试请求失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 静默请求示例（不显示错误提示）
  const handleSilentExample = async () => {
    try {
      setLoading(true);
      const response = await get('/may-fail-endpoint', {
        silent: true, // 静默模式，不显示错误提示
      });
      showResult('静默请求结果', response);
    } catch (error) {
      // 静默处理错误
      console.log('静默请求失败，但不会显示错误提示');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>HTTP客户端Hook使用示例</Text>
      
      {/* 用户状态显示 */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusTitle}>用户状态:</Text>
        <Text style={styles.statusText}>
          已认证: {isAuthenticated ? '是' : '否'}
        </Text>
        {userInfo && (
          <Text style={styles.statusText}>
            用户: {userInfo.username} ({userInfo.email})
          </Text>
        )}
      </View>

      {/* 请求示例按钮 */}
      <View style={styles.buttonContainer}>
        <Button
          title="GET请求示例"
          onPress={handleGetExample}
          disabled={loading}
        />
        <Button
          title="POST请求示例"
          onPress={handlePostExample}
          disabled={loading}
        />
        <Button
          title="PUT请求示例"
          onPress={handlePutExample}
          disabled={loading}
        />
        <Button
          title="DELETE请求示例"
          onPress={handleDeleteExample}
          disabled={loading}
        />
        <Button
          title="PATCH请求示例"
          onPress={handlePatchExample}
          disabled={loading}
        />
        <Button
          title="文件上传示例"
          onPress={handleUploadExample}
          disabled={loading}
        />
        <Button
          title="重试请求示例"
          onPress={handleRetryExample}
          disabled={loading}
        />
        <Button
          title="静默请求示例"
          onPress={handleSilentExample}
          disabled={loading}
        />
      </View>

      {/* 加载状态 */}
      {loading && (
        <Text style={styles.loadingText}>请求中...</Text>
      )}

      {/* 结果显示 */}
      {result && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>请求结果:</Text>
          <Text style={styles.resultText}>{result}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  statusContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 20,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 20,
  },
  resultContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  resultText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    backgroundColor: '#f8f8f8',
    padding: 8,
    borderRadius: 4,
  },
});

export default HttpClientExample; 