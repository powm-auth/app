import { PowmIcon } from '@/components';
import { PowmText } from '@/components/ui';
import { consumeIdentityVerification } from '@/sdk-extension';
import { powmColors } from '@/theme/powm-tokens';
import { loadCurrentWallet } from '@/wallet/service';
import { useWalletStatus } from '@/wallet/status';
import { hasWallet, isSecureStorageAvailable, updateWalletFile } from '@/wallet/storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, AppState, StatusBar, StyleSheet, View } from 'react-native';

export default function StartupScreen() {
    const router = useRouter();
    const { status: walletStatus, refreshWalletStatus } = useWalletStatus();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const hasNavigated = useRef(false);
    const needsAuth = useRef(false);
    const [storageError, setStorageError] = useState(false);
    const [authError, setAuthError] = useState(false);
    const [statusError, setStatusError] = useState(false);
    const [consumptionError, setConsumptionError] = useState(false);

    // Use a ref to track if status error occurred to prevent race condition in catch block
    const isStatusErrorRef = useRef(false);

    useEffect(() => {
        // Check secure storage and wallet existence
        const checkWallet = async () => {
            try {
                // Wait 1 second to show the logo
                await new Promise(resolve => setTimeout(resolve, 1000));

                const storageAvailable = await isSecureStorageAvailable();

                if (!storageAvailable) {
                    console.error('[Startup] Secure storage not available on this device');
                    setStorageError(true);
                    return;
                }

                const walletExists = await hasWallet();

                // If no wallet exists, redirect to onboarding
                if (!walletExists) {
                    if (!hasNavigated.current) {
                        hasNavigated.current = true;
                        router.replace('/onboarding');
                    }
                    return;
                }

                // Attempt authentication (biometrics or device lock screen)
                let authenticated = false;
                while (!authenticated && !hasNavigated.current) {
                    try {
                        const result = await LocalAuthentication.authenticateAsync();

                        if (result.success) {
                            authenticated = true;
                            needsAuth.current = false;
                        } else if (result.error === 'user_cancel') {
                            // User cancelled, retry authentication
                            continue;
                        } else if (result.error === 'system_cancel') {
                            // System cancelled (incoming call, app switched, etc.)
                            // Wait for app to come back to foreground
                            console.log('[Startup] Authentication cancelled by system, waiting for app focus');
                            needsAuth.current = true;
                            return;
                        } else {
                            // Other error, retry after delay
                            console.error('[Startup] Authentication failed:', result.error);
                            await new Promise(resolve => setTimeout(resolve, 2000));
                            continue;
                        }
                    } catch (authError: any) {
                        // Handle activity lifecycle errors on Android
                        console.warn('[Startup] Auth error (likely activity destroyed):', authError.message);
                        // Wait for app to stabilize, then retry
                        needsAuth.current = true;
                        return;
                    }
                }

                // Load wallet into memory (force reload to ensure latest version)
                const wallet = await loadCurrentWallet(true);
                if (!wallet) {
                    console.error('[Startup] Failed to load wallet');
                    setStorageError(true);
                    return;
                }

                console.log('[Startup] Wallet loaded:', wallet.id);

                // Check wallet status with server (Heartbeat)
                let currentStatus;
                try {
                    currentStatus = await refreshWalletStatus();
                } catch (e) {

                    console.error('[Startup] Wallet status check failed:', e);
                    isStatusErrorRef.current = true;
                    setStatusError(true);
                    return;
                }

                // Check if identity verification needs to be consumed
                if (currentStatus?.identityVerification === 'accepted_awaiting_consumption') {
                    console.log('[Startup] Identity verification awaiting consumption, consuming...');
                    try {
                        const consumeResult = await consumeIdentityVerification(wallet);
                        console.log('[Startup] Successfully consumed identity verification');

                        // Update wallet with the new identity attributes
                        wallet.identity_attributes = consumeResult.identity_attributes;

                        // Save the updated wallet
                        await updateWalletFile(wallet);
                        console.log('[Startup] Updated wallet saved with identity attributes');

                        // Refresh status to get updated verification status
                        const updatedStatus = await refreshWalletStatus();

                        // Verify status is now completed
                        if (!updatedStatus || updatedStatus.identityVerification !== 'completed') {
                            console.error('[Startup] Expected verification status to be completed, but got:', updatedStatus?.identityVerification);
                            setConsumptionError(true);
                            return;
                        }

                        console.log('[Startup] Identity verification completed successfully');
                    } catch (consumeError) {
                        console.error('[Startup] Failed to consume identity verification:', consumeError);
                        setConsumptionError(true);
                        return;
                    }
                }

                // Navigate immediately after authentication
                if (!hasNavigated.current) {
                    hasNavigated.current = true;
                    router.replace('/home');
                }
            } catch (error) {
                console.error('[Startup] Error:', error);

                // If it's the status error we've already set, don't override it with storage error
                // We use ref because state update might not have processed yet when this catch block runs
                if (!isStatusErrorRef.current) {
                    setStorageError(true);
                }
            }
        };

        checkWallet();

        // Listen for app state changes to retry authentication if needed
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'active' && needsAuth.current && !hasNavigated.current) {
                // Small delay to let the activity fully initialize
                setTimeout(() => {
                    needsAuth.current = false;
                    console.log('[Startup] App became active, retrying authentication');
                    checkWallet();
                }, 300);
            }
        });

        // Fade in and scale animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();

        return () => {
            subscription.remove();
        };
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={powmColors.mainBackground} />

            {storageError ? (
                <View style={styles.errorContainer}>
                    <PowmIcon name="powmLogo" size={80} color={powmColors.electricMain} />
                    <PowmText variant="titleBold" style={styles.errorTitle}>
                        Secure Storage Not Available
                    </PowmText>
                    <PowmText variant="text" style={styles.errorMessage}>
                        This device does not support secure storage, which is required for the Powm wallet.
                    </PowmText>
                    <PowmText variant="text" style={styles.errorMessage}>
                        Please use a device with secure storage support.
                    </PowmText>
                </View>
            ) : statusError ? (
                <View style={styles.errorContainer}>
                    <PowmIcon name="powmLogo" size={80} color={powmColors.electricMain} />
                    <PowmText variant="titleBold" style={styles.errorTitle}>
                        Connection Failed
                    </PowmText>
                    <PowmText variant="text" style={styles.errorMessage}>
                        Unable to connect to the Powm server to verify wallet status.
                    </PowmText>
                    <PowmText variant="text" style={styles.errorMessage}>
                        Please check your internet connection and restart the app.
                    </PowmText>
                </View>
            ) : consumptionError ? (
                <View style={styles.errorContainer}>
                    <PowmIcon name="powmLogo" size={80} color={powmColors.electricMain} />
                    <PowmText variant="titleBold" style={styles.errorTitle}>
                        Verification Consumption Failed
                    </PowmText>
                    <PowmText variant="text" style={styles.errorMessage}>
                        Unable to complete identity verification setup.
                    </PowmText>
                    <PowmText variant="text" style={styles.errorMessage}>
                        Please restart the app and try again.
                    </PowmText>
                </View>
            ) : authError ? (
                <View style={styles.errorContainer}>
                    <PowmIcon name="powmLogo" size={80} color={powmColors.electricMain} />
                    <PowmText variant="titleBold" style={styles.errorTitle}>
                        Authentication Failed
                    </PowmText>
                    <PowmText variant="text" style={styles.errorMessage}>
                        Unable to authenticate your identity.
                    </PowmText>
                    <PowmText variant="text" style={styles.errorMessage}>
                        Please restart the app and try again.
                    </PowmText>
                </View>
            ) : (
                <Animated.View
                    style={[
                        styles.logoContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}
                >
                    <PowmIcon name="powmLogo" size={120} color={powmColors.electricMain} />
                </Animated.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: powmColors.mainBackground,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        gap: 20,
    },
    errorTitle: {
        color: powmColors.deletionRedHard,
        textAlign: 'center',
        marginTop: 20,
    },
    errorMessage: {
        color: powmColors.gray,
        textAlign: 'center',
        lineHeight: 24,
    },
});
