import { PowmIcon } from '@/components';
import { PowmText } from '@/components/ui';
import { powmColors } from '@/theme/powm-tokens';
import { loadCurrentWallet } from '@/wallet/service';
import { hasWallet, isSecureStorageAvailable } from '@/wallet/storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, AppState, StatusBar, StyleSheet, View } from 'react-native';

export default function StartupScreen() {
    const router = useRouter();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const hasNavigated = useRef(false);
    const needsAuth = useRef(false);
    const [storageError, setStorageError] = useState(false);
    const [authError, setAuthError] = useState(false);

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
                        // Other error, show error screen
                        console.error('[Startup] Authentication failed:', result.error);
                        //setStorageError(true);
                        //return;
                        await new Promise(resolve => setTimeout(resolve, 5000));
                        continue;
                        //setAuthError(true);
                        //return;
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

                // Navigate immediately after authentication
                if (!hasNavigated.current) {
                    hasNavigated.current = true;
                    router.replace('/home');
                }
            } catch (error) {
                console.error('[Startup] Error:', error);
                setStorageError(true);
            }
        };

        checkWallet();

        // Listen for app state changes to retry authentication if needed
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'active' && needsAuth.current && !hasNavigated.current) {
                console.log('[Startup] App became active, retrying authentication');
                checkWallet();
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
