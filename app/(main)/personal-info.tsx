import {
  AnimatedEntry,
  BackgroundImage,
  Button,
  GlassCard,
  PowmText,
  ScreenHeader
} from '@/components';
import { powmColors, powmSpacing } from '@/theme/powm-tokens';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const InfoItem = ({ label, value, index }: { label: string; value: string; index: number }) => {
  return (
    <AnimatedEntry index={index} slideDistance={20}>
      <View style={styles.infoItem}>
        <PowmText variant="text" color={powmColors.inactive} style={{ fontSize: 13, marginBottom: 4 }}>
          {label}
        </PowmText>
        <PowmText variant="subtitleSemiBold" style={{ fontSize: 16 }}>
          {value}
        </PowmText>
      </View>
    </AnimatedEntry>
  );
};

export default function PersonalInfoScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const userInfo = [
    { label: 'First Name', value: 'John' },
    { label: 'Last Name', value: 'Doe' },
    { label: 'Date of Birth', value: '12 / 05 / 1990' },
    { label: 'Nationality', value: 'French' },
    { label: 'Address', value: '123 Avenue des Champs-Élysées, Paris' },
  ];

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
          <ScreenHeader title="Personal Info" />

          <PowmText variant="text" color={powmColors.inactive} align="center" style={{ marginBottom: powmSpacing.xl }}>
            Information extracted from your documents
          </PowmText>

          <GlassCard style={{ marginBottom: powmSpacing.xl }}>
            {userInfo.map((item, index) => (
              <React.Fragment key={item.label}>
                <InfoItem label={item.label} value={item.value} index={index} />
                {index < userInfo.length - 1 && <View style={styles.separator} />}
              </React.Fragment>
            ))}
          </GlassCard>

          <Button
            title="Scan new document"
            icon="qrcode"
            onPress={() => router.push('/scan-document')}
          />

        </ScrollView>
      </View>
    </BackgroundImage>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: powmSpacing.lg },
  infoItem: {
    paddingVertical: 12,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
});
