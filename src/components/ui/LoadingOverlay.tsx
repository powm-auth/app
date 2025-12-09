import { powmColors } from '@/theme/powm-tokens';
import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, View } from 'react-native';
import { PowmText } from './PowmText';

/**
 * LoadingOverlay Component
 * 
 * Full-screen loading overlay that blocks user interaction
 * Displays a spinner with optional message
 * 
 * @example
 * <LoadingOverlay visible={isLoading} message="Processing..." />
 */

export interface LoadingOverlayProps {
    visible: boolean;
    message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ visible, message }) => {
    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <ActivityIndicator size="large" color={powmColors.electricMain} />
                    {message && (
                        <PowmText variant="text" style={styles.message}>
                            {message}
                        </PowmText>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        backgroundColor: powmColors.mainBackgroundAlt,
        borderRadius: 16,
        padding: 32,
        alignItems: 'center',
        minWidth: 200,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    message: {
        marginTop: 16,
        textAlign: 'center',
    },
});
