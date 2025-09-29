import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { RootScreenProps } from '../../router';
import { createStyle } from '../../utils/scale';

const DetailsPage = ({ navigation, route }: RootScreenProps<'Details'>) => {
  const from = route.params?.from ?? '未知';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>详情页面</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>详情</Text>
        </View>
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.label}>来源页面：</Text>
        <Text style={styles.value}>{from}</Text>
      </View>
      
      <View style={styles.spacer} />
      
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>← 返回</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = createStyle({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 24, 
    alignItems: 'center', 
    justifyContent: 'center'
  },
  header: {
    alignItems: 'center',
    marginBottom: 32
  },
  title: { 
    fontSize: 32, 
    fontWeight: '700', 
    marginBottom: 12,
    color: '#2c3e50'
  },
  badge: {
    backgroundColor: '#3498db',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600'
  },
  infoContainer: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 200
  },
  label: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8
  },
  value: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50'
  },
  spacer: { 
    height: 32 
  },
  backButton: {
    backgroundColor: '#34495e',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600'
  }
});

export default DetailsPage; 