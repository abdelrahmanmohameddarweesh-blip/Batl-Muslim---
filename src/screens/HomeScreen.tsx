import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Share, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle, Defs, LinearGradient, Stop, Path, Pattern, Rect } from 'react-native-svg';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getCurrentUserProfile, saveUserScore } from '../firebase/auth';
import { shareAchievementWithImage } from '../utils/sharing';
import AdBanner from '../components/AdBanner';
import { useTheme } from '../contexts/ThemeContext';
import { Colors } from '../config/colors';

// Natively generated low-opacity Islamic geometric repeating backdrop
function ArabesqueBackgroundPattern() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern id="arabesque" width={100} height={100} patternUnits="userSpaceOnUse">
            {/* Draw diamond */}
            <Path
              d="M 50 15 L 75 50 L 50 85 L 25 50 Z"
              stroke="#D4AF37"
              strokeWidth={0.5}
              opacity={0.15}
              fill="none"
            />
            {/* Draw intersecting spoke lines */}
            <Path
              d="M 50 0 L 50 100 M 0 50 L 100 50 M 0 0 L 100 100 M 100 0 L 0 100"
              stroke="#D4AF37"
              strokeWidth={0.4}
              opacity={0.1}
              fill="none"
            />
            {/* Star points circles */}
            <Circle cx={50} cy={50} r={6} stroke="#D4AF37" strokeWidth={0.5} opacity={0.15} fill="none" />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#arabesque)" />
      </Svg>
    </View>
  );
}

