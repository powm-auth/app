import {
  AttributeList,
  BackgroundImage,
  Button,
  Column,
  EncryptionInfo,
  GlassCard,
  LoadingOverlay,
  PowmText
} from '@/components';
import type { ClaimChallengeResponse } from '@/sdk-extension/structs';
import { powmColors, powmSpacing } from '@/theme/powm-tokens';
import {
  acceptChallenge,
  getCurrentWallet,
  rejectChallenge,
  sortAttributeKeys
} from '@/wallet/service';
import * as LocalAuthentication from 'expo-local-authentication';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
    (claimResponse.claim.requester_type === 'wallet' ? 'Private Wallet' : 'Unknown Requester');
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
                <AttributeList
                  title="Requested Information"
                  appName={appName}
                  showInfoIcon={true}
                  attributes={sortedRequestedAttrs.map(attr => ({
                    key: attr,
                    value: walletAttrs[attr]?.value,
                    isAvailable: attr === 'anonymous_id' || !!walletAttrs[attr]?.value
                  }))}
                />

                <EncryptionInfo
                  appName={appName}
                  encryptionScheme={claimResponse.challenge.encrypting_scheme}
                  variant="sending"
                />

                <PowmText variant="text" color={powmColors.gray} style={[styles.descriptionText, { marginTop: powmSpacing.md }]}>
                  Do you accept to share this information with <PowmText variant="text" color={powmColors.electricMain}>{appName}</PowmText>?
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
                const handleAccept = async () => {
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
                };

                if (claimResponse.claim.can_accept === false) {
                  Alert.alert(
                    'Verification Required',
                    'You need to verify your identity before you can accept this challenge.',
                    [
                      {
                        text: 'Cancel',
                        style: 'cancel',
                      },
                      {
                        text: 'Proceed',
                        onPress: handleAccept,
                      },
                    ]
                  );
                  return;
                }

                await handleAccept();
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
