import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Circle, Rect, Defs, Pattern } from 'react-native-svg';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { getCurrentUserProfile, updateUserCountry, saveUserScore } from '../firebase/auth';
import { badgesCatalog, checkUnlockedBadges } from '../data/badges';
import AdBanner from '../components/AdBanner';

const countriesList = [
  { code: 'EG', nameAr: 'مصر 🇪🇬', nameEn: 'Egypt' },
  { code: 'SA', nameAr: 'السعودية 🇸🇦', nameEn: 'Saudi Arabia' },
  { code: 'JO', nameAr: 'الأردن 🇯🇴', nameEn: 'Jordan' },
  { code: 'PS', nameAr: 'فلسطين 🇵🇸', nameEn: 'Palestine' },
  { code: 'AE', nameAr: 'الإمارات 🇦🇪', nameEn: 'UAE' },
  { code: 'MA', nameAr: 'المغرب 🇲🇦', nameEn: 'Morocco' },
  { code: 'OTH', nameAr: 'أخرى 🌍', nameEn: 'Other' },
];

const prayersCatalog = [
  { key: 'fajr', labelAr: 'صلاة الفجر 🌅', labelEn: 'Fajr Prayer 🌅' },
  { key: 'dhuhr', labelAr: 'صلاة الظهر ☀️', labelEn: 'Dhuhr Prayer ☀️' },
  { key: 'asr', labelAr: 'صلاة العصر ⛅', labelEn: 'Asr Prayer ⛅' },
  { key: 'maghrib', labelAr: 'صلاة المغرب 🌇', labelEn: 'Maghrib Prayer 🌇' },
  { key: 'isha', labelAr: 'صلاة العشاء 🌌', labelEn: 'Isha Prayer 🌌' },
];

const deedsCatalog = [
  { key: 'quran', labelAr: 'قراءة الورد القرآني 📖', labelEn: 'Quran Daily Reading 📖' },
  { key: 'adhkar', labelAr: 'أذكار الصباح والمساء 📿', labelEn: 'Morning & Evening Adhkar 📿' },
  { key: 'charity', labelAr: 'الصدقة أو صلة الرحم 🤝', labelEn: 'Charity or Family Bond 🤝' },
  { key: 'tongue', labelAr: 'حفظ اللسان وغض البصر 👁️', labelEn: 'Guarding Tongue & Gaze 👁️' },
  { key: 'knowledge', labelAr: 'طلب العلم النافع 📚', labelEn: 'Seeking Useful Knowledge 📚' },
];

