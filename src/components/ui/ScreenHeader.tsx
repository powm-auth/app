import { PowmIcon } from './PowmIcon';
import { PowmText } from './PowmText';
import { Row } from './Row';
import { powmColors, powmSpacing } from '@/theme/powm-tokens';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';

interface ScreenHeaderProps {
  title: string;
  showBackButton?: boolean;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Standard Screen Header with Title and Back Button.
 */
export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  showBackButton = true,
  onBack,
  rightElement,
  style,
}) => {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <Row align="center" style={[styles.container, style]}>
      {showBackButton && (
        <Pressable onPress={handleBack} hitSlop={10} style={styles.backButton}>
          <PowmIcon
            name="chevron"
            size={24}
            color={powmColors.white}
            style={styles.backIcon}
          />
        </Pressable>
      )}

      <View style={styles.titleContainer}>
        <PowmText variant="title" align="center" style={styles.title}>
          {title}
        </PowmText>
      </View>

      <View style={styles.rightContainer}>
        {rightElement || (showBackButton && <View style={styles.placeholder} />)}
      </View>
    </Row>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: powmSpacing.md,
    height: 48,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: powmColors.glass.iconBackground,
    borderRadius: 20,
    zIndex: 10,
  },
  backIcon: {
    transform: [{ rotate: '180deg' }],
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // Absolute positioning to ensure true center regardless of back button
    position: 'absolute',
    left: 0,
    right: 0,
  },
  title: {
    fontSize: 20,
  },
  rightContainer: {
    width: 40, // Matches back button width for spacing
    alignItems: 'flex-end',
    zIndex: 10,
  },
  placeholder: {
    width: 40,
  },
});
