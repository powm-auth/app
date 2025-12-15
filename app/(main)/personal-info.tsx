import {
  AnimatedEntry,
  BackgroundImage,
  Button,
  GlassCard,
  PowmText,
  ScreenHeader
} from '@/components';
import { getAttributeDisplayName, sortAttributeKeys } from '@/services/wallet-service';
import { loadWallet } from '@/services/wallet-storage';
import { powmColors, powmSpacing } from '@/theme/powm-tokens';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const InfoItem = ({ label, value, index }: { label: string; value: string; index: number }) => {
  return (
    <AnimatedEntry index={index} slideDistance={20}>
      <View style={styles.infoItem}>
        <PowmText variant="text" color={powmColors.inactive} style={{ fontSize: 13, marginBottom: 4 }}>
          {getAttributeDisplayName(label)}
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
  const [attributes, setAttributes] = useState<Record<string, { value: string; salt: string }> | null>(null);

  useEffect(() => {
    loadWallet().then(wallet => {
      if (wallet) {
        setAttributes(wallet.attributes);
      }
    });
  }, []);

  const sortedKeys = attributes ? sortAttributeKeys(Object.keys(attributes)) : [];

  const handleRefreshAge = () => {
    Alert.alert(
      "Refresh Age Attributes?",
      "This will check if you now meet new age requirements (like 18+ or 21+).\n\n" +
      "To do this, your Date of Birth will be securely sent to the Powm server for verification.\n\n" +
      "• The server verifies your DOB\n" +
      "• Calculates your current age\n" +
      "• Updates your age flags (e.g., \"Age Over 18: Yes\")\n" +
      "• Returns the signed update to your wallet\n\n" +
      "Your DOB is processed only for this calculation and is not stored.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Refresh",
          onPress: () => {
            // TODO: Implement age refresh logic
            console.log("Refresh age clicked");
          }
        }
      ]
    );
  };

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
          <ScreenHeader title="Identity" />

          <PowmText variant="text" color={powmColors.inactive} align="center" style={{ marginBottom: powmSpacing.xl }}>
            This information is what's stored inside your local Powm identity wallet.
          </PowmText>

          {attributes && sortedKeys.length > 0 ? (
            <GlassCard style={{ marginBottom: powmSpacing.xl }}>
              {sortedKeys.map((key, index) => (
                <React.Fragment key={key}>
                  <InfoItem label={key} value={attributes[key].value} index={index} />
                  {index < sortedKeys.length - 1 && <View style={styles.separator} />}
                </React.Fragment>
              ))}
            </GlassCard>
          ) : (
            <GlassCard style={{ marginBottom: powmSpacing.xl, alignItems: 'center', padding: powmSpacing.xl }}>
              <PowmText variant="text" color={powmColors.inactive}>
                No identity attributes found.
              </PowmText>
            </GlassCard>
          )}

          <Button
            title="Scan new document"
            icon="qrcode"
            onPress={() => router.push('/scan-document')}
          />

          <View style={{ height: powmSpacing.md }} />

          <Button
            title="Refresh Age Attributes"
            icon="candle"
            variant="secondary"
            onPress={handleRefreshAge}
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
