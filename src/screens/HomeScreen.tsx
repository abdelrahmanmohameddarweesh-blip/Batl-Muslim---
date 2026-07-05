import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Share } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useAuth } from '../contexts/AuthContext';
import { getCurrentUserProfile } from '../firebase/auth';
import AdBanner from '../components/AdBanner';
import { Colors } from '../config/colors';

const ONBOARDING_KEY = 'batl-muslim-onboarding-complete-v1';

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
          {/* Background Track Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#1A342B"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress Circle */}
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
        {/* Central Emoji */}
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
  const [profile, setProfile] = useState<any>(null);
  const [showGuide, setShowGuide] = useState(false);
  
  // Dynamic stats loaded from device
  const [prayersCompletedCount, setPrayersCompletedCount] = useState(0);
  const [recitationMinutes, setRecitationMinutes] = useState(15); // Default mock matching mockup
  const [streakDays, setStreakDays] = useState(7); // Default mock matching mockup

  const loadData = async () => {
    if (!user?.uid) return;
    try {
      const currentProfile = await getCurrentUserProfile(user.uid);
      setProfile(currentProfile);

      // Load today's prayers status
      const today = new Date();
      const todayStr = `prayer-tracker-${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
      const stored = await AsyncStorage.getItem(todayStr);
      if (stored) {
        const parsed = JSON.parse(stored);
        const count = Object.values(parsed).filter(Boolean).length;
        setPrayersCompletedCount(count);
      } else {
        setPrayersCompletedCount(0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();

    // Reload profile and stats whenever the user navigates back to HomeScreen
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
    if (currentScore >= 500) return 'البطل الأسطوري';
    if (currentScore >= 200) return 'بطل ذهبي';
    if (currentScore >= 80) return 'بطل فضي';
    return 'بطل مبتدئ';
  }, [currentScore]);

  const dismissGuide = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setShowGuide(false);
  };

  const handleShareAyah = async () => {
    try {
      const message = `📖 آية اليوم من تطبيق *بطل مسلم* 🌟

{ وَسَارِعُوا إِلَىٰ مَغْفِرَةٍ مِّن رَّبِّكُمْ وَجَنَّةٍ عَرْضُهَا السَّمَاوَاتُ وَالْأَرْضُ أُعَدَّتْ لِلْمُتَّقِينَ }
[سورة آل عمران | 3:133]

"And hasten to forgiveness from your Lord and a garden as wide as the heavens and the earth, prepared for the righteous."

انضم إلينا في رحلة التنافس اليومي نحو المعرفة الإسلامية! 🚀`;

      await Share.share({ message });
    } catch (err) {
      console.error(err);
    }
  };

  // Date Formatting (Gregorian & Hijri)
  const gregorianDate = useMemo(() => {
    const today = new Date();
    return today.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }, []);

  const hijriDate = useMemo(() => {
    return new Intl.DateTimeFormat('ar-SA-u-ca-islamic', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  }, []);

  // Compute percentages
  const prayerPercent = Math.round((prayersCompletedCount / 5) * 100);
  const recitationPercent = Math.round((recitationMinutes / 20) * 100);

  return (
    <ScrollView style={styles.outerContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        <View style={styles.topGlow} />

        {/* Welcome Header */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity style={styles.notificationBtn} activeOpacity={0.75}>
              <Text style={styles.notificationEmoji}>🔔</Text>
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <View style={styles.titleWithIcon}>
                <Text style={styles.title}>بطل مسلم</Text>
                <Text style={styles.badgeIcon}>🛡️</Text>
              </View>
              <Text style={styles.subtitle}>وَفِي ذَلِكَ فَلْيَتَنَافَسِ الْمُتَنَافِسُونَ</Text>
            </View>
          </View>
          
          <View style={styles.dateBadge}>
            <Text style={styles.dateText}>{hijriDate} | {gregorianDate}</Text>
          </View>
        </View>

        {/* Level Badge Card */}
        <View style={styles.levelCard}>
          <View style={styles.levelRow}>
            <View style={styles.levelBadgeContainer}>
              <Text style={styles.levelBadgeText}>{levelName}</Text>
            </View>
            <Text style={styles.pointsText}>⭐ {currentScore} نقطة</Text>
          </View>
          <View style={styles.levelProgressBarBackground}>
            <View style={[styles.levelProgressBarFill, { width: `${Math.min(currentScore, 100)}%` }]} />
          </View>
          <Text style={styles.levelProgressLabel}>{Math.min(currentScore, 100)}% للترقية إلى الرتبة التالية</Text>
        </View>

        {/* Daily Goals Progress Dashboard */}
        <Text style={styles.sectionTitle}>الأهداف اليومية</Text>
        <View style={styles.dailyGoalsRow}>
          <CircularProgress
            size={80}
            strokeWidth={7}
            percent={prayerPercent}
            emoji="🕌"
            label="الصلوات"
            color="#10B981"
            ringColor="#34D399"
          />
          <CircularProgress
            size={80}
            strokeWidth={7}
            percent={recitationPercent}
            emoji="🎙️"
            label="التلاوة"
            color="#F59E0B"
            ringColor="#FBBF24"
          />
          <View style={styles.streakContainer}>
            <View style={styles.streakFlameWrapper}>
              <Text style={styles.streakFlame}>🔥</Text>
              <Text style={styles.streakCount}>{streakDays}</Text>
            </View>
            <Text style={styles.percentText}>{streakDays} أيام</Text>
            <Text style={styles.progressLabel}>سلسلة التحدي</Text>
          </View>
        </View>

        {/* Ayah of the Day */}
        <Text style={styles.sectionTitle}>آية اليوم</Text>
        <View style={styles.ayahCard}>
          <View style={styles.ayahHeader}>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShareAyah} activeOpacity={0.75}>
              <Text style={styles.shareBtnText}>مشاركة 💬</Text>
            </TouchableOpacity>
            <Text style={styles.ayahTitle}>سورة آل عمران | 3:133</Text>
          </View>
          <Text style={styles.ayahArabic}>
            {`﴿  وَسَارِعُوا إِلَىٰ مَغْفِرَةٍ مِّن رَّبِّكُمْ وَجَنَّةٍ عَرْضُهَا السَّمَاوَاتُ وَالْأَرْضُ أُعَدَّتْ لِلْمُتَّقِينَ  ﴾`}
          </Text>
          <Text style={styles.ayahEnglish}>
            "And hasten to forgiveness from your Lord and a garden as wide as the heavens and the earth, prepared for the righteous."
          </Text>
        </View>

        {/* Today's Challenges Grid */}
        <Text style={styles.sectionTitle}>التحديات المتاحة</Text>
        <View style={styles.challengesGrid}>
          <TouchableOpacity
            style={[styles.challengeCard, { backgroundColor: '#10B9811A', borderColor: '#10B9814D' }]}
            onPress={() => navigation.navigate('Trivia')}
            activeOpacity={0.85}
          >
            <Text style={styles.challengeCardEmoji}>🧠</Text>
            <Text style={styles.challengeCardTitle}>تحدي المعرفة</Text>
            <Text style={styles.challengeCardDesc}>تخصيص كامل للأسئلة والفقه</Text>
            <View style={styles.challengeCardBtn}>
              <Text style={styles.challengeCardBtnText}>ابدأ اللعب ➔</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.challengeCard, { backgroundColor: '#F59E0B1A', borderColor: '#F59E0B4D' }]}
            onPress={() => navigation.navigate('Voice')}
            activeOpacity={0.85}
          >
            <Text style={styles.challengeCardEmoji}>🎙️</Text>
            <Text style={styles.challengeCardTitle}>محاكاة التلاوة</Text>
            <Text style={styles.challengeCardDesc}>تحليل النغم ومحاكاة القراء</Text>
            <View style={[styles.challengeCardBtn, { backgroundColor: '#FBBF24' }]}>
              <Text style={[styles.challengeCardBtnText, { color: '#000000' }]}>سجّل الآن ➔</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Quick Access List */}
        <View style={styles.quickAccessList}>
          <TouchableOpacity style={styles.quickAccessItem} onPress={() => navigation.navigate('PrayerTracker')} activeOpacity={0.8}>
            <Text style={styles.quickAccessArrow}>➔</Text>
            <Text style={styles.quickAccessText}>متابعة الصلوات اليومية 🕌</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAccessItem} onPress={() => navigation.navigate('Adhkar')} activeOpacity={0.8}>
            <Text style={styles.quickAccessArrow}>➔</Text>
            <Text style={styles.quickAccessText}>الأذكار اليومية (الصباح والمساء) ☀️</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAccessItem} onPress={() => navigation.navigate('Memorization')} activeOpacity={0.8}>
            <Text style={styles.quickAccessArrow}>➔</Text>
            <Text style={styles.quickAccessText}>تحديات حفظ ومراجعة الآيات 🧠</Text>
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
  header: {
    marginTop: 20,
    marginBottom: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  notificationBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notificationEmoji: {
    fontSize: 18,
  },
  headerTitleContainer: {
    alignItems: 'flex-end',
  },
  titleWithIcon: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  badgeIcon: {
    fontSize: 20,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 2,
  },
  dateBadge: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
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
