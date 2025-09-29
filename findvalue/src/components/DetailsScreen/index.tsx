import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import type { RootScreenProps } from '../../router';
import { createStyle } from '../../utils/scale';

const DetailsScreen = ({ navigation, route }: RootScreenProps<'Details'>) => {
  const from = route.params?.from ?? '未知';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>详情页</Text>
      <Text style={styles.content}>来自：{from}</Text>
      <View style={styles.spacer} />
      <Button title="返回" onPress={() => navigation.goBack()} />
    </View>
  );
};

const styles = createStyle({
  container: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 16 },
  content: { fontSize: 16 },
  spacer: { height: 24 },
});

export default DetailsScreen; 