import { powmColors, powmRadii, powmSpacing } from '@/theme/powm-tokens';
import React from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { PowmText } from './PowmText';

interface GlassInputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const GlassInput: React.FC<GlassInputProps> = ({ 
  label, 
  error, 
  style, 
  ...props 
}) => {
  return (
    <View style={styles.wrapper}>
      {label && (
        <PowmText variant="text" color={powmColors.inactive} style={styles.label}>
          {label}
        </PowmText>
      )}
      <View style={[styles.container, error && styles.errorBorder]}>
        <TextInput
          placeholderTextColor={powmColors.gray}
          style={[styles.input, style]}
          selectionColor={powmColors.electricMain}
          {...props}
        />
      </View>
      {error && (
        <PowmText variant="text" color={powmColors.deletionRedHard} style={styles.errorText}>
          {error}
        </PowmText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: powmSpacing.md,
  },
  label: {
    marginBottom: 8,
    marginLeft: 4,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  container: {
    backgroundColor: powmColors.glass.background,
    borderRadius: powmRadii.lg,
    borderWidth: 1,
    borderColor: powmColors.glass.border,
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  input: {
    color: powmColors.white,
    fontSize: 16,
    fontFamily: 'Inter_500Medium', // Adjust based on your loaded fonts
  },
  errorBorder: {
    borderColor: powmColors.deletionRedHard,
  },
  errorText: {
    marginTop: 4,
    marginLeft: 4,
    fontSize: 12,
  },
});