function MosqueIcon({ color = '#FBBF24', size = 26 }: { color?: string, size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2v3M12 5c-2.5 0-4.5 1.8-4.9 4.2h9.8c-.4-2.4-2.4-4.2-4.9-4.2zm-9 6h18v1H3v-1zm1 2h16v8H4v-8zm5 3v5h6v-5H9z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function QuranBookIcon({ color = '#FBBF24', size = 26 }: { color?: string, size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20M4 19.5V5A2.5 2.5 0 0 1 6.5 2.5H20v14.5M6 6h10M6 10h10"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function MapScrollIcon({ color = '#FBBF24', size = 26 }: { color?: string, size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 20l-5.4-3V4L9 7l6-3 5.4 3v13l-6-3-6 3zm0-13v13M15 4v13"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Custom SVG Circular Progress Ring
function CircularProgress({ size, strokeWidth, percent, emoji, label, color, ringColor, colors }: any) {
  const styles = getStyles(colors);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <View style={styles.circularProgressContainer}>
      <View style={styles.svgWrapper}>
        <Svg width={size} height={size}>
          <Defs>
            <LinearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={ringColor} />
              <Stop offset="100%" stopColor={color} />
            </LinearGradient>
          </Defs>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#1A342B"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#ringGrad)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={styles.innerCircle}>
          <Text style={styles.innerEmoji}>{emoji}</Text>
        </View>
      </View>
      <Text style={styles.percentText}>{percent}%</Text>
      <Text style={styles.progressLabel}>{label}</Text>
    </View>
  );
}

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { colors, isLightMode } = useTheme();
  
  const homeColors = useMemo(() => {
    return {
      background: '#09120F',     // Deep emerald night background
      surface: '#0D1A15',        // Frosted dark slate card surface
      border: '#142E24',         // Subtle gold-green border outline
      textPrimary: '#E6F4EE',    // White gold text
      textSecondary: '#86A597',  // Pale mint secondary text
      primary: '#10B981',        // Emerald primary
      primaryLight: '#10B98126', // Transparent emerald
      accent: '#FBBF24',         // Shiny Amber Gold
      accentLight: '#FBBF241A',  // Transparent gold
      shadow: '#000000',
      error: '#EF4444',
    };
  }, []);

  const styles = getStyles(homeColors);
  const [profile, setProfile] = useState<any>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [activePath, setActivePath] = useState<'solo' | 'live'>('solo');
  
  // Daily goals state
  const [prayersCompletedCount, setPrayersCompletedCount] = useState(0);
  const [recitationMinutes, setRecitationMinutes] = useState(15);
  const [streakDays, setStreakDays] = useState(7);

  // Daily Quests State (Trivia, Prayer, Voice)
  const [questTriviaPlayed, setQuestTriviaPlayed] = useState(false);
  const [questPrayerLogged, setQuestPrayerLogged] = useState(false);
  const [questVoiceDone, setQuestVoiceDone] = useState(false);
  const [questBonusAwarded, setQuestBonusAwarded] = useState(false);

  // Communal Daily Quest States
  const [communalCount, setCommunalCount] = useState<number>(34250);
  const [hasContributedToday, setHasContributedToday] = useState<boolean>(false);

  const loadData = async () => {
    if (!user?.uid) return;
    try {
      const currentProfile = await getCurrentUserProfile(user.uid);
      setProfile(currentProfile);

      const today = new Date();
      const todayStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
      
      // 1. Load today's prayers status
      const prayerKey = `prayer-tracker-${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
      const storedPrayers = await AsyncStorage.getItem(prayerKey);
      let pCount = 0;
      if (storedPrayers) {
        const parsed = JSON.parse(storedPrayers);
        pCount = Object.values(parsed).filter(Boolean).length;
        setPrayersCompletedCount(pCount);
      } else {
        setPrayersCompletedCount(0);
      }

      // 2. Check Daily Quests Completion Status
      const triviaPlayed = await AsyncStorage.getItem(`quest-trivia-played-${todayStr}`);
      const voiceDone = await AsyncStorage.getItem(`quest-voice-done-${todayStr}`);
      const bonusGot = await AsyncStorage.getItem(`quest-daily-bonus-awarded-${todayStr}`);

      setQuestTriviaPlayed(triviaPlayed === 'true');
      setQuestPrayerLogged(pCount > 0);
      setQuestVoiceDone(voiceDone === 'true');
      setQuestBonusAwarded(bonusGot === 'true');

      // 3. Handle awarding daily quest bonus automatically
      if (triviaPlayed === 'true' && pCount > 0 && voiceDone === 'true' && bonusGot !== 'true') {
        const nextScore = (currentProfile?.score ?? 0) + 50;
        await saveUserScore(user.uid, nextScore);
        await AsyncStorage.setItem(`quest-daily-bonus-awarded-${todayStr}`, 'true');
        setQuestBonusAwarded(true);
        Alert.alert(
          language === 'ar' ? 'تهانينا! 🎉' : 'Congratulations! 🎉',
          language === 'ar' 
            ? 'لقد أكملت جميع المهام اليومية وحصلت على +٥٠ نقطة مكافأة!'
            : 'You have completed all daily quests and earned +50 XP bonus points!'
        );
        // Reload profile to show new score
        const updatedProfile = await getCurrentUserProfile(user.uid);
        setProfile(updatedProfile);
      }

      const commCount = await AsyncStorage.getItem('communal-quest-tasbih-count');
      if (commCount) {
        setCommunalCount(parseInt(commCount, 10));
      } else {
        setCommunalCount(34250);
      }
      const contributed = await AsyncStorage.getItem(`communal-quest-contributed-${todayStr}`);
      setHasContributedToday(contributed === 'true');

    } catch (err) {
      console.error('Error loading home data:', err);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [user?.uid, navigation]);

  useEffect(() => {
    const checkGuide = async () => {
      const completed = await AsyncStorage.getItem(ONBOARDING_KEY);
      if (!completed) {
        setShowGuide(true);
      }
    };
    checkGuide();
  }, []);

  const currentScore = profile?.score ?? 0;

  const levelName = useMemo(() => {
    if (currentScore >= 500) return language === 'ar' ? 'البطل الأسطوري' : 'Legendary Hero';
    if (currentScore >= 200) return language === 'ar' ? 'بطل ذهبي' : 'Gold Hero';
    if (currentScore >= 80) return language === 'ar' ? 'بطل فضي' : 'Silver Hero';
    return language === 'ar' ? 'بطل مبتدئ' : 'Novice Hero';
  }, [currentScore, language]);

  const handleContributeCommunal = async () => {
    if (!user?.uid) return;
    try {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
      
      const nextCount = communalCount + 10;
      setCommunalCount(nextCount);
      await AsyncStorage.setItem('communal-quest-tasbih-count', nextCount.toString());
      await AsyncStorage.setItem(`communal-quest-contributed-${todayStr}`, 'true');
      setHasContributedToday(true);

      const nextScore = currentScore + 5;
      await saveUserScore(user.uid, nextScore);
      
      Alert.alert(
        language === 'ar' ? 'مساهمة مباركة! 📿' : 'Blessed Contribution! 📿',
        language === 'ar'
          ? 'تم تسجيل +١٠ صلوات على النبي ﷺ في التحدي الجماعي وحصلت على +٥ نقاط خبرة!'
          : 'Registered +10 Salawat in the communal challenge and earned +5 XP points!'
      );
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const dismissGuide = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setShowGuide(false);
  };

  const handleShareAyah = async () => {
    const message = language === 'ar' 
      ? `📖 آية اليوم من تطبيق *بطل مسلم* 🌟

{ وَسَارِعُوا إِلَىٰ مَغْفِرَةٍ مِّن رَّبِّكُمْ وَجَنَّةٍ عَرْضُهَا السَّمَاوَاتُ وَالْأَرْضُ أُعَدَّتْ لِلْمُتَّقِينَ }
[سورة آل عمران | 3:133]

"And hasten to forgiveness from your Lord and a garden as wide as the heavens and the earth, prepared for the righteous."

انضم إلينا في رحلة التنافس اليومي نحو المعرفة الإسلامية! 🚀`
      : `📖 Ayah of the Day from *Batl Muslim* App 🌟

"And hasten to forgiveness from your Lord and a garden as wide as the heavens and the earth, prepared for the righteous."
[Surah Al-Imran | 3:133]

Join us in our daily journey towards Islamic knowledge! 🚀`;

    await shareAchievementWithImage(message);
  };

  // Date formatting
  const formattedDates = useMemo(() => {
    const today = new Date();
    const gregorian = today.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const hijri = new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA-u-ca-islamic' : 'en-US-u-ca-islamic', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(today);
    
    return { gregorian, hijri };
  }, [language]);

  const prayerPercent = Math.round((prayersCompletedCount / 5) * 100);
  const recitationPercent = Math.round((recitationMinutes / 20) * 100);

  // Daily quest progress calculation
  const completedQuestsCount = [questTriviaPlayed, questPrayerLogged, questVoiceDone].filter(Boolean).length;

  return (
    <ScrollView style={styles.outerContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        <ArabesqueBackgroundPattern />
        <View style={styles.topGlow} />

        {/* Custom Glowing Emerald Header (exactly matching the mockup) */}
        <View style={styles.mockupHeader}>
          {/* Ceiling hanging stars & crescent layout design details */}
          <Svg style={styles.headerBackgroundSvg} width="100%" height={150}>
            <Defs>
              <LinearGradient id="headerGlow" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#0B3E2E" />
                <Stop offset="50%" stopColor="#11231D" stopOpacity="0.8" />
                <Stop offset="100%" stopColor="#09120F" stopOpacity="0" />
              </LinearGradient>
            </Defs>
            <Circle cx="50%" cy="-30" r="140" fill="url(#headerGlow)" />
            {/* Hanging Crescent Moon */}
            <Path
              d="M32 40 a12 12 0 1 0 10 18 a10 10 0 1 1 -10 -18"
              fill="#FBBF24"
              opacity="0.8"
            />
            {/* Hanging Star 1 */}
            <Path d="M120 40 l2 4 l4 1 l-3 3 l1 4 l-4 -2 l-4 2 l1 -4 l-3 -3 l4 -1 z" fill="#FBBF24" opacity="0.6" />
            {/* Hanging Star 2 */}
            <Path d="M280 50 l1 3 l3 1 l-2 2 l0 3 l-3 -2 l-3 2 l0 -3 l-2 -2 l3 -1 z" fill="#FBBF24" opacity="0.5" />
          </Svg>

          <View style={styles.headerTopRow}>
            {/* Notifications Bell */}
            <TouchableOpacity style={styles.notificationBtn} activeOpacity={0.75}>
              <Text style={styles.notificationEmoji}>🔔</Text>
            </TouchableOpacity>

            {/* Central App Shield Logo */}
            <View style={styles.logoBadgeContainer}>
              <View style={styles.shieldLogo}>
                <Text style={styles.shieldLogoText}>🌙</Text>
              </View>
              <Text style={styles.appName}>{t('appName')}</Text>
            </View>

            {/* Dynamic Local Clock */}
            <Text style={styles.timeText}>
              {new Date().toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          
          <Text style={styles.dateLabel}>{formattedDates.hijri} | {formattedDates.gregorian}</Text>
        </View>

        <View style={styles.bodyContent}>

          {/* Level Progress Bar (Pokemon Go Style) */}
          <View style={styles.levelProgressContainer}>
            <View style={styles.homeLevelRow}>
              <Text style={styles.levelText}>
                {language === 'ar' 
                  ? `المستوى ${Math.max(1, Math.floor(currentScore / 100))}` 
                  : `Level ${Math.max(1, Math.floor(currentScore / 100))}`}
              </Text>
              <Text style={styles.homeLevelBadgeText}>{levelName}</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${currentScore % 100}%` }]} />
            </View>
            <Text style={styles.xpFractionText}>{currentScore % 100} / 100 XP</Text>
          </View>

          {/* Communal Quest Card */}
          <View style={styles.communalCard}>
            <View style={styles.communalHeaderRow}>
              <View style={styles.communalBadge}>
                <Text style={styles.communalBadgeText}>
                  {language === 'ar' ? 'التحدي الجماعي اليومي ⚡' : 'Daily Communal Quest ⚡'}
                </Text>
              </View>
              <Text style={styles.communalTitle}>
                {language === 'ar' ? 'الصلاة على النبي ﷺ الاستغفار' : 'Salawat & Seeking Forgiveness'}
              </Text>
            </View>
            
            <View style={styles.communalProgressRow}>
              <View style={styles.communalBarBg}>
                <View style={[styles.communalBarFill, { width: `${Math.min(100, (communalCount / 50000) * 100)}%` }]} />
              </View>
              <Text style={styles.communalProgressText}>
                {communalCount.toLocaleString()} / 50,000
              </Text>
            </View>

            <TouchableOpacity 
              style={[styles.contributeBtn, hasContributedToday && styles.contributeBtnDisabled]}
              onPress={handleContributeCommunal}
              disabled={hasContributedToday}
              activeOpacity={0.8}
            >
              <Text style={styles.contributeBtnText}>
                {hasContributedToday 
                  ? (language === 'ar' ? '✅ ساهمت اليوم' : '✅ Contributed Today')
                  : (language === 'ar' ? '📿 ساهم بـ +١٠ صلوات على النبي (+٥ نقاط)' : '📿 Contribute +10 Salawat (+5 XP)')}
              </Text>
            </TouchableOpacity>
          </View>

            {/* Daily Goals Progress Dashboard */}
            <Text style={styles.sectionTitle}>{t('dailyGoals')}</Text>
            <View style={styles.dailyGoalsRow}>
              <CircularProgress
                size={80}
                strokeWidth={7}
                percent={prayerPercent}
                emoji="🕌"
                label={t('prayers')}
                color="#10B981"
                ringColor="#34D399"
                colors={homeColors}
              />
              <CircularProgress
                size={80}
                strokeWidth={7}
                percent={recitationPercent}
                emoji="🎙️"
                label={t('recitation')}
                color="#F59E0B"
                ringColor="#FBBF24"
                colors={homeColors}
              />
              <View style={styles.streakContainer}>
                <View style={styles.streakFlameWrapper}>
                  <Text style={styles.streakFlame}>🔥</Text>
                  <Text style={styles.streakCount}>{streakDays}</Text>
                </View>
                <Text style={styles.percentText}>{streakDays} {t('days')}</Text>
                <Text style={styles.progressLabel}>{t('streak')}</Text>
              </View>
            </View>

            {/* Unified Daily Quests (Interlinking challenges) */}
            <Text style={styles.sectionTitle}>{t('dailyQuestTitle')}</Text>
            <View style={styles.questCard}>
              <View style={styles.questProgressRow}>
                <Text style={styles.questPercentText}>{completedQuestsCount}/3</Text>
                <Text style={styles.questProgressLabel}>{t('questProgress')}</Text>
              </View>
              <View style={styles.questBarBackground}>
                <View style={[styles.questBarFill, { width: `${(completedQuestsCount / 3) * 100}%` }]} />
              </View>

              <View style={styles.questsList}>
                <View style={styles.questItem}>
                  <Text style={[styles.questCheckIcon, questTriviaPlayed && styles.questCheckIconActive]}>
                    {questTriviaPlayed ? '✓' : '○'}
                  </Text>
                  <Text style={[styles.questItemText, questTriviaPlayed && styles.questItemTextDone]}>
                    {t('questTrivia')}
                  </Text>
                </View>
                <View style={styles.questItem}>
                  <Text style={[styles.questCheckIcon, questPrayerLogged && styles.questCheckIconActive]}>
                    {questPrayerLogged ? '✓' : '○'}
                  </Text>
                  <Text style={[styles.questItemText, questPrayerLogged && styles.questItemTextDone]}>
                    {t('questPrayer')}
                  </Text>
                </View>
                <View style={styles.questItem}>
                  <Text style={[styles.questCheckIcon, questVoiceDone && styles.questCheckIconActive]}>
                    {questVoiceDone ? '✓' : '○'}
                  </Text>
                  <Text style={[styles.questItemText, questVoiceDone && styles.questItemTextDone]}>
                    {t('questVoice')}
                  </Text>
                </View>
              </View>

              {questBonusAwarded && (
                <View style={styles.questBonusBadge}>
                  <Text style={styles.questBonusText}>🎁 {t('questCompleted')}</Text>
                </View>
              )}
            </View>

            {/* Ayah of the Day */}
            <Text style={styles.sectionTitle}>{t('ayahOfDay')}</Text>
            <View style={styles.ayahCard}>
              <View style={styles.ayahHeader}>
                <TouchableOpacity style={styles.shareBtn} onPress={handleShareAyah} activeOpacity={0.75}>
                  <Text style={styles.shareBtnText}>{t('share')}</Text>
                </TouchableOpacity>
                <Text style={styles.ayahTitle}>Surah Al-Imran | 3:133</Text>
              </View>
              <Text style={styles.ayahArabic}>
                {`﴿  وَسَارِعُوا إِلَىٰ مَغْفِرَةٍ مِّن رَّبِّكُمْ وَجَنَّةٍ عَرْضُهَا السَّمَاوَاتُ وَالْأَرْضُ أُعَدَّتْ لِلْمُتَّقِينَ  ﴾`}
              </Text>
              <Text style={styles.ayahEnglish}>
                "And hasten to forgiveness from your Lord and a garden as wide as the heavens and the earth, prepared for the righteous."
              </Text>
            </View>

            {/* The 3 Pillars Hub Grid */}
            <Text style={styles.sectionTitle}>
              {language === 'ar' ? 'أركان بطل مسلم 🗺️' : 'Pillars of Muslim Hero 🗺️'}
            </Text>
            
            <View style={styles.pillarsGrid}>
              {/* Worship Pillar */}
              <TouchableOpacity
                onPress={() => navigation.navigate('WorshipSanctuary')}
                activeOpacity={0.85}
                style={styles.pillarCardTouch}
              >
                <ExpoLinearGradient
                  colors={['#10B981', '#064E3B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.pillarCardGradientBorder}
                >
                  <View style={styles.pillarCardInner}>
                    <View style={[styles.pillarIconWrapper, { backgroundColor: '#10B9811A' }]}>
                      <MosqueIcon color="#10B981" />
                    </View>
                    <View style={styles.pillarInfo}>
                      <Text style={styles.pillarTitle}>
                        {language === 'ar' ? 'أركان العبادة' : 'Pillars of Worship'}
                      </Text>
                      <Text style={styles.pillarDesc}>
                        {language === 'ar' ? 'الصلوات، تحدي الفجر، الأذكار اليومية' : 'Prayers, Fajr tracker, Adhkar'}
                      </Text>
                    </View>
                    <Text style={[styles.pillarArrow, { color: '#10B981' }]}>➔</Text>
                  </View>
                </ExpoLinearGradient>
              </TouchableOpacity>

              {/* Quran Pillar */}
              <TouchableOpacity
                onPress={() => navigation.navigate('QuranSanctuary')}
                activeOpacity={0.85}
                style={styles.pillarCardTouch}
              >
                <ExpoLinearGradient
                  colors={['#F59E0B', '#78350F']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.pillarCardGradientBorder}
                >
                  <View style={styles.pillarCardInner}>
                    <View style={[styles.pillarIconWrapper, { backgroundColor: '#F59E0B1A' }]}>
                      <QuranBookIcon color="#F59E0B" />
                    </View>
                    <View style={styles.pillarInfo}>
                      <Text style={styles.pillarTitle}>
                        {language === 'ar' ? 'محراب القرآن الكريم' : 'Quran Sanctuary'}
                      </Text>
                      <Text style={styles.pillarDesc}>
                        {language === 'ar' ? 'تقليد القراء، حفظ الآيات، التفسير' : 'Qari imitation, Memorization, Tafsir'}
                      </Text>
                    </View>
                    <Text style={[styles.pillarArrow, { color: '#F59E0B' }]}>➔</Text>
                  </View>
                </ExpoLinearGradient>
              </TouchableOpacity>

              {/* Knowledge Pillar */}
              <TouchableOpacity
                onPress={() => navigation.navigate('KnowledgeSanctuary')}
                activeOpacity={0.85}
                style={styles.pillarCardTouch}
              >
                <ExpoLinearGradient
                  colors={['#3B82F6', '#1E3A8A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.pillarCardGradientBorder}
                >
                  <View style={styles.pillarCardInner}>
                    <View style={[styles.pillarIconWrapper, { backgroundColor: '#3B82F61A' }]}>
                      <MapScrollIcon color="#3B82F6" />
                    </View>
                    <View style={styles.pillarInfo}>
                      <Text style={styles.pillarTitle}>
                        {language === 'ar' ? 'مسالك المعرفة' : 'Knowledge Quests'}
                      </Text>
                      <Text style={styles.pillarDesc}>
                        {language === 'ar' ? 'خريطة السيرة النبوية، الحديث، المسابقات' : 'Sirah Quest Map, Hadith, Trivia'}
                      </Text>
                    </View>
                    <Text style={[styles.pillarArrow, { color: '#3B82F6' }]}>➔</Text>
                  </View>
                </ExpoLinearGradient>
              </TouchableOpacity>
            </View>
          </View>

        {/* Ad Banner */}
        <View style={styles.adWrapper}>
          <AdBanner />
        </View>

        {/* Welcome Guide Modal */}
        <Modal transparent visible={showGuide} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalEmoji}>🌱</Text>
              <Text style={styles.modalTitle}>مرحباً بك في بطل مسلم!</Text>
              <Text style={styles.modalSubtitle}>إليك خطوات سريعة للبدء والتقدم:</Text>
              
              <View style={styles.guideStep}>
                <Text style={styles.stepNumber}>١</Text>
                <Text style={styles.stepText}>اختر مستوى الأسئلة المناسب لثقافتك الإسلامية.</Text>
              </View>
              <View style={styles.guideStep}>
                <Text style={styles.stepNumber}>٢</Text>
                <Text style={styles.stepText}>أجب على الأسئلة واكسب نقاطاً إضافية مع كل إجابة متتالية.</Text>
              </View>
              <View style={styles.guideStep}>
                <Text style={styles.stepNumber}>٣</Text>
                <Text style={styles.stepText}>راقب ترتيبك بين أبطال العالم ووثق إنجازاتك في ملفك الشخصي.</Text>
              </View>

              <TouchableOpacity style={styles.modalButton} onPress={dismissGuide} activeOpacity={0.85}>
                <Text style={styles.modalButtonText}>ابدأ رحلتي المباركة ✨</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
    position: 'relative',
  },
  bodyContent: {
    padding: 20,
  },
  dualPathContainer: {
    flexDirection: 'row-reverse',
    gap: 12,
    marginBottom: 24,
  },
  pathCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  pathCardActive: {
    borderColor: colors.primary,
    backgroundColor: '#0F2C21',
  },
  pathIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  pathTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textSecondary,
    marginBottom: 4,
    textAlign: 'center',
  },
  pathTitleActive: {
    color: colors.primary,
    fontWeight: '900',
  },
  pathSubtitle: {
    fontSize: 9,
    color: '#86A59780',
    textAlign: 'center',
    fontWeight: '700',
  },
  livePathContainer: {
    gap: 16,
  },
  rivalCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  rivalHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#1E3A2F4D',
    paddingBottom: 12,
    marginBottom: 16,
  },
  rivalHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EF44441F',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF44444D',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  liveText: {
    fontSize: 9,
    color: '#EF4444',
    fontWeight: '900',
  },
  rivalMatchupRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  rivalMatchupPlayer: {
    alignItems: 'center',
    flex: 1.2,
  },
  rivalAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: 8,
  },
  rivalAvatarText: {
    fontSize: 22,
  },
  rivalPlayerName: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 2,
    textAlign: 'center',
    width: 90,
  },
  rivalPlayerXP: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '700',
  },
  rivalMatchupVS: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.accent,
    fontStyle: 'italic',
  },
  rivalMatchupHint: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 16,
    fontWeight: '700',
  },
  overtakeBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  overtakeBtnText: {
    color: '#09120F',
    fontWeight: '900',
    fontSize: 13,
  },
  raidCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 16,
  },
  raidHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  raidTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  raidSub: {
    fontSize: 11,
    color: colors.accent,
    fontWeight: '800',
  },
  raidProgressBg: {
    height: 10,
    backgroundColor: '#09120F',
    borderRadius: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1E3A2F4D',
    marginBottom: 12,
  },
  raidProgressFill: {
    height: '100%',
    backgroundColor: '#EF4444',
    borderRadius: 5,
  },
  raidDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 18,
    textAlign: 'right',
    marginBottom: 16,
    fontWeight: '700',
  },
  raidBonusRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#1E3A2F33',
    paddingTop: 12,
  },
  raidBonusLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  raidBonusVal: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '800',
  },
  topGlow: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#10B9811F',
  },
  mockupHeader: {
    width: '100%',
    paddingTop: 50, // Avoid safe area overlay
    paddingBottom: 24,
    backgroundColor: '#0B2E21',
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    borderBottomWidth: 3,
    borderBottomColor: '#F59E0B', // Gold bottom border
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 10,
  },
  headerBackgroundSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#11231D80',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E3A2F',
  },
  notificationEmoji: {
    fontSize: 16,
  },
  logoBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shieldLogo: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  shieldLogoText: {
    fontSize: 18,
    color: '#000000',
  },
  appName: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    width: 60,
    textAlign: 'center',
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 6,
    backgroundColor: '#152E2480',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E3A2F4D',
  },
  levelCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelBadgeContainer: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  levelBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.accent,
  },
  levelProgressBarBackground: {
    height: 8,
    backgroundColor: '#1E3A2F',
    borderRadius: 4,
    width: '100%',
    marginBottom: 8,
  },
  levelProgressBarFill: {
    height: 8,
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  levelProgressLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'right',
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.textPrimary,
    textAlign: 'right',
    marginBottom: 12,
    marginTop: 8,
  },
  dailyGoalsRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  circularProgressContainer: {
    alignItems: 'center',
  },
  svgWrapper: {
    position: 'relative',
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#09120F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerEmoji: {
    fontSize: 20,
  },
  percentText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 6,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: 2,
  },
  streakContainer: {
    alignItems: 'center',
  },
  streakFlameWrapper: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  streakFlame: {
    fontSize: 48,
    position: 'absolute',
  },
  streakCount: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000000',
    position: 'absolute',
    top: 36,
  },
  questCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  questProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  questPercentText: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.primary,
  },
  questProgressLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  questBarBackground: {
    height: 6,
    backgroundColor: '#1E3A2F',
    borderRadius: 3,
    width: '100%',
    marginBottom: 16,
  },
  questBarFill: {
    height: 6,
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  questsList: {
    gap: 12,
  },
  questItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  questCheckIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    fontSize: 12,
    fontWeight: '900',
    color: colors.textSecondary,
  },
  questCheckIconActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
    color: '#09120F',
  },
  questItemText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  questItemTextDone: {
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  questBonusBadge: {
    marginTop: 16,
    backgroundColor: colors.accentLight,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  questBonusText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.accent,
    textAlign: 'center',
    lineHeight: 16,
  },
  ayahCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  ayahHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  shareBtn: {
    backgroundColor: '#1E3A2F',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  shareBtnText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  ayahTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  ayahArabic: {
    fontSize: 16,
    lineHeight: 28,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  ayahEnglish: {
    fontSize: 11,
    lineHeight: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  challengesGrid: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  challengeCard: {
    flex: 1,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  challengeCardEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  challengeCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  challengeCardDesc: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
    height: 30,
  },
  challengeCardBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  challengeCardBtnText: {
    color: colors.surface,
    fontSize: 11,
    fontWeight: '800',
  },
  quickAccessList: {
    gap: 10,
    marginBottom: 20,
  },
  quickAccessItem: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickAccessArrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  quickAccessText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  adWrapper: {
    marginTop: 8,
    marginBottom: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  guideStep: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 14,
    width: '100%',
  },
  stepNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
    width: 24,
    textAlign: 'center',
    marginLeft: 12,
  },
  stepText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textPrimary,
    textAlign: 'right',
  },
  modalButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  modalButtonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '800',
  },
  levelProgressContainer: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 14,
  },
  homeLevelRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelText: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  homeLevelBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.primary,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: '#09120F',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#1E3A2F',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 5,
  },
  xpFractionText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
    textAlign: 'left',
  },
  communalCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 16,
    gap: 12,
  },
  communalHeaderRow: {
    alignItems: 'flex-end',
    gap: 4,
  },
  communalBadge: {
    backgroundColor: '#1E3A2F33',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-end',
  },
  communalBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  communalTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.primary,
    textAlign: 'right',
  },
  communalProgressRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  communalBarBg: {
    flex: 1,
    height: 10,
    backgroundColor: '#09120F',
    borderRadius: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1E3A2F',
  },
  communalBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 5,
  },
  communalProgressText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  contributeBtn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  contributeBtnDisabled: {
    backgroundColor: '#09120F',
    borderWidth: 1,
    borderColor: '#1E3A2F',
    shadowOpacity: 0,
    elevation: 0,
  },
  contributeBtnText: {
    color: '#09120F',
    fontSize: 11,
    fontWeight: '900',
  },
  pillarsGrid: {
    gap: 12,
    marginBottom: 20,
  },
  pillarCardTouch: {
    borderRadius: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 12,
  },
  pillarCardGradientBorder: {
    borderRadius: 20,
    padding: 1.5,
  },
  pillarCardInner: {
    backgroundColor: 'rgba(9, 18, 15, 0.88)',
    borderRadius: 18.5,
    padding: 15,
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  pillarIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 14,
  },
  pillarInfo: {
    flex: 1,
  },
  pillarTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.textPrimary,
    textAlign: 'right',
    marginBottom: 2,
  },
  pillarDesc: {
    fontSize: 10.5,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  pillarArrow: {
    fontSize: 14,
    marginRight: 6,
    fontWeight: '900',
  },
});
const ONBOARDING_KEY = 'batl-muslim-onboarding-complete-v1';
