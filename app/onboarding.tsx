import {
    BackgroundImage,
    Button,
    Column,
    GlassCard,
    PowmText
} from '@/components';
import { testOnboardWallet } from '@/services/powm-api';
import { createWallet, createWalletFromOnboarding } from '@/services/wallet-generation';
import { saveWallet } from '@/services/wallet-storage';
import { powmSpacing } from '@/theme/powm-tokens';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActionSheetIOS, Alert, Animated, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import CountryPicker, { Country, CountryCode } from 'react-native-country-picker-modal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface IdentityData {
    first_name: string;
    middle_names: string;
    last_name: string;
    nationality_1: string;
    nationality_2: string;
    nationality_3: string;
    date_of_birth: string;
    birth_country: string;
    gender: string;
    signing_algorithm: string;
}

// Country picker will use built-in country list

const GENDERS = ['Male', 'Female', 'Other'];

const SIGNING_ALGORITHMS = [
    {
        value: 'Ed25519',
        label: 'EdDSA (Ed25519)',
        description: 'Edwards-curve Digital Signature Algorithm. Fast, secure, and modern. Excellent choice for most use cases.',
    },
    {
        value: 'EcdsaP256_Sha256',
        label: 'ECDSA P-256 (Recommended)',
        description: 'Elliptic Curve Digital Signature Algorithm with P-256 curve and SHA-256. Widely supported, secure, and efficient.',
    },
    {
        value: 'EcdsaP384_Sha384',
        label: 'ECDSA P-384',
        description: 'Higher security elliptic curve with P-384 and SHA-384. More secure but slightly slower.',
    },
];

