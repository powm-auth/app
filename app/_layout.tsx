import { powmColors } from '@/theme/powm-tokens';
import { Buffer } from 'buffer';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, View } from 'react-native';

// Setup global Buffer polyfill
global.Buffer = Buffer;

// Global JS error & unhandled promise rejection handlers (diagnostic)
// This helps capture errors like "Unable to activate keep awake" without crashing the app
if (typeof (global as any).onunhandledrejection === 'undefined') {
  (global as any).onunhandledrejection = (event: any) => {
    try {
      // eslint-disable-next-line no-console
      console.warn('[Global] UnhandledPromiseRejection:', event?.reason ?? event);
    } catch (e) {
      // swallow
    }
  };
}

if ((global as any).ErrorUtils && (global as any).ErrorUtils.setGlobalHandler) {
  const prevHandler = (global as any).ErrorUtils.getGlobalHandler && (global as any).ErrorUtils.getGlobalHandler();
  (global as any).ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
    try {
      // eslint-disable-next-line no-console
      console.error('[Global] UncaughtJSError', { error, isFatal });
    } catch (e) {
      // ignore
    }
    if (prevHandler) {
      try {
        prevHandler(error, isFatal);
      } catch (e) {
        // ignore
      }
    }
  });
}

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <View style={styles.container}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: powmColors.mainBackground,
            },
            gestureEnabled: false,
            animation: 'fade',
          }}
        >
          <Stack.Screen name="startup" options={{ animation: 'fade' }} />
          <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
          <Stack.Screen name="(main)" options={{ headerShown: false }} />
        </Stack>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: powmColors.mainBackground,
  },
});
