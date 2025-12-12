import {
    BackgroundImage,
    Button,
    CloseButton,
    Column,
    GlassCard,
    PowmIcon,
    PowmText,
    Row,
    Toggle
} from '@/components';
import { createWalletChallenge, getCurrentWallet, pollChallenge } from '@/services/wallet-service';
import { powmColors, powmRadii, powmSpacing } from '@/theme/powm-tokens';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

// Available attributes to request
const AVAILABLE_ATTRIBUTES = [
    { key: 'first_name', label: 'First Name', description: 'Legal first name' },
    { key: 'last_name', label: 'Last Name', description: 'Legal last name' },
    { key: 'date_of_birth', label: 'Date of Birth', description: 'Full date of birth' },
    { key: 'age_over_18', label: 'Age Over 18', description: 'Verify adult status' },
    { key: 'age_over_21', label: 'Age Over 21', description: 'Verify 21+ status' },
    { key: 'nationality', label: 'Nationality', description: 'Country of citizenship' },
    { key: 'gender', label: 'Gender', description: 'Gender identity' },
];

export default function RequestIdentityScreen() {
    const router = useRouter();
    const wallet = getCurrentWallet();

    const [selectedAttributes, setSelectedAttributes] = useState<string[]>(['first_name', 'last_name']);
    const [stage, setStage] = useState<'select' | 'generating' | 'polling' | 'completed' | 'error'>('select');
    const [challengeId, setChallengeId] = useState<string | null>(null);
    const [challengeData, setChallengeData] = useState<any>(null);
    const [privateKey, setPrivateKey] = useState<any>(null);
    const [identityData, setIdentityData] = useState<any>(null);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [timeRemaining, setTimeRemaining] = useState<number>(0);

    const toggleAttribute = (key: string) => {
        setSelectedAttributes(prev =>
            prev.includes(key)
                ? prev.filter(k => k !== key)
                : [...prev, key]
        );
    };

    const handleGenerateChallenge = async () => {
        if (selectedAttributes.length === 0) {
            Alert.alert('No Attributes', 'Please select at least one attribute to request.');
            return;
        }

        if (!wallet) {
            Alert.alert('Error', 'Wallet not loaded');
            return;
        }

        setStage('generating');

        try {
            const { challengeId, privateKey, challenge } = await createWalletChallenge(wallet, selectedAttributes);

            setChallengeId(challengeId);
            setPrivateKey(privateKey);
            setChallengeData(challenge);
            setStage('polling');

            // Start polling
            pollChallenge(challengeId, privateKey, (status) => {
                if (status === 'accepted') {
                    setStage('completed');
                } else if (status === 'rejected') {
                    setStage('error');
                    setErrorMessage('The user rejected your request');
                }
            })
                .then((identity) => {
                    setIdentityData(identity);
                    setStage('completed');
                })
                .catch((e) => {
                    console.error('Polling error:', e);
                    setStage('error');
                    setErrorMessage(e.message || 'Challenge expired or failed');
                });

        } catch (e: any) {
            console.error('Challenge creation error:', e);
            setStage('error');
            setErrorMessage(e.message || 'Failed to create challenge');
        }
    };

    // Countdown timer effect
    useEffect(() => {
        if (stage !== 'polling' || !challengeData) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const expiresAt = new Date(challengeData.expires_at).getTime();
            const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
            setTimeRemaining(remaining);

            if (remaining === 0) {
                clearInterval(interval);
            }
        }, 1000);

        // Set initial time immediately
        const now = Date.now();
        const expiresAt = new Date(challengeData.expires_at).getTime();
        const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
        setTimeRemaining(remaining);

        return () => clearInterval(interval);
    }, [stage, challengeData]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleReset = () => {
        setChallengeId(null);
        setChallengeData(null);
        setPrivateKey(null);
        setIdentityData(null);
        setErrorMessage('');
        setTimeRemaining(0);
        setStage('select');
    };

    const handleBack = () => {
        if (stage === 'select') {
            router.back();
        } else {
            Alert.alert(
                'Cancel Request',
                'Are you sure you want to cancel this identity request?',
                [
                    { text: 'No', style: 'cancel' },
                    { text: 'Yes', onPress: () => router.back() }
                ]
            );
        }
    };

    return (
        <BackgroundImage>
            <View style={[styles.container, { paddingTop: powmSpacing.md }]}>
                {/* Close Button */}
                <CloseButton onPress={handleBack} style={{ alignSelf: 'flex-start', marginTop: powmSpacing.md }} />

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Title */}
                    <PowmText variant="title" align="center" style={{ marginBottom: powmSpacing.xl }}>
                        Request Identity
                    </PowmText>

                    {stage === 'select' && (
                        <>
                            <PowmText variant="subtitle" style={{ marginBottom: powmSpacing.sm }}>
                                Select Attributes to Request
                            </PowmText>
                            <PowmText variant="text" color={powmColors.inactive} style={{ marginBottom: powmSpacing.lg }}>
                                Choose what information you need to verify from the other person.
                            </PowmText>

                            <Column gap={powmSpacing.sm}>
                                {AVAILABLE_ATTRIBUTES.map((attr) => (
                                    <GlassCard key={attr.key} padding={powmSpacing.md}>
                                        <Row justify="space-between" align="center">
                                            <Column flex={1} gap={4}>
                                                <PowmText variant="subtitleSemiBold">{attr.label}</PowmText>
                                                <PowmText variant="text" color={powmColors.inactive} style={{ fontSize: 12 }}>
                                                    {attr.description}
                                                </PowmText>
                                            </Column>
                                            <Toggle
                                                value={selectedAttributes.includes(attr.key)}
                                                onValueChange={() => toggleAttribute(attr.key)}
                                            />
                                        </Row>
                                    </GlassCard>
                                ))}
                            </Column>

                            <Button
                                title="Generate QR Code"
                                onPress={handleGenerateChallenge}
                                disabled={selectedAttributes.length === 0}
                                style={{ marginTop: powmSpacing.xl }}
                            />
                        </>
                    )}

                    {stage === 'generating' && (
                        <Column align="center" gap={powmSpacing.lg} style={{ marginTop: powmSpacing.xxl }}>
                            <ActivityIndicator size="large" color={powmColors.electricMain} />
                            <PowmText variant="subtitle">Generating Challenge...</PowmText>
                        </Column>
                    )}

                    {stage === 'polling' && challengeId && (
                        <Column align="center" gap={powmSpacing.lg}>
                            <PowmText variant="subtitle" align="center">
                                Scan to Verify Identity
                            </PowmText>
                            <PowmText variant="text" color={powmColors.inactive} align="center">
                                Share this QR code with the person you want to verify
                            </PowmText>

                            <View style={styles.qrContainer}>
                                <QRCode value={`powm://${challengeId}`} size={220} />
                            </View>

                            {/* Timer */}
                            <GlassCard padding={powmSpacing.md} style={{ width: '100%' }}>
                                <Row justify="space-between" align="center">
                                    <Row gap={8} align="center">
                                        <PowmIcon name="clock" size={20} color={powmColors.electricMain} />
                                        <PowmText variant="text">Time Remaining</PowmText>
                                    </Row>
                                    <PowmText variant="subtitleSemiBold" color={timeRemaining < 60 ? powmColors.error : powmColors.electricMain}>
                                        {formatTime(timeRemaining)}
                                    </PowmText>
                                </Row>
                            </GlassCard>

                            {/* Requested Attributes */}
                            <GlassCard padding={powmSpacing.md} style={{ width: '100%' }}>
                                <PowmText variant="subtitleSemiBold" style={{ marginBottom: powmSpacing.sm }}>
                                    Requesting:
                                </PowmText>
                                {selectedAttributes.map((attr, idx) => (
                                    <PowmText key={idx} variant="text" color={powmColors.inactive}>
                                        • {AVAILABLE_ATTRIBUTES.find(a => a.key === attr)?.label}
                                    </PowmText>
                                ))}
                            </GlassCard>

                            {/* Status */}
                            <Row gap={8} align="center">
                                <ActivityIndicator color={powmColors.electricMain} />
                                <PowmText variant="text">Waiting for response...</PowmText>
                            </Row>

                            <Button
                                title="Cancel"
                                variant="secondary"
                                onPress={() => router.back()}
                                style={{ width: '100%', marginTop: powmSpacing.md }}
                            />
                        </Column>
                    )}

                    {stage === 'completed' && identityData && (
                        <Column align="center" gap={powmSpacing.lg}>
                            <View style={styles.successIcon}>
                                <PowmIcon name="check" color={powmColors.success} size={48} />
                            </View>
                            <PowmText variant="title" color={powmColors.success}>
                                Identity Verified!
                            </PowmText>

                            <GlassCard padding={powmSpacing.lg} style={{ width: '100%' }}>
                                <PowmText variant="subtitle" style={{ marginBottom: powmSpacing.md }}>
                                    Verified Information
                                </PowmText>
                                {identityData.attributes && Object.entries(identityData.attributes).map(([key, value]) => {
                                    let displayValue = '';

                                    if (typeof value === 'string' || typeof value === 'number') {
                                        displayValue = String(value);
                                    } else if (typeof value === 'boolean') {
                                        displayValue = value ? 'Yes' : 'No';
                                    } else if (value === null || value === undefined) {
                                        displayValue = 'Not provided';
                                    } else {
                                        displayValue = String(value);
                                    }

                                    return (
                                        <Row key={key} justify="space-between" style={{ marginBottom: powmSpacing.sm }}>
                                            <PowmText variant="text" color={powmColors.gray}>
                                                {AVAILABLE_ATTRIBUTES.find(a => a.key === key)?.label || key}:
                                            </PowmText>
                                            <PowmText variant="text" color={powmColors.white} style={{ flexShrink: 1, textAlign: 'right' }}>
                                                {displayValue}
                                            </PowmText>
                                        </Row>
                                    );
                                })}
                            </GlassCard>

                            <Button
                                title="Done"
                                onPress={() => router.back()}
                                style={{ width: '100%', marginTop: powmSpacing.md }}
                            />
                        </Column>
                    )}

                    {stage === 'error' && (
                        <Column align="center" gap={powmSpacing.lg}>
                            <View style={styles.errorIcon}>
                                <PowmIcon name="close" color={powmColors.error} size={48} />
                            </View>
                            <PowmText variant="title" color={powmColors.error}>
                                Request Failed
                            </PowmText>
                            <PowmText variant="text" color={powmColors.inactive} align="center">
                                {errorMessage}
                            </PowmText>

                            <Row gap={powmSpacing.md} style={{ width: '100%' }}>
                                <Button
                                    title="Back"
                                    variant="secondary"
                                    onPress={() => router.back()}
                                    style={{ flex: 1 }}
                                />
                                <Button
                                    title="Try Again"
                                    onPress={handleReset}
                                    style={{ flex: 1 }}
                                />
                            </Row>
                        </Column>
                    )}
                </ScrollView>
            </View>
        </BackgroundImage>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: powmSpacing.lg,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        paddingBottom: powmSpacing.xxl,
    },
    qrContainer: {
        padding: powmSpacing.lg,
        backgroundColor: 'white',
        borderRadius: powmRadii.lg,
    },
    successIcon: {
        width: 80,
        height: 80,
        borderRadius: powmRadii.full,
        backgroundColor: 'rgba(76, 217, 100, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: powmSpacing.xl,
    },
    errorIcon: {
        width: 80,
        height: 80,
        borderRadius: powmRadii.full,
        backgroundColor: 'rgba(255, 59, 48, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: powmSpacing.xl,
    },
});
