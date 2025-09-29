import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  Dimensions,
  StatusBar,
  TouchableOpacity,
  Animated
} from 'react-native';
import SplashScreen from 'react-native-splash-screen';

interface SplashPageProps {
  navigation: any;
  // 全屏广告图片URL
  adImageUrl?: string;
  // 显示时长（秒）
  displayDuration?: number;
  // 跳过按钮配置
  showSkipButton?: boolean;
  skipButtonDelay?: number; // 跳过按钮显示延迟（秒）
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SplashPage: React.FC<SplashPageProps> = ({
  navigation,
  adImageUrl,
  displayDuration = 3,
  showSkipButton = true,
  skipButtonDelay = 1
}) => {
  const [countdown, setCountdown] = useState(displayDuration);
  const [showSkip, setShowSkip] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // 动画值
  const fadeAnim = useState(new Animated.Value(0))[0];
  const skipButtonAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    // 如果没有广告图片URL，延迟跳转避免渲染错误
    if (!adImageUrl) {
      setTimeout(() => {
        navigateToMain();
      }, 0);
      return;
    }

    // 开始倒计时
    const clearCountdown = startCountdown();
    
    // 延迟显示跳过按钮
    const skipTimer = showSkipButton ? setTimeout(() => {
      setShowSkip(true);
      showSkipButtonAnimation();
    }, skipButtonDelay * 1000) : null;
    
    // 清理函数
    return () => {
      if (clearCountdown) clearCountdown();
      if (skipTimer) clearTimeout(skipTimer);
    };
  }, []); // 移除依赖项，只在组件挂载时执行一次



  const startCountdown = () => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeout(() => {
            navigateToMain();
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // 返回清理函数
    return () => clearInterval(timer);
  };

  const showSkipButtonAnimation = () => {
    Animated.timing(skipButtonAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const onImageLoad = () => {
    setImageLoaded(true);
    // 图片加载完成后淡入显示
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const navigateToMain = () => {
    navigation.replace('MainTabs');
  };

  const handleSkip = () => {
    setTimeout(() => {
      navigateToMain();
    }, 0);
  };

  // 如果没有广告图片URL，显示简单加载界面
  if (!adImageUrl) {
    return (
      <View style={styles.container}>
        <StatusBar hidden />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar 
        translucent={true}
        backgroundColor="transparent"
        barStyle="light-content"
        hidden={true}
      />
      
      {/* 全屏广告图片 */}
      <Animated.View style={[styles.imageContainer, { opacity: fadeAnim }]}>
        <Image
          source={{ uri: adImageUrl }}
          style={styles.adImage}
          resizeMode="contain"
          onLoad={onImageLoad}
          onError={(error) => {
            console.log('Ad image load error:', error.nativeEvent.error);
            // 图片加载失败时，设置状态而不是直接导航
            setImageLoaded(false);
            // 使用setTimeout确保在下一个事件循环中执行导航
            setTimeout(() => {
              navigateToMain();
            }, 1000);
          }}
        />
      </Animated.View>

      {/* 跳过按钮和倒计时容器 */}
      <View style={styles.topRightContainer}>
        {/* 倒计时显示 */}
        <Text style={styles.countdownText}>{countdown}s</Text>
        
        {/* 跳过按钮 */}
        {showSkip && (
          <Animated.View 
            style={[
              styles.skipContainer,
              { opacity: skipButtonAnim }
            ]}
          >
            <TouchableOpacity 
              onPress={handleSkip}
              activeOpacity={1}
            >
              <Text style={styles.skipText}>跳过</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      {/* 广告标识 */}
      <View style={styles.adLabelContainer}>
        <Text style={styles.adLabelText}>广告</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  imageContainer: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  adImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  placeholderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#ecf0f1',
  },
  topRightContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 10,
  },
  countdownText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  skipContainer: {
    // 移除位置样式，因为现在在父容器内
  },
  skipText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  adLabelContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  adLabelText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default SplashPage; 