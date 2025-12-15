import {
  BackgroundImage,
  Button,
  Column,
  GlassCard,
  LoadingOverlay,
  PowmText
} from '@/components';
import {
  acceptChallenge,
  getAttributeDisplayName,
  getCurrentWallet,
  rejectChallenge,
  sortAttributeKeys
} from '@/services/wallet-service';
import { powmColors, powmSpacing } from '@/theme/powm-tokens';
import type { ClaimChallengeResponse } from '@/types/powm';
import * as LocalAuthentication from 'expo-local-authentication';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const getEncryptionSchemeName = (scheme: string) => {
  switch (scheme) {
    case 'ecdhx25519_hkdfsha256_aes256gcm':
      return 'X25519 (Modern High-Performance)';
    case 'ecdhp256_hkdfsha256_aes256gcm':
      return 'P-256 (NIST Standard)';
    case 'ecdhp384_hkdfsha384_aes256gcm':
      return 'P-384 (High Security)';
    default:
      return scheme;
  }
};

export default function ValidateIdentityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);

  const challengeId = params.challengeId as string;
  const claimResponse: ClaimChallengeResponse = params.claimData
    ? JSON.parse(params.claimData as string)
    : null;

  if (!claimResponse) {
    return (
      <BackgroundImage>
        <View style={styles.container}>
          <PowmText variant="title" align="center">No challenge data</PowmText>
        </View>
      </BackgroundImage>
    );
  }

  const appName = claimResponse.claim.requester_display_name ||
    (claimResponse.claim.requester_type === 'wallet' ? 'A Wallet' : 'Unknown Requester');
  const requestedAttrs = claimResponse.challenge.identity_attributes;
  const wallet = getCurrentWallet();
  if (!wallet) {
    return (
      <BackgroundImage>
        <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
          <PowmText variant="title" align="center">Error</PowmText>
          <PowmText variant="text" align="center" style={{ marginTop: powmSpacing.md }}>
            Wallet not loaded. Please restart the app.
          </PowmText>
        </View>
      </BackgroundImage>
    );
  }

  const walletAttrs = wallet.attributes;

  const handleReturnHome = () => {
    router.dismissAll();
  };

  const sortedRequestedAttrs = sortAttributeKeys(requestedAttrs);

  return (
    <BackgroundImage>
      <View style={[styles.container, { paddingTop: insets.top + powmSpacing.sm, paddingBottom: insets.bottom + powmSpacing.lg }]}>

        <View style={styles.content}>
          {/* Header / Title Section */}
          <Column gap={powmSpacing.xs} style={styles.headerSection}>
            <PowmText variant="title" align="center" color={powmColors.electricMain} style={{ fontSize: 36 }}>
              {appName}
            </PowmText>
            <PowmText variant="subtitle" align="center" color={powmColors.gray} style={{ fontSize: 16 }}>
              is requesting your identity
            </PowmText>
          </Column>

          <View style={{ flex: 0.3 }} />

          {/* Question Section */}
          <GlassCard style={styles.questionCard}>
            <ScrollView style={{ maxHeight: 450 }} showsVerticalScrollIndicator={false}>
              <Column gap={powmSpacing.md}>
                <PowmText variant="subtitle" align="center" style={{ fontSize: 20, marginBottom: powmSpacing.md }}>Requested Information</PowmText>

                {sortedRequestedAttrs.map((attr, idx) => {
                  const hasValue = attr === 'anonymous_id' || !!walletAttrs[attr]?.value;
                  return (
                    <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <PowmText variant="text" color={powmColors.gray} style={{ flex: 1 }}>
                        {getAttributeDisplayName(attr)}
                      </PowmText>
                      <PowmText
                        variant="text"
                        color={hasValue ? powmColors.electricMain : powmColors.inactive}
                        style={{ flex: 1, textAlign: 'right', opacity: hasValue ? 1 : 0.6 }}
                      >
                        {attr === 'anonymous_id' ? 'Generated ID' : (walletAttrs[attr]?.value || 'Not available')}
                      </PowmText>
                    </View>
                  );
                })}

                <View style={{ marginTop: powmSpacing.lg }}>
                  <PowmText variant="text" color={powmColors.inactive} style={styles.descriptionText}>
                    🔒 <PowmText variant="text" color={powmColors.electricMain}>End-to-end encrypted</PowmText> - This data goes directly to {appName}. Powm never sees it.{' '}
                    <Text
                      style={{ color: powmColors.electricMain, textDecorationLine: 'underline' }}
                      onPress={() => {
                        Alert.alert(
                          'How Powm Works',
                          `Your identity is end-to-end encrypted between you and ${appName}.\n\n` +
                          '✅ Powm never sees this data\n\n' +
                          `✅ Powm only provides a cryptographic checksum (hash) of your identity to ${appName}\n\n` +
                          `✅ This checksum allows ${appName} to prove authenticity on their end\n\n` +
                          `${appName} can verify your identity is real, but Powm cannot see what data was shared.`
                        );
                      }}
                    >
                      Learn more
                    </Text>
                  </PowmText>
                </View>

                <PowmText variant="text" color={powmColors.gray} style={[styles.descriptionText, { marginTop: powmSpacing.md }]}>
                  Do you accept to share this information with <PowmText variant="text" color={powmColors.electricMain}>{appName}</PowmText>?
                </PowmText>

                <PowmText variant="text" color={powmColors.inactive} style={{ fontSize: 11, marginTop: powmSpacing.sm, textAlign: 'right' }}>
                  Encryption: {getEncryptionSchemeName(claimResponse.challenge.encrypting_scheme)}
                </PowmText>
              </Column>
            </ScrollView>
          </GlassCard>

          <View style={{ flex: 1 }} />

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <Button
              title={rejecting ? "Rejecting..." : "Reject"}
              variant="secondary"
              icon={rejecting ? undefined : "cross"}
              onPress={async () => {
                try {
                  setRejecting(true);
                  setLoadingMessage('Rejecting challenge...');
                  await rejectChallenge(challengeId, wallet, claimResponse);
                  setLoadingMessage(null);
                  router.dismissAll();
                } catch (error) {
                  console.error('Reject error:', error);
                  setLoadingMessage(null);
                  Alert.alert('Error', 'Failed to reject challenge. Please try again.');
                } finally {
                  setRejecting(false);
                }
              }}
              disabled={accepting || rejecting}
              style={{ flex: 1 }}
            />
            <View style={{ width: powmSpacing.md }} />
            <Button
              title={accepting ? "Accepting..." : "Accept"}
              variant="primary"
              icon={accepting ? undefined : "check"}
              onPress={async () => {
                try {
                  // Authenticate user before accepting challenge
                  const result = await LocalAuthentication.authenticateAsync();

                  if (!result.success) {
                    // User cancelled or authentication failed - just return
                    return;
                  }

                  setAccepting(true);
                  setLoadingMessage('Accepting challenge...');
                  await acceptChallenge(challengeId, wallet, claimResponse);
                  setLoadingMessage(null);
                  router.dismissAll();
                } catch (error) {
                  console.error('Accept failed:', error);
                  setLoadingMessage(null);
                  Alert.alert(
                    'Error',
                    error instanceof Error ? error.message : 'Failed to accept challenge',
                    [{ text: 'OK', onPress: () => setAccepting(false) }]
                  );
                }
              }}
              disabled={accepting || rejecting}
              style={{ flex: 1 }}
            />
          </View>
        </View>

        <LoadingOverlay visible={loadingMessage !== null} message={loadingMessage || undefined} />
      </View>
    </BackgroundImage>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: powmSpacing.xl,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerSection: {
    marginTop: 0,
    alignItems: 'center',
  },
  spacer: {
    flex: 0.2,
  },
  questionCard: {
    padding: 24,
  },
  descriptionText: {
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    marginBottom: powmSpacing.lg,
  },
});
