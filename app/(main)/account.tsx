import {
  AnimatedEntry,
  BackgroundImage,
  Column,
  Divider,
  GlassCard,
  PowmIcon,
  PowmText,
  Row,
  ScreenHeader,
} from '@/components';
import { powmColors, powmRadii, powmSpacing } from '@/theme/powm-tokens';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Clipboard,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Types for account state
type AccountState = 'Secured' | 'Breached' | 'Not Used';

const DetailCard = ({ 
  label, 
  value, 
  description, 
  index 
}: { 
  label: string; 
  value: string; 
  description?: string;
  index: number 
}) => {
  const handleCopy = () => {
    Clipboard.setString(value);
    Alert.alert("Copied", `${label} copied to clipboard.`);
  };

  return (
    <AnimatedEntry index={index} slideDistance={20}>
      <GlassCard onPress={handleCopy} style={styles.detailCard}>
        <Column gap={4}>
          <PowmText variant="text" color={powmColors.inactive} style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
            {label}
          </PowmText>
          <PowmText variant="subtitleSemiBold" style={{ fontSize: 16, fontFamily: 'monospace' }}>
            {value}
          </PowmText>
          {description && (
            <PowmText variant="text" color="rgba(255,255,255,0.4)" style={{ fontSize: 11, marginTop: 4 }}>
              {description}
            </PowmText>
          )}
        </Column>
        <View style={styles.copyIcon}>
          <PowmIcon name="data" size={16} color={powmColors.electricMain} />
        </View>
      </GlassCard>
    </AnimatedEntry>
  );
};

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  
  // Default state as requested
  const [accountState, setAccountState] = useState<AccountState>('Secured');

  const getStatusColor = (state: AccountState) => {
    switch (state) {
      case 'Secured': return powmColors.activeElectricMain; // Green-ish/Cyan
      case 'Breached': return powmColors.deletionRedHard;
      case 'Not Used': return powmColors.gray;
      default: return powmColors.electricMain;
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
          <ScreenHeader title="Account" />

          {/* Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={[powmColors.electricMain, 'rgba(20, 18, 28, 0)']}
                style={styles.avatarGradient}
              >
                <View style={styles.avatarInner}>
                  <PowmIcon name="profile" size={64} color="rgba(255,255,255,0.8)" />
                </View>
              </LinearGradient>
            </View>
            <PowmText variant="title" style={{ marginTop: 16 }}>Anonymous User</PowmText>
            <PowmText variant="text" color={powmColors.inactive}>Visible as "Anonymous" to services</PowmText>
          </View>

          <Divider style={{ marginBottom: powmSpacing.xl }} />

          {/* Account Status */}
          <GlassCard style={{ borderColor: getStatusColor(accountState) + '40' }}>
            <Row align="center" gap={16}>
              <View style={[styles.statusIcon, { backgroundColor: getStatusColor(accountState) + '20' }]}>
                <PowmIcon 
                  name={accountState === 'Secured' ? 'verified' : accountState === 'Breached' ? 'cross' : 'clock'} 
                  size={24} 
                  color={getStatusColor(accountState)} 
                />
              </View>
              <Column>
                <PowmText variant="text" color={powmColors.inactive} style={{ fontSize: 12 }}>Account State</PowmText>
                <PowmText variant="subtitleSemiBold" style={{ color: getStatusColor(accountState) }}>
                  {accountState}
                </PowmText>
              </Column>
            </Row>
          </GlassCard>

          <View style={styles.sectionSpacer} />

          {/* Identification Data */}
          <Column gap={powmSpacing.md}>
            <PowmText variant="subtitle" style={styles.sectionTitle}>Identification</PowmText>
            
            <DetailCard 
              index={0}
              label="Powm ID" 
              value="8f7a-9b2c-4d1e-0f3a" 
              description="The only identifier Powm knows about you."
            />
            
            <DetailCard 
              index={1}
              label="Device ID" 
              value="iPhone15,3-A1B2-C3D4" 
              description="Linked strictly to this hardware."
            />
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
  
  // Profile
  profileSection: { alignItems: 'center', marginVertical: powmSpacing.xl },
  avatarContainer: {
    width: 120, height: 120,
    borderRadius: 60,
    padding: 3, // Border width
    overflow: 'hidden',
  },
  avatarGradient: {
    flex: 1, borderRadius: 60, padding: 3,
  },
  avatarInner: {
    flex: 1, backgroundColor: powmColors.mainBackground, borderRadius: 60,
    alignItems: 'center', justifyContent: 'center',
  },
  
  // Status
  statusIcon: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },

  sectionSpacer: { height: 32 },
  sectionTitle: { marginLeft: 4, marginBottom: 8, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.8 },

  // Details
  detailCard: {
    padding: 16,
  },
  copyIcon: {
    position: 'absolute',
    right: 16, top: 16,
    opacity: 0.5,
  },
});
