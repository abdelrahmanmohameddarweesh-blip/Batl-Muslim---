import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { morningAdhkar, eveningAdhkar, type Dhikr } from '../data/adhkar';
import { useAuth } from '../contexts/AuthContext';
import { saveUserScore, getCurrentUserProfile } from '../firebase/auth';
import { Colors } from '../config/colors';
import AdBanner from '../components/AdBanner';

export default function AdhkarScreen({ navigation }: any) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [mode, setMode] = useState<'morning' | 'evening'>('morning');
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

  const activeAdhkar = mode === 'morning' ? morningAdhkar : eveningAdhkar;

  const handlePressDhikr = async (dhikr: Dhikr) => {
    if (saving) return;

    const currentCount = adhkarCounts[dhikr.id] ?? dhikr.count;
    if (currentCount <= 0) return; // Already finished

    const nextCount = currentCount - 1;
    const nextCounts = { ...adhkarCounts, [dhikr.id]: nextCount };
    setAdhkarCounts(nextCounts);
    setSaving(true);

    try {
      const todayStr = getTodayKey();
      await AsyncStorage.setItem(`adhkar-counts-${todayStr}`, JSON.stringify(nextCounts));

      // Check if this specific dhikr is completed now
      if (nextCount === 0) {
        // Check if the whole list is completed
        const isAllDone = activeAdhkar.every(d => (nextCounts[d.id] ?? d.count) === 0);
        const setKey = `${mode}-${todayStr}`;

        if (isAllDone && !completedSets[setKey]) {
          const nextSets = { ...completedSets, [setKey]: true };
          setCompletedSets(nextSets);
          await AsyncStorage.setItem(`adhkar-sets-${todayStr}`, JSON.stringify(nextSets));

          // Award +10 points
          if (user?.uid && profile) {
            const newScore = (profile.score ?? 0) + 10;
            await saveUserScore(user.uid, newScore);
            setProfile({ ...profile, score: newScore });
          }

          Alert.alert(
            'تقبل الله منك! 📿',
            `أكملت قراءة ${mode === 'morning' ? 'أذكار الصباح' : 'أذكار المساء'} كاملة اليوم! تم إضافة +١٠ نقاط إضافية لرصيدك.`
          );
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleResetMode = async () => {
    const todayStr = getTodayKey();
    const nextCounts = { ...adhkarCounts };
    activeAdhkar.forEach(d => {
      nextCounts[d.id] = d.count;
    });
    setAdhkarCounts(nextCounts);
    await AsyncStorage.setItem(`adhkar-counts-${todayStr}`, JSON.stringify(nextCounts));
  };

  return (
    <View style={styles.container}>
      {/* Tab Selectors */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabButton, mode === 'morning' && styles.tabActive]}
          onPress={() => setMode('morning')}
        >
          <Text style={[styles.tabText, mode === 'morning' && styles.tabTextActive]}>☀️ أذكار الصباح</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tabButton, mode === 'evening' && styles.tabActive]}
          onPress={() => setMode('evening')}
        >
          <Text style={[styles.tabText, mode === 'evening' && styles.tabTextActive]}>🌙 أذكار المساء</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.listHeader}>
            <Text style={styles.headerTitle}>أوراد المسلم اليومية</Text>
            <TouchableOpacity style={styles.resetButton} onPress={handleResetMode}>
              <Text style={styles.resetButtonText}>إعادة العدادات 🔄</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.list}>
            {activeAdhkar.map((dhikr) => {
              const currentCount = adhkarCounts[dhikr.id] ?? dhikr.count;
              const isCompleted = currentCount === 0;

              return (
                <TouchableOpacity
                  key={dhikr.id}
                  style={[styles.dhikrCard, isCompleted && styles.dhikrCardDone]}
                  onPress={() => handlePressDhikr(dhikr)}
                  activeOpacity={0.85}
                  disabled={isCompleted || saving}
                >
                  <View style={styles.textContainer}>
                    <Text style={[styles.dhikrText, isCompleted && styles.textMuted]}>
                      {dhikr.text}
                    </Text>
                    <Text style={styles.rewardText}>💡 {dhikr.reward}</Text>
                  </View>

                  <View style={[styles.counterContainer, isCompleted && styles.counterDone]}>
                    <Text style={[styles.counterText, isCompleted && styles.counterTextDone]}>
                      {isCompleted ? '✓' : currentCount}
                    </Text>
                    {!isCompleted && <Text style={styles.counterLabel}>مرات</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}
      <AdBanner />
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
  tabRow: {
    flexDirection: 'row-reverse',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  tabTextActive: {
    color: Colors.surface,
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
  listHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  resetButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resetButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  list: {
    gap: 12,
  },
  dhikrCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
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
  dhikrCardDone: {
    borderColor: Colors.primary + '33',
    backgroundColor: '#F0F9F4',
  },
  textContainer: {
    flex: 1,
    marginLeft: 16,
  },
  dhikrText: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'right',
    marginBottom: 6,
  },
  textMuted: {
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  rewardText: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'right',
  },
  counterContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterDone: {
    backgroundColor: Colors.primary,
  },
  counterText: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.primary,
  },
  counterTextDone: {
    color: Colors.surface,
  },
  counterLabel: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '700',
    marginTop: -2,
  },
});
