/**
 * Powm Color Tokens
 * Official Powm color palette
 */
export const powmColors = {
  // Primary Electric Purple
  electricMain: '#A06BFF',
  electricFade: '#41207D',

  // Active State
  activeElectricMain: '#606BE2',
  activeElectricFade: '#1E1E74',

  // Scan Button
  scanButtonBg: '#1F1938',

  // Orange Electric
  orangeElectricMain: '#FF9A2E',
  orangeElectricFade: '#4E3A24',

  // Backgrounds
  mainBackground: '#060410',
  mainBackgroundAlt: '#2A2834',
  rowBackground: 'rgba(26, 24, 36, 0.86)',

  // Neutral
  white: '#FFFFFF',
  gray: '#C5C5C5',
  inactive: '#7D7C85',

  // Deletion/Error
  deletionRedHard: '#7B2425',
  deletionRedAlt: '#4D1617',
  deletionRedMain: '#FF453A',

  // Success
  successGreen: '#32D74B',

  // Glass Morphism
  glass: {
    background: 'rgba(30, 28, 40, 0.6)',
    border: 'rgba(255, 255, 255, 0.05)',
    pressed: 'rgba(255, 255, 255, 0.03)',
    iconBackground: 'rgba(255, 255, 255, 0.07)',
    separator: 'rgba(255, 255, 255, 0.05)',
  },
} as const;

export type PowmColorToken = keyof typeof powmColors;
