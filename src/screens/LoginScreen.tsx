import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  StyleSheet, Keyboard, KeyboardAvoidingView, Platform, ScrollView, Image, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function LoginScreen({ navigation }: any) {
  const { user, loading, login } = useAuth();
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [age, setAge] = useState('');
  const [photoUri, setPhotoUri] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [focusedField, setFocusedField] = useState<'name' | 'phone' | 'country' | 'age' | null>(null);

  useEffect(() => {
    if (user) {
      navigation.replace('HomeTabs');
    }
  }, [user, navigation]);

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('صلاحية الأستوديو', 'الرجاء تمكين الوصول للأستوديو لاختيار صورة حسابك.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleContinue = async () => {
    if (!name.trim()) {
      setError('الرجاء كتابة اسمك للبدء في رحلة التحدي!');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const parsedAge = age.trim() ? parseInt(age.trim(), 10) : undefined;
      await login(name.trim(), phone.trim(), country.trim(), parsedAge, photoUri || undefined);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
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
            {/* Avatar Upload Container */}
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <TouchableOpacity 
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: 45,
                  backgroundColor: '#ECFDF5',
                  borderColor: '#10B981',
                  borderWidth: 2,
                  justifyContent: 'center',
                  alignItems: 'center',
                  overflow: 'hidden',
                }}
                onPress={handlePickAvatar}
                activeOpacity={0.8}
              >
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={{ width: 90, height: 90, borderRadius: 45 }} />
                ) : (
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 24 }}>📸</Text>
                    <Text style={{ fontSize: 10, color: '#047857', fontWeight: '700', marginTop: 2 }}>صورة الحساب</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Input Label - Name */}
            <Text style={[styles.inputLabel, { color: colors.textBody }]}>اسمك في الميدان</Text>
            
            {/* Input Row - Name */}
            <View style={[
              styles.inputRow,
              { borderColor: error ? '#E7000B' : focusedField === 'name' ? '#10B981' : colors.border },
              focusedField === 'name' && !error && styles.inputRowFocused
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
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                returnKeyType="next"
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
              <Text style={[styles.helperText, { color: colors.textSecondary, marginBottom: 8 }]}>
                يظهر هذا الاسم على لوحة الصدارة وفي المبارزات.
              </Text>
            )}

            {/* Input Label - Phone */}
            <Text style={[styles.inputLabel, { color: colors.textBody, marginTop: 12 }]}>رقم الهاتف (اختياري)</Text>
            
            {/* Input Row - Phone */}
            <View style={[
              styles.inputRow,
              { borderColor: focusedField === 'phone' ? '#10B981' : colors.border },
              focusedField === 'phone' && styles.inputRowFocused
            ]}>
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder="مثال: 00966..."
                placeholderTextColor={colors.textTertiary}
                value={phone}
                onChangeText={setPhone}
                maxLength={15}
                keyboardType="phone-pad"
                onFocus={() => setFocusedField('phone')}
                onBlur={() => setFocusedField(null)}
                returnKeyType="next"
              />

              <Svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles.userIcon}>
                <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </Svg>
            </View>
            <Text style={[styles.helperText, { color: colors.textSecondary, marginBottom: 8 }]}>
              رقم هاتفك يُستخدم للتحقق والترقية (يبقى آمناً تماماً).
            </Text>

            {/* Input Label - Country */}
            <Text style={[styles.inputLabel, { color: colors.textBody, marginTop: 12 }]}>الدولة (اختياري)</Text>
            
            {/* Input Row - Country */}
            <View style={[
              styles.inputRow,
              { borderColor: focusedField === 'country' ? '#10B981' : colors.border },
              focusedField === 'country' && styles.inputRowFocused
            ]}>
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder="مثال: السعودية، مصر..."
                placeholderTextColor={colors.textTertiary}
                value={country}
                onChangeText={setCountry}
                maxLength={25}
                onFocus={() => setFocusedField('country')}
                onBlur={() => setFocusedField(null)}
                returnKeyType="next"
              />

              <Svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles.userIcon}>
                <Path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </Svg>
            </View>
            <Text style={[styles.helperText, { color: colors.textSecondary, marginBottom: 8 }]}>
              تُعرض دولتك بجانب اسمك في لوحات الصدارة العالمية.
            </Text>

            {/* Input Label - Age */}
            <Text style={[styles.inputLabel, { color: colors.textBody, marginTop: 12 }]}>العمر (اختياري)</Text>
            
            {/* Input Row - Age */}
            <View style={[
              styles.inputRow,
              { borderColor: focusedField === 'age' ? '#10B981' : colors.border },
              focusedField === 'age' && styles.inputRowFocused
            ]}>
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder="مثال: 12..."
                placeholderTextColor={colors.textTertiary}
                value={age}
                onChangeText={(text) => setAge(text.replace(/[^0-9]/g, ''))}
                maxLength={3}
                keyboardType="number-pad"
                onFocus={() => setFocusedField('age')}
                onBlur={() => setFocusedField(null)}
                returnKeyType="done"
                onSubmitEditing={handleContinue}
              />

              <Svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles.userIcon}>
                <Circle cx="12" cy="12" r="10" />
                <Path d="M12 6v6l4 2" />
              </Svg>
            </View>
            <Text style={[styles.helperText, { color: colors.textSecondary, marginBottom: 16 }]}>
              يُساعدنا العمر في عرض وتخصيص أسئلة مناسبة لسنّك.
            </Text>

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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  innerContainer: {
    flex: 1,
    minHeight: 680,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingTop: 30,
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