const STEPS = [
    {
        id: 'personal',
        title: 'Personal Information',
        description: 'Let\'s start with your basic information',
        fields: [
            { key: 'first_name', label: 'First Name', required: true, type: 'text' },
            { key: 'last_name', label: 'Last Name', required: true, type: 'text' },
        ]
    },
    {
        id: 'birth',
        title: 'Birth Details',
        description: 'Information about your birth',
        fields: [
            { key: 'date_of_birth', label: 'Date of Birth', required: true, type: 'date' },
            { key: 'birth_country', label: 'Country of Birth', required: true, type: 'country' },
            { key: 'gender', label: 'Gender', required: true, type: 'gender' },
        ]
    },
    {
        id: 'nationality',
        title: 'Nationality',
        description: 'Your citizenship information',
        fields: [
            { key: 'nationality_1', label: 'Primary Nationality', required: true, type: 'country' },
            { key: 'nationality_2', label: 'Second Nationality (optional)', required: false, type: 'country' },
            { key: 'nationality_3', label: 'Third Nationality (optional)', required: false, type: 'country' },
        ]
    },
    {
        id: 'crypto',
        title: 'Cryptographic Settings',
        description: 'Advanced settings for your wallet',
        fields: [
            { key: 'signing_algorithm', label: 'Digital Signature Algorithm', required: true, type: 'algorithm' },
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

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    const [identityData, setIdentityData] = useState<IdentityData>({
        first_name: '',
        middle_names: '',
        last_name: '',
        nationality_1: '',
        nationality_2: '',
        nationality_3: '',
        date_of_birth: '',
        birth_country: '',
        gender: '',
        signing_algorithm: 'EcdsaP256_Sha256', // Default to recommended
    });

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [dateValue, setDateValue] = useState(new Date(2004, 1, 1));
    const [activeCountryPicker, setActiveCountryPicker] = useState<string | null>(null);
    const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
    const [countryNames, setCountryNames] = useState<Record<string, string>>({});

    useEffect(() => {
        // Animate welcome screen entrance
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 20,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handleStartOnboarding = () => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setShowWelcome(false);
        });
    };

    const currentStepData = STEPS[currentStep];

    const updateField = (key: string, value: string) => {
        setIdentityData(prev => ({ ...prev, [key]: value }));
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

    const handleCountrySelect = (country: Country, fieldKey: string) => {
        // Use ISO country code (e.g., 'US', 'FR', 'GB')
        const countryCode = country.cca2 || '';
        updateField(fieldKey, countryCode as string);
        // Store country name for display (handle the type safely)
        const displayName = typeof country.name === 'string' ? country.name : (country.name?.common || '');
        setCountryNames(prev => ({ ...prev, [fieldKey]: displayName }));
        setActiveCountryPicker(null);
    };

    const handleGenderSelectIOS = () => {
        ActionSheetIOS.showActionSheetWithOptions(
            {
                options: ['Cancel', ...GENDERS],
                cancelButtonIndex: 0,
                userInterfaceStyle: 'dark',
            },
            (buttonIndex) => {
                if (buttonIndex > 0) {
                    updateField('gender', GENDERS[buttonIndex - 1]);
                }
            }
        );
    };

    const canProceed = () => {
        return currentStepData.fields
            .filter(f => f.required)
            .every(f => identityData[f.key as keyof IdentityData].trim() !== '');
    };

    const handleNext = () => {
        if (!canProceed()) {
            Alert.alert('Required Fields', 'Please fill in all required fields');
            return;
        }

        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            setShowConfirmation(true);
        }
    };

    const handleBack = () => {
        if (showConfirmation) {
            setShowConfirmation(false);
        } else if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);

            // Create wallet with identity attributes
            const attributesMap: Record<string, string> = {};
            for (const [key, value] of Object.entries(identityData)) {
                if (key !== 'signing_algorithm' && value.trim() !== '') {
                    attributesMap[key] = value;
                }
            }

            const { wallet, signingPrivateKey, publicKeySpkiDer } = createWallet(attributesMap, identityData.signing_algorithm);

            // Map UI algorithm names to API scheme names
            const schemeMapping: Record<string, string> = {
                'EcdsaP256_Sha256': 'EcdsaP256_Sha256',
                'EcdsaP384_Sha384': 'EcdsaP384_Sha384',
                'Ed25519': 'EdDsaEd25519',
            };

            // Submit onboarding data to server and get back attributes with salts + anonymizing key
            const serverResponse = await testOnboardWallet({
                first_name: identityData.first_name,
                middle_names: identityData.middle_names || undefined,
                last_name: identityData.last_name,
                date_of_birth: identityData.date_of_birth,
                birth_country: identityData.birth_country,
                gender: identityData.gender.toLowerCase(), // API expects lowercase
                nationality_1: identityData.nationality_1,
                nationality_2: identityData.nationality_2 || undefined,
                nationality_3: identityData.nationality_3 || undefined,
                signing_scheme: schemeMapping[identityData.signing_algorithm] || 'EcdsaP256_Sha256',
                signing_public_key: publicKeySpkiDer,
            });

            // Decode server-provided anonymizing key from base64
            const anonymizingKey = Buffer.from(serverResponse.anonymizing_key, 'base64');

            // Create final wallet with server-assigned ID, attributes with salts, and anonymizing scheme
            const { wallet: finalWallet, signingPrivateKey: finalSigningKey } = createWalletFromOnboarding(
                serverResponse.wallet_id,
                serverResponse.identity_attributes,
                serverResponse.identity_attribute_hashing_scheme,
                serverResponse.anonymizing_hashing_scheme,
                identityData.signing_algorithm,
                signingPrivateKey,
                wallet.public_key
            );

            // Save wallet to secure storage after successful server registration
            const saved = await saveWallet(finalWallet, finalSigningKey, anonymizingKey);
            if (!saved) {
                throw new Error('Failed to save wallet to secure storage');
            }

            console.log('Wallet created and registered:', finalWallet.id);

            // Navigate back to startup which will load the wallet and handle authentication
            router.replace('/startup');
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
            <BackgroundImage>
                <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                    <Animated.View
                        style={[
                            styles.welcomeContainer,
                            {
                                opacity: fadeAnim,
                                transform: [{ scale: scaleAnim }],
                            },
                        ]}
                    >
                        <Column style={styles.welcomeContent}>
                            <PowmText variant="title" style={styles.welcomeTitle}>
                                Hello there! 👋
                            </PowmText>
                            <PowmText variant="text" style={styles.welcomeSubtitle}>
                                Welcome to Powm
                            </PowmText>
                            <PowmText variant="text" style={styles.welcomeDescription}>
                                Let's get you set up with a secure identity wallet. We'll need some information to create your digital identity.
                            </PowmText>

                            <Button
                                title="Get Started"
                                variant="primary"
                                icon="check"
                                onPress={handleStartOnboarding}
                                style={styles.welcomeButton}
                            />
                        </Column>
                    </Animated.View>
                </View>
            </BackgroundImage>
        );
    }

    if (showConfirmation) {
        return (
            <BackgroundImage>
                <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                    <Column style={styles.content}>
                        <PowmText variant="title" style={styles.title}>
                            Confirm Your Identity
                        </PowmText>
                        <PowmText variant="text" style={styles.description}>
                            Please review your information carefully
                        </PowmText>

                        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                            <GlassCard style={styles.confirmationCard}>
                                {Object.entries(identityData)
                                    .filter(([_, value]) => value.trim() !== '')
                                    .map(([key, value]) => {
                                        // Display country name instead of code for country fields
                                        const isCountryField = key === 'birth_country' || key.startsWith('nationality_');
                                        const displayValue = isCountryField && countryNames[key] ? countryNames[key] : value;

                                        return (
                                            <View key={key} style={styles.confirmationRow}>
                                                <PowmText variant="text" style={styles.confirmationLabel}>
                                                    {key.replace(/_/g, ' ').toUpperCase()}
                                                </PowmText>
                                                <PowmText variant="textSemiBold" style={styles.confirmationValue}>
                                                    {displayValue}
                                                </PowmText>
                                            </View>
                                        );
                                    })}
                            </GlassCard>
                        </ScrollView>

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
                    </Column>
                </View>
            </BackgroundImage>
        );
    }

    return (
        <BackgroundImage>
            <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                <Column style={styles.content}>
                    <View style={styles.header}>
                        <PowmText variant="title" style={styles.title}>
                            {currentStepData.title}
                        </PowmText>
                        <PowmText variant="text" style={styles.description}>
                            {currentStepData.description}
                        </PowmText>
                        <PowmText variant="text" style={styles.stepIndicator}>
                            Step {currentStep + 1} of {STEPS.length}
                        </PowmText>
                    </View>

                    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                        {currentStepData.id === 'crypto' ? (
                            <GlassCard style={styles.formCard}>
                                <View style={styles.advancedHeader}>
                                    <PowmText variant="text" style={styles.advancedTitle}>
                                        Wallet Creation
                                    </PowmText>
                                    <PowmText variant="text" style={styles.advancedWarning}>
                                        Your wallet will be created with secure default cryptographic settings.
                                    </PowmText>
                                </View>

                                <Pressable
                                    style={styles.advancedToggle}
                                    onPress={() => setShowAdvancedSettings(!showAdvancedSettings)}
                                >
                                    <PowmText variant="textSemiBold" style={styles.advancedToggleText}>
                                        {showAdvancedSettings ? '▼' : '▶'} Advanced Settings (Optional)
                                    </PowmText>
                                    <PowmText variant="text" style={styles.advancedToggleHint}>
                                        {showAdvancedSettings ? 'Hide' : 'Show'} cryptographic parameters
                                    </PowmText>
                                </Pressable>

                                {showAdvancedSettings && (
                                    <>
                                        <View style={styles.advancedWarningBox}>
                                            <PowmText variant="text" style={styles.advancedWarningBoxText}>
                                                ⚠️ These settings control the cryptographic parameters of your wallet. Only change these if you know what you're doing. The defaults are recommended for most users.
                                            </PowmText>
                                        </View>

                                        {currentStepData.fields.map((field: any) => (
                                            <View key={field.key} style={styles.fieldContainer}>
                                                <PowmText variant="textSemiBold" style={styles.fieldLabel}>
                                                    {field.label}
                                                    {field.required && <PowmText style={styles.required}> *</PowmText>}
                                                </PowmText>

                                                {field.type === 'algorithm' && (
                                                    <View style={styles.algorithmContainer}>
                                                        {SIGNING_ALGORITHMS.map((algo) => (
                                                            <Pressable
                                                                key={algo.value}
                                                                style={[
                                                                    styles.algorithmOption,
                                                                    identityData.signing_algorithm === algo.value && styles.algorithmOptionSelected
                                                                ]}
                                                                onPress={() => updateField('signing_algorithm', algo.value)}
                                                            >
                                                                <View style={styles.algorithmHeader}>
                                                                    <View style={[
                                                                        styles.radioButton,
                                                                        identityData.signing_algorithm === algo.value && styles.radioButtonSelected
                                                                    ]}>
                                                                        {identityData.signing_algorithm === algo.value && (
                                                                            <View style={styles.radioButtonInner} />
                                                                        )}
                                                                    </View>
                                                                    <PowmText variant="textSemiBold" style={styles.algorithmLabel}>
                                                                        {algo.label}
                                                                    </PowmText>
                                                                </View>
                                                                <PowmText variant="text" style={styles.algorithmDescription}>
                                                                    {algo.description}
                                                                </PowmText>
                                                            </Pressable>
                                                        ))}
                                                    </View>
                                                )}
                                            </View>
                                        ))}
                                    </>
                                )}
                            </GlassCard>
                        ) : (
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
                                                            minimumDate={new Date(1900, 0, 1)}
                                                        />
                                                    )
                                                )}
                                            </>
                                        ) : field.type === 'country' ? (
                                            <>
                                                <Pressable
                                                    style={styles.input}
                                                    onPress={() => setActiveCountryPicker(field.key)}
                                                >
                                                    <PowmText style={identityData[field.key as keyof IdentityData] ? styles.inputText : styles.placeholder}>
                                                        {countryNames[field.key] || identityData[field.key as keyof IdentityData] || `Select ${field.label.toLowerCase()}`}
                                                    </PowmText>
                                                </Pressable>
                                                <CountryPicker
                                                    countryCode={'US' as CountryCode}
                                                    visible={activeCountryPicker === field.key}
                                                    onClose={() => setActiveCountryPicker(null)}
                                                    onSelect={(country) => handleCountrySelect(country, field.key)}
                                                    withFilter
                                                    withFlag
                                                    withCountryNameButton
                                                    withAlphaFilter
                                                    withCallingCode
                                                    containerButtonStyle={{ display: 'none' }}
                                                />
                                            </>
                                        ) : field.type === 'gender' ? (
                                            Platform.OS === 'ios' ? (
                                                <Pressable
                                                    style={styles.input}
                                                    onPress={handleGenderSelectIOS}
                                                >
                                                    <PowmText style={identityData.gender ? styles.inputText : styles.placeholder}>
                                                        {identityData.gender || 'Select gender'}
                                                    </PowmText>
                                                </Pressable>
                                            ) : (
                                                <View style={styles.pickerContainer}>
                                                    <Picker
                                                        selectedValue={identityData.gender}
                                                        onValueChange={(value) => updateField('gender', value)}
                                                        style={styles.picker}
                                                        dropdownIconColor="rgba(255, 255, 255, 0.8)"
                                                    >
                                                        <Picker.Item label="Select gender" value="" />
                                                        {GENDERS.map(gender => (
                                                            <Picker.Item key={gender} label={gender} value={gender} />
                                                        ))}
                                                    </Picker>
                                                </View>
                                            )
                                        ) : (
                                            <TextInput
                                                style={styles.input}
                                                value={identityData[field.key as keyof IdentityData]}
                                                onChangeText={(value) => updateField(field.key, value)}
                                                placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                                                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                                                autoCapitalize="words"
                                            />
                                        )}
                                    </View>
                                ))}
                            </GlassCard>
                        )}
                    </ScrollView>

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
                            title={currentStep === STEPS.length - 1 ? "Review" : "Next"}
                            variant="primary"
                            icon="check"
                            onPress={handleNext}
                            disabled={!canProceed()}
                            style={styles.button}
                        />
                    </View>
                </Column>
            </View>
        </BackgroundImage>
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
