import { FootBar } from '@/components/powm';
import { powmColors } from '@/theme/powm-tokens';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { View } from 'react-native';

/**
 * Root Layout - Powm App
 *
 * Configures the navigation stack for Powm.
 * All screens have headers hidden (using custom headers in screens).
 * The FootBar is rendered outside the stack to stay static during page transitions.
 */
export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      {/* Conteneur principal : le stack occupe tout l’espace disponible, le footer reste fixe en dessous */}
      <View style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: powmColors.mainBackground,
            },
            gestureEnabled: false, // Désactive le swipe back pour le fade
            animation: 'fade', // Type d'animation
            animationDuration: 10,
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="history" />
          <Stack.Screen name="profile" />
          <Stack.Screen
            name="create-ticket"
            options={{
              animation: 'slide_from_bottom',
              presentation: 'modal',
              gestureEnabled: true, // On réactive le geste pour la modale
            }}
          />
        </Stack>
        {/* Le footer est en dehors du Stack : il ne bouge plus avec les pages */}
        <FootBar />
      </View>
    </>
  );
}