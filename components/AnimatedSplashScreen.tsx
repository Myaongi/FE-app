import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

// Prevent native splash screen from autohiding
SplashScreen.preventAutoHideAsync();

interface AnimatedSplashScreenProps {
  children: React.ReactNode;
}

export default function AnimatedSplashScreen({ children }: AnimatedSplashScreenProps) {
  const [isSplashAnimationComplete, setSplashAnimationComplete] = useState(false);

  useEffect(() => {
    // This timeout simulates the GIF animation duration.
    // Adjust the duration (in milliseconds) to match your GIF.
    const animationTimer = setTimeout(() => {
      setSplashAnimationComplete(true);
    }, 3000); // 3 seconds

    return () => clearTimeout(animationTimer);
  }, []);

  useEffect(() => {
    async function hideSplash() {
      if (isSplashAnimationComplete) {
        await SplashScreen.hideAsync();
      }
    }
    hideSplash();
  }, [isSplashAnimationComplete]);

  if (!isSplashAnimationComplete) {
    return (
      <View style={styles.container}>
        <Image
          source={require('../assets/images/splash.gif')}
          style={styles.gif}
        />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF3B1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gif: {
    width: 200, // Adjust width as needed
    height: 200, // Adjust height as needed
  },
});
