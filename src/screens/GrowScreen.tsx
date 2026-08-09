import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { challenges, Challenge } from '../data/challenges';

// Lucide-equivalent stroke SVG icons
function ChallengeIcon({ id, color }: { id: string; color: string }) {
  const strokeColor = color;
  
  if (id === 'prayer-tracker') {
    // Mosque/Building outline
    return (
      <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M3 21h18" />
        <Path d="M10 21V10a2 2 0 0 1 4 0v11" />
        <Path d="m12 3-8 5v13h16V8z" />
      </Svg>
    );
  }
  if (id === 'fajr-challenge') {
    // Sun rising
    return (
      <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        <Circle cx="12" cy="12" r="4" />
      </Svg>
    );
  }
  if (id === 'voice-challenge') {
    // Mic outline
    return (
      <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
        <Path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 22h8" />
      </Svg>
    );
  }
  if (id === 'reading-challenge') {
    // Book Open
    return (
      <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <Path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </Svg>
    );
  }
  if (id === 'memorization') {
    // Brain/Mind outline
    return (
      <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1 0-3.12 3 3 0 0 1 0-4.88 2.5 2.5 0 0 1 0-3.12A2.5 2.5 0 0 1 9.5 2Z" />
        <Path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 0-3.12 3 3 0 0 0 0-4.88 2.5 2.5 0 0 0 0-3.12A2.5 2.5 0 0 0 14.5 2Z" />
      </Svg>
    );
  }
  if (id === 'adhkar') {
    // Beads / Sparkles (Circle dotted)
    return (
      <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <Circle cx="12" cy="12" r="10" strokeDasharray="4 4" />
        <Circle cx="12" cy="12" r="3" />
      </Svg>
    );
  }
  if (id === 'hadith') {
    // Message/Chat outline
    return (
      <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </Svg>
    );
  }
  if (id === 'knowledge') {
    // Scroll / Page / Trivia
    return (
      <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <Path d="M14 2v6h6" />
      </Svg>
    );
  }
  // sirah-quest Map / Compass
  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="12" r="10" />
      <Path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36z" />
    </Svg>
  );
}

