import {
  BackgroundImage,
  Button,
  Column,
  GlassCard,
  PowmText,
  ScreenHeader,
} from '@/components';
import { powmColors, powmSpacing } from '@/theme/powm-tokens';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ValidateIdentityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleReturnHome = () => {
    router.dismissAll();
  };

  return (
    <BackgroundImage>
      <View style={[styles.container, { paddingTop: insets.top + powmSpacing.xl, paddingBottom: insets.bottom + powmSpacing.lg }]}>
        
        <View style={styles.content}>
          {/* Header / Title Section */}
          <Column gap={powmSpacing.sm} style={styles.headerSection}>
             <PowmText variant="title" align="center">
              Instagram wants to{'\n'}know if you're <PowmText variant="title" color={powmColors.electricMain}>+18</PowmText>
            </PowmText>
          </Column>

          <View style={styles.spacer} />

          {/* Question Section */}
          <GlassCard style={styles.questionCard} variant="dark">
            <Column gap={powmSpacing.md}>
              <PowmText variant="subtitle" style={{ fontSize: 20 }}>Do you accept ?</PowmText>
              
              <PowmText variant="text" color={powmColors.inactive} style={styles.descriptionText}>
                Powm will not have any information or a way to link you to this check or this company. Powm respects the <PowmText variant="text" color={powmColors.electricMain}>double anonymat</PowmText>.
              </PowmText>

              <PowmText variant="text" color={powmColors.inactive} style={styles.descriptionText}>
                This is a one shot Identity ticket, it will be used one time by this company and impossible for them to link this information to your identity.
              </PowmText>
              
              <PowmText variant="text" color={powmColors.gray} style={[styles.descriptionText, { marginTop: powmSpacing.sm }]}>
                Do you accept to anonymously provide a Yes or No +18 proof to Instagram ?
              </PowmText>
            </Column>
          </GlassCard>

          <View style={styles.spacer} />

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
             <Button 
                title="No" 
                variant="secondary" 
                icon="cross" 
                onPress={handleReturnHome} 
                style={{ flex: 1 }} 
             />
             <View style={{ width: powmSpacing.md }} />
             <Button 
                title="Yes" 
                variant="primary" 
                icon="check" 
                onPress={() => {
                  console.log("Identity Validated");
                  handleReturnHome();
                }} 
                style={{ flex: 1 }} 
             />
          </View>
        </View>

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
    marginTop: powmSpacing.xl,
    alignItems: 'center',
  },
  spacer: {
    flex: 1,
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
