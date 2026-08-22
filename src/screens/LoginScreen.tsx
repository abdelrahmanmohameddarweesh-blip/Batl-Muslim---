import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  StyleSheet, Keyboard, KeyboardAvoidingView, Platform, ScrollView, Image, Alert, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const countriesList = [
  { code: 'EG', nameAr: 'مصر 🇪🇬', nameEn: 'Egypt', ext: '+20' },
  { code: 'SA', nameAr: 'السعودية 🇸🇦', nameEn: 'Saudi Arabia', ext: '+966' },
  { code: 'JO', nameAr: 'الأردن 🇯🇴', nameEn: 'Jordan', ext: '+962' },
  { code: 'PS', nameAr: 'فلسطين 🇵🇸', nameEn: 'Palestine', ext: '+970' },
  { code: 'AE', nameAr: 'الإمارات 🇦🇪', nameEn: 'UAE', ext: '+971' },
  { code: 'MA', nameAr: 'المغرب 🇲🇦', nameEn: 'Morocco', ext: '+212' },
  { code: 'OTH', nameAr: 'أخرى 🌍', nameEn: 'Other', ext: '+' },
];

const validatePhoneNumber = (phone: string, countryCode: string): boolean => {
  const cleanPhone = phone.replace(/\s+/g, '');
  if (!cleanPhone) return true; // Optional field
  
  switch (countryCode) {
    case 'EG':
      return /^1[0125][0-9]{8}$/.test(cleanPhone); // Egypt: 10 digits starting with 1
    case 'SA':
      return /^5[0-9]{8}$/.test(cleanPhone); // Saudi: 9 digits starting with 5
    case 'JO':
      return /^7[789][0-9]{7}$/.test(cleanPhone); // Jordan: 9 digits starting with 7
    case 'AE':
      return /^5[024568][0-9]{7}$/.test(cleanPhone); // UAE: 9 digits starting with 5
    case 'MA':
      return /^[567][0-9]{8}$/.test(cleanPhone); // Morocco: 9 digits starting with 5, 6, 7
    case 'PS':
      return /^[5-9][0-9]{8}$/.test(cleanPhone); // Palestine: 9 digits starting with 5-9
    default:
      return /^[0-9]{5,15}$/.test(cleanPhone); // General standard length
  }
};

export default function LoginScreen({ navigation }: any) {
  const { user, loading, login } = useAuth();
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState(countriesList[0].nameAr);
  const [age, setAge] = useState('');
  const [error, setError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [saving, setSaving] = useState(false);
  const [focusedField, setFocusedField] = useState<'name' | 'phone' | 'country' | 'age' | null>(null);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [selectedCountryObj, setSelectedCountryObj] = useState(countriesList[0]);

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

    if (phone.trim()) {
      const isValid = validatePhoneNumber(phone.trim(), selectedCountryObj.code);
      if (!isValid) {
        setPhoneError(`رقم الهاتف غير مطابق لصيغة دولة ${selectedCountryObj.nameAr}`);
        return;
      }
    }

    setError('');
    setPhoneError('');
    setSaving(true);
    try {
      const parsedAge = age.trim() ? parseInt(age.trim(), 10) : undefined;
      const fullPhone = phone.trim() ? `${selectedCountryObj.ext}${phone.trim()}` : '';
      await login(name.trim(), fullPhone, country.trim(), parsedAge);
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

            {/* Input Label - Country */}
            <Text style={[styles.inputLabel, { color: colors.textBody, marginTop: 12 }]}>الدولة (اختياري)</Text>
            
            {/* Input Row - Country Dropdown */}
            <TouchableOpacity 
              style={[
                styles.inputRow,
                { borderColor: focusedField === 'country' ? '#10B981' : colors.border },
                { justifyContent: 'space-between', alignItems: 'center', flexDirection: 'row-reverse', paddingHorizontal: 12 }
              ]}
              onPress={() => {
                Keyboard.dismiss();
                setShowCountryModal(true);
              }}
              activeOpacity={0.8}
            >
              <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '600' }}>
                {selectedCountryObj?.nameAr || 'اختر دولتك...'}
              </Text>
              
              <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M6 9l6 6 6-6" />
              </Svg>
            </TouchableOpacity>
            <Text style={[styles.helperText, { color: colors.textSecondary, marginBottom: 8 }]}>
              تُعرض دولتك بجانب اسمك في لوحات الصدارة العالمية.
            </Text>

            {/* Input Label - Phone */}
            <Text style={[styles.inputLabel, { color: colors.textBody, marginTop: 12 }]}>رقم الهاتف (اختياري)</Text>
            
            {/* Input Row - Phone */}
            <View style={[
              styles.inputRow,
              { borderColor: phoneError ? '#E7000B' : focusedField === 'phone' ? '#10B981' : colors.border },
              focusedField === 'phone' && !phoneError && styles.inputRowFocused
            ]}>
              <TextInput
                style={[styles.input, { color: colors.textPrimary, paddingLeft: 8 }]}
                placeholder={selectedCountryObj.code === 'EG' ? 'مثال: 1012345678' : 'أدخل رقم الهاتف...'}
                placeholderTextColor={colors.textSecondary}
                value={phone}
                onChangeText={(text) => {
                  setPhone(text.replace(/[^0-9]/g, ''));
                  if (phoneError) setPhoneError('');
                }}
                maxLength={12}
                keyboardType="phone-pad"
                onFocus={() => setFocusedField('phone')}
                onBlur={() => setFocusedField(null)}
                returnKeyType="next"
              />

              {/* Country Extension Prefix */}
              <View style={{ paddingHorizontal: 12, borderRightWidth: 1, borderRightColor: colors.border, justifyContent: 'center' }}>
                <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 14 }}>
                  {selectedCountryObj?.ext || '+'}
                </Text>
              </View>
            </View>
            {phoneError ? (
              <Text style={styles.errorText}>{phoneError}</Text>
            ) : (
              <Text style={[styles.helperText, { color: colors.textSecondary, marginBottom: 8 }]}>
                رقم هاتفك يُستخدم للتحقق والترقية (يبقى آمناً تماماً).
              </Text>
            )}

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

      {/* Custom Country Picker Dropdown Modal */}
      <Modal
        visible={showCountryModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCountryModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCountryModal(false)}
        >
          <View style={[styles.dropdownModalContainer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.dropdownModalTitle, { color: colors.textPrimary }]}>اختر الدولة</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {countriesList.map((c) => (
                <TouchableOpacity
                  key={c.code}
                  style={[
                    styles.dropdownModalItem,
                    selectedCountryObj.code === c.code && { backgroundColor: colors.primaryTint }
                  ]}
                  onPress={() => {
                    setSelectedCountryObj(c);
                    setCountry(c.nameAr);
                    setPhone(''); // reset phone on country change
                    setPhoneError('');
                    setShowCountryModal(false);
                  }}
                >
                  <Text style={{ fontSize: 16, color: colors.textPrimary, fontWeight: '700' }}>{c.nameAr}</Text>
                  <Text style={{ fontSize: 14, color: colors.textSecondary }}>{c.ext}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dropdownModalContainer: {
    width: '90%',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  dropdownModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  dropdownModalItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB',
    alignItems: 'center',
  },
});
