import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Alert, Image, Modal, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import Svg, { Path, Circle, Rect, Defs, Pattern } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { getCurrentUserProfile, updateUserCountry, saveUserScore, updateUserPhoto, equipUserTitle } from '../firebase/auth';
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface HistoricalArtifact {
  id: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  badge: string;
  youtubeVideoId: string;
}

const HISTORICAL_ARTIFACTS: HistoricalArtifact[] = [
  {
    id: 'art_zulfiqar',
    titleAr: 'سيف "ذو الفقار" الشريف',
    titleEn: 'Ali\'s Zulfiqar Sword',
    descAr: 'السيف الأسطوري ذو الرأسين للإمام علي بن أبي طالب رضي الله عنه، رمز الشجاعة والإيمان.',
    descEn: 'The legendary double-pointed sword of Imam Ali, a symbol of bravery and faith.',
    badge: '⚔️',
    youtubeVideoId: 'q2vP164x65A',
  },
  {
    id: 'art_khalid',
    titleAr: 'سيف "خالد بن الوليد"',
    titleEn: 'Sword of Khalid ibn al-Walid',
    descAr: 'سيف القائد المظفر "سيف الله المسلول" الذي خاض به فتوحات الإسلام الكبرى.',
    descEn: 'The sword of the legendary commander, "The Drawn Sword of Allah".',
    badge: '🗡️',
    youtubeVideoId: 'E5yN5rR_qgU',
  },
  {
    id: 'art_hamzah',
    titleAr: 'درع "حمزة بن عبد المطلب"',
    titleEn: 'Shield of Hamzah',
    descAr: 'درع "أسد الله وسيد الشهداء" الذي خاض به بدر وأحد مدافعاً عن النبي ﷺ.',
    descEn: 'The battle shield of Hamzah, the "Lion of Allah", who defended the Prophet (ﷺ) at Badr and Uhud.',
    badge: '🛡️',
    youtubeVideoId: 'gW3zJbM-tG4',
  },
  {
    id: 'art_saad',
    titleAr: 'قوس "سعد بن أبي وقاص"',
    titleEn: 'Bow of Sa\'d ibn Abi Waqqas',
    descAr: 'قوس أول من رمى بسهم في سبيل الله، الصحابي الذي فداه النبي بأبويه يوم أحد.',
    descEn: 'The bow of the first companion to shoot an arrow in the way of Allah.',
    badge: '🏹',
    youtubeVideoId: 'yvP6K1K92oA',
  },
  {
    id: 'art_alparslan',
    titleAr: 'خوذة السلطان "ألب أرسلان"',
    titleEn: 'Helmet of Alp Arslan',
    descAr: 'خوذة بطل معركة ملاذكرد الخالدة الذي حمى ديار الإسلام من الزوال.',
    descEn: 'The helmet of Alp Arslan, hero of the Battle of Manzikert who defended the Islamic world.',
    badge: '🪖',
    youtubeVideoId: 'U1B9a4X_3L0',
  },
  {
    id: 'art_uqab',
    titleAr: 'الراية النبوية "العُقاب"',
    titleEn: 'Al-Uqab Banner of the Prophet',
    descAr: 'الراية السوداء الرسمية للنبي محمد ﷺ في الغزوات وصدر الإسلام.',
    descEn: 'The official black banner of the Prophet Muhammad (ﷺ) during battles.',
    badge: '🏴',
    youtubeVideoId: 'jP5Vb_x4O3w',
  },
  {
    id: 'art_ring',
    titleAr: 'خاتم "الرسول ﷺ" الشريف',
    titleEn: 'Signet Ring of the Prophet',
    descAr: 'خاتم الفضة المنقوش عليه "محمد رسول الله" الذي استخدمه لختم رسائل دعوة الملوك للإسلام.',
    descEn: 'The Prophet’s (ﷺ) silver signet ring used to seal the letters calling kings to Islam.',
    badge: '💍',
    youtubeVideoId: 't2VbX4k92OA',
  },
];

interface QuranicTitle {
  id: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  emoji: string;
  targetTest: 'mutashabihat' | 'quran' | 'trivia' | 'total';
  targetValue: number;
}

