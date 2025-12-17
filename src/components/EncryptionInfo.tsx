import { PowmText } from '@/components/ui';
import { powmColors, powmSpacing } from '@/theme/powm-tokens';
import React from 'react';
import { Alert, Text, View } from 'react-native';

interface EncryptionInfoProps {
    appName?: string;
    encryptionScheme?: string;
    variant?: 'sending' | 'receiving';
}

export function EncryptionInfo({ appName, encryptionScheme, variant = 'sending' }: EncryptionInfoProps) {
    const isSending = variant === 'sending';

    const getEncryptionSchemeName = (scheme: string) => {
        switch (scheme) {
            case 'ecdhx25519_hkdfsha256_aes256gcm':
                return 'X25519 (Modern High-Performance)';
            case 'ecdhp256_hkdfsha256_aes256gcm':
                return 'P-256 (NIST Standard)';
            case 'ecdhp384_hkdfsha384_aes256gcm':
                return 'P-384 (High Security)';
            default:
                return scheme?.split('_').map(s => s.toUpperCase()).join('-') || 'Unknown';
        }
    };

    return (
        <View style={{ marginTop: powmSpacing.lg }}>
            <PowmText variant="text" color={powmColors.inactive} style={{ lineHeight: 20 }}>
                🔒 <PowmText variant="text" color={powmColors.electricMain}>End-to-end encrypted</PowmText> -{' '}
                <Text
                    style={{ color: powmColors.electricMain, textDecorationLine: 'underline' }}
                    onPress={() => {
                        const message = isSending
                            ? `Your identity is end-to-end encrypted and sent to ${appName || 'the requester'}.\n\n` +
                            '✅ Sensitive data (such as your name) are never readable by Powm servers\n\n' +
                            '✅ Non-sensitive data (such as your gender or age) uses privacy-enhancing techniques to prevent tracking\n\n' +
                            `✅ ${appName || 'The requester'} receives your encrypted identity and can verify its authenticity\n\n` +
                            'Powm provides cryptographic proof without accessing your sensitive information.'
                            : 'The identity was end-to-end encrypted and sent directly to you.\n\n' +
                            '✅ Sensitive data (such as name) never reaches Powm servers\n\n' +
                            '✅ Non-sensitive data (such as gender or age) uses privacy-enhancing techniques to prevent tracking\n\n' +
                            '✅ You received the encrypted identity and verified its authenticity\n\n' +
                            'Powm provides cryptographic proof without accessing sensitive information.';

                        Alert.alert('How Powm Works', message);
                    }}
                >
                    Learn more
                </Text>
            </PowmText>

            {encryptionScheme && (
                <PowmText variant="text" color={powmColors.inactive} style={{ fontSize: 11, marginTop: powmSpacing.sm, textAlign: 'right' }}>
                    Encryption: {getEncryptionSchemeName(encryptionScheme)}
                </PowmText>
            )}
        </View>
    );
}
