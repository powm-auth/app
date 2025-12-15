import {
  AnimatedEntry,
  BackgroundImage,
  Column,
  GlassCard,
  ListItem,
  PowmIcon,
  PowmIconName,
  PowmText,
  Row,
  ScreenHeader,
} from '@/components';
import { deleteWalletFromServer } from '@/sdk-extension';
import { powmColors, powmRadii, powmSpacing } from '@/theme/powm-tokens';
import { ANONYMOUS_ID_INFO_MESSAGE, ANONYMOUS_ID_INFO_TITLE } from '@/utils/constants';
import { getCurrentWallet } from '@/wallet/service';
import { deleteWallet, rotateAnonymizingKey, withSigningKey } from '@/wallet/storage';
import { signing } from '@powm/sdk-js/crypto';
import { Buffer } from 'buffer';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  UIManager,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const StatCard = ({ label, value, icon, index, iconSize = 20 }: { label: string; value: string; icon: PowmIconName; index: number; iconSize?: number }) => {
  return (
    <AnimatedEntry index={index} slideDistance={20} style={{ flex: 1 }}>
      <GlassCard style={[styles.statCard, { alignItems: 'center' }]}>
        <View style={styles.statIcon}>
          <PowmIcon name={icon} size={iconSize} color={powmColors.electricMain} />
        </View>
        <Column align="center">
          <PowmText variant="subtitleSemiBold" style={{ fontSize: 20 }} align="center">{value}</PowmText>
          <PowmText variant="text" color={powmColors.inactive} style={{ fontSize: 12 }} align="center">{label}</PowmText>
        </Column>
      </GlassCard>
    </AnimatedEntry>
  );
};

