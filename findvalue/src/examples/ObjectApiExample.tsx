import React, { useState, useEffect } from 'react';
import { View, Text, Button, ScrollView, StyleSheet, Alert, TextInput } from 'react-native';
import { useObjectApi, BizObject } from '../api/mine/objectApi';

/**
 * 对象API使用示例
 * 展示如何使用封装的对象API进行各种操作
 */
export function ObjectApiExample() {
  const [loading, setLoading] = useState(false);
  const [objects, setObjects] = useState<BizObject[]>([]);
  const [selectedObject, setSelectedObject] = useState<BizObject | null>(null);
  const [objectCode, setObjectCode] = useState('user_profile');
  const [searchKeyword, setSearchKeyword] = useState('');

  // 使用对象API Hook
  const {
    getSingleBizObject,
    getBizObjectList,
    createBizObject,
    updateBizObject,
    deleteBizObject,
    getObjectMetadata,
    getBatchBizObjects,
    searchBizObjects,
    copyBizObject,
    exportBizObject,
    importBizObject,
  } = useObjectApi();

  // 页面加载时获取对象列表
  useEffect(() => {
    handleGetObjectList();
  }, []);

  // 获取单个业务对象
  const handleGetSingleObject = async () => {
    if (!objectCode.trim()) {
      Alert.alert('提示', '请输入对象代码');
      return;
    }

    try {
      setLoading(true);
      const object = await getSingleBizObject(objectCode);
      setSelectedObject(object);
      Alert.alert('成功', '获取对象成功');
    } catch (error) {
      console.error('获取对象失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取对象列表
  const handleGetObjectList = async () => {
    try {
      setLoading(true);
      const result = await getBizObjectList({
        page: 1,
        pageSize: 20,
      });
      setObjects(result.items);
    } catch (error) {
      console.error('获取对象列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 创建新对象
  const handleCreateObject = async () => {
    try {
      setLoading(true);
      const newObject = await createBizObject({
        code: `new_object_${Date.now()}`,
        name: '新建对象',
        type: 'custom',
        status: 'active',
        metadata: {
          description: '通过API创建的对象',
          category: 'test',
        },
      });
      
      // 刷新列表
      await handleGetObjectList();
      Alert.alert('成功', `创建对象成功: ${newObject.name}`);
    } catch (error) {
      console.error('创建对象失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 更新对象
  const handleUpdateObject = async () => {
    if (!selectedObject) {
      Alert.alert('提示', '请先选择一个对象');
      return;
    }

    try {
      setLoading(true);
      const updatedObject = await updateBizObject(selectedObject.code, {
        name: `${selectedObject.name} (已更新)`,
        metadata: {
          ...selectedObject.metadata,
          lastUpdated: new Date().toISOString(),
        },
      });
      
      setSelectedObject(updatedObject);
      await handleGetObjectList();
      Alert.alert('成功', '对象更新成功');
    } catch (error) {
      console.error('更新对象失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 删除对象
  const handleDeleteObject = async () => {
    if (!selectedObject) {
      Alert.alert('提示', '请先选择一个对象');
      return;
    }

    Alert.alert(
      '确认删除',
      `确定要删除对象 "${selectedObject.name}" 吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteBizObject(selectedObject.code);
              setSelectedObject(null);
              await handleGetObjectList();
              Alert.alert('成功', '对象删除成功');
            } catch (error) {
              console.error('删除对象失败:', error);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // 获取对象元数据
  const handleGetMetadata = async () => {
    if (!selectedObject) {
      Alert.alert('提示', '请先选择一个对象');
      return;
    }

    try {
      setLoading(true);
      const metadata = await getObjectMetadata(selectedObject.code);
      Alert.alert(
        '对象元数据',
        `字段数量: ${metadata.fields.length}\n关系数量: ${metadata.relations.length}\n权限: ${JSON.stringify(metadata.permissions)}`
      );
    } catch (error) {
      console.error('获取元数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 搜索对象
  const handleSearchObjects = async () => {
    if (!searchKeyword.trim()) {
      Alert.alert('提示', '请输入搜索关键词');
      return;
    }

    try {
      setLoading(true);
      const searchResults = await searchBizObjects(searchKeyword, {
        type: 'custom',
        status: 'active',
      });
      setObjects(searchResults);
      Alert.alert('搜索完成', `找到 ${searchResults.length} 个对象`);
    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 复制对象
  const handleCopyObject = async () => {
    if (!selectedObject) {
      Alert.alert('提示', '请先选择一个对象');
      return;
    }

    try {
      setLoading(true);
      const copiedObject = await copyBizObject(
        selectedObject.code,
        `${selectedObject.code}_copy_${Date.now()}`,
        `${selectedObject.name} (副本)`
      );
      
      await handleGetObjectList();
      Alert.alert('成功', `对象复制成功: ${copiedObject.name}`);
    } catch (error) {
      console.error('复制对象失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 导出对象
  const handleExportObject = async () => {
    if (!selectedObject) {
      Alert.alert('提示', '请先选择一个对象');
      return;
    }

    try {
      setLoading(true);
      const downloadUrl = await exportBizObject(selectedObject.code, 'json');
      Alert.alert('导出成功', `下载链接: ${downloadUrl}`);
    } catch (error) {
      console.error('导出对象失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 批量获取对象
  const handleBatchGet = async () => {
    if (objects.length === 0) {
      Alert.alert('提示', '没有可用的对象代码');
      return;
    }

    try {
      setLoading(true);
      const objectCodes = objects.slice(0, 3).map(obj => obj.code);
      const batchResults = await getBatchBizObjects(objectCodes);
      Alert.alert('批量获取完成', `获取了 ${batchResults.length} 个对象`);
    } catch (error) {
      console.error('批量获取失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>对象API使用示例</Text>

      {/* 输入区域 */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="对象代码 (如: user_profile)"
          value={objectCode}
          onChangeText={setObjectCode}
        />
        <TextInput
          style={styles.input}
          placeholder="搜索关键词"
          value={searchKeyword}
          onChangeText={setSearchKeyword}
        />
      </View>

      {/* 选中的对象信息 */}
      {selectedObject && (
        <View style={styles.selectedObjectContainer}>
          <Text style={styles.selectedObjectTitle}>选中的对象:</Text>
          <Text style={styles.selectedObjectText}>
            名称: {selectedObject.name}
          </Text>
          <Text style={styles.selectedObjectText}>
            代码: {selectedObject.code}
          </Text>
          <Text style={styles.selectedObjectText}>
            类型: {selectedObject.type}
          </Text>
          <Text style={styles.selectedObjectText}>
            状态: {selectedObject.status}
          </Text>
        </View>
      )}

      {/* 操作按钮 */}
      <View style={styles.buttonContainer}>
        <Button
          title="获取单个对象"
          onPress={handleGetSingleObject}
          disabled={loading}
        />
        <Button
          title="刷新对象列表"
          onPress={handleGetObjectList}
          disabled={loading}
        />
        <Button
          title="创建新对象"
          onPress={handleCreateObject}
          disabled={loading}
        />
        <Button
          title="更新对象"
          onPress={handleUpdateObject}
          disabled={loading || !selectedObject}
        />
        <Button
          title="删除对象"
          onPress={handleDeleteObject}
          disabled={loading || !selectedObject}
          color="#FF3B30"
        />
        <Button
          title="获取元数据"
          onPress={handleGetMetadata}
          disabled={loading || !selectedObject}
        />
        <Button
          title="搜索对象"
          onPress={handleSearchObjects}
          disabled={loading}
        />
        <Button
          title="复制对象"
          onPress={handleCopyObject}
          disabled={loading || !selectedObject}
        />
        <Button
          title="导出对象"
          onPress={handleExportObject}
          disabled={loading || !selectedObject}
        />
        <Button
          title="批量获取"
          onPress={handleBatchGet}
          disabled={loading || objects.length === 0}
        />
      </View>

      {/* 加载状态 */}
      {loading && (
        <Text style={styles.loadingText}>处理中...</Text>
      )}

      {/* 对象列表 */}
      <View style={styles.objectListContainer}>
        <Text style={styles.objectListTitle}>对象列表 ({objects.length}):</Text>
        {objects.map((object, index) => (
          <View
            key={object.id || index}
            style={[
              styles.objectItem,
              selectedObject?.id === object.id && styles.selectedObjectItem,
            ]}
          >
            <Text
              style={styles.objectItemText}
              onPress={() => setSelectedObject(object)}
            >
              {object.name} ({object.code})
            </Text>
            <Text style={styles.objectItemType}>{object.type}</Text>
          </View>
        ))}
      </View>
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
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  selectedObjectContainer: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  selectedObjectTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1976D2',
  },
  selectedObjectText: {
    fontSize: 14,
    color: '#555',
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
  objectListContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  objectListTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  objectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  selectedObjectItem: {
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  objectItemText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  objectItemType: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
});

export default ObjectApiExample; 