const QURANIC_TITLES: QuranicTitle[] = [
  {
    id: 'title_knight',
    titleAr: 'فارس المتشابهات',
    titleEn: 'Knight of Mutashabihat',
    descAr: 'أكمل ٣٠ إجابة صحيحة في اختبار المتشابهات لتنال هذا اللقب.',
    descEn: 'Achieve 30 correct answers in Mutashabihat test.',
    emoji: '🛡️',
    targetTest: 'mutashabihat',
    targetValue: 30,
  },
  {
    id: 'title_hafidh',
    titleAr: 'الحافظ المتقن',
    titleEn: 'Precise Memorizer',
    descAr: 'أكمل ٥٠ إجابة صحيحة في تقييم الحفظ لتنال هذا اللقب.',
    descEn: 'Achieve 50 correct answers in Quran Assessment.',
    emoji: '🏆',
    targetTest: 'quran',
    targetValue: 50,
  },
  {
    id: 'title_pulpit',
    titleAr: 'سراج المنبر',
    titleEn: 'Lantern of the Pulpit',
    descAr: 'أكمل ٤٠ إجابة صحيحة في تحدي المعلومات والحديث لتنال هذا اللقب.',
    descEn: 'Achieve 40 correct answers in Trivia/Hadith challenge.',
    emoji: '🕯️',
    targetTest: 'trivia',
    targetValue: 40,
  },
  {
    id: 'title_heavens',
    titleAr: 'قارئ الجنان',
    titleEn: 'Reciter of Heavens',
    descAr: 'أكمل ١٠٠ إجابة صحيحة إجمالاً في جميع الاختبارات لتنال اللقب الأسمى.',
    descEn: 'Achieve 100 total correct answers across all quizzes.',
    emoji: '👑',
    targetTest: 'total',
    targetValue: 100,
  },
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
  { key: 'morning_adhkar', labelAr: 'أذكار الصباح 🌅', labelEn: 'Morning Adhkar 🌅' },
  { key: 'evening_adhkar', labelAr: 'أذكار المساء 🌇', labelEn: 'Evening Adhkar 🌇' },
  { key: 'charity', labelAr: 'الصدقة أو صلة الرحم 🤝', labelEn: 'Charity or Family Bond 🤝' },
  { key: 'tongue', labelAr: 'حفظ اللسان وغض البصر 👁️', labelEn: 'Guarding Tongue & Gaze 👁️' },
  { key: 'knowledge', labelAr: 'طلب العلم النافع 📚', labelEn: 'Seeking Useful Knowledge 📚' },
];

