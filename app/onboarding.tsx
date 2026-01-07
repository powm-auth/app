import {
    BackgroundImage,
    Button,
    Column,
    GlassCard,
    PowmText
} from '@/components';
import { onboardWallet } from '@/sdk-extension';
import type { Wallet } from '@/sdk-extension/structs';
import { powmColors, powmSpacing } from '@/theme/powm-tokens';
import { loadCurrentWallet } from '@/wallet/service';
import { saveWallet } from '@/wallet/storage';
import { signing } from '@powm/sdk-js/crypto';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Buffer } from 'buffer';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Easing, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface IdentityData {
    first_name: string;
    last_name: string;
    date_of_birth: string;
}

// Country picker will use built-in country list

const STEPS = [
    {
        id: 'personal',
        title: 'Personal Information',
        description: 'Basic details to create your wallet',
        fields: [
            { key: 'first_name', label: 'First Name', required: true, type: 'text' },
            { key: 'last_name', label: 'Last Name', required: true, type: 'text' },
            { key: 'date_of_birth', label: 'Date of Birth', required: true, type: 'date' },
        ]
    }
];

export default function OnboardingScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [currentStep, setCurrentStep] = useState(0);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showWelcome, setShowWelcome] = useState(true);
    const [showSuccess, setShowSuccess] = useState(false);

    const firstNameInputRef = useRef<React.ElementRef<typeof TextInput>>(null);
    const lastNameInputRef = useRef<React.ElementRef<typeof TextInput>>(null);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const stepFadeAnim = useRef(new Animated.Value(1)).current;
    const formEntranceAnim = useRef(new Animated.Value(0)).current;
    const bgFadeAnim = useRef(new Animated.Value(1)).current;
    const mainBgFadeAnim = useRef(new Animated.Value(0)).current;

    // Welcome screen individual animations
    const titleFadeAnim = useRef(new Animated.Value(0)).current;
    const titleSlideAnim = useRef(new Animated.Value(50)).current;
    const subtitleFadeAnim = useRef(new Animated.Value(0)).current;
    const subtitleSlideAnim = useRef(new Animated.Value(50)).current;
    const descFadeAnim = useRef(new Animated.Value(0)).current;
    const descSlideAnim = useRef(new Animated.Value(50)).current;
    const buttonFadeAnim = useRef(new Animated.Value(0)).current;
    const buttonSlideAnim = useRef(new Animated.Value(50)).current;

    // Success screen animations
    const successEmojiFadeAnim = useRef(new Animated.Value(0)).current;
    const successEmojiSlideAnim = useRef(new Animated.Value(50)).current;
    const successTitleFadeAnim = useRef(new Animated.Value(0)).current;
    const successTitleSlideAnim = useRef(new Animated.Value(50)).current;
    const successMessageFadeAnim = useRef(new Animated.Value(0)).current;
    const successMessageSlideAnim = useRef(new Animated.Value(50)).current;
    const successSubFadeAnim = useRef(new Animated.Value(0)).current;
    const successSubSlideAnim = useRef(new Animated.Value(50)).current;
    const successButtonsFadeAnim = useRef(new Animated.Value(0)).current;
    const successButtonsSlideAnim = useRef(new Animated.Value(50)).current;
    const successBgAnim = useRef(new Animated.Value(0)).current;
    const successBgFadeAnim = useRef(new Animated.Value(0)).current;
    const successBgLoopRef = useRef<Animated.CompositeAnimation | null>(null);

    const successBurstParticles = useRef(
        Array.from({ length: 16 }, (_, index) => {
            const colors = [
                powmColors.electricMain,
                powmColors.orangeElectricMain,
                powmColors.successGreen,
                powmColors.white,
            ];

            // Randomize a bit so the burst doesn't look too uniform.
            const sizeBase = 6 + (index % 5) * 2;
            const size = Math.max(4, Math.round(sizeBase * (0.85 + Math.random() * 0.9)));

            const travelDurationMs = 680 + Math.floor(Math.random() * 520);
            const distanceFactor = 0.85 + Math.random() * 0.75;
            const angleJitter = (Math.random() - 0.5) * 0.7; // ~ +/- 0.35 rad
            const delayJitterMs = Math.floor(Math.random() * 35);
            const startScale = 0.45 + Math.random() * 0.45;
            const endScale = 1.5 + Math.random() * 1.15;
            const fadeInMs = 45 + Math.floor(Math.random() * 65);
            return {
                translateX: new Animated.Value(0),
                translateY: new Animated.Value(0),
                scale: new Animated.Value(0),
                opacity: new Animated.Value(0),
                size,
                color: colors[index % colors.length],

                travelDurationMs,
                distanceFactor,
                angleJitter,
                delayJitterMs,
                startScale,
                endScale,
                fadeInMs,
            };
        })
    ).current;

    const [identityData, setIdentityData] = useState<IdentityData>({
        first_name: '',
        last_name: '',
        date_of_birth: '',
    });

    const [showDatePicker, setShowDatePicker] = useState(false);
    const defaultDate = new Date();
    defaultDate.setFullYear(defaultDate.getFullYear() - 25); // 25 years ago
    const [dateValue, setDateValue] = useState(defaultDate);
    const [activeCountryPicker, setActiveCountryPicker] = useState<string | null>(null);
    const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        // Auto-fill removed - requires native rebuild for expo-localization
    }, []);

    useEffect(() => {
        // Fade in background on mount
        Animated.timing(mainBgFadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
        }).start();
    }, []);

    useEffect(() => {
        // Staggered welcome screen entrance animations - slow and sensational
        Animated.stagger(400, [
            Animated.parallel([
                Animated.timing(titleFadeAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.spring(titleSlideAnim, {
                    toValue: 0,
                    tension: 15,
                    friction: 9,
                    useNativeDriver: true,
                }),
            ]),
            Animated.parallel([
                Animated.timing(subtitleFadeAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.spring(subtitleSlideAnim, {
                    toValue: 0,
                    tension: 15,
                    friction: 9,
                    useNativeDriver: true,
                }),
            ]),
            Animated.parallel([
                Animated.timing(descFadeAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.spring(descSlideAnim, {
                    toValue: 0,
                    tension: 15,
                    friction: 9,
                    useNativeDriver: true,
                }),
            ]),
            Animated.parallel([
                Animated.timing(buttonFadeAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.spring(buttonSlideAnim, {
                    toValue: 0,
                    tension: 15,
                    friction: 9,
                    useNativeDriver: true,
                }),
            ]),
        ]).start();
    }, []);

    useEffect(() => {
        if (!showSuccess) return;

        // Reset values so the animation always plays when the screen is shown
        successEmojiFadeAnim.setValue(0);
        successEmojiSlideAnim.setValue(50);
        successTitleFadeAnim.setValue(0);
        successTitleSlideAnim.setValue(50);
        successMessageFadeAnim.setValue(0);
        successMessageSlideAnim.setValue(50);
        successSubFadeAnim.setValue(0);
        successSubSlideAnim.setValue(50);
        successButtonsFadeAnim.setValue(0);
        successButtonsSlideAnim.setValue(50);
        successBgAnim.setValue(0);
        successBgFadeAnim.setValue(0);

        // Fade in background first
        Animated.timing(mainBgFadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
        }).start(() => {
            // Wait 1 extra second before showing content
            setTimeout(() => {
                Animated.timing(successBgFadeAnim, {
                    toValue: 1,
                    duration: 220,
                    useNativeDriver: true,
                }).start();

                // One-time celebratory burst (fireworks/confetti) as the page loads
                const { width, height } = Dimensions.get('window');
                const origins = [
                    { x: width * 0.28, y: height * 0.38 },
                    { x: width * 0.72, y: height * 0.32 },
                ];

                const burstAnims: Animated.CompositeAnimation[] = [];
                for (let i = 0; i < successBurstParticles.length; i++) {
                    const particle = successBurstParticles[i];

                    const originIndex = i % origins.length;
                    const localCount = Math.ceil(successBurstParticles.length / origins.length);
                    const localIndex = Math.floor(i / origins.length);
                    const origin = origins[originIndex];

                    const originX = typeof origin?.x === 'number' ? origin.x : width * 0.5;
                    const originY = typeof origin?.y === 'number' ? origin.y : height * 0.4;
                    const startScale = typeof (particle as any).startScale === 'number' ? (particle as any).startScale : 0.6;

                    particle.translateX.setValue(originX);
                    particle.translateY.setValue(originY);
                    particle.scale.setValue(startScale);
                    particle.opacity.setValue(0);

                    const baseAngle = (Math.PI * 2 * localIndex) / localCount;
                    const angle = baseAngle + particle.angleJitter;

                    const distanceBase = 110 + (localIndex % 5) * 16;
                    const distance = distanceBase * particle.distanceFactor;

                    const dx = originX + Math.cos(angle) * distance;
                    const dy = originY + Math.sin(angle) * distance;

                    // Make one side pop slightly after the other.
                    const originDelayMs = originIndex * 220;
                    const delayJitterMs = typeof (particle as any).delayJitterMs === 'number' ? (particle as any).delayJitterMs : 0;
                    const delay = originDelayMs + localIndex * 10 + delayJitterMs;

                    const fadeInMs = typeof (particle as any).fadeInMs === 'number' ? (particle as any).fadeInMs : 70;
                    const travelMs = typeof (particle as any).travelDurationMs === 'number' ? (particle as any).travelDurationMs : 950;
                    const travelTailMs = Math.max(120, travelMs - fadeInMs);

                    burstAnims.push(
                        Animated.sequence([
                            Animated.delay(delay),
                            Animated.parallel([
                                // Travel starts immediately
                                Animated.timing(particle.translateX, {
                                    toValue: dx,
                                    duration: travelMs,
                                    easing: Easing.out(Easing.quad),
                                    useNativeDriver: true,
                                }),
                                Animated.timing(particle.translateY, {
                                    toValue: dy,
                                    duration: travelMs,
                                    easing: Easing.out(Easing.quad),
                                    useNativeDriver: true,
                                }),
                                // Opacity: quick in, then fade out
                                Animated.sequence([
                                    Animated.timing(particle.opacity, { toValue: 1, duration: fadeInMs, useNativeDriver: true }),
                                    Animated.timing(particle.opacity, { toValue: 0, duration: travelTailMs, easing: Easing.out(Easing.quad), useNativeDriver: true }),
                                ]),
                                // Scale: quick in, then grow as it moves away
                                Animated.sequence([
                                    Animated.timing(particle.scale, { toValue: 1, duration: fadeInMs, useNativeDriver: true }),
                                    Animated.timing(particle.scale, { toValue: particle.endScale, duration: travelTailMs, easing: Easing.out(Easing.quad), useNativeDriver: true }),
                                ]),
                            ]),
                        ])
                    );
                }
                Animated.parallel(burstAnims).start();

                // Cheerful, subtle background motion
                successBgLoopRef.current?.stop();
                const loop = Animated.loop(
                    Animated.sequence([
                        Animated.timing(successBgAnim, {
                            toValue: 1,
                            duration: 6000,
                            useNativeDriver: true,
                        }),
                        Animated.timing(successBgAnim, {
                            toValue: 0,
                            duration: 6000,
                            useNativeDriver: true,
                        }),
                    ])
                );
                successBgLoopRef.current = loop;
                loop.start();

                // Staggered entrance like the initial welcome screen
                Animated.stagger(350, [
                    Animated.parallel([
                        Animated.timing(successEmojiFadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
                        Animated.spring(successEmojiSlideAnim, { toValue: 0, tension: 15, friction: 9, useNativeDriver: true }),
                    ]),
                    Animated.parallel([
                        Animated.timing(successTitleFadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
                        Animated.spring(successTitleSlideAnim, { toValue: 0, tension: 15, friction: 9, useNativeDriver: true }),
                    ]),
                    Animated.parallel([
                        Animated.timing(successMessageFadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
                        Animated.spring(successMessageSlideAnim, { toValue: 0, tension: 15, friction: 9, useNativeDriver: true }),
                    ]),
                    Animated.parallel([
                        Animated.timing(successSubFadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
                        Animated.spring(successSubSlideAnim, { toValue: 0, tension: 15, friction: 9, useNativeDriver: true }),
                    ]),
                    Animated.parallel([
                        Animated.timing(successButtonsFadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
                        Animated.spring(successButtonsSlideAnim, { toValue: 0, tension: 15, friction: 9, useNativeDriver: true }),
                    ]),
                ]).start();

                return () => {
                    loop.stop();
                };
            });
        });
    }, [showSuccess]);

    const handleStartOnboarding = () => {
        Animated.parallel([
            Animated.timing(titleFadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
            Animated.timing(subtitleFadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
            Animated.timing(descFadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
            Animated.timing(buttonFadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
            Animated.timing(bgFadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
            Animated.timing(mainBgFadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start(() => {
            setShowWelcome(false);

            // Fade background back in and animate in the onboarding form
            Animated.parallel([
                Animated.timing(mainBgFadeAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(formEntranceAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ]).start();
        });
    };

    const currentStepData = STEPS[currentStep];

    const updateField = (key: string, value: string) => {
        setIdentityData(prev => ({ ...prev, [key]: value }));
        // Clear validation error for this field when user types
        if (validationErrors[key]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[key];
                return newErrors;
            });
        }
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }

        if (selectedDate) {
            setDateValue(selectedDate);
            // Use local date components to avoid timezone conversion issues
            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(selectedDate.getDate()).padStart(2, '0');
            const formatted = `${year}-${month}-${day}`;
            updateField('date_of_birth', formatted);
        }
    };

    const canProceed = () => {
        return currentStepData.fields
            .filter(f => f.required)
            .every(f => identityData[f.key as keyof IdentityData]?.trim() !== '');
    };

    const validateField = (key: string, value: string): string | null => {
        // Validate names start with uppercase and have at least 2 characters
        if ((key === 'first_name' || key === 'last_name') && value) {
            if (value.length < 2) {
                return 'Must be at least 2 characters';
            }
            if (!value.match(/^[A-Z]/)) {
                return 'Must start with an uppercase letter';
            }
        }

        // Validate date of birth
        if (key === 'date_of_birth' && value) {
            const dob = new Date(value);
            const now = new Date();

            if (dob > now) {
                return 'Cannot be in the future';
            }

            let age = now.getFullYear() - dob.getFullYear();
            const monthDiff = now.getMonth() - dob.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
                age--;
            }

            if (age > 150) {
                return 'Cannot be more than 150 years ago';
            }
        }

        return null;
    };

    const validateCurrentFields = (): boolean => {
        const errors: Record<string, string> = {};

        currentStepData.fields.forEach(field => {
            const value = identityData[field.key as keyof IdentityData];
            const error = validateField(field.key, value);
            if (error) {
                errors[field.key] = error;
            }
        });

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleFieldBlur = (key: string) => {
        const value = identityData[key as keyof IdentityData];
        const error = validateField(key, value);
        if (error) {
            setValidationErrors(prev => ({ ...prev, [key]: error }));
        }
    };

    const handleNext = () => {
        if (!canProceed()) {
            Alert.alert('Required Fields', 'Please fill in all required fields');
            return;
        }

        // Validate current step fields before proceeding
        if (!validateCurrentFields()) {
            return;
        }

        if (currentStep < STEPS.length - 1) {
            // Animate transition
            Animated.sequence([
                Animated.timing(stepFadeAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                setCurrentStep(currentStep + 1);
                Animated.timing(stepFadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }).start();
            });
        } else {
            Animated.timing(stepFadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start(() => {
                setShowConfirmation(true);
                Animated.timing(stepFadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }).start();
            });
        }
    };

    const handleBack = () => {
        if (showConfirmation) {
            Animated.timing(stepFadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start(() => {
                setShowConfirmation(false);
                Animated.timing(stepFadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }).start();
            });
        } else if (currentStep > 0) {
            Animated.timing(stepFadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start(() => {
                setCurrentStep(currentStep - 1);
                Animated.timing(stepFadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }).start();
            });
        }
    };

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);

            // Generate signing key pair using P-256
            const keyPair = signing.generateKeyPair('ecdsap256_sha256');
            const signingPrivateKey = Buffer.from(keyPair.privateKeyPkcs8Der);
            const publicKey = Buffer.from(keyPair.publicKeySpkiDer);

            // Submit onboarding request to server
            const serverResponse = await onboardWallet({
                signing_scheme: 'EcdsaP256_Sha256',
                signing_public_key: publicKey,
            });

            // Build wallet from server response
            const wallet: Wallet = {
                id: serverResponse.wallet_id,
                public_key: publicKey,
                created_at: new Date(), // this is ok because timestamp is passed in request, so server approves it 
                updated_at: null,
                signing_algorithm: 'EcdsaP256_Sha256',
                identity_attribute_hashing_scheme: serverResponse.identity_attribute_hashing_scheme,
                identity_attributes: null, // Assume attributes are null at first until verification
                anonymizing_hashing_scheme: serverResponse.anonymizing_hashing_scheme,
                user_details: {
                    first_name: identityData.first_name,
                    last_name: identityData.last_name,
                    date_of_birth: identityData.date_of_birth,
                },
                stats: { approved_shares: 0 },
            };

            // Decode anonymizing key from server
            const anonymizingKey = Buffer.from(serverResponse.anonymizing_key, 'base64');

            // Save wallet to secure storage
            const saved = await saveWallet(wallet, signingPrivateKey, anonymizingKey);
            if (!saved) {
                throw new Error('Failed to save wallet to secure storage');
            }

            // Load wallet into memory for immediate use (force reload to clear old cache)
            await loadCurrentWallet(true);

            console.log('Wallet created and registered:', wallet.id);

            // Show success screen
            setIsSubmitting(false);
            Animated.parallel([
                Animated.timing(stepFadeAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(mainBgFadeAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                setShowSuccess(true);
            });
        } catch (error) {
            console.error('Onboarding failed:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to create wallet. Please try again.';
            Alert.alert('Error', errorMessage);
            setIsSubmitting(false);
        }
    };

    // Welcome screen
    if (showWelcome) {
        return (
            <Animated.View style={{ flex: 1, opacity: mainBgFadeAnim }}>
                <BackgroundImage
                    source={require('../assets/images/first_screen_bg.png')}
                    gradient={false}
                    imageStyle={{
                        transform: [],
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        width: '100%',
                        height: '100%',
                        opacity: bgFadeAnim
                    }}
                >
                    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                        <View style={styles.welcomeContainer}>
                            <Column style={styles.welcomeContent}>
                                <Animated.View
                                    style={{
                                        opacity: titleFadeAnim,
                                        transform: [{ translateY: titleSlideAnim }],
                                    }}
                                >
                                    <PowmText variant="title" style={[styles.welcomeTitle, { fontSize: 40 }]}>
                                        Welcome to <PowmText variant="title" style={{ fontSize: 40, color: powmColors.electricMain }}>Powm</PowmText>!
                                    </PowmText>
                                </Animated.View>

                                <Animated.View
                                    style={{
                                        opacity: subtitleFadeAnim,
                                        transform: [{ translateY: subtitleSlideAnim }],
                                    }}
                                >
                                    <PowmText variant="text" style={styles.welcomeSubtitle}>
                                        Your Digital Identity Wallet
                                    </PowmText>
                                </Animated.View>

                                <Animated.View
                                    style={{
                                        opacity: descFadeAnim,
                                        transform: [{ translateY: descSlideAnim }],
                                    }}
                                >
                                    <PowmText variant="text" style={styles.welcomeDescription}>
                                        Create a secure, privacy-first identity wallet. We'll guide you through a quick setup process to get started.
                                    </PowmText>
                                </Animated.View>

                                <Animated.View
                                    style={{
                                        opacity: buttonFadeAnim,
                                        transform: [{ translateY: buttonSlideAnim }],
                                    }}
                                >
                                    <Button
                                        title="Create My Wallet"
                                        variant="primary"
                                        onPress={handleStartOnboarding}
                                        style={[styles.welcomeButton, styles.glassButtonPrimary] as any}
                                    />
                                </Animated.View>
                            </Column>
                        </View>
                    </View>
                </BackgroundImage>
            </Animated.View>
        );
    }

    // Success screen
    if (showSuccess) {
        return (
            <Animated.View style={{ flex: 1, opacity: mainBgFadeAnim }}>
                <BackgroundImage
                    source={require('../assets/images/welcome_bg.png')}
                    gradient={false}
                    imageStyle={{
                        transform: [],
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        width: '100%',
                        height: '100%',
                    }}
                >
                    <View style={[styles.successRoot, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                        <View style={[styles.welcomeContainer, styles.successContainer]}>
                            <Animated.View style={[styles.successBackground, { opacity: successBgFadeAnim }]} pointerEvents="none">
                                <View style={styles.successBurstLayer}>
                                    {successBurstParticles.map((particle, index) => (
                                        <Animated.View
                                            key={index}
                                            style={[
                                                styles.successBurstParticle,
                                                {
                                                    width: particle.size,
                                                    height: particle.size,
                                                    borderRadius: particle.size / 2,
                                                    backgroundColor: particle.color,
                                                    opacity: particle.opacity,
                                                    transform: [
                                                        { translateX: particle.translateX },
                                                        { translateY: particle.translateY },
                                                        { scale: particle.scale },
                                                    ],
                                                },
                                            ]}
                                        />
                                    ))}
                                </View>
                            </Animated.View>

                            <View style={styles.successContent}>
                                <Animated.View style={{ opacity: successEmojiFadeAnim, transform: [{ translateY: successEmojiSlideAnim }] }}>
                                    <PowmText variant="title" style={styles.successEmoji}>
                                        🎉
                                    </PowmText>
                                </Animated.View>

                                <Animated.View style={{ opacity: successTitleFadeAnim, transform: [{ translateY: successTitleSlideAnim }] }}>
                                    <PowmText variant="title" style={[styles.welcomeTitle, { fontSize: 40 }]}>
                                        Welcome to <PowmText variant="title" style={{ fontSize: 40, color: powmColors.electricMain }}>Powm</PowmText>!
                                    </PowmText>
                                </Animated.View>

                                <Animated.View style={{ opacity: successMessageFadeAnim, transform: [{ translateY: successMessageSlideAnim }] }}>
                                    <PowmText variant="text" style={styles.successMessage}>
                                        Your wallet has been created successfully. The next step is to verify your identity, but you don't have to do that now.
                                    </PowmText>
                                </Animated.View>

                                <Animated.View style={{ opacity: successButtonsFadeAnim, transform: [{ translateY: successButtonsSlideAnim }] }}>
                                    <View style={styles.successButtons}>
                                        <Button
                                            title="Let's Get Started!"
                                            variant="primary"
                                            onPress={() => router.replace('/startup')}
                                            style={[styles.successButtonFull, styles.glassButtonPrimary] as any}
                                        />
                                    </View>
                                </Animated.View>
                            </View>
                        </View>
                    </View>
                </BackgroundImage>
            </Animated.View>
        );
    }

    if (showConfirmation) {
        return (
            <Animated.View style={{ flex: 1, opacity: mainBgFadeAnim }}>
                <BackgroundImage>
                    <View style={[styles.container, { paddingTop: insets.top + 60, paddingBottom: insets.bottom }]}>
                        <Column style={styles.content}>
                            <Animated.View style={{ opacity: stepFadeAnim }}>
                                <View style={styles.header}>
                                    <PowmText variant="title" style={styles.title}>
                                        ✓ Almost There!
                                    </PowmText>
                                    <PowmText variant="text" style={styles.description}>
                                        Please review your information before creating your wallet
                                    </PowmText>
                                </View>
                            </Animated.View>

                            <Animated.View style={{ flex: 1, opacity: stepFadeAnim }}>
                                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                                    <GlassCard style={styles.confirmationCard}>
                                        {[
                                            'first_name',
                                            'last_name',
                                            'date_of_birth',
                                        ]
                                            .filter((key) => identityData[key as keyof IdentityData]?.trim() !== '')
                                            .map((key, index, array) => {
                                                const value = identityData[key as keyof IdentityData];
                                                const isLast = index === array.length - 1;
                                                return (
                                                    <View key={key} style={[styles.confirmationRow, isLast && styles.confirmationRowLast]}>
                                                        <PowmText variant="text" style={styles.confirmationLabel}>
                                                            {key.replace(/_/g, ' ').toUpperCase()}
                                                        </PowmText>
                                                        <PowmText variant="textSemiBold" style={styles.confirmationValue}>
                                                            {value}
                                                        </PowmText>
                                                    </View>
                                                );
                                            })}
                                    </GlassCard>
                                </ScrollView>
                            </Animated.View>

                            <Animated.View style={{ opacity: stepFadeAnim }}>
                                <View style={styles.buttonContainer}>
                                    <Button
                                        title="Back"
                                        variant="secondary"
                                        onPress={handleBack}
                                        style={styles.button}
                                        disabled={isSubmitting}
                                    />
                                    <Button
                                        title={isSubmitting ? "Creating..." : "Submit"}
                                        variant="primary"
                                        icon="check"
                                        onPress={handleSubmit}
                                        style={styles.button}
                                        disabled={isSubmitting}
                                    />
                                </View>
                            </Animated.View>
                        </Column>
                    </View>
                </BackgroundImage>
            </Animated.View>
        );
    }

    return (
        <Animated.View style={{ flex: 1, opacity: mainBgFadeAnim }}>
            <BackgroundImage>
                <Animated.View
                    style={[
                        { flex: 1 },
                        {
                            opacity: formEntranceAnim,
                        }
                    ]}
                >
                    <View style={[styles.container, { paddingTop: insets.top + 60, paddingBottom: insets.bottom }]}>
                        <Column style={styles.content}>
                            {/* Progress Bar - Commented out for single-step flow, keeping for future multi-step expansion */}
                            {/* <View style={styles.progressContainer}>
                                <View style={styles.progressBar}>
                                    {STEPS.map((_, index) => (
                                        <View
                                            key={index}
                                            style={[
                                                styles.progressStep,
                                                index <= currentStep && styles.progressStepActive,
                                            ]}
                                        />
                                    ))}
                                </View>
                                <PowmText variant="text" style={styles.progressText}>
                                    Step {currentStep + 1} of {STEPS.length}
                                </PowmText>
                            </View> */}

                            <Animated.View style={{ opacity: stepFadeAnim }}>
                                <View style={styles.header}>
                                    <PowmText variant="title" style={styles.title}>
                                        {currentStepData.title}
                                    </PowmText>
                                    <PowmText variant="text" style={styles.description}>
                                        {currentStepData.description}
                                    </PowmText>
                                </View>
                            </Animated.View>

                            <Animated.View style={{ flex: 1, opacity: stepFadeAnim }}>
                                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                                    <GlassCard style={styles.formCard}>
                                        {currentStepData.fields.map((field: any) => (
                                            <View key={field.key} style={styles.fieldContainer}>
                                                <PowmText variant="textSemiBold" style={styles.fieldLabel}>
                                                    {field.label}
                                                    {field.required && <PowmText style={styles.required}> *</PowmText>}
                                                </PowmText>

                                                {field.type === 'date' ? (
                                                    <>
                                                        <Pressable
                                                            style={styles.input}
                                                            onPress={() => setShowDatePicker(true)}
                                                        >
                                                            <PowmText style={identityData.date_of_birth ? styles.inputText : styles.placeholder}>
                                                                {identityData.date_of_birth || 'Select date of birth'}
                                                            </PowmText>
                                                        </Pressable>
                                                        {Platform.OS === 'ios' ? (
                                                            <Modal
                                                                transparent={true}
                                                                animationType="slide"
                                                                visible={showDatePicker}
                                                                onRequestClose={() => setShowDatePicker(false)}
                                                            >
                                                                <View style={styles.modalContainer}>
                                                                    <View style={styles.modalContent}>
                                                                        <View style={styles.modalHeader}>
                                                                            <Pressable onPress={() => setShowDatePicker(false)}>
                                                                                <PowmText style={styles.modalDoneButton}>Done</PowmText>
                                                                            </Pressable>
                                                                        </View>
                                                                        <DateTimePicker
                                                                            value={dateValue}
                                                                            mode="date"
                                                                            display="spinner"
                                                                            onChange={handleDateChange}
                                                                            maximumDate={new Date()}
                                                                            minimumDate={new Date(1900, 0, 1)}
                                                                            textColor="white"
                                                                            themeVariant="dark"
                                                                        />
                                                                    </View>
                                                                </View>
                                                            </Modal>
                                                        ) : (
                                                            showDatePicker && (
                                                                <DateTimePicker
                                                                    value={dateValue}
                                                                    mode="date"
                                                                    display="default"
                                                                    onChange={handleDateChange}
                                                                    maximumDate={new Date()}
                                                                    minimumDate={new Date(new Date().getFullYear() - 150, 0, 1)}
                                                                />
                                                            )
                                                        )}
                                                    </>
                                                ) : (
                                                    <>
                                                        <TextInput
                                                            ref={
                                                                field.key === 'first_name'
                                                                    ? firstNameInputRef
                                                                    : field.key === 'last_name'
                                                                        ? lastNameInputRef
                                                                        : undefined
                                                            }
                                                            style={[styles.input, validationErrors[field.key] && styles.inputError]}
                                                            value={identityData[field.key as keyof IdentityData]}
                                                            onChangeText={(value) => updateField(field.key, value)}
                                                            onBlur={() => handleFieldBlur(field.key)}
                                                            returnKeyType={field.key === 'first_name' ? 'next' : 'done'}
                                                            blurOnSubmit={field.key === 'first_name' ? false : true}
                                                            onSubmitEditing={() => {
                                                                if (field.key === 'first_name') {
                                                                    lastNameInputRef.current?.focus();
                                                                    return;
                                                                }
                                                            }}
                                                            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                                                            placeholderTextColor="rgba(255, 255, 255, 0.4)"
                                                            autoCapitalize="words"
                                                        />
                                                        {validationErrors[field.key] && (
                                                            <PowmText style={styles.errorText}>
                                                                {validationErrors[field.key]}
                                                            </PowmText>
                                                        )}
                                                    </>
                                                )}
                                            </View>
                                        ))}
                                    </GlassCard>
                                </ScrollView>
                            </Animated.View>

                            <Animated.View style={{ opacity: stepFadeAnim }}>
                                <View style={styles.buttonContainer}>
                                    {currentStep > 0 && (
                                        <Button
                                            title="Back"
                                            variant="secondary"
                                            onPress={handleBack}
                                            style={styles.button}
                                        />
                                    )}
                                    <Button
                                        title={currentStep === STEPS.length - 1 ? "Review" : "Continue"}
                                        variant="primary"
                                        icon="check"
                                        onPress={handleNext}
                                        disabled={!canProceed() || Object.keys(validationErrors).length > 0}
                                        style={currentStep === 0 ? styles.buttonFull : styles.button}
                                    />
                                </View>
                            </Animated.View>
                        </Column>
                    </View>
                </Animated.View>
            </BackgroundImage>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: powmSpacing.lg,
    },
    content: {
        flex: 1,
        gap: powmSpacing.lg,
    },
    header: {
        gap: powmSpacing.xs,
    },
    progressContainer: {
        marginBottom: powmSpacing.md,
        gap: powmSpacing.xs,
    },
    progressBar: {
        flexDirection: 'row',
        gap: powmSpacing.xs,
        height: 4,
    },
    progressStep: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 2,
    },
    progressStepActive: {
        backgroundColor: powmColors.electricMain,
    },
    progressText: {
        fontSize: 12,
        opacity: 0.6,
        textAlign: 'center',
    },
    title: {
        textAlign: 'center',
    },
    description: {
        textAlign: 'center',
        opacity: 0.8,
    },
    stepIndicator: {
        textAlign: 'center',
        opacity: 0.6,
        marginTop: powmSpacing.xs,
    },
    scrollView: {
        flex: 1,
    },
    formCard: {
        padding: powmSpacing.lg,
        gap: powmSpacing.md,
    },
    fieldContainer: {
        gap: powmSpacing.xs,
    },
    fieldLabel: {
        fontWeight: '600',
    },
    required: {
        color: '#ff6b6b',
    },
    input: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        padding: powmSpacing.md,
        color: 'white',
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
    },
    inputError: {
        borderColor: powmColors.deletionRedHard,
    },
    errorText: {
        color: powmColors.deletionRedHard,
        fontSize: 12,
        marginTop: powmSpacing.xs,
    },
    inputText: {
        color: 'white',
        fontSize: 16,
    },
    placeholder: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 16,
    },
    pickerContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        overflow: 'hidden',
    },
    picker: {
        color: 'white',
        backgroundColor: 'transparent',
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: powmSpacing.md,
    },
    button: {
        flex: 1,
    },
    buttonFull: {
        flex: 1,
        minWidth: '100%',
    },
    confirmationCard: {
        padding: powmSpacing.lg,
        gap: powmSpacing.md,
    },
    confirmationRow: {
        gap: powmSpacing.xs,
        paddingVertical: powmSpacing.xs,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    confirmationRowLast: {
        borderBottomWidth: 0,
    },
    confirmationLabel: {
        opacity: 0.6,
        fontSize: 12,
    },
    confirmationValue: {
        fontWeight: '600',
    },
    welcomeContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -60,
    },
    welcomeContent: {
        gap: powmSpacing.lg,
        alignItems: 'center',
        maxWidth: 400,
        paddingHorizontal: powmSpacing.xl,
    },
    welcomeTitle: {
        fontSize: 48,
        textAlign: 'center',
        marginBottom: powmSpacing.sm,
    },
    welcomeSubtitle: {
        fontSize: 24,
        textAlign: 'center',
        opacity: 0.9,
    },
    welcomeDescription: {
        textAlign: 'center',
        opacity: 0.7,
        lineHeight: 24,
        marginTop: powmSpacing.md,
    },
    welcomeButton: {
        marginTop: powmSpacing.xl,
        minWidth: 200,
    },
    successContent: {
        gap: powmSpacing.xl,
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: powmSpacing.md,
    },
    successEmoji: {
        fontSize: 72,
        textAlign: 'center',
    },
    successTitle: {
        fontSize: 36,
        textAlign: 'center',
    },
    successMessage: {
        textAlign: 'center',
        opacity: 0.9,
        lineHeight: 24,
        fontSize: 16,
    },
    successSubMessage: {
        textAlign: 'center',
        opacity: 0.7,
        fontSize: 15,
        marginTop: powmSpacing.sm,
    },
    successButtons: {
        flexDirection: 'column',
        width: '100%',
        gap: powmSpacing.md,
        marginTop: powmSpacing.lg,
    },
    successButtonFull: {
        minWidth: '100%',
    },
    successContainer: {
        alignItems: 'stretch',
    },
    successRoot: {
        flex: 1,
    },
    successBackground: {
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
    },
    successBurstLayer: {
        position: 'absolute',
        inset: 0,
    },
    successBurstParticle: {
        position: 'absolute',
    },
    successOrb: {
        position: 'absolute',
        width: 360,
        height: 360,
        borderRadius: 180,
        backgroundColor: powmColors.electricMain,
        opacity: 0.22,
        top: -140,
        left: -140,
    },
    successOrbAlt: {
        position: 'absolute',
        width: 320,
        height: 320,
        borderRadius: 160,
        backgroundColor: powmColors.orangeElectricMain,
        opacity: 0.18,
        bottom: -140,
        right: -140,
    },
    advancedHeader: {
        gap: powmSpacing.sm,
        marginBottom: powmSpacing.md,
    },
    advancedTitle: {
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
    },
    advancedWarning: {
        fontSize: 14,
        opacity: 0.7,
        textAlign: 'center',
        lineHeight: 20,
    },
    advancedToggle: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: powmSpacing.md,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        gap: powmSpacing.xs,
    },
    advancedToggleText: {
        fontSize: 16,
        fontWeight: '600',
    },
    advancedToggleHint: {
        fontSize: 13,
        opacity: 0.6,
    },
    advancedWarningBox: {
        backgroundColor: 'rgba(255, 193, 7, 0.1)',
        borderRadius: 12,
        padding: powmSpacing.md,
        borderWidth: 1,
        borderColor: 'rgba(255, 193, 7, 0.3)',
        marginTop: powmSpacing.md,
    },
    advancedWarningBoxText: {
        fontSize: 13,
        opacity: 0.9,
        lineHeight: 18,
        color: 'rgba(255, 223, 138, 1)',
    },
    algorithmContainer: {
        gap: powmSpacing.md,
    },
    algorithmOption: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: powmSpacing.md,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    algorithmOptionSelected: {
        borderColor: 'rgba(138, 180, 248, 0.8)',
        backgroundColor: 'rgba(138, 180, 248, 0.1)',
    },
    algorithmHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: powmSpacing.sm,
        marginBottom: powmSpacing.xs,
    },
    radioButton: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioButtonSelected: {
        borderColor: 'rgba(138, 180, 248, 1)',
    },
    radioButtonInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: 'rgba(138, 180, 248, 1)',
    },
    algorithmLabel: {
        fontSize: 16,
    },
    algorithmDescription: {
        fontSize: 13,
        opacity: 0.7,
        lineHeight: 18,
    },
    glassButtonPrimary: {
        backgroundColor: 'rgba(65, 32, 125, 0.6)',
        borderColor: 'rgba(160, 107, 255, 0.5)',
        borderWidth: 1,
    },
    glassButtonSecondary: {
        backgroundColor: powmColors.glass.background,
        borderColor: powmColors.glass.border,
        borderWidth: 1,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: '#1E1E1E',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 40,
    },
    modalHeader: {
        padding: 16,
        alignItems: 'flex-end',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
        backgroundColor: '#252525',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    modalDoneButton: {
        color: '#0A84FF',
        fontSize: 18,
        fontWeight: '600',
    },
});
