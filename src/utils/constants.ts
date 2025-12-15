/**
 * Application-wide constants
 */

export const APP_NAME = 'Expo App';
export const APP_VERSION = '1.0.0';

/**
 * API configuration (example)
 */
export const API_CONFIG = {
  baseUrl: 'https://api.example.com',
  timeout: 10000,
} as const;

/**
 * Common animation durations (in milliseconds)
 */
export const ANIMATION_DURATION = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const;

/**
 * Screen breakpoints for responsive design
 */
export const BREAKPOINTS = {
  small: 320,
  medium: 768,
  large: 1024,
  xlarge: 1440,
} as const;

/**
 * Display names for identity attributes
 * NOTE: The order of keys here determines the display order in the app.
 */
export const ATTRIBUTE_DISPLAY_NAMES: Record<string, string> = {
  'anonymous_id': 'Anonymous Unique ID',
  'first_name': 'First Name',
  'last_name': 'Last Name',
  'date_of_birth': 'Date of Birth',
  'age_over_18': 'Age Over 18',
  'age_over_21': 'Age Over 21',
  'nationality_1': 'Nationality 1',
  'nationality_2': 'Nationality 2',
  'nationality_3': 'Nationality 3',
  'gender': 'Gender',
  'birth_country': 'Birth Country',
};
