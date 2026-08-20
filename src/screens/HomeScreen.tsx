import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, FlatList, Dimensions, ImageBackground } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getCurrentUserProfile } from '../firebase/auth';
import AdBanner from '../components/AdBanner';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Mock data for Daily Podium Winner Cards
const PODIUM_WINNERS = [
  { rank: 2, name: 'عبد الله', nameEn: 'Abdullah', score: '95', time: '14s', medal: '🥈', border: '#D1D5DB' },
  { rank: 1, name: 'يوسف أ.', nameEn: 'Yusuf A.', score: '98', time: '12s', medal: '👑', border: '#F5B841', isWinner: true },
  { rank: 3, name: 'فاطمة', nameEn: 'Fatima', score: '92', time: '15s', medal: '🥉', border: '#D97706' }
];

// Mock data for Live Activity Feed
const ACTIVITY_FEED = [
  { id: 1, ar: 'Zara A. فازت للتو بمبارزة 1v1 ضد Omar!', en: 'Zara A. just won a 1v1 Duel against Omar!' },
  { id: 2, ar: 'Ibrahim K. وصل إلى المرتبة 50 عالمياً! 🏆', en: 'Ibrahim K. reached World Rank 50! 🏆' },
  { id: 3, ar: 'تحدي فقه الطهارة الجديد متاح الآن!', en: 'New Quiz Category: Fiqh is now available!' }
];

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { colors } = useTheme();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('الكل');

  const todayStr = useMemo(() => {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  }, []);

  const loadData = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const currentProfile = await getCurrentUserProfile(user.uid);
      setProfile(currentProfile);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [user?.uid, navigation]);

  const currentScore = profile?.score ?? 0;
  const currentLevel = Math.max(1, Math.floor(currentScore / 100));
  const currentXP = currentScore % 100;
  const targetXP = 100;
  const streakDays = profile?.streak ?? 0;
  
  // Custom stats with fallbacks
  const challengesPlayed = profile?.challengesPlayed ?? 142;
  const challengesWon = profile?.challengesWon ?? 98;
  const winRate = Math.round((challengesWon / (challengesPlayed || 1)) * 100);
  const localRank = profile?.localRank ?? 12;
  const globalRank = profile?.globalRank ?? 384;

  const formattedDates = useMemo(() => {
    const today = new Date();
    // Hijri date approximation
    const hijriFormatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const hijri = hijriFormatter.format(today);

    // Gregorian date
    const gregorianFormatter = new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    const gregorian = gregorianFormatter.format(today);

    return { gregorian, hijri };
  }, [language]);

  const handleShareAyah = async () => {
    try {
      const message = `📖 آية اليوم من تطبيق *بطل مسلم* 🏆:
      
﴿ وَفِي ذَٰلِكَ فَلْيَتَنَافَسِ الْمُتَنَافِسُونَ ﴾
"وفي ذلك فليتنافس المتنافسون" - سورة المطففين: ٢٦

شاركوني التحدي وحملوا التطبيق الآن للارتقاء بعبادتكم اليومية! 🚀`;
      await Share.share({ message });
    } catch (err) {
      console.error(err);
    }
  };

  // Carousel Challenges Data
  const challengesData = [
    {
      id: '1v1',
      titleAr: 'المبارزة الثنائية ⚔️',
      titleEn: '1v1 Live Trivia Duel ⚔️',
      descAr: 'تحدَّ منافساً حقيقياً مباشرة وأجب على الأسئلة بأسرع وقت لتحقيق الفوز.',
      descEn: 'A fast-paced, real-time speed quiz face-off against a live Muslim peer.',
      route: 'LiveDuel',
      isDuel: true,
    },
    {
      id: 'rapid',
      titleAr: 'الضغط السريع (الموت المفاجئ) ⚡',
      titleEn: 'Rapid Fire Mode ⚡',
      descAr: '٥ ثوانٍ للإجابة على كل سؤال. خطأ واحد ينهي التحدي فوراً!',
      descEn: '5-second timer per question. A single mistake ends the run instantly!',
      route: 'Trivia',
      params: { mode: 'hardcore' },
      isDuel: false,
    }
  ];

  return (
    <ScrollView style={[styles.outerContainer, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        
        {/* Welcome & Top Row */}
        <View style={styles.topHeaderRow}>
          <View style={styles.greetingCol}>
            <Text style={[styles.greetingLabelText, { color: colors.textSecondary }]}>
              {language === 'ar' ? 'السلام عليكم ورحمة الله' : 'Peace be upon you'}
            </Text>
            <Text style={[styles.profileNameText, { color: colors.textPrimary }]}>
              {user?.displayName || (language === 'ar' ? 'بطل مسلم' : 'Guest Hero')}
            </Text>
          </View>
          
          <View style={styles.headerRightActions}>
            <TouchableOpacity style={[styles.headerBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} activeOpacity={0.75}>
              <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={colors.textSecondary} strokeWidth="2">
                <Path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z" />
                <Path d="M10 20a2 2 0 0 0 4 0" />
              </Svg>
              <View style={[styles.unreadDot, { borderColor: colors.surface }]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Date Label */}
        <Text style={[styles.dateTextLabel, { color: colors.textSecondary }]}>
          {formattedDates.hijri} · {formattedDates.gregorian}
        </Text>

        {/* UNIFIED CHALLENGER PROFILE CARD */}
        <View style={[styles.unifiedCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.unifiedHeaderRow}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.primaryTint }]}>
              <Text style={styles.avatarEmoji}>🧔</Text>
            </View>
            <View style={styles.unifiedNameCol}>
              <Text style={[styles.unifiedNameText, { color: colors.textPrimary }]}>
                {user?.displayName || (language === 'ar' ? 'المنافس البطل' : 'Challenger Hero')}
              </Text>
              <View style={styles.streakBadge}>
                <Text style={styles.streakFlameIcon}>🔥</Text>
                <Text style={styles.streakText}>
                  {streakDays} {language === 'ar' ? 'أيام متتالية' : 'Day Streak'}
                </Text>
              </View>
            </View>
            <View style={styles.leagueBadgeContainer}>
              <Text style={styles.leagueLabel}>{language === 'ar' ? 'النخبة' : 'Gold III'}</Text>
              <Text style={styles.leagueMedal}>🏆</Text>
            </View>
          </View>

          {/* Level Progress Gauge */}
          <View style={styles.levelGaugeContainer}>
            <View style={styles.levelProgressLabelRow}>
              <Text style={[styles.levelProgressLabel, { color: colors.textSecondary }]}>
                {language === 'ar' ? `المستوى ${currentLevel}` : `Level ${currentLevel}`}
              </Text>
              <Text style={[styles.levelProgressValue, { color: colors.textPrimary }]}>
                {currentXP} / {targetXP} XP
              </Text>
            </View>
            <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
              <View style={[styles.progressBarFill, { width: `${(currentXP / targetXP) * 100}%`, backgroundColor: colors.primary }]} />
            </View>
          </View>

          {/* 4 Stats Grid */}
          <View style={[styles.statsGridRow, { borderTopColor: colors.border }]}>
            <View style={styles.statBox}>
              <Text style={styles.statEmoji}>🛡️</Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{challengesPlayed}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{language === 'ar' ? 'التحديات' : 'Played'}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statEmoji}>🏆</Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{challengesWon}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{language === 'ar' ? 'الفوز' : 'Wins'}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statEmoji}>📍</Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>#{localRank}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{language === 'ar' ? 'المحلي' : 'Local Rank'}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statEmoji}>🌐</Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>#{globalRank}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{language === 'ar' ? 'العالمي' : 'Global Rank'}</Text>
            </View>
          </View>
        </View>

        {/* YESTERDAY'S DAILY PODIUM (WINNER CARDS) */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitleText, { color: colors.textPrimary }]}>
            {language === 'ar' ? 'منصة تتويج الأمس 🏆' : "Yesterday's Daily Podium 🏆"}
          </Text>
        </View>
        
        <View style={styles.podiumContainer}>
          {PODIUM_WINNERS.map((winner, idx) => (
            <View 
              key={idx} 
              style={[
                styles.podiumCard, 
                { backgroundColor: colors.surface, borderColor: colors.border },
                winner.isWinner && { borderColor: '#F5B841', borderWidth: 2, scaleX: 1.05, scaleY: 1.05 }
              ]}
            >
              <Text style={styles.podiumMedal}>{winner.medal}</Text>
              <View style={[styles.podiumAvatar, { backgroundColor: winner.isWinner ? colors.primaryTint : colors.neutralTint }]}>
                <Text style={styles.podiumAvatarEmoji}>{winner.rank === 1 ? '🧔' : (winner.rank === 2 ? '👨' : '👩')}</Text>
              </View>
              <Text style={[styles.podiumName, { color: colors.textPrimary }]}>
                {language === 'ar' ? winner.name : winner.nameEn}
              </Text>
              <Text style={[styles.podiumPlaceLabel, { color: colors.textSecondary }]}>
                {winner.rank === 1 ? (language === 'ar' ? 'المركز 1' : '1st Place') : 
                 (winner.rank === 2 ? (language === 'ar' ? 'المركز 2' : '2nd Place') : (language === 'ar' ? 'المركز 3' : '3rd Place'))}
              </Text>
              <Text style={[styles.podiumScoreText, { color: colors.primaryDeep }]}>
                {winner.score} {language === 'ar' ? 'نقطة' : 'pts'}
              </Text>
              <Text style={[styles.podiumTimeText, { color: colors.textSecondary }]}>
                ⏱️ {winner.time}
              </Text>
            </View>
          ))}
        </View>

        {/* HERO CARD: DAILY GLOBAL CHAMPIONSHIP */}
        <View style={[styles.dailyChampionshipCard, { backgroundColor: colors.primaryDeep }]}>
          <View style={styles.dailyChampionshipContent}>
            <Text style={styles.dailyChampBadge}>🏆 {language === 'ar' ? 'البطولة اليومية' : 'Daily Championship'}</Text>
            <Text style={styles.dailyChampTitle}>
              {language === 'ar' ? 'تحدي اليوم: السيرة النبوية' : 'Today: Sirah of the Prophet'}
            </Text>
            <Text style={styles.dailyChampMeta}>
              ⏱️ {language === 'ar' ? 'ينتهي خلال: 04س 22د' : 'Ends in: 04h 22m'} · 🟢 {language === 'ar' ? '1.8 ألف يلعبون الآن' : '1.8k Active'}
            </Text>
            
            <TouchableOpacity 
              style={styles.dailyChampCTA} 
              onPress={() => navigation.navigate('Trivia', { mode: 'championship' })}
              activeOpacity={0.9}
            >
              <Text style={styles.dailyChampCTAText}>
                {language === 'ar' ? 'شارك الآن ➔' : 'Participate Now ➔'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* HORIZONTAL SWIPEABLE CHALLENGE CAROUSEL */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitleText, { color: colors.textPrimary }]}>
            {language === 'ar' ? 'اختر ميدان التحدي ⚡' : 'Select Arena Mode ⚡'}
          </Text>
        </View>

        <FlatList
          data={challengesData}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          snapToInterval={SCREEN_WIDTH - 40}
          decelerationRate="fast"
          contentContainerStyle={styles.carouselContainer}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.carouselCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => navigation.navigate(item.route, item.params)}
              activeOpacity={0.9}
            >
              {/* Background illustration mock-ups */}
              <View style={styles.carouselCardVectorHolder}>
                {item.isDuel ? (
                  <Svg viewBox="0 0 100 100" width="120" height="120" opacity="0.15">
                    <Path d="M20,80 L80,20 M80,80 L20,20" stroke={colors.primary} strokeWidth="10" strokeLinecap="round" />
                  </Svg>
                ) : (
                  <Svg viewBox="0 0 100 100" width="120" height="120" opacity="0.15">
                    <Circle cx="50" cy="55" r="35" fill="none" stroke={colors.primary} strokeWidth="10" />
                    <Path d="M50,30 L50,55 L70,55" fill="none" stroke={colors.primary} strokeWidth="10" strokeLinecap="round" />
                  </Svg>
                )}
              </View>

              <Text style={styles.carouselCardIcon}>{item.isDuel ? '⚔️' : '⏱️'}</Text>
              <Text style={[styles.carouselCardTitle, { color: colors.textPrimary }]}>
                {language === 'ar' ? item.titleAr : item.titleEn}
              </Text>
              <Text style={[styles.carouselCardDesc, { color: colors.textSecondary }]}>
                {language === 'ar' ? item.descAr : item.descEn}
              </Text>

              <View style={[styles.carouselCardButton, { backgroundColor: colors.primary }]}>
                <Text style={styles.carouselCardButtonText}>
                  {language === 'ar' ? 'ابدأ المواجهة' : 'Start Arena'}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />

        {/* CATEGORY QUICK-SELECT PILLS */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsScrollContainer}>
          {['الكل', 'القرآن', 'السنة', 'الفقه', 'السيرة', 'العقيدة', 'التاريخ'].map((cat) => {
            const isSelected = activeCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.pillBtn,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  isSelected && { backgroundColor: colors.primaryDeep, borderColor: colors.primaryDeep }
                ]}
                onPress={() => {
                  setActiveCategory(cat);
                  navigation.navigate('Trivia', { category: cat });
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.pillBtnText, { color: colors.textSecondary }, isSelected && { color: '#FFFFFF', fontWeight: '700' }]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* AYAH OF TODAY CARD */}
        <View style={[styles.ayahCard, { backgroundColor: colors.accentTint, borderColor: colors.accentTintBorder }]}>
          <View style={styles.ayahHeaderRow}>
            <Text style={[styles.ayahLabelText, { color: colors.accentOnTint }]}>
              {language === 'ar' ? 'آية اليوم 📖' : 'Ayah of the Day 📖'}
            </Text>
            <TouchableOpacity style={styles.ayahShareButton} onPress={handleShareAyah} activeOpacity={0.7}>
              <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.accentOnTint} strokeWidth="2.5">
                <Path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <Path d="m16 6-4-4-4 4" />
                <Path d="M12 2v13" />
              </Svg>
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.ayahArabicText, { color: colors.textPrimary }]}>
            وَفِي ذَٰلِكَ فَلْيَتَنَافَسِ الْمُتَنَافِسُونَ
          </Text>
          
          {language !== 'ar' && (
            <Text style={[styles.ayahEnglishText, { color: colors.textSecondary }]}>
              "And for this let those aspire, who have aspirations."
            </Text>
          )}
          
          <Text style={[styles.ayahMetaText, { color: colors.accentOnTint }]}>
            {language === 'ar' ? 'سورة المطففين · ٢٦' : 'Surah Al-Mutaffifin · 26'}
          </Text>
        </View>

        {/* WEEKLY LEAGUE STANDINGS BRACKET CARD */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitleText, { color: colors.textPrimary }]}>
            {language === 'ar' ? 'دوري الفرسان الأسبوعي 🛡️' : 'Weekly Fursan League 🛡️'}
          </Text>
        </View>

        <View style={[styles.leagueCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.leagueHeader}>
            <Text style={[styles.leagueTitleText, { color: colors.textPrimary }]}>
              {language === 'ar' ? 'المجموعات النشطة' : 'Active Divisions'}
            </Text>
            <Text style={[styles.leagueCountdownText, { color: colors.textSecondary }]}>
              ⏱️ {language === 'ar' ? 'ينتهي خلال: ٢ ي' : 'Ends in: 2d'}
            </Text>
          </View>

          {/* Simple Bracket Node list mock */}
          <View style={styles.bracketContainer}>
            <View style={styles.bracketNode}>
              <Text style={[styles.bracketPos, { color: colors.textSecondary }]}>1</Text>
              <Text style={[styles.bracketName, { color: colors.textPrimary }]}>Aisha R.</Text>
              <Text style={styles.bracketStatus}>🟢 {language === 'ar' ? 'صعود' : 'Promote'}</Text>
            </View>
            <View style={styles.bracketNode}>
              <Text style={[styles.bracketPos, { color: colors.textSecondary }]}>2</Text>
              <Text style={[styles.bracketName, { color: colors.textPrimary }]}>Zain B.</Text>
              <Text style={styles.bracketStatus}>🟢 {language === 'ar' ? 'صعود' : 'Promote'}</Text>
            </View>
            <View style={[styles.bracketNode, { backgroundColor: colors.primaryTint }]}>
              <Text style={[styles.bracketPos, { color: colors.primaryOnTint }]}>3</Text>
              <Text style={[styles.bracketName, { color: colors.textPrimary, fontWeight: '700' }]}>
                {language === 'ar' ? 'أنت' : 'You'}
              </Text>
              <Text style={[styles.bracketStatus, { color: colors.primaryOnTint }]}>🟢 {language === 'ar' ? 'صعود' : 'Promote'}</Text>
            </View>
            <View style={styles.bracketNode}>
              <Text style={[styles.bracketPos, { color: colors.textSecondary }]}>4</Text>
              <Text style={[styles.bracketName, { color: colors.textPrimary }]}>Sara K.</Text>
              <Text style={[styles.bracketStatus, { color: colors.textSecondary }]}>➖ {language === 'ar' ? 'ثابت' : 'Safe'}</Text>
            </View>
          </View>
        </View>

        {/* LIVE ACTIVITY FEED */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitleText, { color: colors.textPrimary }]}>
            {language === 'ar' ? 'الأحداث الحية 🟢' : 'Live Arena Feed 🟢'}
          </Text>
        </View>

        <View style={[styles.feedCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {ACTIVITY_FEED.map((feed) => (
            <View key={feed.id} style={[styles.feedItem, { borderBottomColor: colors.border }]}>
              <Text style={styles.feedDot}>•</Text>
              <Text style={[styles.feedText, { color: colors.textPrimary }]}>
                {language === 'ar' ? feed.ar : feed.en}
              </Text>
            </View>
          ))}
        </View>

        <AdBanner />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 28,
  },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 56,
    gap: 18,
  },
  topHeaderRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  greetingCol: {
    alignItems: 'flex-end',
    gap: 2,
  },
  greetingLabelText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  profileNameText: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#1D2939',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  unreadDot: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 9,
    height: 9,
    borderRadius: 50,
    backgroundColor: '#F5B841',
    borderWidth: 2,
  },
  dateTextLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'IBMPlexSansArabic-SemiBold',
  },
  
  // UNIFIED CARD
  unifiedCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#1D2939',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  unifiedHeaderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 99,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 22,
  },
  unifiedNameCol: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 2,
  },
  unifiedNameText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  streakBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  streakFlameIcon: {
    fontSize: 14,
  },
  streakText: {
    fontSize: 11,
    color: '#F97316',
    fontWeight: '600',
  },
  leagueBadgeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  leagueLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#D97706',
  },
  leagueMedal: {
    fontSize: 20,
  },
  levelGaugeContainer: {
    width: '100%',
    marginBottom: 16,
  },
  levelProgressLabelRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  levelProgressLabel: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'IBMPlexSansArabic-SemiBold',
  },
  levelProgressValue: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
    writingDirection: 'ltr',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 99,
  },
  statsGridRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 14,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statEmoji: {
    fontSize: 16,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  statLabel: {
    fontSize: 9,
    fontFamily: 'IBMPlexSansArabic-Regular',
    marginTop: 1,
  },

  // SECTION HEADER
  sectionHeaderRow: {
    flexDirection: 'row-reverse',
    marginTop: 4,
  },
  sectionTitleText: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },

  // PODIUM
  podiumContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 4,
    height: 160,
  },
  podiumCard: {
    width: '31%',
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    paddingVertical: 10,
    position: 'relative',
    height: 135,
  },
  podiumMedal: {
    fontSize: 18,
    position: 'absolute',
    top: -12,
  },
  podiumAvatar: {
    width: 32,
    height: 32,
    borderRadius: 99,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    marginTop: 2,
  },
  podiumAvatarEmoji: {
    fontSize: 16,
  },
  podiumName: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  podiumPlaceLabel: {
    fontSize: 8.5,
    fontFamily: 'IBMPlexSansArabic-Regular',
    marginTop: 1,
  },
  podiumScoreText: {
    fontSize: 11.5,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
    marginTop: 2,
  },
  podiumTimeText: {
    fontSize: 8.5,
    fontFamily: 'IBMPlexSansArabic-Medium',
    marginTop: 1,
  },

  // HERO CARD: DAILY GLOBAL CHAMPIONSHIP
  dailyChampionshipCard: {
    borderRadius: 20,
    padding: 18,
    position: 'relative',
    overflow: 'hidden',
  },
  dailyChampionshipContent: {
    alignItems: 'flex-end',
    width: '100%',
  },
  dailyChampBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    marginBottom: 8,
  },
  dailyChampTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
    marginBottom: 4,
  },
  dailyChampMeta: {
    fontSize: 10.5,
    color: '#A7F3D0',
    fontFamily: 'IBMPlexSansArabic-Regular',
    marginBottom: 14,
  },
  dailyChampCTA: {
    backgroundColor: '#F5B841',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  dailyChampCTAText: {
    fontSize: 11.5,
    color: '#042D23',
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },

  // HORIZONTAL SWIPEABLE CAROUSEL
  carouselContainer: {
    paddingHorizontal: 2,
    gap: 16,
  },
  carouselCard: {
    width: SCREEN_WIDTH - 40,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  carouselCardVectorHolder: {
    position: 'absolute',
    right: -20,
    bottom: -20,
  },
  carouselCardIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  carouselCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
    marginBottom: 4,
    textAlign: 'right',
  },
  carouselCardDesc: {
    fontSize: 11,
    lineHeight: 16,
    fontFamily: 'IBMPlexSansArabic-Regular',
    marginBottom: 16,
    textAlign: 'right',
  },
  carouselCardButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  carouselCardButtonText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },

  // PILLS
  pillsScrollContainer: {
    gap: 8,
    flexDirection: 'row-reverse',
    paddingVertical: 2,
  },
  pillBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 99,
    borderWidth: 1,
  },
  pillBtnText: {
    fontSize: 11.5,
    fontFamily: 'IBMPlexSansArabic-Medium',
  },

  // AYAH OF TODAY CARD
  ayahCard: {
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  ayahHeaderRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ayahLabelText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  ayahShareButton: {
    padding: 4,
  },
  ayahArabicText: {
    fontSize: 16,
    lineHeight: 28,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  ayahEnglishText: {
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  ayahMetaText: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'IBMPlexSansArabic-SemiBold',
  },

  // WEEKLY LEAGUE STANDINGS
  leagueCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  leagueHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  leagueTitleText: {
    fontSize: 13.5,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  leagueCountdownText: {
    fontSize: 10.5,
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  bracketContainer: {
    gap: 8,
  },
  bracketNode: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  bracketPos: {
    fontSize: 12,
    fontWeight: '700',
  },
  bracketName: {
    fontSize: 12.5,
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  bracketStatus: {
    fontSize: 10.5,
    fontWeight: '700',
  },

  // LIVE ACTIVITY FEED
  feedCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  feedItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  feedDot: {
    fontSize: 14,
    color: '#10B981',
    marginLeft: 6,
  },
  feedText: {
    fontSize: 11,
    fontFamily: 'IBMPlexSansArabic-Medium',
    flex: 1,
    textAlign: 'right',
  },
});
