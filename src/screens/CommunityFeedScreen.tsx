import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { readCommunityPosts, saveCommunityPosts, type CommunityPost } from '../data/communityFeed';
import { readers } from '../data/readers';
import AdBanner from '../components/AdBanner';

const getFlagEmoji = (code?: string) => {
  if (!code) return '🌍';
  switch (code) {
    case 'EG': return '🇪🇬';
    case 'SA': return '🇸🇦';
    case 'JO': return '🇯🇴';
    case 'PS': return '🇵🇸';
    case 'AE': return '🇦🇪';
    case 'MA': return '🇲🇦';
    default: return '🌍';
  }
};

const countriesList = [
  { code: 'ALL', nameAr: 'كل البلدان 🌍', nameEn: 'All Countries' },
  { code: 'EG', nameAr: 'مصر 🇪🇬', nameEn: 'Egypt' },
  { code: 'SA', nameAr: 'السعودية 🇸🇦', nameEn: 'Saudi Arabia' },
  { code: 'JO', nameAr: 'الأردن 🇯🇴', nameEn: 'Jordan' },
  { code: 'PS', nameAr: 'فلسطين 🇵🇸', nameEn: 'Palestine' },
  { code: 'AE', nameAr: 'الإمارات 🇦🇪', nameEn: 'UAE' },
  { code: 'MA', nameAr: 'المغرب 🇲🇦', nameEn: 'Morocco' },
];

