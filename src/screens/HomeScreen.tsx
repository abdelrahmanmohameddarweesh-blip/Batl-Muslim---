import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { getCurrentUserProfile } from '../firebase/auth';
import AdBanner from '../components/AdBanner';
import { Colors } from '../config/colors';

const ONBOARDING_KEY = 'batl-muslim-onboarding-complete-v1';

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.uid) {
        return;
      }
      const currentProfile = await getCurrentUserProfile(user.uid);
      setProfile(currentProfile);
    };

    loadProfile();
  }, [user?.uid]);

  useEffect(() => {
    const checkGuide = async () => {
      const completed = await AsyncStorage.getItem(ONBOARDING_KEY);
      if (!completed) {
        setShowGuide(true);
      }
    };

    checkGuide();
  }, []);

  const menuItems = [
    { title: 'اللعب الآن', hint: 'تحديات أسئلة منوعة', screen: 'Trivia', emoji: '📝', color: '#EBF7F3' },
    { title: 'الترتيب', hint: 'قائمة أفضل الأبطال', screen: 'Leaderboard', emoji: '🏆', color: '#FFF8E6' },
    { title: 'الملف الشخصي', hint: 'نقاطك وإنجازاتك', screen: 'Profile', emoji: '👤', color: '#EBF4F7' },
    { title: 'تحدي الصوت', hint: 'تسجيل وقراءة القرآن', screen: 'Voice', emoji: '🎙️', color: '#F7EBF7' },
  ];

  const currentScore = profile?.score ?? 0;
  
  const challengeLabel = useMemo(() => {
    if (currentScore >= 40) {
      return 'أكمل 3 أسئلة جديدة اليوم لزيادة النقاط';
    }
    if (currentScore >= 20) {
      return 'استمر في التقدم والتعلم وتقدم في الترتيب';
    }
    return 'ابدأ أول تحدٍ اليوم لتفعيل ترتيبك بين الأبطال';
  }, [currentScore]);

  const levelName = useMemo(() => {
    if (currentScore >= 100) return 'بطل ذهبي';
    if (currentScore >= 50) return 'بطل فضي';
    return 'مبتدئ';
  }, [currentScore]);

  const dismissGuide = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setShowGuide(false);
  };

  return (
    <ScrollView style={styles.outerContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        <View style={styles.topGlow} />
        
        {/* Welcome Header */}
        <View style={styles.header}>
          <Text style={styles.userGreeting}>
            {user?.displayName ? `السلام عليكم، ${user.displayName}` : 'السلام عليكم ورحمة الله'}
          </Text>
          <Text style={styles.title}>بطل مسلم</Text>
          <Text style={styles.subtitle}>وَفِي ذَلِكَ فَلْيَتَنَافَسِ الْمُتَنَافِسُونَ</Text>
        </View>

        {/* Level and Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.levelBadge}>{levelName}</Text>
            <Text style={styles.progressText}>النقاط الحالية: {currentScore}</Text>
          </View>
          <View style={styles.barBackground}>
            <View style={[styles.barFill, { width: `${Math.min(currentScore, 100)}%` }]} />
          </View>
          <Text style={styles.progressPercent}>{Math.min(currentScore, 100)}% إلى الترقية التالية</Text>
        </View>

        {/* Daily Challenge Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.challengeBadge}>
              <Text style={styles.challengeBadgeText}>تحدي اليوم 🌟</Text>
            </View>
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>🔥 3 أيام متتالية</Text>
            </View>
          </View>
          <Text style={styles.heroTitle}>{challengeLabel}</Text>
          <TouchableOpacity style={styles.heroButton} onPress={() => navigation.navigate('Trivia')} activeOpacity={0.85}>
            <Text style={styles.heroButtonText}>ابدأ التحدي الآن</Text>
          </TouchableOpacity>
        </View>

        {/* 2x2 Grid Actions */}
        <Text style={styles.sectionTitle}>أقسام التطبيق</Text>
        <View style={styles.grid}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.screen}
              style={[styles.gridCard, { backgroundColor: Colors.surface }]}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.85}
            >
              <View style={[styles.gridIconContainer, { backgroundColor: item.color }]}>
                <Text style={styles.gridEmoji}>{item.emoji}</Text>
              </View>
              <Text style={styles.gridTitle}>{item.title}</Text>
              <Text style={styles.gridHint}>{item.hint}</Text>
            </TouchableOpacity>
          ))}
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
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.primaryLight,
    opacity: 0.6,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  userGreeting: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.accent,
    marginBottom: 6,
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  progressSection: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  progressHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  levelBadge: {
    backgroundColor: Colors.primaryLight,
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  progressText: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  barBackground: {
    height: 8,
    backgroundColor: Colors.background,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  barFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  progressPercent: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'right',
  },
  heroCard: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  heroTopRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  challengeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  challengeBadgeText: {
    color: Colors.surface,
    fontSize: 12,
    fontWeight: '700',
  },
  streakBadge: {
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  streakText: {
    color: Colors.accent,
    fontSize: 11,
    fontWeight: '800',
  },
  heroTitle: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
    marginBottom: 16,
    textAlign: 'right',
  },
  heroButton: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  heroButtonText: {
    color: Colors.surface,
    fontWeight: '700',
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 12,
    textAlign: 'right',
  },
  grid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  gridCard: {
    width: '48%',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  gridIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  gridEmoji: {
    fontSize: 22,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  gridHint: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 14,
  },
  adWrapper: {
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 41, 30, 0.4)',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  guideStep: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    color: Colors.primary,
    fontWeight: '800',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 28,
    marginLeft: 12,
  },
  stepText: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'right',
  },
  modalButton: {
    marginTop: 12,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: Colors.surface,
    fontWeight: '700',
    fontSize: 15,
  },
});
