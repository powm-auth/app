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
import { deleteWallet } from '@/services/wallet-storage';
import { powmColors, powmRadii, powmSpacing } from '@/theme/powm-tokens';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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

const StatCard = ({ label, value, icon, index }: { label: string; value: string; icon: PowmIconName; index: number }) => {
  return (
    <AnimatedEntry index={index} slideDistance={20} style={{ flex: 1 }}>
      <GlassCard style={styles.statCard}>
        <View style={styles.statIcon}>
          <PowmIcon name={icon} size={20} color={powmColors.electricMain} />
        </View>
        <Column>
          <PowmText variant="subtitleSemiBold" style={{ fontSize: 20 }}>{value}</PowmText>
          <PowmText variant="text" color={powmColors.inactive} style={{ fontSize: 12 }}>{label}</PowmText>
        </Column>
      </GlassCard>
    </AnimatedEntry>
  );
};

export default function MyDataScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [isBackupLoading, setIsBackupLoading] = useState(false);

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
      "This action is irreversible. All your documents, history, and keys will be wiped from this device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // TODO: Deregister wallet from server before deleting local data
              await deleteWallet();
              console.log("All wallet data deleted");
              router.replace('/startup');
            } catch (error) {
              console.error('Failed to delete wallet:', error);
              Alert.alert('Error', 'Failed to delete wallet data');
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
          <ScreenHeader title="My Data" />

          {/* Dashboard Stats */}
          <Row gap={12} style={styles.statsContainer}>
            <StatCard label="Documents" value="3" icon="id" index={0} />
            <StatCard label="Validations" value="12" icon="check" index={1} />
            <StatCard label="Trust Score" value="High" icon="verified" index={2} />
          </Row>

          <View style={styles.sectionSpacer} />

          {/* Recovery Section */}
          <Column gap={powmSpacing.md}>
            <PowmText variant="subtitle" style={styles.sectionTitle}>Recovery & Backup</PowmText>

            <GlassCard padding={0}>
              <ListItem
                title="Crypto Codes"
                subtitle="View your recovery phrase"
                icon="data"
                iconColor={powmColors.orangeElectricMain}
                onPress={() => Alert.alert("Crypto Codes", "A-1234-B-5678-C-9012")}
                showChevron
              />
              <View style={styles.separator} />
              <ListItem
                title="Encrypted Backup"
                subtitle={isBackupLoading ? "Uploading..." : "Upload save to Powm servers"}
                icon={isBackupLoading ? "clock" : "data"}
                iconColor={powmColors.electricMain}
                onPress={handleBackup}
                showChevron
              />
            </GlassCard>
          </Column>

          <View style={styles.sectionSpacer} />

          {/* Danger Zone */}
          <Column gap={powmSpacing.md}>
            <PowmText variant="subtitle" style={[styles.sectionTitle, { color: powmColors.deletionRedHard }]}>Danger Zone</PowmText>

            <Pressable style={styles.dangerCard} onPress={handleDeleteAll}>
              <LinearGradient
                colors={['rgba(255, 69, 58, 0.1)', 'rgba(255, 69, 58, 0.05)']}
                style={StyleSheet.absoluteFill}
              />
              <Row align="center" gap={16}>
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(255, 69, 58, 0.2)' }]}>
                  <PowmIcon name="cross" size={22} color={powmColors.deletionRedHard} />
                </View>
                <Column flex={1}>
                  <PowmText variant="subtitleSemiBold" color={powmColors.deletionRedHard}>Delete Everything</PowmText>
                  <PowmText variant="text" color={powmColors.inactive} style={{ fontSize: 12 }}>
                    Wipe all data from this device
                  </PowmText>
                </Column>
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
  dangerCard: {
    borderRadius: powmRadii.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.3)',
    overflow: 'hidden',
    padding: 16,
  },
});
