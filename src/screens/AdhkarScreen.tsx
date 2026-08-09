import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Circle } from 'react-native-svg';
import { morningAdhkar, eveningAdhkar, type Dhikr } from '../data/adhkar';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { saveUserScore, getCurrentUserProfile } from '../firebase/auth';

export default function AdhkarScreen({ navigation }: any) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { language } = useLanguage();
  
  const [profile, setProfile] = useState<any>(null);
  const [mode, setMode] = useState<'morning' | 'evening'>('morning');
  const [activeIndex, setActiveIndex] = useState(0);
  const [adhkarCounts, setAdhkarCounts] = useState<Record<string, number>>({});
  const [completedSets, setCompletedSets] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const getTodayKey = () => {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const todayStr = getTodayKey();
        const storedCounts = await AsyncStorage.getItem(`adhkar-counts-${todayStr}`);
        const storedSets = await AsyncStorage.getItem(`adhkar-sets-${todayStr}`);

        if (storedCounts) setAdhkarCounts(JSON.parse(storedCounts));
        if (storedSets) setCompletedSets(JSON.parse(storedSets));

        if (user?.uid) {
          const currentProfile = await getCurrentUserProfile(user.uid);
          setProfile(currentProfile);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.uid]);

  // Reset activeIndex when toggling morning/evening
  useEffect(() => {
    setActiveIndex(0);
  }, [mode]);

  const activeAdhkar = mode === 'morning' ? morningAdhkar : eveningAdhkar;
  const currentDhikr: Dhikr | undefined = activeAdhkar[activeIndex];

  const handlePressTasbih = async () => {
    if (!currentDhikr || saving) return;

    const todayStr = getTodayKey();
    const currentRemaining = adhkarCounts[currentDhikr.id] ?? currentDhikr.count;
    
    if (currentRemaining <= 0) {
      // Already finished this card, move to next
      moveToNext();
      return;
    }

    const nextRemaining = currentRemaining - 1;
    const nextCounts = { ...adhkarCounts, [currentDhikr.id]: nextRemaining };
    setAdhkarCounts(nextCounts);
    setSaving(true);

    try {
      await AsyncStorage.setItem(`adhkar-counts-${todayStr}`, JSON.stringify(nextCounts));

      if (nextRemaining === 0) {
        // Play success tone / haptic mock
        const isAllDone = activeAdhkar.every(d => (nextCounts[d.id] ?? d.count) === 0);
        const setKey = `${mode}-${todayStr}`;

        if (isAllDone && !completedSets[setKey]) {
          const nextSets = { ...completedSets, [setKey]: true };
          setCompletedSets(nextSets);
          await AsyncStorage.setItem(`adhkar-sets-${todayStr}`, JSON.stringify(nextSets));

          if (user?.uid && profile) {
            const newScore = (profile.score ?? 0) + 10;
            await saveUserScore(user.uid, newScore);
            setProfile({ ...profile, score: newScore });
          }

          Alert.alert(
            'تقبل الله منك! 📿',
            `أكملت قراءة ${mode === 'morning' ? 'أذكار الصباح' : 'أذكار المساء'} كاملة اليوم! تم إضافة +١٥ نقطة إضافية لرصيدك.`
          );
        } else {
          // Auto advance to next dhikr card in 500ms
          setTimeout(() => {
            moveToNext();
          }, 400);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const moveToNext = () => {
    if (activeIndex < activeAdhkar.length - 1) {
      setActiveIndex(prev => prev + 1);
    }
  };

  const moveToPrev = () => {
    if (activeIndex > 0) {
      setActiveIndex(prev => prev - 1);
    }
  };

  const handleResetMode = async () => {
    const todayStr = getTodayKey();
    const nextCounts = { ...adhkarCounts };
    activeAdhkar.forEach(d => {
      nextCounts[d.id] = d.count;
    });
    setAdhkarCounts(nextCounts);
    setActiveIndex(0);
    await AsyncStorage.setItem(`adhkar-counts-${todayStr}`, JSON.stringify(nextCounts));
  };

  if (loading || !currentDhikr) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  const currentCount = adhkarCounts[currentDhikr.id] ?? currentDhikr.count;
  const targetCount = currentDhikr.count;
  const isCompleted = currentCount === 0;

  // Tasbih progress offset calculations
  const radius = 66;
  const circumference = 2 * Math.PI * radius; // 414.69
  const progressOffset = circumference * (currentCount / targetCount);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with back navigation */}
      <View style={[styles.headerStyle, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.textPrimary} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: [{ scaleX: language === 'ar' ? -1 : 1 }] }}>
            <Path d="m15 18-6-6 6-6" />
          </Svg>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>أذكار اليوم</Text>
        <TouchableOpacity style={styles.resetBtn} onPress={handleResetMode} activeOpacity={0.7}>
          <Text style={[styles.resetText, { color: colors.textSecondary }]}>إعادة العداد</Text>
        </TouchableOpacity>
      </View>

      {/* Segmented Mode Selector */}
      <View style={styles.segmentsWrapper}>
        <View style={[styles.segmentsContainer, { backgroundColor: colors.neutralTint }]}>
          <TouchableOpacity
            style={[styles.segmentBtn, mode === 'evening' && styles.segmentBtnActive]}
            onPress={() => setMode('evening')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, mode === 'evening' ? { color: colors.textPrimary, fontWeight: '700' } : { color: colors.textSecondary }]}>
              🌙 أذكار المساء
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, mode === 'morning' && styles.segmentBtnActive]}
            onPress={() => setMode('morning')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, mode === 'morning' ? { color: colors.textPrimary, fontWeight: '700' } : { color: colors.textSecondary }]}>
              ☀️ أذكار الصباح
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {/* Progress Strip */}
        <View style={styles.progressStripRow}>
          <View style={styles.pillsContainer}>
            {activeAdhkar.map((d, idx) => {
              const dCount = adhkarCounts[d.id] ?? d.count;
              const dDone = dCount === 0;
              const dActive = idx === activeIndex;
              
              let pillColor = colors.border;
              if (dDone) {
                pillColor = colors.primary;
              } else if (dActive) {
                pillColor = colors.accent;
              }

              return (
                <View
                  key={d.id}
                  style={[styles.progressPill, { backgroundColor: pillColor }]}
                />
              );
            })}
          </View>
          <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
            الذكر {activeIndex + 1} من {activeAdhkar.length}
          </Text>
        </View>

        {/* Swipe/Main Dhikr Card */}
        <View style={[styles.dhikrCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          
          {/* Top category chip */}
          <View style={styles.cardHeaderRow}>
            {activeIndex > 0 ? (
              <TouchableOpacity style={styles.navArrow} onPress={moveToPrev} activeOpacity={0.7}>
                <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={colors.textSecondary} strokeWidth="2.2">
                  <Path d="m9 18 6-6-6-6" />
                </Svg>
              </TouchableOpacity>
            ) : <View style={{ width: 32 }} />}

            <View style={[styles.countChip, { backgroundColor: '#ECFDF5', borderColor: '#A4F4CF' }]}>
              <Text style={[styles.countChipText, { color: '#00604F' }]}>
                تكرار · {targetCount} {targetCount === 1 ? 'مرة' : targetCount === 3 ? 'مرات' : 'تكرار'}
              </Text>
            </View>

            {activeIndex < activeAdhkar.length - 1 ? (
              <TouchableOpacity style={styles.navArrow} onPress={moveToNext} activeOpacity={0.7}>
                <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={colors.textSecondary} strokeWidth="2.2">
                  <Path d="m15 18-6-6 6-6" />
                </Svg>
              </TouchableOpacity>
            ) : <View style={{ width: 32 }} />}
          </View>

          {/* Dhikr text */}
          <Text style={[styles.dhikrTextContent, { color: colors.textPrimary }]}>
            {currentDhikr.text}
          </Text>

          {/* reward phrase */}
          <Text style={[styles.rewardLabelText, { color: colors.textSecondary }]}>
            {currentDhikr.reward}
          </Text>

          {/* Tasbih circular dial */}
          <View style={styles.dialContainer}>
            <Svg width="150" height="150" viewBox="0 0 150 150">
              {/* Dial Track Circle */}
              <Circle
                cx="75"
                cy="75"
                r={radius}
                stroke={colors.neutralTint}
                strokeWidth="10"
                fill="transparent"
              />
              {/* Dial Progress Circle */}
              <Circle
                cx="75"
                cy="75"
                r={radius}
                stroke="#10B981"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={progressOffset}
                strokeLinecap="round"
                transform="rotate(-90 75 75)"
              />
            </Svg>
            <View style={styles.dialTextWrapper}>
              <Text style={[styles.dialCountText, { color: colors.textPrimary }]}>
                {isCompleted ? '✓' : currentCount}
              </Text>
              {!isCompleted && (
                <Text style={[styles.dialRemainingText, { color: colors.textTertiary }]}>
                  من {targetCount}
                </Text>
              )}
            </View>
          </View>

          {/* Tasbih trigger button */}
          <TouchableOpacity
            style={[styles.tasbihButton, { backgroundColor: isCompleted ? colors.primaryLight : '#059669' }]}
            onPress={handlePressTasbih}
            activeOpacity={0.85}
            disabled={saving}
          >
            <Text style={[styles.tasbihButtonText, { color: isCompleted ? '#00604F' : colors.surface }]}>
              {isCompleted ? 'أكملت الذكر ✨' : 'اضغط للتسبيح'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Reward Strip */}
        <View style={[styles.rewardStripCard, { backgroundColor: colors.accentTint, borderColor: colors.accentTintBorder }]}>
          <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={colors.accentOnTint} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
          </Svg>
          <Text style={[styles.rewardStripText, { color: colors.accentOnTint }]}>
            أكمل الأوراد كاملة للحصول على نقاط مضاعفة اليوم!
          </Text>
          <Text style={[styles.rewardPointsText, { color: colors.accentDeep }]}>
            +١٥ نقطة
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerStyle: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  resetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  resetText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'IBMPlexSansArabic-SemiBold',
  },
  segmentsWrapper: {
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
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
  scrollBody: {
    padding: 20,
    paddingBottom: 36,
  },
  progressStripRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'IBMPlexSansArabic-SemiBold',
    writingDirection: 'ltr',
  },
  pillsContainer: {
    flexDirection: 'row-reverse',
    gap: 4,
  },
  progressPill: {
    width: 14,
    height: 4,
    borderRadius: 999,
  },
  dhikrCard: {
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
    shadowColor: '#1D2939',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  navArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  countChipText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  dhikrTextContent: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 40,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 6,
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  rewardLabelText: {
    fontSize: 12.5,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  dialContainer: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 24,
  },
  dialTextWrapper: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialCountText: {
    fontSize: 44,
    fontWeight: '700',
    writingDirection: 'ltr',
  },
  dialRemainingText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: -4,
    writingDirection: 'ltr',
  },
  tasbihButton: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  tasbihButtonText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  rewardStripCard: {
    flexDirection: 'row-reverse',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  rewardStripText: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: '600',
    textAlign: 'right',
    fontFamily: 'IBMPlexSansArabic-SemiBold',
  },
  rewardPointsText: {
    fontSize: 13,
    fontWeight: '700',
    writingDirection: 'ltr',
  },
});
