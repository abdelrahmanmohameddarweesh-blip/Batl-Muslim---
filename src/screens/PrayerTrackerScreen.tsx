import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { prayers } from '../data/prayers';
import { useAuth } from '../contexts/AuthContext';
import { saveUserScore, getCurrentUserProfile } from '../firebase/auth';
import { Colors } from '../config/colors';

export default function PrayerTrackerScreen({ navigation }: any) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [checkedPrayers, setCheckedPrayers] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const getTodayKey = () => {
    const today = new Date();
    return `prayer-tracker-${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load local prayer status
        const key = getTodayKey();
        const stored = await AsyncStorage.getItem(key);
        if (stored) {
          setCheckedPrayers(JSON.parse(stored));
        }

        // Load profile score
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

      // Calculate score logic: 3 points for each checked prayer today
      const currentCheckedCount = Object.values(checkedPrayers).filter(Boolean).length;
      const nextCheckedCount = Object.values(nextState).filter(Boolean).length;

      if (nextCheckedCount > currentCheckedCount) {
        // Added a prayer, award +3 points
        if (user?.uid && profile) {
          const newScore = (profile.score ?? 0) + 3;
          await saveUserScore(user.uid, newScore);
          setProfile({ ...profile, score: newScore });
        }
      } else if (nextCheckedCount < currentCheckedCount) {
        // Unchecked a prayer, deduct 3 points
        if (user?.uid && profile) {
          const newScore = Math.max(0, (profile.score ?? 0) - 3);
          await saveUserScore(user.uid, newScore);
          setProfile({ ...profile, score: newScore });
        }
      }

      // Check if all 5 prayers are completed today for a bonus!
      if (nextCheckedCount === 5) {
        Alert.alert('ما شاء الله! 🎉', 'أكملت جميع صلوات اليوم المفروضة! تم إضافة +١٥ نقطة إضافية لرصيدك.');
        if (user?.uid && profile) {
          const newScore = (profile.score ?? 0) + 15;
          await saveUserScore(user.uid, newScore);
          setProfile({ ...profile, score: newScore });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const completedCount = Object.values(checkedPrayers).filter(Boolean).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>الصلوات الخمس</Text>
        <Text style={styles.subtitle}>تتبع صلواتك اليومية وحافظ عليها في وقتها لزيادة نقاطك الإيمانية</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Progress Summary Card */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>صلوات اليوم</Text>
            <Text style={styles.summaryProgress}>{completedCount} من ٥ صلوات</Text>
            
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${(completedCount / 5) * 100}%` }]} />
            </View>
            <Text style={styles.scoreText}>النقاط الحالية: {profile?.score ?? 0} نقطة</Text>
          </View>

          {/* List of Prayers */}
          <View style={styles.prayerList}>
            {prayers.map((prayer) => {
              const isChecked = !!checkedPrayers[prayer.id];
              return (
                <TouchableOpacity
                  key={prayer.id}
                  style={[styles.prayerCard, isChecked && styles.prayerCardChecked]}
                  onPress={() => handleTogglePrayer(prayer.id)}
                  activeOpacity={0.85}
                  disabled={saving}
                >
                  <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                    {isChecked && <Text style={styles.checkboxTick}>✓</Text>}
                  </View>
                  
                  <View style={styles.prayerInfo}>
                    <Text style={[styles.prayerName, isChecked && styles.textChecked]}>{prayer.name}</Text>
                    <Text style={styles.timeHint}>🕒 {prayer.timeHint}</Text>
                    <Text style={styles.hadithText}>{prayer.hadith}</Text>
                  </View>

                  <Text style={styles.pointsLabel}>+{isChecked ? 3 : 0} ن</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  loader: {
    marginTop: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  summaryProgress: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.primary,
    marginBottom: 12,
  },
  progressBarBg: {
    height: 10,
    width: '100%',
    backgroundColor: Colors.background,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 5,
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.accent,
  },
  prayerList: {
    gap: 14,
  },
  prayerCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 2,
  },
  prayerCardChecked: {
    borderColor: Colors.primary + '55',
    backgroundColor: '#F0F9F4',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
    backgroundColor: Colors.surface,
  },
  checkboxChecked: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  checkboxTick: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '900',
  },
  prayerInfo: {
    flex: 1,
  },
  prayerName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'right',
    marginBottom: 4,
  },
  textChecked: {
    color: Colors.primary,
  },
  timeHint: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginBottom: 6,
  },
  hadithText: {
    fontSize: 11,
    lineHeight: 16,
    color: Colors.textSecondary,
    textAlign: 'right',
    fontStyle: 'italic',
    paddingLeft: 12,
  },
  pointsLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
    marginRight: 8,
  },
});
