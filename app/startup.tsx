import { PowmIcon } from '@/components';
import { PowmText } from '@/components/ui';
import { loadCurrentWallet } from '@/services/wallet-service';
import { hasWallet, isSecureStorageAvailable } from '@/services/wallet-storage';
import { powmColors } from '@/theme/powm-tokens';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Animated, StatusBar, StyleSheet, View } from 'react-native';

export default function StartupScreen() {
    const router = useRouter();
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const scaleAnim = React.useRef(new Animated.Value(0.8)).current;
    const hasNavigated = React.useRef(false);
    const [storageError, setStorageError] = useState(false);

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
                while (!authenticated) {
                    const result = await LocalAuthentication.authenticateAsync();

                    if (result.success) {
                        authenticated = true;
                    } else if (result.error === 'user_cancel') {
                        // User cancelled, retry authentication
                        continue;
                    } else {
                        // Other error, show error screen
                        console.error('[Startup] Authentication failed:', result.error);
                        setStorageError(true);
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