export default function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { colors, toggleTheme, isLightMode } = useTheme();

  // Navigation segment: 'profile' | 'accountability'
  const [activeSection, setActiveSection] = useState<'profile' | 'accountability'>('profile');

  // Profile data states
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [unlockedBadgeIds, setUnlockedBadgeIds] = useState<string[]>([]);
  const [savedRecitations, setSavedRecitations] = useState<any[]>([]);

  // Accountability states
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  const [prayers, setPrayers] = useState<Record<string, 'congregation' | 'individual' | 'missed' | null>>({
    fajr: null,
    dhuhr: null,
    asr: null,
    maghrib: null,
    isha: null,
  });
  const [deeds, setDeeds] = useState<Record<string, boolean>>({
    quran: false,
    adhkar: false,
    charity: false,
    tongue: false,
    knowledge: false,
  });
  const [pledged, setPledged] = useState(false);
  const [weeklyHistory, setWeeklyHistory] = useState<{ dateStr: string, completedCount: number }[]>([]);

  const loadProfile = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const currentProfile = await getCurrentUserProfile(user.uid);
      setProfile(currentProfile);

      const unlocked = await checkUnlockedBadges(currentProfile?.score ?? 0);
      setUnlockedBadgeIds(unlocked);

      const stored = await AsyncStorage.getItem('saved-recitations-list');
      setSavedRecitations(stored ? JSON.parse(stored) : []);
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDailyLogs = async () => {
    try {
      const stored = await AsyncStorage.getItem(`accountability-log-${todayStr}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPrayers(parsed.prayers || {});
        setDeeds(parsed.deeds || {});
        setPledged(parsed.pledged || false);
      }

      // Generate history for past 7 days
      const history = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dStr = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
        const log = await AsyncStorage.getItem(`accountability-log-${dStr}`);
        let completed = 0;
        if (log) {
          const parsedLog = JSON.parse(log);
          const pCompleted = Object.values(parsedLog.prayers || {}).filter(val => val === 'congregation' || val === 'individual').length;
          const dCompleted = Object.values(parsedLog.deeds || {}).filter(Boolean).length;
          completed = pCompleted + dCompleted;
        }
        history.push({ dateStr: dStr, completedCount: completed });
      }
      setWeeklyHistory(history);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadProfile();
    loadDailyLogs();
    if (navigation) {
      const unsubscribe = navigation.addListener('focus', () => {
        loadProfile();
        loadDailyLogs();
      });
      return unsubscribe;
    }
  }, [user?.uid, navigation]);

  const saveDailyLogs = async (
    updatedPrayers = prayers,
    updatedDeeds = deeds,
    updatedPledge = pledged
  ) => {
    try {
      const data = {
        prayers: updatedPrayers,
        deeds: updatedDeeds,
        pledged: updatedPledge,
        updatedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(`accountability-log-${todayStr}`, JSON.stringify(data));
      
      const currentTotal = 
        Object.values(updatedPrayers).filter(val => val === 'congregation' || val === 'individual').length +
        Object.values(updatedDeeds).filter(Boolean).length;
      
      setWeeklyHistory(prev => prev.map(h => h.dateStr === todayStr ? { ...h, completedCount: currentTotal } : h));
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePrayer = (prayerKey: string, status: 'congregation' | 'individual' | 'missed') => {
    const updated = {
      ...prayers,
      [prayerKey]: prayers[prayerKey] === status ? null : status,
    };
    setPrayers(updated);
    saveDailyLogs(updated, deeds, pledged);
  };

  const handleToggleDeed = (deedKey: string) => {
    const updated = {
      ...deeds,
      [deedKey]: !deeds[deedKey],
    };
    setDeeds(updated);
    saveDailyLogs(prayers, updated, pledged);
  };

  const handleTogglePledge = () => {
    const updated = !pledged;
    setPledged(updated);
    saveDailyLogs(prayers, deeds, updated);
    if (updated) {
      Alert.alert(
        language === 'ar' ? 'ميثاق الصدق 🤝' : 'Pledge of Honesty 🤝',
        language === 'ar'
          ? 'عاهدت الله تعالى على الصدق والأمانة في تدوين عبادتك اليومية.'
          : 'You have pledged before Allah to record your daily worship with total honesty.'
      );
    }
  };

  const handleDeleteSaved = async (id: string) => {
    Alert.alert(
      language === 'ar' ? 'حذف التلاوة 🗑️' : 'Delete Recitation 🗑️',
      language === 'ar'
        ? 'هل أنت متأكد من حذف هذه التلاوة المحفوظة لتوفير مساحة في حقيبتك؟'
        : 'Are you sure you want to delete this saved recitation to free up slots?',
      [
        { text: language === 'ar' ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: language === 'ar' ? 'حذف' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedList = savedRecitations.filter((r: any) => r.id !== id);
              setSavedRecitations(updatedList);
              await AsyncStorage.setItem('saved-recitations-list', JSON.stringify(updatedList));
            } catch (err) {
              console.error(err);
            }
          }
        }
      ]
    );
  };

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
    <View style={[styles.outerContainer, { backgroundColor: colors.background }]}>
      {/* Top Segmented Tabs Wrapper */}
      <View style={[styles.headerContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={[styles.segmentsContainer, { backgroundColor: colors.neutralTint }]}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeSection === 'accountability' && styles.segmentBtnActive]}
            onPress={() => setActiveSection('accountability')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, activeSection === 'accountability' ? { color: colors.textPrimary, fontWeight: '700' } : { color: colors.textSecondary }]}>
              {language === 'ar' ? 'سجل المحاسبة' : 'Accountability'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, activeSection === 'profile' && styles.segmentBtnActive]}
            onPress={() => setActiveSection('profile')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, activeSection === 'profile' ? { color: colors.textPrimary, fontWeight: '700' } : { color: colors.textSecondary }]}>
              {language === 'ar' ? 'حسابي' : 'Profile'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color="#059669" style={styles.loader} />
        ) : activeSection === 'profile' ? (
          /* ========================================================
             PROFILE SECTION
             ======================================================== */
          <View style={styles.contentWrapper}>
            {/* Profile Card Header */}
            <View style={[styles.profileHeaderCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.avatarContainer, { backgroundColor: colors.primaryTint, borderColor: colors.primary }]}>
                <Text style={[styles.avatarText, { color: colors.primaryDeep }]}>
                  {user?.displayName ? user.displayName[0].toUpperCase() : '👤'}
                </Text>
              </View>
              <Text style={[styles.profileName, { color: colors.textPrimary }]}>
                {user?.displayName || (language === 'ar' ? 'ضيف' : 'Guest')}
              </Text>
              <View style={[styles.levelBadge, { backgroundColor: colors.accentTint, borderColor: colors.accentTintBorder }]}>
                <Text style={[styles.levelBadgeText, { color: colors.accentOnTint }]}>🏆 {levelName}</Text>
              </View>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.statVal, { color: colors.primaryDeep }]}>{currentScore}</Text>
                <Text style={[styles.statLbl, { color: colors.textSecondary }]}>{language === 'ar' ? 'مجموع النقاط' : 'Total Score'}</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.statVal, { color: colors.primaryDeep }]}>
                  {unlockedBadgeIds.length} / {badgesCatalog.length}
                </Text>
                <Text style={[styles.statLbl, { color: colors.textSecondary }]}>{language === 'ar' ? 'الأوسمة المفتوحة' : 'Unlocked Badges'}</Text>
              </View>
            </View>

            {/* Cabinet of Badges */}
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('badgesTitle')}</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>{t('badgesDesc')}</Text>
            
            <View style={styles.badgesCabinet}>
              {badgesCatalog.map((badge) => {
                const isUnlocked = unlockedBadgeIds.includes(badge.id);
                return (
                  <View
                    key={badge.id}
                    style={[
                      styles.badgeCard,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      isUnlocked && { borderColor: badge.color, backgroundColor: `${badge.color}15` }
                    ]}
                  >
                    <View style={[styles.badgeEmojiWrapper, !isUnlocked && styles.badgeEmojiWrapperLocked]}>
                      <Text style={[styles.badgeEmoji, !isUnlocked && styles.badgeEmojiLocked]}>
                        {badge.emoji}
                      </Text>
                    </View>
                    <Text style={[styles.badgeTitle, { color: colors.textPrimary }, !isUnlocked && styles.badgeTitleLocked]}>
                      {language === 'ar' ? badge.titleAr : badge.titleEn}
                    </Text>
                    <Text style={[styles.badgeDesc, { color: colors.textSecondary }, !isUnlocked && styles.badgeDescLocked]}>
                      {language === 'ar' ? badge.descAr : badge.descEn}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Saved Recitations Portfolio */}
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {language === 'ar' ? '💾 تلاواتي المحفوظة' : '💾 My Saved Recitations'}
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              {language === 'ar' 
                ? `سعة تخزين التلاوات: ${savedRecitations.length} / ٣ مساحات مجانية مستخدمة`
                : `Storage limit: ${savedRecitations.length} / 3 free slots used`}
            </Text>

            <View style={styles.portfolioContainer}>
              {savedRecitations.length === 0 ? (
                <View style={[styles.portfolioEmptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.portfolioEmptyText, { color: colors.textSecondary }]}>
                    {language === 'ar' 
                      ? 'لا توجد تلاوات محفوظة حتى الآن. سجل تلاوتك لحفظها هنا!'
                      : 'No saved recitations found. Record recitations to save them here!'}
                  </Text>
                </View>
              ) : (
                <View style={styles.portfolioGrid}>
                  {savedRecitations.map((item: any) => (
                    <View key={item.id} style={[styles.portfolioCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <View style={styles.portfolioHeader}>
                        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteSaved(item.id)} activeOpacity={0.75}>
                          <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E7000B" strokeWidth="2.2">
                            <Path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          </Svg>
                        </TouchableOpacity>
                        <Text style={[styles.portfolioCardTitle, { color: colors.textPrimary }]}>{item.surahName}</Text>
                      </View>
                      <Text style={[styles.portfolioCardMeta, { color: colors.textSecondary }]}>
                        {language === 'ar' ? `آية: ${item.ayahNumber}` : `Ayah: ${item.ayahNumber}`} | {item.style === 'mujawwad' ? (language === 'ar' ? 'مجوّد' : 'Mujawwad') : (language === 'ar' ? 'مرتل' : 'Murattal')}
                      </Text>
                      <Text style={[styles.portfolioCardQari, { color: colors.textSecondary }]}>
                        👤 {item.readerName}
                      </Text>
                      <View style={[styles.portfolioScoreBadge, { backgroundColor: colors.neutralTint }]}>
                        <Text style={[styles.portfolioScoreText, { color: colors.primaryDeep }]}>🎯 {item.matchPercentage}% match</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Language Switcher & Settings */}
            <View style={[styles.detailsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                {language === 'ar' ? 'تفاصيل الحساب والاعدادات' : 'Account details & Settings'}
              </Text>
              
              <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                  {user?.uid ? (language === 'ar' ? 'نشط (محلي)' : 'Active (Local)') : 'Offline'}
                </Text>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{language === 'ar' ? 'حالة الاتصال' : 'Connection status'}</Text>
              </View>
              
              <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{formattedDate}</Text>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{language === 'ar' ? 'آخر نشاط' : 'Last activity'}</Text>
              </View>

              <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                <View style={styles.langSwitchContainer}>
                  <TouchableOpacity
                    style={[styles.langBtn, language === 'ar' && { backgroundColor: colors.primaryDeep }]}
                    onPress={() => setLanguage('ar')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.langBtnText, language === 'ar' ? { color: '#FFFFFF' } : { color: colors.textSecondary }]}>عربي</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.langBtn, language === 'en' && { backgroundColor: colors.primaryDeep }]}
                    onPress={() => setLanguage('en')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.langBtnText, language === 'en' ? { color: '#FFFFFF' } : { color: colors.textSecondary }]}>English</Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t('langToggle')}</Text>
              </View>

              {/* Country Selection */}
              <View style={styles.detailRowCol}>
                <Text style={[styles.detailLabelCol, { color: colors.textSecondary }]}>{t('selectCountry')}</Text>
                <View style={styles.countryListContainer}>
                  {countriesList.map((c) => {
                    const isSelected = profile?.countryCode === c.code;
                    return (
                      <TouchableOpacity
                        key={c.code}
                        style={[
                          styles.countryBadge,
                          { backgroundColor: colors.neutralTint, borderColor: colors.border },
                          isSelected && { backgroundColor: colors.primaryDeep, borderColor: colors.primaryDeep }
                        ]}
                        onPress={async () => {
                          if (user?.uid) {
                            await updateUserCountry(user.uid, c.nameEn, c.code);
                            loadProfile();
                          }
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.countryBadgeText, isSelected ? { color: '#FFFFFF' } : { color: colors.textPrimary }]}>
                          {language === 'ar' ? c.nameAr : c.nameEn}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Theme Toggle Card */}
            <View style={[styles.themeToggleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.themeHeader}>
                <Text style={[styles.themeTitle, { color: colors.textPrimary }]}>
                  {language === 'ar' ? 'مظهر التطبيق' : 'App Theme'}
                </Text>
                <Text style={[styles.themeSub, { color: colors.textSecondary }]}>
                  {language === 'ar' 
                    ? (isLightMode ? 'مظهر مضيء ☀️' : 'مظهر داكن 🌙') 
                    : (isLightMode ? 'Light Mode ☀️' : 'Dark Mode 🌙')}
                </Text>
              </View>
              <TouchableOpacity style={[styles.themeToggleBtn, { backgroundColor: colors.neutralTint, borderColor: colors.border }]} onPress={toggleTheme} activeOpacity={0.8}>
                <Text style={[styles.themeToggleBtnText, { color: colors.textPrimary }]}>
                  {language === 'ar' ? 'تغيير المظهر 🔄' : 'Change Theme 🔄'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Motivational Note */}
            <View style={[styles.noteCard, { backgroundColor: '#FFF7ED', borderColor: '#FFD6A7' }]}>
              <Text style={[styles.noteText, { color: '#973C00' }]}>
                💡 {language === 'ar' 
                  ? '"من سلك طريقًا يلتمس فيه علمًا، سهّل الله له به طريقًا إلى الجنة." استمر في تحدي المعرفة اليومي!'
                  : '"Whoever follows a path in pursuit of knowledge, Allah will make easy for him a path to Paradise." Keep up your daily quest!'}
              </Text>
            </View>

            {/* Logout Button */}
            <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.85}>
              <Text style={styles.logoutButtonText}>{t('logout')} ➔</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* ========================================================
             ACCOUNTABILITY SECTION (MERGED FROM ACCOUNTABILITY SCREEN)
             ======================================================== */
          <View style={styles.contentWrapper}>
            {/* Header Description */}
            <View style={styles.logHeader}>
              <Text style={[styles.logTitle, { color: colors.textPrimary }]}>
                {language === 'ar' ? 'سجل المحاسبة اليومية' : 'Daily Accountability Journal'}
              </Text>
              <Text style={[styles.logSubtitle, { color: colors.textSecondary }]}>
                {language === 'ar'
                  ? 'حاسبوا أنفسكم قبل أن تُحاسبوا، وزِنوا أعمالكم قبل أن تُوزن عليكم.'
                  : 'Hold yourself accountable daily for continuous personal growth.'}
              </Text>
            </View>

            {/* PRAYERS LOG CARD */}
            <View style={[styles.logCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.logCardTitle, { color: colors.textPrimary }]}>
                {language === 'ar' ? '🕌 سجل الصلوات المفروضة' : '🕌 Daily Prayers Log'}
              </Text>
              <Text style={[styles.logCardSubtitle, { color: colors.textSecondary }]}>
                {language === 'ar' ? 'أدّيت الصلوات بأي صفة اليوم؟' : 'How did you offer your prayers today?'}
              </Text>

              <View style={styles.prayersList}>
                {prayersCatalog.map((p) => {
                  const currentStatus = prayers[p.key];
                  return (
                    <View key={p.key} style={[styles.prayerRow, { borderBottomColor: colors.neutralTint }]}>
                      <Text style={[styles.prayerNameText, { color: colors.textPrimary }]}>
                        {language === 'ar' ? p.labelAr : p.labelEn}
                      </Text>
                      
                      <View style={styles.optionsRow}>
                        <TouchableOpacity
                          style={[
                            styles.optionBtn,
                            { backgroundColor: colors.neutralTint, borderColor: colors.border },
                            currentStatus === 'congregation' && { backgroundColor: '#10B981', borderColor: '#10B981' }
                          ]}
                          onPress={() => handleTogglePrayer(p.key, 'congregation')}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.optionBtnText, currentStatus === 'congregation' ? { color: '#FFFFFF' } : { color: colors.textPrimary }]}>
                            {language === 'ar' ? 'جماعة' : 'Congr.'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.optionBtn,
                            { backgroundColor: colors.neutralTint, borderColor: colors.border },
                            currentStatus === 'individual' && { backgroundColor: '#F5B841', borderColor: '#F5B841' }
                          ]}
                          onPress={() => handleTogglePrayer(p.key, 'individual')}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.optionBtnText, currentStatus === 'individual' ? { color: '#FFFFFF' } : { color: colors.textPrimary }]}>
                            {language === 'ar' ? 'منفرداً' : 'Indiv.'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.optionBtn,
                            { backgroundColor: colors.neutralTint, borderColor: colors.border },
                            currentStatus === 'missed' && { backgroundColor: '#E7000B', borderColor: '#E7000B' }
                          ]}
                          onPress={() => handleTogglePrayer(p.key, 'missed')}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.optionBtnText, currentStatus === 'missed' ? { color: '#FFFFFF' } : { color: colors.textPrimary }]}>
                            {language === 'ar' ? 'فاتتني' : 'Missed'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* DEEDS LOG CARD */}
            <View style={[styles.logCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.logCardTitle, { color: colors.textPrimary }]}>
                {language === 'ar' ? '📖 سجل محاسبة الطاعات' : '📖 Accountability of Deeds'}
              </Text>
              <Text style={[styles.logCardSubtitle, { color: colors.textSecondary }]}>
                {language === 'ar' ? 'طاعات وسنن يومية تعهد نفسك عليها:' : 'Daily spiritual habits to maintain:'}
              </Text>

              <View style={styles.deedsList}>
                {deedsCatalog.map((d) => {
                  const isChecked = !!deeds[d.key];
                  return (
                    <TouchableOpacity
                      key={d.key}
                      style={[
                        styles.deedRow,
                        { borderColor: colors.border },
                        isChecked && { borderColor: colors.primaryTintBorder, backgroundColor: colors.primaryTint }
                      ]}
                      onPress={() => handleToggleDeed(d.key)}
                      activeOpacity={0.85}
                    >
                      <View style={[
                        styles.deedCheckbox,
                        { borderColor: isChecked ? colors.primary : colors.borderStrong, backgroundColor: isChecked ? colors.primary : 'transparent' }
                      ]}>
                        {isChecked && (
                          <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <Path d="M20 6 9 17l-5-5" />
                          </Svg>
                        )}
                      </View>
                      <Text style={[styles.deedText, { color: colors.textPrimary }, isChecked && { fontWeight: '700' }]}>
                        {language === 'ar' ? d.labelAr : d.labelEn}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* PLEDGE CARD */}
            <View style={[styles.pledgeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TouchableOpacity
                style={styles.pledgeCheckboxRow}
                onPress={handleTogglePledge}
                activeOpacity={0.85}
              >
                <View style={[
                  styles.pledgeCheckbox,
                  { borderColor: pledged ? colors.accentDeep : colors.borderStrong, backgroundColor: pledged ? colors.accentDeep : 'transparent' }
                ]}>
                  {pledged && (
                    <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M20 6 9 17l-5-5" />
                    </Svg>
                  )}
                </View>
                <View style={styles.pledgeTextCol}>
                  <Text style={[styles.pledgeTitle, { color: colors.textPrimary }]}>
                    {language === 'ar' ? 'ميثاق الصدق والأمانة 🤝' : 'Pledge of Honesty 🤝'}
                  </Text>
                  <Text style={[styles.pledgeDescText, { color: colors.textSecondary }]}>
                    {language === 'ar'
                      ? 'أؤكد بموجب هذا أن جميع البيانات المسجلة صحيحة وصادقة تماماً.'
                      : 'I pledge before Allah that my logs are completely honest and true.'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* WEEKLY CHART */}
            <View style={[styles.logCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.logCardTitle, { color: colors.textPrimary }]}>
                {language === 'ar' ? '📈 التقرير الأسبوعي' : '📈 Weekly Progress'}
              </Text>
              <Text style={[styles.logCardSubtitle, { color: colors.textSecondary }]}>
                {language === 'ar' ? 'مجموع الطاعات والصلوات المكتملة آخر ٧ أيام:' : 'Total completed actions in the past 7 days:'}
              </Text>

              <View style={styles.chartContainer}>
                {weeklyHistory.map((day, index) => {
                  // Max completed count is 5 prayers + 5 deeds = 10 total
                  const barHeight = Math.max(10, (day.completedCount / 10) * 120);
                  const isCurrent = day.dateStr === todayStr;

                  return (
                    <View key={index} style={styles.chartCol}>
                      <Text style={[styles.chartValText, { color: colors.textSecondary }]}>
                        {day.completedCount}
                      </Text>
                      <View style={[
                        styles.chartBarBg,
                        { backgroundColor: colors.neutralTint }
                      ]}>
                        <View style={[
                          styles.chartBarFill,
                          {
                            height: barHeight,
                            backgroundColor: isCurrent ? colors.accentDeep : colors.primaryDeep,
                          }
                        ]} />
                      </View>
                      <Text style={[styles.chartDayText, { color: colors.textSecondary }, isCurrent && { color: colors.accentDeep, fontWeight: '700' }]}>
                        {new Date(day.dateStr).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'narrow' })}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        <View style={styles.adWrapper}>
          <AdBanner />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  headerContainer: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: '#1D2939',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  segmentsContainer: {
    flexDirection: 'row-reverse',
    borderRadius: 12,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 9,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#1D2939',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'IBMPlexSansArabic-SemiBold',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  contentWrapper: {
    padding: 20,
  },
  loader: {
    marginTop: 40,
  },
  profileHeaderCard: {
    borderRadius: 18,
    paddingVertical: 24,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#1D2939',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  avatarContainer: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  levelBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  levelBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  statsGrid: {
    flexDirection: 'row-reverse',
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#1D2939',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  statVal: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
    writingDirection: 'ltr',
  },
  statLbl: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'IBMPlexSansArabic-SemiBold',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 4,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  sectionSubtitle: {
    fontSize: 11.5,
    textAlign: 'right',
    marginBottom: 16,
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  badgesCabinet: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  badgeCard: {
    width: '48%',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    flexGrow: 1,
  },
  badgeCardLocked: {
    opacity: 0.4,
  },
  badgeEmojiWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeEmojiWrapperLocked: {
    backgroundColor: '#E5E7EB',
  },
  badgeEmoji: {
    fontSize: 20,
  },
  badgeEmojiLocked: {
    opacity: 0.5,
  },
  badgeTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  badgeTitleLocked: {
    fontWeight: '500',
  },
  badgeDesc: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  badgeDescLocked: {
    opacity: 0.8,
  },
  portfolioContainer: {
    width: '100%',
    marginBottom: 24,
  },
  portfolioEmptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portfolioEmptyText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  portfolioGrid: {
    gap: 10,
  },
  portfolioCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  portfolioHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  portfolioCardTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  deleteBtn: {
    padding: 4,
  },
  portfolioCardMeta: {
    fontSize: 10.5,
    textAlign: 'right',
    marginBottom: 4,
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  portfolioCardQari: {
    fontSize: 10.5,
    textAlign: 'right',
    marginBottom: 8,
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  portfolioScoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  portfolioScoreText: {
    fontSize: 9.5,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  detailsCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 14,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  detailRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'IBMPlexSansArabic-SemiBold',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  langSwitchContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 2,
  },
  langBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  langBtnText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'IBMPlexSansArabic-SemiBold',
  },
  detailRowCol: {
    marginTop: 12,
  },
  detailLabelCol: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 8,
    fontFamily: 'IBMPlexSansArabic-SemiBold',
  },
  countryListContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
  },
  countryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  countryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'IBMPlexSansArabic-SemiBold',
  },
  themeToggleCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  themeHeader: {
    flex: 1,
    alignItems: 'flex-end',
  },
  themeTitle: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  themeSub: {
    fontSize: 11,
    marginTop: 2,
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  themeToggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  themeToggleBtnText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'IBMPlexSansArabic-SemiBold',
  },
  noteCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  noteText: {
    fontSize: 11.5,
    lineHeight: 18,
    textAlign: 'right',
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  logoutButton: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FFC9C9',
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  logoutButtonText: {
    color: '#E7000B',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  adWrapper: {
    marginTop: 10,
    alignItems: 'center',
  },
  // Accountability Styles
  logHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  logSubtitle: {
    fontSize: 11.5,
    fontFamily: 'IBMPlexSansArabic-Regular',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  logCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#1D2939',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  logCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 2,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  logCardSubtitle: {
    fontSize: 11,
    textAlign: 'right',
    marginBottom: 16,
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  prayersList: {
    gap: 12,
  },
  prayerRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  prayerNameText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'IBMPlexSansArabic-SemiBold',
  },
  optionsRow: {
    flexDirection: 'row-reverse',
    gap: 6,
  },
  optionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  optionBtnText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'IBMPlexSansArabic-SemiBold',
  },
  deedsList: {
    gap: 10,
  },
  deedRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  deedCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  deedText: {
    flex: 1,
    fontSize: 12.5,
    textAlign: 'right',
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  pledgeCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  pledgeCheckboxRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
  },
  pledgeCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    marginTop: 2,
  },
  pledgeTextCol: {
    flex: 1,
  },
  pledgeTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 4,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  pledgeDescText: {
    fontSize: 11,
    textAlign: 'right',
    lineHeight: 16,
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  chartContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
    paddingTop: 10,
    paddingHorizontal: 8,
  },
  chartCol: {
    alignItems: 'center',
  },
  chartValText: {
    fontSize: 9.5,
    fontWeight: '600',
    marginBottom: 4,
    writingDirection: 'ltr',
  },
  chartBarBg: {
    width: 22,
    height: 120,
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartBarFill: {
    width: '100%',
    borderRadius: 6,
  },
  chartDayText: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 6,
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
});
