import {
  BackgroundImage,
  Button,
  Column,
  GlassCard,
  LoadingOverlay,
  PowmText,
  ScreenHeader
} from '@/components';
import {
  acceptChallenge,
  getCurrentWallet,
  rejectChallenge
} from '@/services/wallet-service';
import { powmColors, powmSpacing } from '@/theme/powm-tokens';
import type { ClaimChallengeResponse } from '@/types/powm';
import * as LocalAuthentication from 'expo-local-authentication';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
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

  const appName = claimResponse.claim.application_display_name;
  const requestedAttrs = claimResponse.challenge.identity_attributes;
  const wallet = getCurrentWallet();
  if (!wallet) {
    return (
      <BackgroundImage>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <ScreenHeader title="Validate Identity" subtitle="Error" />
          <View style={styles.errorContainer}>
            <PowmText variant="text" style={styles.errorText}>
              Wallet not loaded. Please restart the app.
            </PowmText>
          </View>
        </View>
      </BackgroundImage>
    );
  }

  const walletAttrs = wallet.attributes;

  const handleReturnHome = () => {
    router.dismissAll();
  };

  return (
    <BackgroundImage>
      <View style={[styles.container, { paddingTop: insets.top + powmSpacing.xl, paddingBottom: insets.bottom + powmSpacing.lg }]}>

        <View style={styles.content}>
          {/* Header / Title Section */}
          <Column gap={powmSpacing.sm} style={styles.headerSection}>
            <PowmText variant="title" align="center">
              {appName} wants to know:
            </PowmText>
            {requestedAttrs.map((attr, idx) => (
              <PowmText key={idx} variant="title" color={powmColors.electricMain} align="center">
                {attr.replace('_', ' ')}
              </PowmText>
            ))}
          </Column>

          <View style={styles.spacer} />

          {/* Question Section */}
          <GlassCard style={styles.questionCard}>
            <Column gap={powmSpacing.md}>
              <PowmText variant="subtitle" style={{ fontSize: 20 }}>Requested Information:</PowmText>

              {requestedAttrs.map((attr, idx) => (
                <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <PowmText variant="text" color={powmColors.gray}>
                    {attr.replace('_', ' ')}:
                  </PowmText>
                  <PowmText variant="text" color={powmColors.electricMain}>
                    {walletAttrs[attr]?.value || 'Not available'}
                  </PowmText>
                </View>
              ))}

              <PowmText variant="text" color={powmColors.inactive} style={[styles.descriptionText, { marginTop: powmSpacing.md }]}>
                Powm will not have any information or a way to link you to this check or this company. Powm respects <PowmText variant="text" color={powmColors.electricMain}>double anonymat</PowmText>.
              </PowmText>

              <PowmText variant="text" color={powmColors.gray} style={[styles.descriptionText, { marginTop: powmSpacing.sm }]}>
                Do you accept to share this information with {appName}?
              </PowmText>

              <PowmText variant="text" color={powmColors.inactive} style={{ fontSize: 11, marginTop: powmSpacing.sm, textAlign: 'right' }}>
                Encryption: {getEncryptionSchemeName(claimResponse.challenge.encrypting_scheme)}
              </PowmText>
            </Column>
          </GlassCard>

          <View style={styles.spacer} />

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
                  router.replace('/home');
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
                  router.replace('/home');
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
    marginTop: powmSpacing.xl,
    alignItems: 'center',
  },
  spacer: {
    flex: 1,
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
