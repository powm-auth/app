import {
  AnimatedEntry,
  BackgroundImage,
  Button,
  GlassCard,
  PowmIcon,
  PowmText,
  ScreenHeader
} from '@/components';
import { powmColors, powmSpacing } from '@/theme/powm-tokens';
import { ATTRIBUTE_DEFINITIONS } from '@/utils/constants';
import { getAttributeDisplayName, refreshAgeAttributes, sortAttributeKeys } from '@/wallet/service';
import { loadWallet } from '@/wallet/storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const InfoItem = ({ label, value, index, onRefresh }: { label: string; value?: string; index: number; onRefresh?: () => void }) => {
  const isPlaceholder = !value;
  return (
    <AnimatedEntry index={index} slideDistance={20}>
      <View style={styles.infoItem}>
        <View style={{ flex: 1 }}>
          <PowmText variant="text" color={powmColors.inactive} style={{ fontSize: 13, marginBottom: 4 }}>
            {getAttributeDisplayName(label)}
          </PowmText>
          <PowmText
            variant="subtitleSemiBold"
            style={{ fontSize: 16, opacity: isPlaceholder ? 0.5 : 1 }}
            color={isPlaceholder ? powmColors.inactive : undefined}
          >
            {value || 'Not provided'}
          </PowmText>
        </View>
        {onRefresh && (
          <TouchableOpacity onPress={onRefresh} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <PowmIcon name="reload" size={20} color={powmColors.electricMain} />
          </TouchableOpacity>
        )}
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

  const sortedKeys = sortAttributeKeys(
    Object.keys(ATTRIBUTE_DEFINITIONS).filter(key => {
      const hasValue = attributes && attributes[key] && attributes[key].value;
      const alwaysShow = ATTRIBUTE_DEFINITIONS[key].alwaysDisplayInSettings;
      return hasValue || alwaysShow;
    })
  );

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
          onPress: async () => {
            try {
              await refreshAgeAttributes();
              // Reload wallet to update UI
              const wallet = await loadWallet();
              if (wallet) {
                setAttributes(wallet.attributes);
              }
              Alert.alert("Success", "Age attributes refreshed successfully.");
            } catch (error) {
              console.error("Failed to refresh age attributes:", error);
              Alert.alert("Error", "Failed to refresh age attributes. Please try again.");
            }
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

          {sortedKeys.length > 0 ? (
            <GlassCard style={{ marginBottom: powmSpacing.xl }}>
              {sortedKeys.map((key, index) => (
                <React.Fragment key={key}>
                  <InfoItem
                    label={key}
                    value={attributes?.[key]?.value}
                    index={index}
                    onRefresh={(key === 'age_over_18' || key === 'age_over_21') ? handleRefreshAge : undefined}
                  />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
});
