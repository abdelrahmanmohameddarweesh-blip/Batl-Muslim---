import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function KnowledgeSanctuaryScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.knowledgeEmoji}>🗺️</Text>
        <Text style={styles.title}>
          {language === 'ar' ? 'مسالك المعرفة 🗺️' : 'Knowledge Quests 🗺️'}
        </Text>
        <Text style={styles.subtitle}>
          {language === 'ar'
            ? 'تتبع محطات السيرة النبوية العطرة، تعلم رواية الحديث، واختبر ثقافتك الإسلامية الكبرى'
            : 'Trace the milestones of the Prophet\'s life, learn Hadith structures, and test your Islamic knowledge'}
        </Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 1. Sirah Quest Map */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('SirahQuest')}
          activeOpacity={0.85}
        >
          <View style={[styles.iconWrapper, { backgroundColor: '#FFF0F5' }]}>
            <Text style={styles.cardIcon}>🗺️</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>
              {language === 'ar' ? 'خريطة السيرة النبوية' : 'Sirah Quest Map'}
            </Text>
            <Text style={styles.cardDesc}>
              {language === 'ar'
                ? 'رحلة تفاعلية عبر ٦ مراحل رئيسية في حياة النبي ﷺ وحل ألغاز السيرة.'
                : 'A Duolingo-style journey through the life of the Prophet ﷺ.'}
            </Text>
          </View>
          <Text style={styles.arrow}>➔</Text>
        </TouchableOpacity>

        {/* 2. Hadith Challenge */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('HadithChallenge')}
          activeOpacity={0.85}
        >
          <View style={[styles.iconWrapper, { backgroundColor: '#EBEBF7' }]}>
            <Text style={styles.cardIcon}>💬</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>
              {language === 'ar' ? 'تحدي الحديث الشريف' : 'Hadith Scholar'}
            </Text>
            <Text style={styles.cardDesc}>
              {language === 'ar'
                ? 'اختبارات في رواة الأحاديث، صحتها، ودلالاتها التربوية.'
                : 'Solve quizzes on Hadith narrators, authenticity, and core meanings.'}
            </Text>
          </View>
          <Text style={styles.arrow}>➔</Text>
        </TouchableOpacity>

        {/* 3. Islamic Trivia */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Trivia')}
          activeOpacity={0.85}
        >
          <View style={[styles.iconWrapper, { backgroundColor: '#F2F2F2' }]}>
            <Text style={styles.cardIcon}>📝</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>
              {language === 'ar' ? 'تحدي المعرفة الإسلامية' : 'Grand Islamic Trivia'}
            </Text>
            <Text style={styles.cardDesc}>
              {language === 'ar'
                ? 'المسابقة الكبرى في الفقه، السيرة، القرآن، والتاريخ الإسلامي.'
                : 'The ultimate trivia challenge covering Islamic history, Fiqh, and culture.'}
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
  knowledgeEmoji: {
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
