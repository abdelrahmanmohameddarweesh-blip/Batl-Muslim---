import AsyncStorage from '@react-native-async-storage/async-storage';

export type Badge = {
  id: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  emoji: string;
  color: string;
};

export const badgesCatalog: Badge[] = [
  {
    id: 'trivia-scholar',
    titleAr: 'العلامة',
    titleEn: 'Scholar',
    descAr: 'حقق أكثر من ١٠٠ نقطة في تحدي المعلومات',
    descEn: 'Earn over 100 points in Trivia',
    emoji: '🎓',
    color: '#3B82F6',
  },
  {
    id: 'voice-reciter',
    titleAr: 'قارئ الغراء',
    titleEn: 'Qari Reciter',
    descAr: 'أكمل تلاوة القرآن بدقة ونجاح',
    descEn: 'Successfully complete a Vocal Recitation',
    emoji: '🎙️',
    color: '#8B5CF6',
  },
  {
    id: 'prayer-keeper',
    titleAr: 'المصلّي المحافظ',
    titleEn: 'Prayer Keeper',
    descAr: 'حافظ على صلواتك الخمس في المتابع اليومي',
    descEn: 'Log at least 5 total prayers in the Tracker',
    emoji: '🕌',
    color: '#10B981',
  },
  {
    id: 'quran-memorizer',
    titleAr: 'حافظ الوحيين',
    titleEn: 'Memorizer',
    descAr: 'أكمل اختبارات حفظ الآيات في القرآن',
    descEn: 'Complete a Quran Memorization challenge',
    emoji: '📖',
    color: '#F59E0B',
  },
];

// Helper to check which badges are unlocked based on stats
export async function checkUnlockedBadges(userScore: number): Promise<string[]> {
  const unlockedIds: string[] = [];

  // 1. Check Scholar (Trivia score >= 100)
  if (userScore >= 100) {
    unlockedIds.push('trivia-scholar');
  }

  try {
    // 2. Check Reciter: scan keys or check if any audio session score was saved
    const keys = await AsyncStorage.getAllKeys();
    const recitationsDone = await AsyncStorage.getItem('completed-recitations-count');
    if (recitationsDone && parseInt(recitationsDone, 10) > 0) {
      unlockedIds.push('voice-reciter');
    }

    // 3. Check Prayer Keeper: count total checked prayers across all stored days
    const prayerKeys = keys.filter((k) => k.startsWith('prayer-tracker-'));
    let totalChecked = 0;
    for (const key of prayerKeys) {
      const dataStr = await AsyncStorage.getItem(key);
      if (dataStr) {
        const parsed = JSON.parse(dataStr);
        totalChecked += Object.values(parsed).filter(Boolean).length;
      }
    }
    if (totalChecked >= 5) {
      unlockedIds.push('prayer-keeper');
    }

    // 4. Check Quran Memorizer
    const memorizedDone = await AsyncStorage.getItem('completed-memorization-count');
    if (memorizedDone && parseInt(memorizedDone, 10) > 0) {
      unlockedIds.push('quran-memorizer');
    }
  } catch (err) {
    console.error('Error checking badges:', err);
  }

  return unlockedIds;
}
