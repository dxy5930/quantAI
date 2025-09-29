import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import { useStore } from '../../store';
import type { TabScreenProps } from '../../router';
import { createStyle } from '../../utils/scale';

const HomeScreenBase = ({ navigation }: TabScreenProps) => {
  const { counterStore } = useStore();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FindValue</Text>
      <Text style={styles.counter}>计数：{counterStore.value}</Text>

      <View style={styles.actions}>
        <Button title="+" onPress={() => counterStore.increment(1)} />
        <View style={styles.spacer} />
        <Button title="-" onPress={() => counterStore.decrement(1)} />
      </View>

      <View style={styles.spacerLarge} />
      <Button title="去详情" onPress={() => navigation.navigate('Details', { from: 'Home' })} />
    </View>
  );
};

const HomeScreen = observer(HomeScreenBase);

const styles = createStyle({
  container: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 16 },
  counter: { fontSize: 18 },
  actions: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  spacer: { width: 16 },
  spacerLarge: { height: 24 },
});

export default HomeScreen; 