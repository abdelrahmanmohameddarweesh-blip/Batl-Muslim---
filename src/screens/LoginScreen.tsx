import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  StyleSheet, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function LoginScreen({ navigation }: any) {
  const { user, loading, login } = useAuth();
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (user) {
      navigation.replace('HomeTabs');
    }
  }, [user, navigation]);

  const handleContinue = async () => {
    if (!name.trim()) {
      setError('الرجاء كتابة اسمك للبدء في رحلة التحدي!');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await login(name.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollViewContent
          name={name}
          setName={setName}
          error={error}
          setError={setError}
          isFocused={isFocused}
          setIsFocused={setIsFocused}
          handleContinue={handleContinue}
          saving={saving}
          loading={loading}
          colors={colors}
        />
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

// Separate stateless renderer to keep components clean
function ScrollViewContent({
  name, setName, error, setError, isFocused, setIsFocused, handleContinue, saving, loading, colors
}: any) {
  return (
    <View style={styles.innerContainer}>
      <View style={styles.topSection}>
        {/* Rosette Islamic Logo with Bolt */}
        <View style={styles.logoShadowWrapper}>
          <LinearGradient
            colors={['#10B981', '#047857']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoContainer}
          >
            <View style={styles.rosetteSquare1} />
            <View style={styles.rosetteSquare2} />
            
            {/* SVG Bolt Glyph */}
            <Svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={styles.boltIcon}>
              <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </Svg>
          </LinearGradient>
        </View>

        {/* Wordmark */}
        <Text style={[styles.wordmark, { color: colors.textPrimary }]}>بطل مسلم</Text>
        
        {/* Subtitle */}
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          ابدأ رحلتك الإسلامية الممتعة ونافس اللاعبين حول العالم
        </Text>
      </View>

      <View style={styles.middleSection}>
        {/* Input Label */}
        <Text style={[styles.inputLabel, { color: colors.textBody }]}>اسمك في الميدان</Text>
        
        {/* Input Row */}
        <View style={[
          styles.inputRow,
          { borderColor: error ? '#E7000B' : isFocused ? '#10B981' : colors.border },
          isFocused && !error && styles.inputRowFocused
        ]}>
          {/* Trailing Character Counter */}
          <Text style={[styles.charCounter, { color: colors.textTertiary }]}>
            {name.length}/18
          </Text>

          {/* Text Input */}
          <TextInput
            style={[styles.input, { color: colors.textPrimary }]}
            placeholder="اكتب اسمك هنا للبدء..."
            placeholderTextColor={colors.textTertiary}
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (error) setError('');
            }}
            maxLength={18}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            returnKeyType="done"
            onSubmitEditing={handleContinue}
            blurOnSubmit={true}
          />

          {/* Leading User SVG Icon */}
          <Svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles.userIcon}>
            <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <Circle cx="12" cy="7" r="4" />
          </Svg>
        </View>

        {/* Helper/Error message */}
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            يظهر هذا الاسم على لوحة الصدارة وفي المبارزات.
          </Text>
        )}

        {/* Features Chips Row */}
        <View style={styles.chipsRow}>
          <View style={[styles.chip, { backgroundColor: '#ECFDF5', borderColor: '#A4F4CF' }]}>
            <Text style={[styles.chipText, { color: '#00604F' }]}>٩ تحديات</Text>
          </View>
          <View style={[styles.chip, { backgroundColor: '#FFF7ED', borderColor: '#FFD6A7' }]}>
            <Text style={[styles.chipText, { color: '#973C00' }]}>مبارزات ١×١</Text>
          </View>
          <View style={[styles.chip, { backgroundColor: '#EFF6FF', borderColor: '#BEDBFF' }]}>
            <Text style={[styles.chipText, { color: '#1447E6' }]}>لوحة صدارة</Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomSection}>
        {/* Action Button */}
        {loading || saving ? (
          <ActivityIndicator size="large" color="#059669" style={styles.loader} />
        ) : (
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={handleContinue}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaButtonText}>ابدأ اللعب الآن</Text>
          </TouchableOpacity>
        )}

        {/* Footnote */}
        <Text style={[styles.footnote, { color: colors.textTertiary }]}>
          لا حاجة لبريد أو كلمة مرور — تقدّمك محفوظ على جهازك.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 28,
  },
  topSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoShadowWrapper: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.35,
    shadowRadius: 25,
    elevation: 8,
    marginBottom: 24,
  },
  logoContainer: {
    width: 104,
    height: 104,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  rosetteSquare1: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 2,
  },
  rosetteSquare2: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
  },
  boltIcon: {
    zIndex: 2,
  },
  wordmark: {
    fontSize: 34,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.68,
    marginBottom: 8,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 27,
    maxWidth: 290,
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  middleSection: {
    width: '100%',
    marginVertical: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 8,
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  inputRow: {
    flexDirection: 'row-reverse',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  inputRowFocused: {
    shadowColor: 'rgba(16, 185, 129, 0.12)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  userIcon: {
    marginLeft: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
    padding: 0,
    fontFamily: 'IBMPlexSansArabic-SemiBold',
  },
  charCounter: {
    fontSize: 11,
    fontWeight: '600',
    marginRight: 8,
    writingDirection: 'ltr',
  },
  helperText: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'right',
    marginTop: 8,
    marginBottom: 20,
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  errorText: {
    color: '#E7000B',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    marginTop: 8,
    marginBottom: 20,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  chipsRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'IBMPlexSansArabic-SemiBold',
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
  },
  ctaButton: {
    backgroundColor: '#059669',
    paddingVertical: 17,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 5,
    marginBottom: 16,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  loader: {
    marginVertical: 18,
  },
  footnote: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
});