export default function CommunityFeedScreen({ navigation }: any) {
  const { colors, isLightMode } = useTheme();
  const { language } = useLanguage();
  const styles = getStyles(colors);

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Active Filters States
  const [filterReader, setFilterReader] = useState<string>('ALL');
  const [filterCountry, setFilterCountry] = useState<string>('ALL');
  const [filterStyle, setFilterStyle] = useState<string>('ALL');
  const [filterAccuracy, setFilterAccuracy] = useState<string>('ALL'); // 'ALL' | '90' | '80' | '70'

  const loadFeed = async () => {
    setLoading(true);
    try {
      const data = await readCommunityPosts();
      setPosts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadFeed();
    });
    return unsubscribe;
  }, [navigation]);

  // Dynamic filtering logic
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      if (filterReader !== 'ALL' && post.readerId !== filterReader) return false;
      if (filterCountry !== 'ALL' && post.countryCode !== filterCountry) return false;
      if (filterStyle !== 'ALL' && post.style !== filterStyle) return false;
      if (filterAccuracy !== 'ALL') {
        const threshold = parseInt(filterAccuracy, 10);
        if (post.matchPercentage < threshold) return false;
      }
      return true;
    });
  }, [posts, filterReader, filterCountry, filterStyle, filterAccuracy]);

  const handleVote = async (postId: string, type: 'mashallah' | 'subhanallah') => {
    const updated = posts.map(post => {
      if (post.id === postId) {
        if (type === 'mashallah') {
          const hasVoted = !!post.hasVotedMashallah;
          return {
            ...post,
            mashallahCount: hasVoted ? post.mashallahCount - 1 : post.mashallahCount + 1,
            hasVotedMashallah: !hasVoted,
          };
        } else {
          const hasVoted = !!post.hasVotedSubhanallah;
          return {
            ...post,
            subhanallahCount: hasVoted ? post.subhanallahCount - 1 : post.subhanallahCount + 1,
            hasVotedSubhanallah: !hasVoted,
          };
        }
      }
      return post;
    });
    setPosts(updated);
    await saveCommunityPosts(updated);
  };

  const getReaderAvatarSymbol = (readerId: string) => {
    switch (readerId) {
      case 'abdulbasit': return '🕌';
      case 'minshawi': return '📖';
      case 'husary': return '💡';
      case 'sudais': return '🕋';
      default: return '🎙️';
    }
  };

  return (
    <View style={styles.container}>
      {/* Feed Header */}
      <View style={styles.feedHeader}>
        <Text style={styles.feedTitle}>
          {language === 'ar' ? 'منبر التلاوة 🎙️' : 'Recitation Feed 🎙️'}
        </Text>
        <Text style={styles.feedSubtitle}>
          {language === 'ar' 
            ? 'تفاعل مع تلاوات زملائك، وقارن تطابق تلاوتك مع كبار القراء' 
            : 'Listen to recitations, react to top voices, and share your own'}
        </Text>
      </View>

      {/* Floating Action / Filter Top Bar */}
      <View style={styles.topActionsBar}>
        <TouchableOpacity
          style={styles.recordActionBtn}
          onPress={() => navigation.navigate('Voice')}
          activeOpacity={0.85}
        >
          <Text style={styles.recordActionBtnText}>🎙️ {language === 'ar' ? 'سجّل تلاوتك' : 'Record Recitation'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterToggleBtn, showFilters && styles.filterToggleBtnActive]}
          onPress={() => setShowFilters(!showFilters)}
          activeOpacity={0.8}
        >
          <Text style={[styles.filterToggleBtnText, showFilters && styles.filterToggleBtnTextActive]}>
            🔍 {language === 'ar' ? 'تصفية' : 'Filters'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modern Filter Sheet */}
      {showFilters && (
        <View style={styles.filterSheet}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {/* Style Filter */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupLabel}>{language === 'ar' ? 'طريقة التلاوة:' : 'Style:'}</Text>
              <View style={styles.badgeRow}>
                {['ALL', 'murattal', 'mujawwad'].map(styleOption => (
                  <TouchableOpacity
                    key={styleOption}
                    style={[styles.filterBadge, filterStyle === styleOption && styles.filterBadgeActive]}
                    onPress={() => setFilterStyle(styleOption)}
                  >
                    <Text style={[styles.filterBadgeText, filterStyle === styleOption && styles.filterBadgeTextActive]}>
                      {styleOption === 'ALL' ? (language === 'ar' ? 'الكل' : 'All') : styleOption === 'murattal' ? (language === 'ar' ? 'مرتل 📖' : 'Murattal') : (language === 'ar' ? 'مجوّد 🎨' : 'Mujawwad')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Accuracy Match Filter */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupLabel}>{language === 'ar' ? 'نسبة التطابق:' : 'Accuracy:'}</Text>
              <View style={styles.badgeRow}>
                {['ALL', '90', '80', '70'].map(acc => (
                  <TouchableOpacity
                    key={acc}
                    style={[styles.filterBadge, filterAccuracy === acc && styles.filterBadgeActive]}
                    onPress={() => setFilterAccuracy(acc)}
                  >
                    <Text style={[styles.filterBadgeText, filterAccuracy === acc && styles.filterBadgeTextActive]}>
                      {acc === 'ALL' ? (language === 'ar' ? 'الكل' : 'All') : `${acc}%+`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Qari Filter */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupLabel}>{language === 'ar' ? 'القارئ المحاكى:' : 'Qari:'}</Text>
              <View style={styles.badgeRow}>
                <TouchableOpacity
                  style={[styles.filterBadge, filterReader === 'ALL' && styles.filterBadgeActive]}
                  onPress={() => setFilterReader('ALL')}
                >
                  <Text style={[styles.filterBadgeText, filterReader === 'ALL' && styles.filterBadgeTextActive]}>
                    {language === 'ar' ? 'الكل' : 'All'}
                  </Text>
                </TouchableOpacity>
                {readers.map(r => (
                  <TouchableOpacity
                    key={r.id}
                    style={[styles.filterBadge, filterReader === r.id && styles.filterBadgeActive]}
                    onPress={() => setFilterReader(r.id)}
                  >
                    <Text style={[styles.filterBadgeText, filterReader === r.id && styles.filterBadgeTextActive]}>
                      {r.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Country Filter */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupLabel}>{language === 'ar' ? 'حسب البلد:' : 'Country:'}</Text>
              <View style={styles.badgeRow}>
                {countriesList.map(c => (
                  <TouchableOpacity
                    key={c.code}
                    style={[styles.filterBadge, filterCountry === c.code && styles.filterBadgeActive]}
                    onPress={() => setFilterCountry(c.code)}
                  >
                    <Text style={[styles.filterBadgeText, filterCountry === c.code && styles.filterBadgeTextActive]}>
                      {language === 'ar' ? c.nameAr : c.nameEn}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Social Timeline */}
      <ScrollView style={styles.timelineScroll} contentContainerStyle={styles.timelineContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : filteredPosts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}>🍂</Text>
            <Text style={styles.emptyStateText}>
              {language === 'ar' 
                ? 'لا توجد تسجيلات تطابق خيارات التصفية هذه. جرّب تعديل الفلاتر أو سجل تلاوتك لتنشرها!'
                : 'No recitations found matching these filters. Try modifying your filter choices or record a new one!'}
            </Text>
          </View>
        ) : (
          filteredPosts.map(post => (
            <View key={post.id} style={styles.postCard}>
              {/* Profile details header matching UI mockup */}
              <View style={styles.profileRow}>
                <TouchableOpacity style={styles.moreIcon} activeOpacity={0.7}>
                  <Text style={styles.moreIconText}>•••</Text>
                </TouchableOpacity>

                <View style={styles.profileMeta}>
                  <Text style={styles.postUserName}>
                    {post.userName} {getFlagEmoji(post.countryCode)}
                  </Text>
                  <View style={styles.levelBadgePill}>
                    <Text style={styles.levelBadgeText}>Level {post.userLevel}</Text>
                  </View>
                </View>
                
                <View style={styles.profileAvatar}>
                  <Text style={styles.profileAvatarText}>
                    {getReaderAvatarSymbol(post.readerId)}
                  </Text>
                </View>
              </View>

              {/* Quranic Text details */}
              <View style={styles.quranCard}>
                <Text style={styles.ayahSurah}>{post.surahName}</Text>
                <Text style={styles.ayahTextCalligraphy}>
                  {post.surahName === 'سورة الكهف' && '﴿ إِنَّهُمْ فِتْيَةٌ آمَنُوا بِرَبِّهِمْ وَزِدْنَاهُمْ هُدًى ﴾'}
                  {post.surahName === 'سورة يس' && '﴿ يس ﴾'}
                  {post.surahName === 'سورة الملك' && '﴿ تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ ﴾'}
                  {post.surahName === 'سورة الرحمن' && '﴿ الرَّحْمَٰنُ ﴾'}
                  {post.surahName !== 'سورة الكهف' && post.surahName !== 'سورة يس' && post.surahName !== 'سورة الملك' && post.surahName !== 'سورة الرحمن' && '﴿ قُلْ هُوَ اللَّهُ أَحَدٌ ﴾'}
                </Text>

                {/* Score and Qari Badge */}
                <View style={styles.scoreRow}>
                  <View style={styles.qariBadge}>
                    <Text style={styles.qariBadgeText}>
                      👤 {language === 'ar' ? 'القارئ:' : 'Qari:'} {post.readerName} ({post.style === 'murattal' ? 'مرتل' : 'مجوّد'})
                    </Text>
                  </View>
                  <View style={styles.matchBadge}>
                    <Text style={styles.matchBadgeText}>⭐ {post.matchPercentage}% Match</Text>
                  </View>
                </View>

                {/* Simulated Audio Progress Waveform matching generated mockup */}
                <View style={styles.waveformContainer}>
                  <TouchableOpacity style={styles.playBtn} activeOpacity={0.8}>
                    <Text style={styles.playBtnIcon}>▶️</Text>
                  </TouchableOpacity>
                  <View style={styles.barsRow}>
                    {[12, 18, 28, 22, 10, 16, 26, 32, 22, 12, 18, 30, 24, 14, 20, 28, 22, 12, 8].map((h, i) => (
                      <View key={i} style={[styles.waveBar, { height: h }]} />
                    ))}
                  </View>
                  <Text style={styles.durationLabel}>0:06</Text>
                </View>
              </View>

              {/* Views, comments counter sub-row */}
              <View style={styles.countersSubRow}>
                <Text style={styles.countersSubText}>
                  1,420 Views  •  12 Comments  •  23 Shares
                </Text>
              </View>

              {/* Social Reactions Upvote Buttons with overlapping badges */}
              <View style={styles.reactionActionRow}>
                <TouchableOpacity
                  style={[styles.reactionBtn, post.hasVotedMashallah && styles.reactionBtnActive]}
                  onPress={() => handleVote(post.id, 'mashallah')}
                  activeOpacity={0.7}
                >
                  <View style={styles.reactionBadgeCount}>
                    <Text style={styles.reactionBadgeCountText}>{post.mashallahCount}</Text>
                  </View>
                  <Text style={styles.reactionLabel}>⭐ {language === 'ar' ? 'ما شاء الله' : 'Mashallah'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.reactionBtn, post.hasVotedSubhanallah && styles.reactionBtnActive]}
                  onPress={() => handleVote(post.id, 'subhanallah')}
                  activeOpacity={0.7}
                >
                  <View style={styles.reactionBadgeCount}>
                    <Text style={styles.reactionBadgeCountText}>{post.subhanallahCount}</Text>
                  </View>
                  <Text style={styles.reactionLabel}>📿 {language === 'ar' ? 'سبحان الله' : 'Subhanallah'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.adWrapper}>
        <AdBanner />
      </View>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  feedHeader: {
    alignItems: 'center',
    marginBottom: 14,
  },
  feedTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  feedSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 12,
  },
  topActionsBar: {
    flexDirection: 'row-reverse',
    gap: 12,
    marginBottom: 14,
  },
  recordActionBtn: {
    flex: 1.8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  recordActionBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.surface,
  },
  filterToggleBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  filterToggleBtnActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  filterToggleBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  filterToggleBtnTextActive: {
    color: colors.primary,
    fontWeight: '900',
  },
  filterSheet: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 14,
  },
  filterScroll: {
    flexDirection: 'row',
    gap: 20,
  },
  filterGroup: {
    gap: 8,
  },
  filterGroupLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterBadgeActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterBadgeText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '800',
  },
  filterBadgeTextActive: {
    color: colors.surface,
    fontWeight: '900',
  },
  timelineScroll: {
    flex: 1,
  },
  timelineContent: {
    paddingBottom: 24,
    gap: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyStateEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStateText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 30,
    fontWeight: '700',
  },
  postCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 12,
    gap: 12,
  },
  moreIcon: {
    marginRight: 'auto',
    paddingHorizontal: 6,
  },
  moreIconText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '900',
  },
  profileMeta: {
    alignItems: 'flex-end',
  },
  postUserName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  levelBadgePill: {
    backgroundColor: colors.accentLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  levelBadgeText: {
    fontSize: 9,
    color: colors.accent,
    fontWeight: '900',
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  profileAvatarText: {
    fontSize: 22,
  },
  quranCard: {
    backgroundColor: colors.background,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: 12,
    marginBottom: 10,
  },
  ayahSurah: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '800',
    textAlign: 'right',
  },
  ayahTextCalligraphy: {
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 24,
    textAlign: 'right',
    fontWeight: '900',
  },
  scoreRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  qariBadge: {
    backgroundColor: colors.neutralTint,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  qariBadgeText: {
    fontSize: 9,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  matchBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: colors.primary,
  },
  matchBadgeText: {
    fontSize: 9,
    color: colors.primary,
    fontWeight: '800',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 10,
    marginTop: 6,
  },
  playBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playBtnIcon: {
    fontSize: 11,
    marginLeft: 1,
  },
  barsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  waveBar: {
    width: 3,
    backgroundColor: colors.primary,
    borderRadius: 1.5,
    opacity: 0.75,
  },
  durationLabel: {
    fontSize: 9,
    color: colors.textSecondary,
    fontWeight: '800',
  },
  countersSubRow: {
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  countersSubText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '700',
    textAlign: 'right',
  },
  reactionActionRow: {
    flexDirection: 'row-reverse',
    gap: 12,
  },
  reactionBtn: {
    flex: 1,
    backgroundColor: colors.neutralTint,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    position: 'relative',
  },
  reactionBtnActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  reactionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  reactionBadgeCount: {
    position: 'absolute',
    top: -8,
    right: 12,
    backgroundColor: colors.accent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.surface,
    zIndex: 1,
  },
  reactionBadgeCountText: {
    fontSize: 8,
    fontWeight: '900',
    color: colors.surface,
  },
  adWrapper: {
    marginTop: 10,
  },
});