export default function GrowScreen({ navigation }: any) {
  const { language } = useLanguage();
  const { colors } = useTheme();

  // Active filter tab: 'all' | 'worship' | 'quran' | 'knowledge'
  const [activeTab, setActiveTab] = useState<'all' | 'worship' | 'quran' | 'knowledge'>('all');

  // Challenge groups mapping
  const worshipRoutes = ['PrayerTracker', 'FajrChallenge', 'Adhkar'];
  const quranRoutes = ['Voice', 'Memorization', 'ReadingChallenge'];
  const knowledgeRoutes = ['SirahQuest', 'HadithChallenge', 'Trivia'];

  const getCategoryOfChallenge = (challenge: Challenge): 'worship' | 'quran' | 'knowledge' => {
    if (worshipRoutes.includes(challenge.route)) return 'worship';
    if (quranRoutes.includes(challenge.route)) return 'quran';
    return 'knowledge';
  };

  // Sections config
  const sections = [
    {
      key: 'worship',
      titleAr: 'أركان العبادة',
      titleEn: 'Worship Essentials',
      color: '#10B981',
      list: challenges.filter(c => getCategoryOfChallenge(c) === 'worship'),
    },
    {
      key: 'quran',
      titleAr: 'محراب القرآن الكريم',
      titleEn: 'Quran Sanctuary',
      color: '#1C64F2',
      list: challenges.filter(c => getCategoryOfChallenge(c) === 'quran'),
    },
    {
      key: 'knowledge',
      titleAr: 'مسالك المعرفة',
      titleEn: 'Knowledge Quests',
      color: '#D97706',
      list: challenges.filter(c => getCategoryOfChallenge(c) === 'knowledge'),
    },
  ];

  // Filtered sections to display
  const displayedSections = sections.filter(sec => {
    if (activeTab === 'all') return true;
    return sec.key === activeTab;
  });

  const getDifficultyStyles = (diff: string) => {
    switch (diff) {
      case 'سهل':
        return { bg: '#ECFDF5', text: '#00604F' };
      case 'متوسط':
        return { bg: '#FFF7ED', text: '#973C00' };
      case 'متقدم':
        return { bg: '#FEF2F2', text: '#9F0712' };
      default: // 'بطل'
        return { bg: '#FAF5FF', text: '#6E11B0' };
    }
  };

  const getCategoryThemeColor = (key: string) => {
    if (key === 'worship') return '#10B981';
    if (key === 'quran') return '#1C64F2';
    return '#D97706';
  };

  return (
    <View style={[styles.outerContainer, { backgroundColor: colors.background }]}>
      {/* Sticky Header */}
      <View style={[styles.headerContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          {language === 'ar' ? 'التطوّر' : 'Grow'}
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          {language === 'ar' 
            ? 'عبادتك، قرآنك، ومعرفتك — كلها تُغذّي رتبتك.' 
            : 'Your worship, Quran, and knowledge — all feed your rank.'}
        </Text>

        {/* Filters Tabs Row */}
        <View style={styles.tabsRow}>
          {[
            { key: 'all', ar: 'الكل', en: 'All' },
            { key: 'worship', ar: 'العبادة', en: 'Worship' },
            { key: 'quran', ar: 'القرآن', en: 'Quran' },
            { key: 'knowledge', ar: 'المعرفة', en: 'Knowledge' },
          ].map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key as any)}
                style={[
                  styles.tabBtn,
                  isActive && { borderBottomColor: colors.primaryDeep }
                ]}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.tabText,
                  isActive ? { color: colors.primaryDeep, fontWeight: '700' } : { color: colors.textSecondary }
                ]}>
                  {language === 'ar' ? tab.ar : tab.en}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Main List Body */}
      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {displayedSections.map(sec => (
          <View key={sec.key} style={styles.sectionContainer}>
            {/* Section Title Header */}
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionCountBadge, { backgroundColor: colors.neutralTint }]}>
                <Text style={[styles.sectionCountText, { color: colors.textSecondary }]}>
                  {sec.list.length}
                </Text>
              </View>
              <Text style={[styles.sectionTitleText, { color: colors.textPrimary }]}>
                {language === 'ar' ? sec.titleAr : sec.titleEn}
              </Text>
              <View style={[styles.sectionTitleColorBar, { backgroundColor: sec.color }]} />
            </View>

            {/* Challenges List */}
            <View style={styles.challengesContainer}>
              {sec.list.map(item => {
                const diffStyles = getDifficultyStyles(item.difficulty);
                const themeColor = getCategoryThemeColor(sec.key);
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => navigation.navigate(item.route)}
                    style={[styles.challengeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    activeOpacity={0.85}
                  >
                    {/* Trailing Points Column */}
                    <View style={styles.pointsCol}>
                      <Text style={[styles.pointsVal, { color: colors.accentDeep }]}>
                        +{item.points}
                      </Text>
                      <Text style={[styles.pointsLabel, { color: colors.textTertiary }]}>
                        {language === 'ar' ? 'نقطة' : 'XP'}
                      </Text>
                    </View>

                    {/* Main Info Area */}
                    <View style={styles.cardInfoContainer}>
                      <View style={styles.cardHeaderRow}>
                        <View style={[styles.difficultyBadge, { backgroundColor: diffStyles.bg }]}>
                          <Text style={[styles.difficultyText, { color: diffStyles.text }]}>
                            {language === 'ar' ? item.difficulty : item.difficulty}
                          </Text>
                        </View>
                        <Text style={[styles.challengeTitle, { color: colors.textPrimary }]}>
                          {item.title}
                        </Text>
                      </View>
                      <Text style={[styles.challengeDesc, { color: colors.textSecondary }]} numberOfLines={1}>
                        {item.description}
                      </Text>
                    </View>

                    {/* Icon Tile */}
                    <View style={[styles.iconTile, { backgroundColor: item.color, borderColor: 'rgba(0,0,0,0.03)' }]}>
                      <ChallengeIcon id={item.id} color={themeColor} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
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
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: '#1D2939',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 16,
  },
  tabsRow: {
    flexDirection: 'row-reverse',
    gap: 22,
    paddingBottom: 2,
  },
  tabBtn: {
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
  },
  scrollBody: {
    padding: 20,
    paddingBottom: 36,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleColorBar: {
    width: 5,
    height: 14,
    borderRadius: 999,
    marginLeft: 8,
  },
  sectionTitleText: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
  },
  sectionCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  sectionCountText: {
    fontSize: 11,
    fontWeight: '600',
    writingDirection: 'ltr',
  },
  challengesContainer: {
    gap: 12,
  },
  challengeCard: {
    flexDirection: 'row-reverse',
    borderWidth: 1,
    borderRadius: 14,
    padding: 13,
    alignItems: 'center',
    shadowColor: '#1D2939',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  cardInfoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  cardHeaderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  challengeTitle: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
  },
  difficultyBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    marginRight: 6,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '700',
  },
  challengeDesc: {
    fontSize: 11.5,
    textAlign: 'right',
    lineHeight: 16,
  },
  pointsCol: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    marginRight: 8,
  },
  pointsVal: {
    fontSize: 14,
    fontWeight: '700',
    writingDirection: 'ltr',
  },
  pointsLabel: {
    fontSize: 9,
    fontWeight: '600',
  },
});
