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

export default function CommunityFeedScreen() {
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
    loadFeed();
  }, []);

  // Dynamic filtering logic
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      // 1. Qari Filter
      if (filterReader !== 'ALL' && post.readerId !== filterReader) {
        return false;
      }
      // 2. Country Filter
      if (filterCountry !== 'ALL' && post.countryCode !== filterCountry) {
        return false;
      }
      // 3. Style Filter
      if (filterStyle !== 'ALL' && post.style !== filterStyle) {
        return false;
      }
      // 4. Accuracy Filter
      if (filterAccuracy !== 'ALL') {
        const threshold = parseInt(filterAccuracy, 10);
        if (post.matchPercentage < threshold) {
          return false;
        }
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

  return (
    <View style={styles.container}>
      {/* Feed Header */}
      <View style={styles.feedHeader}>
        <Text style={styles.feedTitle}>
          {language === 'ar' ? 'منبر التلاوة الجماعي 🎙️' : 'Community Recitation Feed 🎙️'}
        </Text>
        <Text style={styles.feedSubtitle}>
          {language === 'ar' 
            ? 'تصفح تلاوات زملائك، تفاعل معها، وتعلم من محاكاتهم للقراء' 
            : 'Explore recitations shared by other heroes, upvote, and learn'}
        </Text>
      </View>

      {/* Filter Action Row */}
      <View style={styles.filterActionRow}>
        <TouchableOpacity
          style={[styles.filterToggleBtn, showFilters && styles.filterToggleBtnActive]}
          onPress={() => setShowFilters(!showFilters)}
          activeOpacity={0.8}
        >
          <Text style={[styles.filterToggleBtnText, showFilters && styles.filterToggleBtnTextActive]}>
            {showFilters 
              ? (language === 'ar' ? 'إغلاق الفلاتر ✖️' : 'Close Filters ✖️') 
              : (language === 'ar' ? 'تصفية وتخصيص البحث 🔍' : 'Filter & Search 🔍')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Expandable Filter Sheet */}
      {showFilters && (
        <View style={styles.filterSheet}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {/* 1. Recitation Style (Murattal / Mujawwad) */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupLabel}>{language === 'ar' ? 'طريقة التلاوة:' : 'Style:'}</Text>
              <View style={styles.badgeRow}>
                <TouchableOpacity
                  style={[styles.filterBadge, filterStyle === 'ALL' && styles.filterBadgeActive]}
                  onPress={() => setFilterStyle('ALL')}
                >
                  <Text style={[styles.filterBadgeText, filterStyle === 'ALL' && styles.filterBadgeTextActive]}>
                    {language === 'ar' ? 'الكل' : 'All'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterBadge, filterStyle === 'murattal' && styles.filterBadgeActive]}
                  onPress={() => setFilterStyle('murattal')}
                >
                  <Text style={[styles.filterBadgeText, filterStyle === 'murattal' && styles.filterBadgeTextActive]}>
                    {language === 'ar' ? 'مرتل 📖' : 'Murattal'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterBadge, filterStyle === 'mujawwad' && styles.filterBadgeActive]}
                  onPress={() => setFilterStyle('mujawwad')}
                >
                  <Text style={[styles.filterBadgeText, filterStyle === 'mujawwad' && styles.filterBadgeTextActive]}>
                    {language === 'ar' ? 'مجوّد 🎨' : 'Mujawwad'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 2. Accuracy Threshold */}
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

            {/* 3. Imitated Qari (Reader) */}
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

            {/* 4. Country Code */}
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
                ? 'لا توجد تسجيلات تطابق خيارات التصفية هذه. جرّب تعديل الفلاتر أو كن البطل الأول الذي ينشر!'
                : 'No recitations found matching these filters. Try modifying your filter choices!'}
            </Text>
          </View>
        ) : (
          filteredPosts.map(post => (
            <View key={post.id} style={styles.postCard}>
              {/* Profile details */}
              <View style={styles.profileRow}>
                <View style={styles.profileMeta}>
                  <Text style={styles.postUserName}>
                    {post.userName} {getFlagEmoji(post.countryCode)}
                  </Text>
                  <Text style={styles.postUserLevel}>
                    {language === 'ar' ? `المستوى ${post.userLevel}` : `Level ${post.userLevel}`}
                  </Text>
                </View>
                <View style={styles.profileAvatar}>
                  <Text style={styles.profileAvatarText}>{post.userName[0]}</Text>
                </View>
              </View>

              {/* Quranic Text details */}
              <View style={styles.quranCard}>
                <Text style={styles.ayahSurah}>{post.surahName} (الآية {post.ayahNumber})</Text>
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

                {/* Simulated Audio Progress Waveform */}
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

              {/* Social Reactions Upvote Buttons */}
              <View style={styles.reactionActionRow}>
                <TouchableOpacity
                  style={[styles.reactionBtn, post.hasVotedMashallah && styles.reactionBtnActive]}
                  onPress={() => handleVote(post.id, 'mashallah')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.reactionLabel}>
                    ⭐ {language === 'ar' ? 'ما شاء الله' : 'Mashallah'} ({post.mashallahCount})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.reactionBtn, post.hasVotedSubhanallah && styles.reactionBtnActive]}
                  onPress={() => handleVote(post.id, 'subhanallah')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.reactionLabel}>
                    📿 {language === 'ar' ? 'سبحان الله' : 'Subhanallah'} ({post.subhanallahCount})
                  </Text>
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
    fontSize: 20,
    fontWeight: '900',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  feedSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 12,
  },
  filterActionRow: {
    marginBottom: 10,
  },
  filterToggleBtn: {
    backgroundColor: '#09120F',
    borderWidth: 1.5,
    borderColor: '#1E3A2F',
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
  },
  filterToggleBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterToggleBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  filterToggleBtnTextActive: {
    color: '#09120F',
    fontWeight: '900',
  },
  filterSheet: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
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
    backgroundColor: '#09120F',
    borderWidth: 1,
    borderColor: '#1E3A2F',
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
    color: '#09120F',
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
  profileMeta: {
    alignItems: 'flex-end',
  },
  postUserName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  postUserLevel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '700',
    marginTop: 2,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  profileAvatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  quranCard: {
    backgroundColor: '#09120F',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E3A2F4D',
    gap: 10,
    marginBottom: 14,
  },
  ayahSurah: {
    fontSize: 10,
    color: colors.accent,
    fontWeight: '700',
    textAlign: 'right',
  },
  ayahTextCalligraphy: {
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 22,
    textAlign: 'right',
    fontWeight: '800',
  },
  scoreRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  qariBadge: {
    backgroundColor: '#1E3A2F33',
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
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playBtnIcon: {
    fontSize: 10,
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
  reactionActionRow: {
    flexDirection: 'row-reverse',
    gap: 12,
  },
  reactionBtn: {
    flex: 1,
    backgroundColor: '#09120F',
    borderWidth: 1,
    borderColor: '#1E3A2F',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
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
  adWrapper: {
    marginTop: 10,
  },
});
