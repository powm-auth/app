import { powmColors } from '@/theme/powm-tokens';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

/**
 * Root Layout - Powm App
 *
 * Configures the navigation stack for Powm.
 * All screens have headers hidden (using custom headers in screens).
 */
export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: powmColors.mainBackground,
          },
          // Animation horizontale au lieu du fade
          animation: 'slide_from_right',
          gestureEnabled: true,
          gestureDirection: 'horizontal',
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
          }}
        />
      </Stack>
    </>
  );
}
