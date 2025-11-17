import React, { useEffect, useState, useCallback } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

interface AnimatedSplashScreenProps {
  children: React.ReactNode;
}

export default function AnimatedSplashScreen({ children }: AnimatedSplashScreenProps) {
  const [isAppReady, setAppReady] = useState(false);

  useEffect(() => {
    async function prepare() {

      await SplashScreen.hideAsync();
      

      const animationTimer = setTimeout(() => {
        setAppReady(true);
      }, 3000); 

      return () => clearTimeout(animationTimer);
    }

    prepare();
  }, []);

  if (!isAppReady) {
    return (
      <View style={styles.container}>
        <Image
          source={require('../assets/images/splash.gif')}
          style={styles.gif}
          onLoadEnd={() => console.log('GIF loaded')} 
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
    width: 200,
    height: 200,
  },
});
