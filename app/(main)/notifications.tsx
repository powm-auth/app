import {
  BackgroundImage,
  GlassCard,
  ListItem,
  PowmText,
  ScreenHeader,
  Toggle,
} from '@/components';
import { powmColors, powmSpacing } from '@/theme/powm-tokens';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  // Notification State (Mock)
  const [isEnabled, setIsEnabled] = useState(true);

  const toggleSwitch = () => setIsEnabled(previousState => !previousState);

  return (
    <BackgroundImage>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + powmSpacing.lg, paddingBottom: insets.bottom + powmSpacing.xl },
          ]}
        >
          <ScreenHeader title="Notifications" />

          {/* Notification Settings */}
          <GlassCard padding={0}>
            <ListItem 
              title="Push Notifications"
              subtitle="Receive alerts about your activity"
              icon="bell"
              iconColor={powmColors.electricMain}
              rightElement={
                 <Toggle value={isEnabled} onValueChange={toggleSwitch} />
              }
            />
          </GlassCard>

          <PowmText variant="text" color={powmColors.inactive} style={{ marginTop: 16, fontSize: 12, paddingHorizontal: 4 }}>
            Turning this off will disable all push notifications from Powm, including verification requests.
          </PowmText>

        </ScrollView>
      </View>
    </BackgroundImage>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: powmSpacing.lg },
});
