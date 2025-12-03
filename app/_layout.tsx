import { FootBar } from '@/components';
import { powmColors } from '@/theme/powm-tokens';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
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
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="history" />
            <Stack.Screen name="profile" />
            
            {/* Feature Screens */}
            <Stack.Screen 
              name="personal-info" 
              options={{ animation: 'slide_from_right', gestureEnabled: true }} 
            />
            <Stack.Screen 
              name="identity-documents" 
              options={{ animation: 'slide_from_right', gestureEnabled: true }} 
            />
            <Stack.Screen 
              name="my-data" 
              options={{ animation: 'slide_from_right', gestureEnabled: true }} 
            />
            <Stack.Screen 
              name="account" 
              options={{ animation: 'slide_from_right', gestureEnabled: true }} 
            />
            <Stack.Screen 
              name="notifications" 
              options={{ animation: 'slide_from_right', gestureEnabled: true }} 
            />
            {/* ✅ NEW: Help */}
            <Stack.Screen 
              name="help" 
              options={{ animation: 'slide_from_right', gestureEnabled: true }} 
            />

            {/* Scanners */}
            <Stack.Screen 
              name="scan" 
              options={{
                presentation: 'fullScreenModal',
                gestureEnabled: false,
                animation: 'fade',
              }}
            />
            <Stack.Screen 
              name="scan-document" 
              options={{
                presentation: 'fullScreenModal',
                gestureEnabled: false,
                animation: 'fade',
              }}
            />
            
            {/* Modals */}
            <Stack.Screen
              name="create-ticket"
              options={{
                animation: 'slide_from_bottom',
                presentation: 'modal',
                gestureEnabled: true,
              }}
            />
            <Stack.Screen
              name="validate-identity"
              options={{
                animation: 'slide_from_bottom',
                presentation: 'modal',
                gestureEnabled: true,
              }}
            />
          </Stack>
        </View>
        
        <FootBar />
      </View>
    </>
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