export default function ProfileScreen({ navigation }: any) {
  const { user, logout, updateUserFields } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { colors, toggleTheme, isLightMode } = useTheme();

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        language === 'ar' ? 'صلاحية الأستوديو' : 'Gallery Permission',
        language === 'ar'
          ? 'الرجاء تمكين الوصول للأستوديو لاختيار صورة.'
          : 'Please enable gallery access in settings to upload a photo.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      const selectedUri = result.assets[0].uri;
      try {
        if (user?.uid) {
          await updateUserPhoto(user.uid, selectedUri);
          updateUserFields({ photoUri: selectedUri });
          // Also update local profile state
          setProfile((prev: any) => prev ? { ...prev, photoUri: selectedUri } : { photoUri: selectedUri });
        }
      } catch (err) {
        console.error('Failed to update photo', err);
      }
    }
  };

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
    morning_adhkar: false,
    evening_adhkar: false,
    charity: false,
    tongue: false,
    knowledge: false,
  });
  const [pledged, setPledged] = useState(false);
  const [weeklyHistory, setWeeklyHistory] = useState<any[]>([]);
  const [selectedArtifact, setSelectedArtifact] = useState<HistoricalArtifact | null>(null);

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
        let pLogs = {};
        let dLogs = {};
        if (log) {
          const parsedLog = JSON.parse(log);
          pLogs = parsedLog.prayers || {};
          dLogs = parsedLog.deeds || {};
          const pCompleted = Object.values(pLogs).filter(val => val === 'congregation' || val === 'individual').length;
          const dCompleted = Object.values(dLogs).filter(Boolean).length;
          completed = pCompleted + dCompleted;
        }
        history.push({ 
          dateStr: dStr, 
          completedCount: completed,
          prayers: pLogs,
          deeds: dLogs
        });
      }
      setWeeklyHistory(history);
    } catch (err) {
      console.error(err);
    }
  };

  const weeklyAnalytics = useMemo(() => {
    let congregationCount = 0;
    let individualCount = 0;
    let missedCount = 0;
    let totalPrayersLogged = 0;
    
    let fajrOnTimeCount = 0;
    let morningAzkarCount = 0;
    let eveningAzkarCount = 0;
    let totalDaysWithLogs = 0;

    weeklyHistory.forEach(day => {
      let dayHasLogs = false;
      // Prayers check
      if (day.prayers) {
        Object.keys(day.prayers).forEach(key => {
          const status = day.prayers[key];
          if (status) {
            dayHasLogs = true;
            totalPrayersLogged++;
            if (status === 'congregation') congregationCount++;
            else if (status === 'individual') individualCount++;
            else if (status === 'missed') missedCount++;

            // Fajr challenge check
            if (key === 'fajr' && status === 'congregation') {
              fajrOnTimeCount++;
            }
          }
        });
      }

      // Deeds check
      if (day.deeds) {
        if (day.deeds.morning_adhkar) {
          dayHasLogs = true;
          morningAzkarCount++;
        }
        if (day.deeds.evening_adhkar) {
          dayHasLogs = true;
          eveningAzkarCount++;
        }
      }

      if (dayHasLogs) {
        totalDaysWithLogs++;
      }
    });

    // Compute ratio percentages
    const totalCount = congregationCount + individualCount + missedCount;
    const congregationPct = totalCount > 0 ? (congregationCount / totalCount) : 0;
    const individualPct = totalCount > 0 ? (individualCount / totalCount) : 0;
    const missedPct = totalCount > 0 ? (missedCount / totalCount) : 0;

    // Build assessment text
    let assessmentAr = 'سجل صلواتك وطاعاتك يومياً لتبدأ في مراجعة التقرير الأسبوعي.';
    let assessmentEn = 'Log your prayers and habits daily to view your weekly performance review.';
    let alertColor = '#F2F2F2'; // default neutral
    let textThemeColor = '#2C3E50';

    if (totalDaysWithLogs > 0) {
      if (missedCount > 4) {
        assessmentAr = '⚠️ تنبيه: لقد فاتتك بعض الصلوات المفروضة هذا الأسبوع. الصلاة عماد الدين، حاول إعطاءها الأولوية وضبط التنبيهات اللازمة لتأديتها في وقتها.';
        assessmentEn = '⚠️ Warning: You missed some obligatory prayers this week. Prayer is the pillar of faith. Prioritize it and set alarms to offer them on time.';
        alertColor = '#FCE8E6'; // red
        textThemeColor = '#C5221F';
      } else if (congregationCount > 15) {
        assessmentAr = '🎉 ممتاز! ما شاء الله على حرصك العالي والتزامك بصلاة الجماعة في المسجد. أداء إيماني متميز ومبارك، استمر على هذا الدرب العظيم.';
        assessmentEn = '🎉 Excellent! Masha\'Allah on your high commitment to praying in congregation. Outstanding spiritual dedication. Keep on this blessed path.';
        alertColor = '#E6F4EA'; // green
        textThemeColor = '#137333';
      } else {
        assessmentAr = '👍 أداء طيب ومتوازن هذا الأسبوع. استمر في مجاهدة نفسك لزيادة صلوات الجماعة والمحافظة الدائمة على الأذكار لتزيد يومك بركة ونوراً.';
        assessmentEn = '👍 Balanced spiritual performance this week. Keep striving to increase congregation prayers and maintain daily Azkar for more blessings.';
        alertColor = '#FFF8E6'; // orange
        textThemeColor = '#B8860B';
      }
    }

    return {
      congregationCount,
      individualCount,
      missedCount,
      totalPrayersLogged,
      fajrOnTimeCount,
      morningAzkarCount,
      eveningAzkarCount,
      totalDaysWithLogs,
      congregationPct,
      individualPct,
      missedPct,
      assessmentAr,
      assessmentEn,
      alertColor,
      textThemeColor
    };
  }, [weeklyHistory]);

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

  const handleEquipTitle = async (titleId: string) => {
    if (!user?.uid) return;
    try {
      const updated = await equipUserTitle(user.uid, titleId);
      setProfile(updated);
      updateUserFields({ activeTitle: updated.activeTitle });
      Alert.alert(
        language === 'ar' ? 'تم بنجاح!' : 'Success!',
        language === 'ar' ? 'تم تجهيز لقبك الجديد بنجاح.' : 'Equipped your new title successfully.'
      );
    } catch (err) {
      console.error(err);
    }
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
              <TouchableOpacity 
                style={[styles.avatarContainer, { backgroundColor: colors.primaryTint, borderColor: colors.primary, overflow: 'hidden' }]}
                onPress={handlePickAvatar}
                activeOpacity={0.85}
              >
                {user?.photoUri ? (
                  <Image source={{ uri: user.photoUri }} style={{ width: 80, height: 80, borderRadius: 40 }} />
                ) : (
                  <Text style={[styles.avatarText, { color: colors.primaryDeep }]}>
                    {user?.displayName ? user.displayName[0].toUpperCase() : '👤'}
                  </Text>
                )}
                {/* Tiny edit overlay */}
                <View style={{ position: 'absolute', bottom: 0, width: '100%', backgroundColor: 'rgba(0,0,0,0.4)', paddingVertical: 2, alignItems: 'center' }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '700' }}>{language === 'ar' ? 'تعديل' : 'Edit'}</Text>
                </View>
              </TouchableOpacity>
              <Text style={[styles.profileName, { color: colors.textPrimary }]}>
                {user?.displayName || (language === 'ar' ? 'ضيف' : 'Guest')}
              </Text>
              {profile?.activeTitle ? (
                <Text style={[styles.activeTitleTextSub, { color: colors.primary, fontFamily: 'IBMPlexSansArabic-Bold', marginBottom: 6 }]}>
                  ⚔️ {
                    QURANIC_TITLES.find(t => t.id === profile.activeTitle)?.[language === 'ar' ? 'titleAr' : 'titleEn']
                  }
                </Text>
              ) : null}
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

            {/* Quranic Titles Section */}
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {language === 'ar' ? '👑 الألقاب القرآنية المكتسبة' : '👑 Earned Quranic Titles'}
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              {language === 'ar' 
                ? 'حقق مستهدفات الاختبارات لفتح الألقاب الشريفة وتجهيزها في حسابك' 
                : 'Complete quiz milestones to unlock and equip noble titles'}
            </Text>

            <View style={styles.titlesContainer}>
              {QURANIC_TITLES.map(title => {
                const isUnlocked = profile?.unlockedTitles?.includes(title.id);
                const isActive = profile?.activeTitle === title.id;

                // Get current value towards target
                const currentValue = title.targetTest === 'mutashabihat'
                  ? (profile?.mutashabihatCorrectCount ?? 0)
                  : title.targetTest === 'quran'
                    ? (profile?.quranCorrectCount ?? 0)
                    : title.targetTest === 'trivia'
                      ? (profile?.triviaCorrectCount ?? 0)
                      : ((profile?.mutashabihatCorrectCount ?? 0) + (profile?.quranCorrectCount ?? 0) + (profile?.triviaCorrectCount ?? 0));

                const progress = Math.min(1, currentValue / title.targetValue);

                return (
                  <View
                    key={title.id}
                    style={[
                      styles.titleCard,
                      { backgroundColor: colors.surface, borderColor: isActive ? colors.primary : colors.border }
                    ]}
                  >
                    <View style={styles.titleCardHeader}>
                      <View style={[styles.titleEmojiBg, { backgroundColor: colors.border }]}>
                        <Text style={{ fontSize: 24 }}>{title.emoji}</Text>
                      </View>
                      
                      <View style={styles.titleMeta}>
                        <Text style={[styles.titleName, { color: colors.textPrimary, fontFamily: 'IBMPlexSansArabic-Bold' }]}>
                          {language === 'ar' ? title.titleAr : title.titleEn}
                        </Text>
                        <Text style={[styles.titleDesc, { color: colors.textSecondary }]}>
                          {language === 'ar' ? title.descAr : title.descEn}
                        </Text>
                      </View>
                    </View>

                    {/* Progress Bar (Only show if locked) */}
                    {!isUnlocked ? (
                      <View style={styles.titleProgressContainer}>
                        <View style={styles.titleProgressLabels}>
                          <Text style={{ fontSize: 10, color: colors.textSecondary }}>
                            {language === 'ar' ? `المستهدف: ${title.targetValue} إجابة` : `Target: ${title.targetValue} answers`}
                          </Text>
                          <Text style={{ fontSize: 10, color: colors.textPrimary, fontWeight: '700' }}>
                            {currentValue} / {title.targetValue}
                          </Text>
                        </View>
                        <View style={[styles.titleProgressBarBg, { backgroundColor: colors.border }]}>
                          <View style={[styles.titleProgressBarFill, { width: `${progress * 100}%`, backgroundColor: colors.primary }]} />
                        </View>
                      </View>
                    ) : (
                      <View style={styles.titleActionRow}>
                        {isActive ? (
                          <View style={[styles.activeTitleBadge, { backgroundColor: colors.primaryLight }]}>
                            <Text style={[styles.activeTitleText, { color: colors.primary, fontFamily: 'IBMPlexSansArabic-Bold' }]}>
                              {language === 'ar' ? '✓ مجهز حالياً' : '✓ Active'}
                            </Text>
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={[styles.equipBtn, { backgroundColor: colors.primary }]}
                            onPress={() => handleEquipTitle(title.id)}
                          >
                            <Text style={styles.equipBtnText}>
                              {language === 'ar' ? 'تجهيز اللقب' : 'Equip Title'}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Historical Collection Vault */}
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {language === 'ar' ? '🏛️ محراب المقتنيات التاريخية' : '🏛️ Historical Artifacts Vault'}
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              {language === 'ar' 
                ? 'استكشف المقتنيات الإسلامية التي قمت بفتحها من متجر السراج وشاهد قصصها' 
                : 'Explore and watch the stories of Islamic artifacts you unlocked from the shop'}
            </Text>

            <View style={styles.vaultGrid}>
              {HISTORICAL_ARTIFACTS.map(art => {
                const isUnlocked = profile?.unlockedItems?.includes(art.id);
                return (
                  <TouchableOpacity
                    key={art.id}
                    style={[
                      styles.vaultCard,
                      { backgroundColor: colors.surface, borderColor: isUnlocked ? '#E5B942' : colors.border }
                    ]}
                    onPress={() => isUnlocked && setSelectedArtifact(art)}
                    disabled={!isUnlocked}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.vaultIconWrapper, !isUnlocked && { opacity: 0.25 }]}>
                      <Text style={{ fontSize: 28 }}>{art.badge}</Text>
                    </View>
                    <Text style={[styles.vaultTextName, { color: isUnlocked ? colors.textPrimary : colors.textSecondary }]}>
                      {language === 'ar' ? art.titleAr.replace(' الشريف', '').replace(' الشريفة', '') : art.titleEn}
                    </Text>
                    {!isUnlocked && (
                      <View style={styles.lockedOverlay}>
                        <Text style={{ fontSize: 11, color: colors.textSecondary }}>🔒 مغلق</Text>
                      </View>
                    )}
                  </TouchableOpacity>
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

            {/* WEEKLY CHART & DETAILED REPORT */}
            <View style={[styles.logCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.logCardTitle, { color: colors.textPrimary, fontFamily: 'IBMPlexSansArabic-Bold' }]}>
                {language === 'ar' ? '📈 التقرير الأسبوعي المفصل' : '📈 Detailed Weekly Performance'}
              </Text>
              <Text style={[styles.logCardSubtitle, { color: colors.textSecondary }]}>
                {language === 'ar' ? 'إحصائيات الصلوات والعبادات خلال الـ ٧ أيام الماضية:' : 'Prayer & habit insights for the past 7 days:'}
              </Text>

              {/* Dynamic Assessment Notification Box */}
              <View style={[styles.weeklyAssessmentBox, { backgroundColor: weeklyAnalytics.alertColor }]}>
                <Text style={[styles.weeklyAssessmentText, { color: weeklyAnalytics.textThemeColor, fontFamily: 'IBMPlexSansArabic-Medium' }]}>
                  {language === 'ar' ? weeklyAnalytics.assessmentAr : weeklyAnalytics.assessmentEn}
                </Text>
              </View>

              {/* Segmented Ratio Bar for Prayers */}
              <View style={styles.ratioCard}>
                <Text style={[styles.ratioTitle, { color: colors.textPrimary, fontFamily: 'IBMPlexSansArabic-Bold' }]}>
                  {language === 'ar' ? '📊 توزيع أداء الصلوات' : '📊 Prayer Distribution Ratio'}
                </Text>
                
                {weeklyAnalytics.totalPrayersLogged > 0 ? (
                  <View style={styles.segmentedBar}>
                    {weeklyAnalytics.congregationCount > 0 && (
                      <View style={[styles.segmentedSegment, { flex: weeklyAnalytics.congregationPct, backgroundColor: '#10B981' }]} />
                    )}
                    {weeklyAnalytics.individualCount > 0 && (
                      <View style={[styles.segmentedSegment, { flex: weeklyAnalytics.individualPct, backgroundColor: '#F5B841' }]} />
                    )}
                    {weeklyAnalytics.missedCount > 0 && (
                      <View style={[styles.segmentedSegment, { flex: weeklyAnalytics.missedPct, backgroundColor: '#E7000B' }]} />
                    )}
                  </View>
                ) : (
                  <View style={[styles.segmentedBar, { backgroundColor: colors.border }]} />
                )}

                <View style={styles.ratioLabelsRow}>
                  <View style={styles.ratioLabelItem}>
                    <View style={[styles.ratioColorDot, { backgroundColor: '#10B981' }]} />
                    <Text style={[styles.ratioLabelText, { color: colors.textSecondary }]}>
                      {language === 'ar' ? `جماعة: ${weeklyAnalytics.congregationCount}` : `Congr: ${weeklyAnalytics.congregationCount}`}
                    </Text>
                  </View>
                  <View style={styles.ratioLabelItem}>
                    <View style={[styles.ratioColorDot, { backgroundColor: '#F5B841' }]} />
                    <Text style={[styles.ratioLabelText, { color: colors.textSecondary }]}>
                      {language === 'ar' ? `منفرداً: ${weeklyAnalytics.individualCount}` : `Indiv: ${weeklyAnalytics.individualCount}`}
                    </Text>
                  </View>
                  <View style={styles.ratioLabelItem}>
                    <View style={[styles.ratioColorDot, { backgroundColor: '#E7000B' }]} />
                    <Text style={[styles.ratioLabelText, { color: colors.textSecondary }]}>
                      {language === 'ar' ? `فاتتني: ${weeklyAnalytics.missedCount}` : `Missed: ${weeklyAnalytics.missedCount}`}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Challenge Milestones Status */}
              <View style={styles.challengeSummaryCard}>
                <View style={[styles.challengeStatItem, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.challengeStatVal, { color: colors.primaryDeep }]}>
                    {weeklyAnalytics.fajrOnTimeCount} / {weeklyAnalytics.totalDaysWithLogs} {language === 'ar' ? 'أيام' : 'days'}
                  </Text>
                  <Text style={[styles.challengeStatLabel, { color: colors.textPrimary }]}>
                    🌅 {language === 'ar' ? 'تحدي الفجر (في الجماعة)' : 'Fajr Challenge (in Congregation)'}
                  </Text>
                </View>
                
                <View style={[styles.challengeStatItem, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.challengeStatVal, { color: colors.primaryDeep }]}>
                    {weeklyAnalytics.morningAzkarCount} / {weeklyAnalytics.totalDaysWithLogs} {language === 'ar' ? 'أيام' : 'days'}
                  </Text>
                  <Text style={[styles.challengeStatLabel, { color: colors.textPrimary }]}>
                    📿 {language === 'ar' ? 'أذكار الصباح المسجلة' : 'Morning Adhkar Completed'}
                  </Text>
                </View>

                <View style={styles.challengeStatItem}>
                  <Text style={[styles.challengeStatVal, { color: colors.primaryDeep }]}>
                    {weeklyAnalytics.eveningAzkarCount} / {weeklyAnalytics.totalDaysWithLogs} {language === 'ar' ? 'أيام' : 'days'}
                  </Text>
                  <Text style={[styles.challengeStatLabel, { color: colors.textPrimary }]}>
                    📿 {language === 'ar' ? 'أذكار المساء المسجلة' : 'Evening Adhkar Completed'}
                  </Text>
                </View>
              </View>

              {/* Weekly Activity Bar Chart */}
              <Text style={[styles.chartTitleText, { color: colors.textPrimary, fontFamily: 'IBMPlexSansArabic-Bold', marginTop: 20 }]}>
                {language === 'ar' ? '📊 رسم بياني للنشاط اليومي' : '📊 Daily Completed Actions Chart'}
              </Text>
              <View style={styles.chartContainer}>
                {weeklyHistory.map((day, index) => {
                  // Max completed count is 5 prayers + 6 deeds = 11 total
                  const barHeight = Math.max(10, (day.completedCount / 11) * 120);
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

      {/* INTERACTIVE MULTIMEDIA CARD OVERLAY MODAL */}
      {selectedArtifact && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={!!selectedArtifact}
          onRequestClose={() => setSelectedArtifact(null)}
        >
          <View style={styles.modalCenteredView}>
            <View style={[styles.modalView, { backgroundColor: colors.surface }]}>
              {/* Top Row */}
              <View style={styles.modalHeader}>
                <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedArtifact(null)}>
                  <Text style={{ fontSize: 24, color: colors.textPrimary }}>✕</Text>
                </TouchableOpacity>
                <Text style={[styles.modalHeaderTitle, { color: colors.textPrimary, fontFamily: 'IBMPlexSansArabic-Bold' }]}>
                  {selectedArtifact.badge} {language === 'ar' ? selectedArtifact.titleAr : selectedArtifact.titleEn}
                </Text>
              </View>

              {/* YouTube Native WebPlayer */}
              {selectedArtifact.youtubeVideoId && (
                <View style={styles.playerContainer}>
                  <WebView
                    style={styles.youtubePlayer}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    allowsFullscreenVideo={true}
                    scrollEnabled={false}
                    source={{ uri: `https://www.youtube.com/embed/${selectedArtifact.youtubeVideoId}?rel=0&autoplay=0&showinfo=0&controls=1` }}
                  />
                </View>
              )}

              {/* Scrollable Story Content */}
              <ScrollView style={styles.storyScroll} contentContainerStyle={styles.storyContent} showsVerticalScrollIndicator={false}>
                <View style={styles.scrollDesignCard}>
                  <Text style={styles.scrollHeader}>📖 القصة التاريخية والدينية للمقتنى:</Text>
                  <Text style={styles.storyTextAr}>{selectedArtifact.descAr}</Text>
                  
                  {/* Detailed educational extra text block */}
                  <Text style={styles.extraHistoryText}>
                    {selectedArtifact.id === 'art_zulfiqar' && 
                      'كان هذا السيف مهدى للإمام علي رضي الله عنه من النبي ﷺ في غزوة أحد بعد أن تكسر سيفه، وجاء في الأثر دفاعه المستميت وبطولته التي نصرت جيش المسلمين وثبتت أركان المعركة.'}
                    {selectedArtifact.id === 'art_khalid' && 
                      'يعتبر سيف خالد رمزاً للعبقرية العسكرية الإسلامية الفريدة، حيث لم يهزم خالد في جاهلية ولا إسلام وقاد فتوحات الشام والعراق بمهارة خارقة مخلصاً نيته لله تعالى.'}
                    {selectedArtifact.id === 'art_hamzah' && 
                      'كان حمزة بن عبد المطلب رضي الله عنه يقاتل بسيفين ويرتدي ريشة النعامة على صدره كعلامة للشجاعة، وبذل روحه ودرعه فداءً لدعوة الحق وحماية لرسول الله.'}
                    {selectedArtifact.id === 'art_saad' && 
                      'سعد بن أبي وقاص رضي الله عنه هو أحد العشرة المبشرين بالجنة، وصاحب الدعوة المستجابة التي دعا له بها النبي ﷺ، وكان قوسه الحارس الأمين في أحد.'}
                    {selectedArtifact.id === 'art_alparslan' && 
                      'معركة ملاذكرد في عام 1071م غيرت مجرى التاريخ الإسلامي، حيث كسر السلطان السلجوقي الطوق عن الأمة الإسلامية وفتح ألب أرسلان أبواب الأناضول للإسلام.'}
                    {selectedArtifact.id === 'art_uqab' && 
                      'كانت راية العقاب تخفق بالتوحيد في كل موطن، وهي رمز العزة والتمكين في صدر الإسلام وتوضح اجتماع كلمة المسلمين تحت راية واحدة تعلي كلمة الله.'}
                    {selectedArtifact.id === 'art_ring' && 
                      'خاتم الفضة النبوي الشريف يعكس الدقة الإدارية والتنظيمية في عهد النبوة، حيث استخدم لتوثيق المراسلات الرسمية للملوك مثل هرقل والمقوقس وكسرى ودعوتهم للتوحيد.'}
                  </Text>

                  <View style={styles.englishDivider} />
                  
                  <Text style={styles.scrollHeaderEn}>English Narrative:</Text>
                  <Text style={styles.storyTextEn}>{selectedArtifact.descEn}</Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
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
  vaultGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginVertical: 15,
  },
  vaultCard: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  vaultIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vaultTextName: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 6,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  lockedOverlay: {
    position: 'absolute',
    bottom: 6,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  modalCenteredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalView: {
    width: SCREEN_WIDTH * 0.92,
    height: SCREEN_HEIGHT * 0.85,
    borderRadius: 24,
    paddingTop: 15,
    paddingHorizontal: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  modalCloseBtn: {
    padding: 5,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  playerContainer: {
    height: 190,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginVertical: 15,
    borderWidth: 1.5,
    borderColor: '#E5B942',
  },
  youtubePlayer: {
    flex: 1,
  },
  storyScroll: {
    flex: 1,
  },
  storyContent: {
    paddingBottom: 30,
  },
  scrollDesignCard: {
    backgroundColor: '#FFFDF9',
    borderColor: '#E5C158',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
  },
  scrollHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#B8860B',
    marginBottom: 8,
    textAlign: 'right',
  },
  storyTextAr: {
    fontSize: 14,
    color: '#4A3B32',
    lineHeight: 22,
    textAlign: 'right',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  extraHistoryText: {
    fontSize: 13,
    color: '#605045',
    lineHeight: 20,
    textAlign: 'right',
    marginTop: 10,
    fontStyle: 'italic',
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  englishDivider: {
    height: 1,
    backgroundColor: '#E5C158',
    marginVertical: 15,
    opacity: 0.4,
  },
  scrollHeaderEn: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#B8860B',
    marginBottom: 8,
    textAlign: 'left',
  },
  storyTextEn: {
    fontSize: 13,
    color: '#4A3B32',
    lineHeight: 20,
    textAlign: 'left',
  },
  activeTitleTextSub: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  titlesContainer: {
    marginVertical: 15,
    gap: 12,
  },
  titleCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  titleCardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  titleEmojiBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleMeta: {
    flex: 1,
    marginRight: 12,
    alignItems: 'flex-end',
  },
  titleName: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  titleDesc: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'right',
  },
  titleProgressContainer: {
    marginTop: 12,
  },
  titleProgressLabels: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  titleProgressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  titleProgressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  titleActionRow: {
    marginTop: 12,
    alignItems: 'flex-start',
  },
  activeTitleBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  activeTitleText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  equipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  equipBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  weeklyAssessmentBox: {
    borderRadius: 12,
    padding: 14,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  weeklyAssessmentText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'right',
  },
  ratioCard: {
    marginVertical: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.01)',
  },
  ratioTitle: {
    fontSize: 13.5,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'right',
  },
  segmentedBar: {
    height: 14,
    borderRadius: 7,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 12,
    width: '100%',
  },
  segmentedSegment: {
    height: '100%',
  },
  ratioLabelsRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  ratioLabelItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  ratioColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  ratioLabelText: {
    fontSize: 11,
    fontWeight: '600',
  },
  challengeSummaryCard: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    backgroundColor: 'rgba(0,0,0,0.01)',
    overflow: 'hidden',
  },
  challengeStatItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  challengeStatVal: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  challengeStatLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  chartTitleText: {
    fontSize: 13.5,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'right',
  },
});