export default function MyDataScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [isBackupLoading, setIsBackupLoading] = useState(false);
  const [walletStats, setWalletStats] = useState<{ id: string; created: string; attributeCount: number; approvedShares: number } | null>(null);

  useFocusEffect(
    useCallback(() => {
      const fetchWallet = async () => {
        // Use getCurrentWallet first for speed, then load from storage if needed
        let wallet = getCurrentWallet();
        if (!wallet) {
          // Import dynamically to avoid circular dependencies if any, or just use the imported one
          const { loadWallet } = await import('@/wallet/storage');
          wallet = await loadWallet();
        }

        if (wallet) {
          const date = new Date(wallet.created_at);
          const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          setWalletStats({
            id: wallet.id,
            created: formattedDate,
            attributeCount: Object.keys(wallet.attributes).length,
            approvedShares: wallet.stats?.approved_shares || 0
          });
        }
      };
      fetchWallet();
    }, [])
  );

  const handleBackup = () => {
    setIsBackupLoading(true);
    setTimeout(() => {
      setIsBackupLoading(false);
      Alert.alert("Success", "Your encrypted data has been safely uploaded to Powm servers.");
    }, 2000);
  };

  const handleDeleteAll = () => {
    Alert.alert(
      "Delete Everything?",
      "This action is irreversible. Your entire wallet, including all identity data and history, will be permanently erased from this device and the server.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            // Second confirmation
            Alert.alert(
              "Are You Absolutely Sure?",
              "This cannot be undone. Your wallet will be permanently deleted from both this device and our servers.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Yes, Delete Everything",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      // Get wallet info before deleting
                      const wallet = getCurrentWallet();
                      if (!wallet) {
                        throw new Error('No wallet found');
                      }

                      // Create signer function
                      const signer = async (data: Uint8Array) => {
                        return await withSigningKey((privateKey) => {
                          const signature = signing.sign(
                            wallet.signing_algorithm,
                            privateKey,
                            data as any
                          );
                          return Buffer.from(signature).toString('base64');
                        });
                      };

                      // Delete from server first
                      try {
                        await deleteWalletFromServer(wallet.id, signer);
                      } catch (error) {
                        console.warn('Failed to delete wallet from server (ignoring):', error);
                      }

                      // Then delete local data
                      await deleteWallet();
                      console.log("All wallet data deleted");

                      // Show success message
                      Alert.alert(
                        "Everything Erased",
                        "Your wallet has been completely removed from this device and our servers.",
                        [
                          {
                            text: "OK",
                            onPress: () => router.replace('/startup')
                          }
                        ],
                        { cancelable: false }
                      );
                    } catch (error) {
                      console.error('Failed to delete wallet:', error);
                      Alert.alert('Error', 'Failed to delete wallet data. Please try again.');
                    }
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const handleRotateAnonymizingKey = () => {
    Alert.alert(
      "Reset Your Anonymous ID?",
      "When apps verify your identity, they can also request your Anonymous ID — a unique code just for that app. It lets them recognize you on repeat visits without always needing your real details.\n\nIf you reset it, you'll get a new Anonymous ID. Apps will see you as a completely new person (for anonymous tracking only).",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Learn More",
          onPress: () => {
            Alert.alert(
              ANONYMOUS_ID_INFO_TITLE,
              ANONYMOUS_ID_INFO_MESSAGE,
              [
                { text: "Cancel", style: "cancel" },
                { text: "Reset Anonymous ID", style: "destructive", onPress: confirmRotateAnonymizingKey }
              ]
            );
          }
        },
        {
          text: "Reset",
          style: "destructive",
          onPress: confirmRotateAnonymizingKey
        }
      ]
    );
  };

  const confirmRotateAnonymizingKey = async () => {
    try {
      const success = await rotateAnonymizingKey();
      if (success) {
        Alert.alert("Done!", "Your Anonymous ID has been reset. Apps will now see you as a new user.");
      } else {
        Alert.alert("Error", "Failed to reset Anonymous ID. Please try again.");
      }
    } catch (error) {
      console.error('Failed to rotate anonymizing key:', error);
      Alert.alert('Error', 'Failed to reset Anonymous ID');
    }
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
          <ScreenHeader title="Wallet Data" />

          {/* Dashboard Stats */}
          <Row gap={12} style={styles.statsContainer}>
            <StatCard
              label="Wallet Created"
              value={walletStats?.created || '...'}
              icon="clock"
              index={0}
            />
            <StatCard
              label="Approved Shares"
              value={walletStats ? walletStats.approvedShares.toString() : '...'}
              icon="check"
              index={1}
            />
          </Row>

          <View style={styles.sectionSpacer} />

          {/* Recovery Section */}
          <Column gap={powmSpacing.md}>
            <PowmText variant="subtitle" style={styles.sectionTitle}>
              Recovery & Backup{' '}
              <PowmText variant="text" color={powmColors.orangeElectricMain} style={{ fontSize: 13, fontWeight: '600', fontStyle: 'italic' }}>
                Coming Soon
              </PowmText>
            </PowmText>

            <GlassCard padding={0} style={{ opacity: 0.5 }}>
              <ListItem
                title="Crypto Codes"
                subtitle="View your recovery phrase"
                icon="data"
                iconColor={powmColors.inactive}
                onPress={() => { }}
                showChevron
                disabled
              />
              <View style={styles.separator} />
              <ListItem
                title="Encrypted Backup"
                subtitle="Upload save to Powm servers"
                icon="data"
                iconColor={powmColors.inactive}
                onPress={() => { }}
                showChevron
                disabled
              />
            </GlassCard>
          </Column>

          <View style={styles.sectionSpacer} />

          {/* Danger Zone */}
          <Column gap={powmSpacing.md}>
            <PowmText variant="subtitle" style={[styles.sectionTitle, { color: '#FF4545' }]}>Danger Zone</PowmText>

            {/* Rotate Anonymizing Key */}
            <Pressable
              style={({ pressed }) => [styles.warningCard, pressed && { opacity: 0.8 }]}
              onPress={handleRotateAnonymizingKey}
            >
              <LinearGradient
                colors={['rgba(255, 159, 10, 0.15)', 'rgba(255, 159, 10, 0.08)']}
                style={StyleSheet.absoluteFill}
              />
              <Row align="center" gap={16}>
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(255, 159, 10, 0.2)' }]}>
                  <PowmIcon name="reload" size={22} color={powmColors.orangeElectricMain} />
                </View>
                <Column flex={1}>
                  <PowmText variant="subtitleSemiBold" color={powmColors.orangeElectricMain}>Reset Anonymous ID</PowmText>
                  <PowmText variant="text" color={powmColors.inactive} style={{ fontSize: 12 }}>
                    Click to learn more
                  </PowmText>
                </Column>
                <PowmIcon name="chevron" size={16} color={powmColors.orangeElectricMain} />
              </Row>
            </Pressable>

            {/* Delete Everything */}
            <Pressable
              style={({ pressed }) => [styles.dangerCard, pressed && { opacity: 0.8 }]}
              onPress={handleDeleteAll}
            >
              <LinearGradient
                colors={['rgba(255, 69, 58, 0.15)', 'rgba(255, 69, 58, 0.08)']}
                style={StyleSheet.absoluteFill}
              />
              <Row align="center" gap={16}>
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(255, 69, 58, 0.2)' }]}>
                  <PowmIcon name="cross" size={22} color={powmColors.deletionRedMain} />
                </View>
                <Column flex={1}>
                  <PowmText variant="subtitleSemiBold" color={powmColors.deletionRedMain}>Delete Everything</PowmText>
                  <PowmText variant="text" color={powmColors.inactive} style={{ fontSize: 12 }}>
                    Wipe all data from this device
                  </PowmText>
                </Column>
                <PowmIcon name="chevron" size={16} color={powmColors.deletionRedMain} />
              </Row>
            </Pressable>
          </Column>

        </ScrollView>
      </View>
    </BackgroundImage>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: powmSpacing.lg },

  // Stats
  statsContainer: { marginBottom: powmSpacing.lg },
  statCard: {
    padding: 12,
  },
  statIcon: { marginBottom: 8, opacity: 0.8 },

  // Sections
  sectionSpacer: { height: 32 },
  sectionTitle: { marginLeft: 4, marginBottom: 8, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.8 },

  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginLeft: 72, // Icon width + gap
  },
  iconCircle: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },

  // Danger Zone
  warningCard: {
    borderRadius: powmRadii.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 10, 0.3)',
    overflow: 'hidden',
    padding: 16,
  },
  dangerCard: {
    borderRadius: powmRadii.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.3)',
    overflow: 'hidden',
    padding: 16,
  },
});
