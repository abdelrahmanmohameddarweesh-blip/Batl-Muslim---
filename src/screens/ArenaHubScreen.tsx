import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function ArenaHubScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.arenaEmoji}>⚔️</Text>
        <Text style={styles.title}>
          {language === 'ar' ? 'ميدان المنافسة ⚡' : 'Competition Arena ⚡'}
        </Text>
        <Text style={styles.subtitle}>
          {language === 'ar'
            ? 'تحدَّ أقرانك في مبارزات فورية، نافس على المراتب الأولى، وكن بطلاً متميزاً'
            : 'Challenge peers in real-time speed duels, climb the leaderboard, and become a legendary hero'}
        </Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Box 1: 1v1 Live Speed Duel */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('LiveDuel')}
          activeOpacity={0.85}
        >
          <View style={[styles.iconWrapper, { backgroundColor: '#FEE2E2' }]}>
            <Text style={styles.cardIcon}>⚔️</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>
              {language === 'ar' ? 'المبارزة المباشرة' : '1v1 Live Trivia Duel'}
            </Text>
            <Text style={styles.cardDesc}>
              {language === 'ar'
                ? 'مواجهة فورية سريعة للإجابة على الأسئلة الإسلامية في أسرع وقت.'
                : 'A fast-paced, real-time quiz face-off against a peer.'}
            </Text>
          </View>
          <Text style={styles.arrow}>➔</Text>
        </TouchableOpacity>

        {/* Box 2: Leaderboard */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Leaderboard')}
          activeOpacity={0.85}
        >
          <View style={[styles.iconWrapper, { backgroundColor: '#FEF3C7' }]}>
            <Text style={styles.cardIcon}>🏆</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>
              {language === 'ar' ? 'لوحة الصدارة' : 'Leaderboard'}
            </Text>
            <Text style={styles.cardDesc}>
              {language === 'ar'
                ? 'استعرض ترتيب الأبطال على مستوى دولتك والعالم.'
                : 'View rankings globally and filtered by your country.'}
            </Text>
          </View>
          <Text style={styles.arrow}>➔</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  arenaEmoji: {
    fontSize: 54,
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    gap: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  iconWrapper: {
    width: 54,
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 14,
  },
  cardIcon: {
    fontSize: 26,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.textPrimary,
    textAlign: 'right',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 11,
    lineHeight: 16,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  arrow: {
    fontSize: 16,
    color: colors.primary,
    marginRight: 10,
  },
});
