export const DarkColors = {
  primary: '#10B981',       // Vibrant Emerald Green
  primaryLight: '#152E24',  // Deep emerald green shadow/background tint
  accent: '#F59E0B',        // Amber Gold for streaks/highlights
  accentLight: '#2D220B',   // Dark gold glow background
  background: '#09120F',    // Deep dark slate black background
  surface: '#11231D',       // Dark emerald-charcoal card surface
  textPrimary: '#ECF4F0',   // Main light text
  textSecondary: '#86A597', // Soft sage-green description text
  border: '#1E3A2F',        // Dark subtle borders
  success: '#10B981',       // Success emerald
  error: '#EF4444',         // Warning/Error red
  shadow: '#000000',        // Black shadows
};

export const LightColors = {
  primary: '#10B981',       // Vibrant Emerald Green
  primaryLight: '#D1FAE5',  // Soft pastel green background tint
  accent: '#D97706',        // Deeper Gold for light mode legibility
  accentLight: '#FEF3C7',   // Pastel gold glow background
  background: '#F3F4F6',    // Clean light grey background
  surface: '#FFFFFF',       // Bright white card surfaces
  textPrimary: '#111827',   // Bold charcoal-black text for readability
  textSecondary: '#4B5563', // Charcoal grey description text
  border: '#E5E7EB',        // Light subtle grey borders
  success: '#10B981',       // Success emerald
  error: '#EF4444',         // Warning/Error red
  shadow: '#9CA3AF',        // Soft grey shadows
};

// Fallback exports for non-migrated screens to prevent compilation crash
export const Colors = DarkColors;
