import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { prayers } from '../data/prayers';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { saveUserScore, getCurrentUserProfile } from '../firebase/auth';

export default function PrayerTrackerScreen({ navigation }: any) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { language } = useLanguage();
  const [profile, setProfile] = useState<any>(null);
  const [checkedPrayers, setCheckedPrayers] = useState<Record<string, boolean>>({});
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const getTodayKey = () => {
    const today = new Date();
    return `prayer-tracker-${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  };

  const getHistoryKeyForDate = (date: Date) => {
    return `prayer-tracker-${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const todayKey = getTodayKey();
        const stored = await AsyncStorage.getItem(todayKey);
        if (stored) {
          setCheckedPrayers(JSON.parse(stored));
        }

        // Load 7 days history
        const tempHistory = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const key = getHistoryKeyForDate(d);
          const histVal = await AsyncStorage.getItem(key);
          const parsed = histVal ? JSON.parse(histVal) : {};
          tempHistory.push({
            label: d.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'narrow' }),
            isToday: i === 0,
            prayers: parsed,
          });
        }
        setHistoryData(tempHistory);

        // Load profile
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
  }, [user?.uid, language]);

  // Calculate Next Prayer details dynamically
  const getNextPrayerDetails = () => {
    const today = new Date();
    const currentMinutes = today.getHours() * 60 + today.getMinutes();

    // Map prayer names to their approximate minutes from midnight
    const prayerTimes = [
      { id: 'fajr', time: 270, labelAr: 'الفجر', timeStr: '٤:٣٠ ص' },
      { id: 'dhuhr', time: 740, labelAr: 'الظهر', timeStr: '١٢:٢٠ م' },
      { id: 'asr', time: 940, labelAr: 'العصر', timeStr: '٣:٤٠ م' },
      { id: 'maghrib', time: 1130, labelAr: 'المغرب', timeStr: '٦:٥٠ م' },
      { id: 'isha', time: 1220, labelAr: 'العشاء', timeStr: '٨:٢٠ م' },
    ];

    let next = prayerTimes.find(p => p.time > currentMinutes);
    if (!next) {
      next = prayerTimes[0]; // If all passed, next is Fajr tomorrow
    }

    const diff = next.time > currentMinutes ? next.time - currentMinutes : (1440 - currentMinutes) + next.time;
    const hoursLeft = Math.floor(diff / 60);
    const minutesLeft = diff % 60;
    
    let timeHint = '';
    if (hoursLeft > 0) {
      timeHint = `بعد ${hoursLeft} ساعة و ${minutesLeft} د`;
    } else {
      timeHint = `بعد ${minutesLeft} دقيقة`;
    }

    return {
      id: next.id,
      name: next.labelAr,
      timeStr: next.timeStr,
      timeHint,
    };
  };

  const nextPrayer = getNextPrayerDetails();

  const handleTogglePrayer = async (id: string) => {
    if (saving) return;

    const nextState = {
      ...checkedPrayers,
      [id]: !checkedPrayers[id],
    };

    setCheckedPrayers(nextState);
    setSaving(true);

    try {
      const key = getTodayKey();
      await AsyncStorage.setItem(key, JSON.stringify(nextState));

      const currentCheckedCount = Object.values(checkedPrayers).filter(Boolean).length;
      const nextCheckedCount = Object.values(nextState).filter(Boolean).length;

      if (nextCheckedCount > currentCheckedCount) {
        if (user?.uid && profile) {
          const newScore = (profile.score ?? 0) + 3;
          await saveUserScore(user.uid, newScore);
          setProfile({ ...profile, score: newScore });
        }
      } else if (nextCheckedCount < currentCheckedCount) {
        if (user?.uid && profile) {
          const newScore = Math.max(0, (profile.score ?? 0) - 3);
          await saveUserScore(user.uid, newScore);
          setProfile({ ...profile, score: newScore });
        }
      }

      if (nextCheckedCount === 5) {
        Alert.alert('ما شاء الله! 🎉', 'أكملت جميع صلوات اليوم المفروضة! تم إضافة +١٥ نقطة إضافية لرصيدك.');
        if (user?.uid && profile) {
          const newScore = (profile.score ?? 0) + 15;
          await saveUserScore(user.uid, newScore);
          setProfile({ ...profile, score: newScore });
        }
      }

      setHistoryData(prev => prev.map(day => {
        if (day.isToday) {
          return { ...day, prayers: nextState };
        }
        return day;
      }));

    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const completedCount = Object.values(checkedPrayers).filter(Boolean).length;

  const totalLoggedCount = historyData.reduce((acc, curr) => {
    return acc + Object.values(curr.prayers).filter(Boolean).length;
  }, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.headerStyle, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.textPrimary} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: [{ scaleX: language === 'ar' ? -1 : 1 }] }}>
            <Path d="m15 18-6-6 6-6" />
          </Svg>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>الصلوات الخمس</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#059669" style={styles.loader} />
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Summary Hero Card */}
          <View style={styles.heroShadowWrapper}>
            <LinearGradient
              colors={['#059669', '#047857']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <View style={styles.heroTopRow}>
                <View style={styles.heroCol}>
                  <Text style={styles.heroLabel}>صلوات اليوم</Text>
                  <Text style={styles.heroVal}>{completedCount} من ٥</Text>
                </View>
                <View style={styles.heroDivider} />
                <View style={styles.heroCol}>
                  <Text style={styles.heroLabel}>الصلاة القادمة</Text>
                  <Text style={styles.heroVal}>{nextPrayer.name} · {nextPrayer.timeStr}</Text>
                </View>
              </View>

              {/* Progress Track */}
              <View style={styles.progressTrackBg}>
                <LinearGradient
                  colors={['#F5B841', '#FBBF24']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressTrackFill, { width: `${(completedCount / 5) * 100}%` }]}
                />
              </View>
            </LinearGradient>
          </View>

          {/* List of Prayers */}
          <View style={styles.prayerList}>
            {prayers.map((prayer) => {
              const isChecked = !!checkedPrayers[prayer.id];
              const isNext = nextPrayer.id === prayer.id;
              
              let checkboxFill = 'transparent';
              let checkboxBorder = colors.borderStrong;

              if (isChecked) {
                checkboxFill = colors.primary;
                checkboxBorder = colors.primary;
              } else if (isNext) {
                checkboxBorder = colors.accent;
              }

              return (
                <TouchableOpacity
                  key={prayer.id}
                  style={[
                    styles.prayerCard,
                    isChecked && { borderColor: colors.primaryTintBorder },
                    isNext && styles.nextPrayerCard,
                    { backgroundColor: colors.surface }
                  ]}
                  onPress={() => handleTogglePrayer(prayer.id)}
                  activeOpacity={0.85}
                  disabled={saving}
                >
                  {/* Leading state checkbox */}
                  <View style={[
                    styles.checkboxCircle,
                    { borderColor: checkboxBorder, backgroundColor: checkboxFill }
                  ]}>
                    {isChecked && (
                      <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M20 6 9 17l-5-5" />
                      </Svg>
                    )}
                  </View>

                  {/* Info Area */}
                  <View style={styles.prayerInfo}>
                    <View style={styles.prayerTitleRow}>
                      {isNext && (
                        <View style={[styles.nextChip, { backgroundColor: colors.accentTint, borderColor: colors.accentTintBorder }]}>
                          <Text style={[styles.nextChipText, { color: colors.accentOnTint }]}>
                            {nextPrayer.timeHint}
                          </Text>
                        </View>
                      )}
                      <Text style={[styles.rakatChip, { backgroundColor: colors.neutralTint, color: colors.textSecondary }]}>
                        {prayer.rakats === 2 ? 'ركعتان' : `${prayer.rakats} ركعات`}
                      </Text>
                      <Text style={[styles.prayerName, { color: colors.textPrimary }]}>
                        {prayer.name}
                      </Text>
                    </View>

                    {/* Subline */}
                    <Text style={[styles.sublineText, { color: colors.textSecondary }]}>
                      {isChecked ? prayer.hadith : prayer.timeHint}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 7-day Grid Panel */}
          <View style={[styles.historyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.historyHeader}>
              <Text style={[styles.historyCountText, { color: colors.primaryDeep }]}>
                {totalLoggedCount} / ٣٥ صلاة
              </Text>
              <Text style={[styles.historyTitleText, { color: colors.textPrimary }]}>
                آخر ٧ أيام
              </Text>
            </View>

            <View style={styles.historyGridRow}>
              {historyData.map((day, dIdx) => (
                <View key={dIdx} style={styles.historyColContainer}>
                  <View style={styles.historyColumn}>
                    {prayers.map((p) => {
                      const wasChecked = !!day.prayers[p.id];
                      let barColor = colors.neutralTint;
                      if (wasChecked) {
                        barColor = colors.primary;
                      } else if (day.isToday) {
                        barColor = colors.accent;
                      } else {
                        barColor = '#F3F4F6';
                      }

                      return (
                        <View
                          key={p.id}
                          style={[styles.historyBarItem, { backgroundColor: barColor }]}
                        />
                      );
                    })}
                  </View>
                  <Text style={[styles.historyColLabel, { color: colors.textSecondary }]}>
                    {day.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      )}
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
  loader: {
    marginTop: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 36,
  },
  heroShadowWrapper: {
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 5,
    marginBottom: 24,
  },
  heroCard: {
    borderRadius: 22,
    padding: 18,
  },
  heroTopRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroCol: {
    flex: 1,
    alignItems: 'center',
  },
  heroDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#A7F3D0',
    marginBottom: 4,
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  heroVal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  progressTrackBg: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressTrackFill: {
    height: '100%',
    borderRadius: 999,
  },
  prayerList: {
    gap: 12,
    marginBottom: 24,
  },
  prayerCard: {
    flexDirection: 'row-reverse',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#1D2939',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  nextPrayerCard: {
    borderWidth: 1.5,
    shadowColor: '#F5B841',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  checkboxCircle: {
    width: 26,
    height: 26,
    borderRadius: 9,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 13,
  },
  prayerInfo: {
    flex: 1,
  },
  prayerTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 4,
  },
  prayerName: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'right',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  rakatChip: {
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 5,
    marginRight: 6,
    fontFamily: 'IBMPlexSansArabic-SemiBold',
  },
  nextChip: {
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 5,
    marginRight: 6,
    borderWidth: 1,
  },
  nextChipText: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
    writingDirection: 'ltr',
  },
  sublineText: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'right',
    lineHeight: 16,
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  historyCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
  },
  historyHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  historyTitleText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  historyCountText: {
    fontSize: 11,
    fontWeight: '600',
    writingDirection: 'ltr',
  },
  historyGridRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  historyColContainer: {
    alignItems: 'center',
  },
  historyColumn: {
    gap: 4,
    marginBottom: 6,
  },
  historyBarItem: {
    width: 28,
    height: 11,
    borderRadius: 3,
  },
  historyColLabel: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
});
