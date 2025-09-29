import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, ScrollView} from 'react-native';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import {observer} from 'mobx-react-lite';
import {useStore} from '../../store';
import type {TabScreenProps} from '../../router';
// import { createStyle } from '../../utils/scale';

const HomePageBase = ({navigation}: TabScreenProps) => {
  const {counterStore} = useStore();

  // 双击手势 - 页面特定功能
  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onStart(() => {
      counterStore.increment(10);
    });

  // 长按手势 - 页面特定功能
  const longPress = Gesture.LongPress()
    .minDuration(800)
    .onStart(() => {
      counterStore.reset();
    });

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>FindValue</Text>

      <GestureDetector gesture={doubleTap}>
        <View style={styles.counterContainer}>
          <Text style={styles.counter}>计数：{counterStore.value}</Text>
          <Text style={styles.hint}>双击 +10</Text>
        </View>
      </GestureDetector>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => counterStore.increment(1)}>
          <Text style={styles.buttonText}>+</Text>
        </TouchableOpacity>

        <View style={styles.spacer} />

        <TouchableOpacity
          style={styles.button}
          onPress={() => counterStore.decrement(1)}>
          <Text style={styles.buttonText}>-</Text>
        </TouchableOpacity>
      </View>

      <GestureDetector gesture={longPress}>
        <View style={styles.resetContainer}>
          <Text style={styles.resetText}>长按重置</Text>
        </View>
      </GestureDetector>

      <View style={styles.spacerLarge} />

      <TouchableOpacity
        style={styles.navigateButton}
        onPress={() => navigation.navigate('Details', {from: 'Home'})}>
        <Text style={styles.navigateButtonText}>去详情页</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.navigateButton}
        onPress={() => navigation.navigate('Details', {from: 'Home'})}>
        <Text style={styles.navigateButtonText}>去详情页</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.navigateButton}
        onPress={() => navigation.navigate('Details', {from: 'Home'})}>
        <Text style={styles.navigateButtonText}>去详情页</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.navigateButton}
        onPress={() => navigation.navigate('Details', {from: 'Home'})}>
        <Text style={styles.navigateButtonText}>去详情页</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.navigateButton}
        onPress={() => navigation.navigate('Details', {from: 'Home'})}>
        <Text style={styles.navigateButtonText}>去详情页2</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const HomePage = observer(HomePageBase);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 64,
    fontWeight: '700',
    marginBottom: 32,
    color: '#2c3e50',
  },
  counterContainer: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  counter: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2c3e50',
  },
  hint: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#3498db',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
  },
  spacer: {
    width: 32,
  },
  resetContainer: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  resetText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  spacerLarge: {
    height: 32,
  },
  navigateButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    width: "auto"
  },
  navigateButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default HomePage;
