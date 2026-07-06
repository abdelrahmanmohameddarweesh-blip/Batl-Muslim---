import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { getCurrentUserProfile, updateUserCountry } from '../firebase/auth';
import { badgesCatalog, checkUnlockedBadges } from '../data/badges';
import AdBanner from '../components/AdBanner';
import { Colors } from '../config/colors';

const countriesList = [
  { code: 'EG', nameAr: 'مصر 🇪🇬', nameEn: 'Egypt' },
  { code: 'SA', nameAr: 'السعودية 🇸🇦', nameEn: 'Saudi Arabia' },
  { code: 'JO', nameAr: 'الأردن 🇯🇴', nameEn: 'Jordan' },
  { code: 'PS', nameAr: 'فلسطين 🇵🇸', nameEn: 'Palestine' },
  { code: 'AE', nameAr: 'الإمارات 🇦🇪', nameEn: 'UAE' },
  { code: 'MA', nameAr: 'المغرب 🇲🇦', nameEn: 'Morocco' },
  { code: 'OTH', nameAr: 'أخرى 🌍', nameEn: 'Other' },
];

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { theme, colors, toggleTheme, isLightMode } = useTheme();
  const styles = getStyles(colors);
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [unlockedBadgeIds, setUnlockedBadgeIds] = useState<string[]>([]);

  const loadProfile = async () => {
    if (!user?.uid) {
      return;
    }
    setLoading(true);
    try {
      const currentProfile = await getCurrentUserProfile(user.uid);
      setProfile(currentProfile);

      // Load unlocked badges dynamically based on user stats
      const unlocked = await checkUnlockedBadges(currentProfile?.score ?? 0);
      setUnlockedBadgeIds(unlocked);
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user?.uid]);

  const currentScore = profile?.score ?? 0;

  const levelName = useMemo(() => {
    if (currentScore >= 500) return language === 'ar' ? 'البطل الأسطوري' : 'Legendary Hero';
    if (currentScore >= 200) return language === 'ar' ? 'بطل ذهبي' : 'Gold Hero';
    if (currentScore >= 80) return language === 'ar' ? 'بطل فضي' : 'Silver Hero';
    return language === 'ar' ? 'بطل مبتدئ' : 'Novice Hero';
  }, [currentScore, language]);

  const formattedDate = useMemo(() => {
    if (!profile?.lastPlayedAt) return language === 'ar' ? 'لم تلعب بعد' : 'No activity yet';
    try {
      const date = new Date(profile.lastPlayedAt);
      return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return language === 'ar' ? 'تاريخ غير معروف' : 'Unknown date';
    }
  }, [profile?.lastPlayedAt, language]);

  return (
    <ScrollView style={styles.outerContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        <Text style={styles.title}>{t('profileTitle')}</Text>
        
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : (
          <>
            {/* Profile Card Header */}
            <View style={styles.profileHeaderCard}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {user?.displayName ? user.displayName[0].toUpperCase() : '👤'}
                </Text>
              </View>
              <Text style={styles.profileName}>
                {user?.displayName || (language === 'ar' ? 'ضيف' : 'Guest')}
              </Text>
              <View style={styles.levelBadge}>
                <Text style={styles.levelBadgeText}>🏆 {levelName}</Text>
              </View>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{currentScore}</Text>
                <Text style={styles.statLbl}>{language === 'ar' ? 'مجموع النقاط' : 'Total Score'}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>
                  {unlockedBadgeIds.length} / {badgesCatalog.length}
                </Text>
                <Text style={styles.statLbl}>{language === 'ar' ? 'الأوسمة المفتوحة' : 'Unlocked Badges'}</Text>
              </View>
            </View>

            {/* Cabinet of Badges / Sticker Cabinet */}
            <Text style={styles.sectionTitle}>{t('badgesTitle')}</Text>
            <Text style={styles.sectionSubtitle}>{t('badgesDesc')}</Text>
            
            <View style={styles.badgesCabinet}>
              {badgesCatalog.map((badge) => {
                const isUnlocked = unlockedBadgeIds.includes(badge.id);
                return (
                  <View
                    key={badge.id}
                    style={[
                      styles.badgeCard,
                      isUnlocked 
                        ? { borderColor: badge.color, backgroundColor: `${badge.color}1E` }
                        : styles.badgeCardLocked
                    ]}
                  >
                    <View style={[styles.badgeEmojiWrapper, !isUnlocked && styles.badgeEmojiWrapperLocked]}>
                      <Text style={[styles.badgeEmoji, !isUnlocked && styles.badgeEmojiLocked]}>
                        {badge.emoji}
                      </Text>
                    </View>
                    <Text style={[styles.badgeTitle, !isUnlocked && styles.badgeTitleLocked]}>
                      {language === 'ar' ? badge.titleAr : badge.titleEn}
                    </Text>
                    <Text style={[styles.badgeDesc, !isUnlocked && styles.badgeDescLocked]}>
                      {language === 'ar' ? badge.descAr : badge.descEn}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Details Card with Language Switcher */}
            <View style={styles.detailsCard}>
              <Text style={styles.cardTitle}>{language === 'ar' ? 'تفاصيل الحساب والاعدادات' : 'Account details & Settings'}</Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailValue}>{user?.uid ? (language === 'ar' ? 'نشط (محلي)' : 'Active (Local)') : 'Offline'}</Text>
                <Text style={styles.detailLabel}>{language === 'ar' ? 'حالة الاتصال' : 'Connection status'}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailValue}>{formattedDate}</Text>
                <Text style={styles.detailLabel}>{language === 'ar' ? 'آخر نشاط' : 'Last activity'}</Text>
              </View>

              {/* Language Switcher Toggle */}
              <View style={styles.detailRow}>
                <View style={styles.langSwitchContainer}>
                  <TouchableOpacity
                    style={[styles.langBtn, language === 'ar' && styles.langBtnActive]}
                    onPress={() => setLanguage('ar')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.langBtnText, language === 'ar' && styles.langBtnTextActive]}>عربي</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.langBtn, language === 'en' && styles.langBtnActive]}
                    onPress={() => setLanguage('en')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.langBtnText, language === 'en' && styles.langBtnTextActive]}>English</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.detailLabel}>{t('langToggle')}</Text>
              </View>

              {/* Country Selection */}
              <View style={styles.detailRowCol}>
                <Text style={styles.detailLabelCol}>{t('selectCountry')}</Text>
                <View style={styles.countryListContainer}>
                  {countriesList.map((c) => {
                    const isSelected = profile?.countryCode === c.code;
                    return (
                      <TouchableOpacity
                        key={c.code}
                        style={[styles.countryBadge, isSelected && styles.countryBadgeActive]}
                        onPress={async () => {
                          if (user?.uid) {
                            await updateUserCountry(user.uid, c.nameEn, c.code);
                            loadProfile();
                          }
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.countryBadgeText, isSelected && styles.countryBadgeTextActive]}>
                          {language === 'ar' ? c.nameAr : c.nameEn}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.progressBarSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>
                    {language === 'ar' ? 'التقدم للترقية القادمة' : 'Progress to next promotion'}
                  </Text>
                  <Text style={styles.progressVal}>{Math.min(currentScore, 100)}/100</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${Math.min(currentScore, 100)}%` }]} />
                </View>
              </View>
            </View>

            {/* Theme Toggle Card */}
            <View style={styles.themeToggleCard}>
              <View style={styles.themeHeader}>
                <Text style={styles.themeTitle}>
                  {language === 'ar' ? 'مظهر التطبيق' : 'App Theme'}
                </Text>
                <Text style={styles.themeSub}>
                  {language === 'ar' 
                    ? (isLightMode ? 'مظهر مضيء ☀️' : 'مظهر داكن 🌙') 
                    : (isLightMode ? 'Light Mode ☀️' : 'Dark Mode 🌙')}
                </Text>
              </View>
              <TouchableOpacity style={styles.themeToggleBtn} onPress={toggleTheme} activeOpacity={0.8}>
                <Text style={styles.themeToggleBtnText}>
                  {language === 'ar' ? 'تغيير المظهر 🔄' : 'Change Theme 🔄'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Motivational Note */}
            <View style={styles.noteCard}>
              <Text style={styles.noteText}>
                💡 {language === 'ar' 
                  ? '"من سلك طريقًا يلتمس فيه علمًا، سهّل الله له به طريقًا إلى الجنة." استمر في تحدي المعرفة اليومي!'
                  : '"Whoever follows a path in pursuit of knowledge, Allah will make easy for him a path to Paradise." Keep up your daily quest!'}
              </Text>
            </View>

            {/* Logout Button */}
            <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.85}>
              <Text style={styles.logoutButtonText}>{t('logout')} ➔</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.adWrapper}>
          <AdBanner />
        </View>
      </View>
    </ScrollView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 20,
  },
  loader: {
    marginTop: 40,
  },
  profileHeaderCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    paddingVertical: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  levelBadge: {
    backgroundColor: colors.accentLight,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#F59E0B33',
  },
  levelBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.accent,
  },
  statsGrid: {
    flexDirection: 'row-reverse',
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statVal: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.primary,
    marginBottom: 4,
  },
  statLbl: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.textPrimary,
    textAlign: 'right',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'right',
    marginBottom: 16,
    fontWeight: '700',
  },
  badgesCabinet: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  badgeCard: {
    width: '48%',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  badgeCardLocked: {
    borderColor: '#1E3A2F',
    backgroundColor: '#11231D50',
    opacity: 0.5,
  },
  badgeEmojiWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeEmojiWrapperLocked: {
    backgroundColor: '#09120F',
  },
  badgeEmoji: {
    fontSize: 24,
  },
  badgeEmojiLocked: {
    opacity: 0.3,
  },
  badgeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  badgeTitleLocked: {
    color: colors.textSecondary,
  },
  badgeDesc: {
    fontSize: 9,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 12,
    fontWeight: '700',
  },
  badgeDescLocked: {
    color: '#86A59780',
  },
  detailsCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.textPrimary,
    marginBottom: 16,
    textAlign: 'right',
  },
  detailRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#1E3A2F4D',
  },
  detailLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  detailValue: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '800',
  },
  detailRowCol: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#1E3A2F4D',
  },
  detailLabelCol: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'right',
  },
  countryListContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-start',
    marginTop: 4,
  },
  countryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#09120F',
    borderWidth: 1.5,
    borderColor: '#1E3A2F',
  },
  countryBadgeActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  countryBadgeText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '800',
  },
  countryBadgeTextActive: {
    color: '#09120F',
    fontWeight: '900',
  },
  langSwitchContainer: {
    flexDirection: 'row',
    backgroundColor: '#09120F',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: '#1E3A2F',
  },
  langBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  langBtnActive: {
    backgroundColor: colors.primary,
  },
  langBtnText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '800',
  },
  langBtnTextActive: {
    color: '#09120F',
    fontWeight: '900',
  },
  progressBarSection: {
    marginTop: 16,
  },
  progressHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  progressVal: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#09120F',
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1E3A2F4D',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  noteCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E3A2F33',
    marginBottom: 20,
  },
  noteText: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.primary,
    textAlign: 'right',
    fontWeight: '700',
  },
  logoutButton: {
    backgroundColor: '#2D1616',
    borderWidth: 1.5,
    borderColor: '#DC26264D',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: colors.error,
    fontWeight: '800',
    fontSize: 14,
  },
  adWrapper: {
    marginTop: 20,
  },
  themeToggleCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  themeHeader: {
    alignItems: 'flex-start',
  },
  themeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'right',
  },
  themeSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'right',
  },
  themeToggleBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  themeToggleBtnText: {
    color: '#09120F',
    fontWeight: '800',
    fontSize: 12,
  },
});
