import { FootBar } from '@/components';
import { powmColors } from '@/theme/powm-tokens';
import { getCurrentWallet } from '@/wallet/service';
import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

// Shared screen options for DRY configuration
const featureScreenOptions: NativeStackNavigationOptions = {
  animation: 'slide_from_right',
  gestureEnabled: true,
  animationDuration: 200,
};

const modalScreenOptions: NativeStackNavigationOptions = {
  animation: 'slide_from_bottom',
  presentation: 'modal',
  gestureEnabled: true,
  animationDuration: 200,
};

export default function AppLayout() {
  const router = useRouter();

  useEffect(() => {
    // Check if wallet is loaded - if not, immediately restart
    const wallet = getCurrentWallet();
    if (!wallet) {
      console.error('[AppLayout] Wallet not loaded - restarting app');
      router.replace('/startup');
    }
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: powmColors.mainBackground,
            },
            gestureEnabled: false,
            animation: 'fade',
            animationDuration: 150,
          }}
        >
          <Stack.Screen name="home" />
          <Stack.Screen name="history" />
          <Stack.Screen name="profile" />

          {/* Feature Screens */}
          <Stack.Screen name="personal-info" options={featureScreenOptions} />
          <Stack.Screen name="identity-documents" options={featureScreenOptions} />
          <Stack.Screen name="my-data" options={featureScreenOptions} />
          <Stack.Screen name="account" options={featureScreenOptions} />
          <Stack.Screen name="notifications" options={featureScreenOptions} />
          <Stack.Screen name="help" options={featureScreenOptions} />

          {/* Scanners */}
          <Stack.Screen name="scan" options={modalScreenOptions} />
          <Stack.Screen
            name="scan-document"
            options={{
              presentation: 'fullScreenModal',
              gestureEnabled: false,
              animation: 'fade',
              animationDuration: 150,
            }}
          />

          {/* Modals */}
          <Stack.Screen name="provide-identity" options={modalScreenOptions} />
          <Stack.Screen name="request-identity" options={modalScreenOptions} />
        </Stack>
      </View>

      <FootBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: powmColors.mainBackground,
    flexDirection: 'column',
  },
  content: {
    flex: 1,
  },
});
