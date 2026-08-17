import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Share } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Rect, Circle, Defs, Pattern } from 'react-native-svg';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getCurrentUserProfile } from '../firebase/auth';
import AdBanner from '../components/AdBanner';



export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { colors } = useTheme();
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Daily tasks completion states
  const [prayersDone, setPrayersDone] = useState(false);
  const [adhkarDone, setAdhkarDone] = useState(false);
  const [triviaDone, setTriviaDone] = useState(false);

  const todayStr = useMemo(() => {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  }, []);

  const loadData = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const currentProfile = await getCurrentUserProfile(user.uid);
      setProfile(currentProfile);

      // Check daily prayers log completion
      const storedLog = await AsyncStorage.getItem(`accountability-log-${todayStr}`);
      if (storedLog) {
        const parsed = JSON.parse(storedLog);
        const pCompleted = Object.values(parsed.prayers || {}).filter(val => val === 'congregation' || val === 'individual').length;
        setPrayersDone(pCompleted === 5);
      }

      // Check morning & evening sets completion
      const storedSets = await AsyncStorage.getItem(`adhkar-sets-${todayStr}`);
      if (storedSets) {
        const parsed = JSON.parse(storedSets);
        setAdhkarDone(!!parsed[`morning-${todayStr}`] || !!parsed[`evening-${todayStr}`]);
      }

      // Check trivia quiz completion
      const triviaPlayed = await AsyncStorage.getItem(`quest-trivia-played-${todayStr}`);
      setTriviaDone(triviaPlayed === 'true');

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [user?.uid, navigation]);

  const currentScore = profile?.score ?? 0;
  const currentLevel = Math.max(1, Math.floor(currentScore / 100));
  const currentXP = currentScore % 100;
  const targetXP = 100;
  const streakDays = profile?.streak ?? 0;

  const levelName = useMemo(() => {
    if (currentScore >= 500) return language === 'ar' ? 'البطل الأسطوري' : 'Legendary Hero';
    if (currentScore >= 200) return language === 'ar' ? 'بطل ذهبي' : 'Gold Hero';
    if (currentScore >= 80) return language === 'ar' ? 'بطل فضي' : 'Silver Hero';
    return language === 'ar' ? 'بطل مبتدئ' : 'Novice Hero';
  }, [currentScore, language]);

  const formattedDates = useMemo(() => {
    const today = new Date();
    
    // Hijri date approximation
    const hijriFormatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const hijri = hijriFormatter.format(today);

    // Gregorian date
    const gregorianFormatter = new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    const gregorian = gregorianFormatter.format(today);

    return { gregorian, hijri };
  }, [language]);

  const handleShareAyah = async () => {
    try {
      const message = `📖 آية اليوم من تطبيق *بطل مسلم* 🏆:
      
﴿ وَفِي ذَٰلِكَ فَلْيَتَنَافَسِ الْمُتَنَافِسُونَ ﴾
"وفي ذلك فليتنافس المتنافسون" - سورة المطففين: ٢٦

شاركوني التحدي وحملوا التطبيق الآن للارتقاء بعبادتكم اليومية! 🚀`;
      await Share.share({ message });
    } catch (err) {
      console.error(err);
    }
  };

  // 7 days checklist mock-up
  const daysList = [
    { label: 'س', active: streakDays >= 7 },
    { label: 'ح', active: streakDays >= 6 },
    { label: 'ن', active: streakDays >= 5 },
    { label: 'ث', active: streakDays >= 4 },
    { label: 'ر', active: streakDays >= 3 },
    { label: 'خ', active: streakDays >= 2 },
    { label: 'ج', active: streakDays >= 1 },
  ];

  const totalDoneQuests = [prayersDone, adhkarDone, triviaDone].filter(Boolean).length;

  return (
    <ScrollView style={[styles.outerContainer, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

      <View style={styles.container}>
        
        {/* Welcome & Top Actions Row */}
        <View style={styles.topHeaderRow}>
          <View style={styles.greetingCol}>
            <Text style={[styles.greetingLabelText, { color: colors.textSecondary }]}>
              {language === 'ar' ? 'السلام عليكم ورحمة الله' : 'Peace be upon you'}
            </Text>
            <Text style={[styles.profileNameText, { color: colors.textPrimary }]}>
              {user?.displayName || (language === 'ar' ? 'بطل مسلم' : 'Guest Hero')}
            </Text>
          </View>
          
          <View style={styles.headerRightActions}>
            {/* Notification Bell */}
            <TouchableOpacity style={[styles.headerBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} activeOpacity={0.75}>
              <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={colors.textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z" />
                <Path d="M10 20a2 2 0 0 0 4 0" />
              </Svg>
              <View style={[styles.unreadDot, { borderColor: colors.surface }]} />
            </TouchableOpacity>

            {/* Avatar container */}
            <TouchableOpacity 
              style={[styles.avatarBorderFrame, { borderColor: colors.primary }]}
              onPress={() => navigation.navigate('Profile')}
              activeOpacity={0.75}
            >
              <View style={[styles.avatarInnerCircle, { backgroundColor: colors.primaryTint }]}>
                <Text style={styles.avatarEmojiText}>🧕</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Date Label */}
        <Text style={[styles.dateTextLabel, { color: colors.textSecondary }]}>
          {formattedDates.hijri} · {formattedDates.gregorian}
        </Text>

        {/* XP Progress Card */}
        <View style={[styles.progressCard, { backgroundColor: colors.primaryDeep }]}>
          {/* Background vector rosette rosette */}
          <Svg viewBox="0 0 120 120" width="150" height="150" style={styles.cardBgVector}>
            <Rect x="30" y="30" width="60" height="60" fill="none" stroke="#FFFFFF" strokeWidth="2.5" opacity="0.12" />
            <Rect x="30" y="30" width="60" height="60" fill="none" stroke="#FFFFFF" strokeWidth="2.5" opacity="0.12" transform="rotate(45 60 60)" />
          </Svg>

          <View style={styles.progressHeaderRow}>
            <View style={styles.progressLabelCol}>
              <Text style={styles.progressSubLabel}>
                {language === 'ar' ? 'رتبتك الحالية' : 'Current Rank'}
              </Text>
              <Text style={styles.progressMainLabel}>
                {levelName} · {language === 'ar' ? `المستوى ${currentLevel}` : `Level ${currentLevel}`}
              </Text>
            </View>

            <View style={[styles.scoreBadge, { backgroundColor: 'rgba(255, 255, 255, 0.15)', borderColor: 'rgba(255, 255, 255, 0.25)' }]}>
              <Text style={styles.scoreBadgeNum}>{currentScore}</Text>
              <Text style={styles.scoreBadgeLabel}>{language === 'ar' ? 'نقطة' : 'XP'}</Text>
            </View>
          </View>

          {/* Progress bar line */}
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${(currentXP / targetXP) * 100}%` }]} />
          </View>

          <View style={styles.progressFooterRow}>
            <Text style={styles.progressFooterText}>
              {language === 'ar' ? `${targetXP - currentXP} نقطة للمستوى التالي` : `${targetXP - currentXP} XP to next level`}
            </Text>
            <Text style={styles.progressValueText}>
              {currentXP} / {targetXP}
            </Text>
          </View>
        </View>

        {/* Challenge Streak Card */}
        <View style={[styles.streakCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.streakLeftCol}>
            <View style={styles.streakFlameIconWrapper}>
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="#F97316" stroke="none">
                <Path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
              </Svg>
            </View>
            <View style={styles.streakCountTexts}>
              <Text style={[styles.streakDaysValText, { color: colors.textPrimary }]}>
                {streakDays} {language === 'ar' ? 'أيام' : 'Days'}
              </Text>
              <Text style={[styles.streakLabelText, { color: colors.textSecondary }]}>
                {language === 'ar' ? 'سلسلة التحدي' : 'Daily Streak'}
              </Text>
            </View>
          </View>

          {/* 7 Days Row */}
          <View style={styles.daysRow}>
            {daysList.map((day, idx) => (
              <View
                key={idx}
                style={[
                  styles.dayPill,
                  { backgroundColor: colors.neutralTint, borderColor: colors.border },
                  day.active && styles.dayPillActive
                ]}
              >
                <Text style={[styles.dayPillText, day.active ? { color: '#FFFFFF' } : { color: colors.textTertiary }]}>
                  {day.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Daily Goals / Quests Card */}
        <View style={[styles.questsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.questsHeader}>
            <Text style={[styles.questsTitleText, { color: colors.textPrimary }]}>
              {language === 'ar' ? 'المهام اليومية' : 'Daily Quests'}
            </Text>
            <View style={[styles.questsRatioBadge, { backgroundColor: colors.primaryTint }]}>
              <Text style={[styles.questsRatioText, { color: colors.primaryOnTint }]}>
                {totalDoneQuests} / 3
              </Text>
            </View>
          </View>

          <View style={styles.questsList}>
            {/* Quest 1 */}
            <View style={styles.questItemRow}>
              <View style={[
                styles.questCheckbox,
                { borderColor: prayersDone ? colors.primary : colors.borderStrong, backgroundColor: prayersDone ? colors.primary : 'transparent' }
              ]}>
                {prayersDone && (
                  <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M20 6 9 17l-5-5" />
                  </Svg>
                )}
              </View>
              <Text style={[styles.questText, { color: colors.textPrimary }, prayersDone && styles.questTextDone]}>
                {language === 'ar' ? '🕌 إتمام الصلوات الخمس المفروضة' : '🕌 Log all 5 daily prayers'}
              </Text>
            </View>

            {/* Quest 2 */}
            <View style={styles.questItemRow}>
              <View style={[
                styles.questCheckbox,
                { borderColor: adhkarDone ? colors.primary : colors.borderStrong, backgroundColor: adhkarDone ? colors.primary : 'transparent' }
              ]}>
                {adhkarDone && (
                  <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M20 6 9 17l-5-5" />
                  </Svg>
                )}
              </View>
              <Text style={[styles.questText, { color: colors.textPrimary }, adhkarDone && styles.questTextDone]}>
                {language === 'ar' ? '📿 قراءة أوراد الأذكار اليومية' : '📿 Read morning or evening Adhkar'}
              </Text>
            </View>

            {/* Quest 3 */}
            <View style={styles.questItemRow}>
              <View style={[
                styles.questCheckbox,
                { borderColor: triviaDone ? colors.primary : colors.borderStrong, backgroundColor: triviaDone ? colors.primary : 'transparent' }
              ]}>
                {triviaDone && (
                  <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M20 6 9 17l-5-5" />
                  </Svg>
                )}
              </View>
              <Text style={[styles.questText, { color: colors.textPrimary }, triviaDone && styles.questTextDone]}>
                {language === 'ar' ? '🧠 خوض مسابقة المعلومات اليومية' : '🧠 Play today\'s trivia challenge'}
              </Text>
            </View>
          </View>
        </View>

        {/* Ayah of the Day Card */}
        <View style={[styles.ayahCard, { backgroundColor: colors.accentTint, borderColor: colors.accentTintBorder }]}>
          <View style={styles.ayahHeaderRow}>
            <Text style={[styles.ayahLabelText, { color: colors.accentOnTint }]}>
              {language === 'ar' ? 'آية اليوم' : 'Ayah of the Day'}
            </Text>
            <TouchableOpacity style={styles.ayahShareButton} onPress={handleShareAyah} activeOpacity={0.7}>
              <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.accentOnTint} strokeWidth="2.5">
                <Path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <Path d="m16 6-4-4-4 4" />
                <Path d="M12 2v13" />
              </Svg>
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.ayahArabicText, { color: colors.textPrimary }]}>
            وَفِي ذَٰلِكَ فَلْيَتَنَافَسِ الْمُتَنَافِسُونَ
          </Text>
          
          <Text style={[styles.ayahMetaText, { color: colors.accentOnTint }]}>
            {language === 'ar' ? 'سورة المطففين · ٢٦' : 'Surah Al-Mutaffifin · 26'}
          </Text>
        </View>

        <AdBanner />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 28,
  },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 56,
    gap: 16,
  },
  topHeaderRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  greetingCol: {
    alignItems: 'flex-end',
    gap: 2,
  },
  greetingLabelText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  profileNameText: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#1D2939',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  unreadDot: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 9,
    height: 9,
    borderRadius: 50,
    backgroundColor: '#F5B841',
    borderWidth: 2,
  },
  avatarBorderFrame: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 2,
  },
  avatarInnerCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmojiText: {
    fontSize: 20,
  },
  dateTextLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
    fontFamily: 'IBMPlexSansArabic-SemiBold',
  },
  progressCard: {
    borderRadius: 22,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 3,
  },
  cardBgVector: {
    position: 'absolute',
    left: -30,
    top: -24,
  },
  progressHeaderRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    zIndex: 1,
  },
  progressLabelCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  progressSubLabel: {
    fontSize: 11.5,
    color: '#A7F3D0',
    fontWeight: '500',
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  progressMainLabel: {
    fontSize: 19,
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  scoreBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
    zIndex: 1,
  },
  scoreBadgeNum: {
    fontSize: 19,
    color: '#FFFFFF',
    fontWeight: '700',
    writingDirection: 'ltr',
  },
  scoreBadgeLabel: {
    fontSize: 9.5,
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: 'IBMPlexSansArabic-SemiBold',
    marginTop: -2,
  },
  progressBarBackground: {
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
    marginBottom: 8,
    width: '100%',
    zIndex: 1,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#F5B841',
  },
  progressFooterRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  progressFooterText: {
    fontSize: 10.5,
    color: '#A7F3D0',
    fontWeight: '500',
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  progressValueText: {
    fontSize: 11,
    color: '#A7F3D0',
    fontWeight: '600',
    writingDirection: 'ltr',
  },
  streakCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    shadowColor: '#1D2939',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  streakLeftCol: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 9,
  },
  streakFlameIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakCountTexts: {
    alignItems: 'flex-end',
  },
  streakDaysValText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  streakLabelText: {
    fontSize: 10.5,
    fontWeight: '500',
    fontFamily: 'IBMPlexSansArabic-Regular',
    marginTop: 2,
  },
  daysRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dayPill: {
    width: 22,
    height: 26,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  dayPillActive: {
    backgroundColor: '#F5B841',
    borderColor: '#D97706',
  },
  dayPillText: {
    fontSize: 10.5,
    fontWeight: '600',
    fontFamily: 'IBMPlexSansArabic-SemiBold',
  },
  questsCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#1D2939',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  questsHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  questsTitleText: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  questsRatioBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  questsRatioText: {
    fontSize: 11.5,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
    writingDirection: 'ltr',
  },
  questsList: {
    gap: 12,
  },
  questItemRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  questCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 11,
  },
  questText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'right',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  questTextDone: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  ayahCard: {
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  ayahHeaderRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  ayahLabelText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  ayahShareButton: {
    padding: 4,
  },
  ayahArabicText: {
    fontSize: 17,
    lineHeight: 30,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  ayahMetaText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'IBMPlexSansArabic-SemiBold',
  },
});
