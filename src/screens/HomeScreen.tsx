import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Share, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle, Defs, LinearGradient, Stop, Path } from 'react-native-svg';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getCurrentUserProfile, saveUserScore } from '../firebase/auth';
import { shareAchievementWithImage } from '../utils/sharing';
import AdBanner from '../components/AdBanner';
import { Colors } from '../config/colors';

// Custom SVG Circular Progress Ring
function CircularProgress({ size, strokeWidth, percent, emoji, label, color, ringColor }: any) {
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
  const [profile, setProfile] = useState<any>(null);
  const [showGuide, setShowGuide] = useState(false);
  
  // Daily goals state
  const [prayersCompletedCount, setPrayersCompletedCount] = useState(0);
  const [recitationMinutes, setRecitationMinutes] = useState(15);
  const [streakDays, setStreakDays] = useState(7);

  // Daily Quests State (Trivia, Prayer, Voice)
  const [questTriviaPlayed, setQuestTriviaPlayed] = useState(false);
  const [questPrayerLogged, setQuestPrayerLogged] = useState(false);
  const [questVoiceDone, setQuestVoiceDone] = useState(false);
  const [questBonusAwarded, setQuestBonusAwarded] = useState(false);

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

        {/* Level Badge Card */}
        <View style={styles.levelCard}>
          <View style={styles.levelRow}>
            <View style={styles.levelBadgeContainer}>
              <Text style={styles.levelBadgeText}>{levelName}</Text>
            </View>
            <Text style={styles.pointsText}>⭐ {currentScore} {t('points')}</Text>
          </View>
          <View style={styles.levelProgressBarBackground}>
            <View style={[styles.levelProgressBarFill, { width: `${Math.min(currentScore, 100)}%` }]} />
          </View>
          <Text style={styles.levelProgressLabel}>
            {Math.min(currentScore, 100)}% {language === 'ar' ? 'للوصول للمستوى التالي' : 'to next level'}
          </Text>
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
          />
          <CircularProgress
            size={80}
            strokeWidth={7}
            percent={recitationPercent}
            emoji="🎙️"
            label={t('recitation')}
            color="#F59E0B"
            ringColor="#FBBF24"
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

        {/* Today's Challenges Grid */}
        <Text style={styles.sectionTitle}>{t('challenges')}</Text>
        <View style={styles.challengesGrid}>
          <TouchableOpacity
            style={[styles.challengeCard, { backgroundColor: '#10B9811A', borderColor: '#10B9814D' }]}
            onPress={() => navigation.navigate('Trivia')}
            activeOpacity={0.85}
          >
            <Text style={styles.challengeCardEmoji}>🧠</Text>
            <Text style={styles.challengeCardTitle}>{t('dailyTrivia')}</Text>
            <Text style={styles.challengeCardDesc}>{t('dailyTriviaDesc')}</Text>
            <View style={styles.challengeCardBtn}>
              <Text style={styles.challengeCardBtnText}>{t('startChallenge')}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.challengeCard, { backgroundColor: '#F59E0B1A', borderColor: '#F59E0B4D' }]}
            onPress={() => navigation.navigate('Voice')}
            activeOpacity={0.85}
          >
            <Text style={styles.challengeCardEmoji}>🎙️</Text>
            <Text style={styles.challengeCardTitle}>{t('recitationHub')}</Text>
            <Text style={styles.challengeCardDesc}>{t('recitationHubDesc')}</Text>
            <View style={[styles.challengeCardBtn, { backgroundColor: '#FBBF24' }]}>
              <Text style={[styles.challengeCardBtnText, { color: '#000000' }]}>{t('reciteNow')}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Quick Access List */}
        <View style={styles.quickAccessList}>
          <TouchableOpacity style={styles.quickAccessItem} onPress={() => navigation.navigate('PrayerTracker')} activeOpacity={0.8}>
            <Text style={styles.quickAccessArrow}>➔</Text>
            <Text style={styles.quickAccessText}>{t('prayerTrackerLink')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAccessItem} onPress={() => navigation.navigate('Adhkar')} activeOpacity={0.8}>
            <Text style={styles.quickAccessArrow}>➔</Text>
            <Text style={styles.quickAccessText}>{t('adhkarLink')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAccessItem} onPress={() => navigation.navigate('Memorization')} activeOpacity={0.8}>
            <Text style={styles.quickAccessArrow}>➔</Text>
            <Text style={styles.quickAccessText}>{t('memorizationLink')}</Text>
          </TouchableOpacity>
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

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  container: {
    flex: 1,
    padding: 20,
    position: 'relative',
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
    marginTop: 10,
    marginBottom: 20,
    alignItems: 'center',
    position: 'relative',
    width: '100%',
    paddingBottom: 10,
  },
  headerBackgroundSvg: {
    position: 'absolute',
    top: -20,
    left: 0,
    right: 0,
    zIndex: -1,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 4,
    marginBottom: 8,
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
    color: Colors.textPrimary,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textSecondary,
    width: 60,
    textAlign: 'center',
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
    marginTop: 6,
    backgroundColor: '#152E2480',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E3A2F4D',
  },
  levelCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelBadgeContainer: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  levelBadgeText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.accent,
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
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  levelProgressLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: 'right',
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.textPrimary,
    textAlign: 'right',
    marginBottom: 12,
    marginTop: 8,
  },
  dailyGoalsRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: Colors.border,
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
    color: Colors.textPrimary,
    marginTop: 6,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
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
    backgroundColor: Colors.surface,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
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
    color: Colors.primary,
  },
  questProgressLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
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
    backgroundColor: Colors.primary,
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
    borderColor: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    fontSize: 12,
    fontWeight: '900',
    color: Colors.textSecondary,
  },
  questCheckIconActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
    color: '#09120F',
  },
  questItemText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  questItemTextDone: {
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  questBonusBadge: {
    marginTop: 16,
    backgroundColor: Colors.accentLight,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  questBonusText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.accent,
    textAlign: 'center',
    lineHeight: 16,
  },
  ayahCard: {
    backgroundColor: Colors.surface,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
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
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  ayahTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  ayahArabic: {
    fontSize: 16,
    lineHeight: 28,
    fontWeight: '700',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  ayahEnglish: {
    fontSize: 11,
    lineHeight: 16,
    color: Colors.textSecondary,
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
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  challengeCardDesc: {
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
    height: 30,
  },
  challengeCardBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  challengeCardBtnText: {
    color: Colors.surface,
    fontSize: 11,
    fontWeight: '800',
  },
  quickAccessList: {
    gap: 10,
    marginBottom: 20,
  },
  quickAccessItem: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickAccessArrow: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  quickAccessText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
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
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
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
    color: Colors.primary,
    width: 24,
    textAlign: 'center',
    marginLeft: 12,
  },
  stepText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: Colors.textPrimary,
    textAlign: 'right',
  },
  modalButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  modalButtonText: {
    color: Colors.surface,
    fontSize: 14,
    fontWeight: '800',
  },
});
const ONBOARDING_KEY = 'batl-muslim-onboarding-complete-v1';
