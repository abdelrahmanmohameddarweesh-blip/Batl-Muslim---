import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function QuranSanctuaryScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.quranEmoji}>📖</Text>
        <Text style={styles.title}>
          {language === 'ar' ? 'محراب القرآن الكريم 📖' : 'Quran Sanctuary 📖'}
        </Text>
        <Text style={styles.subtitle}>
          {language === 'ar'
            ? 'رتل كتاب الله، حاكِ عمالقة التلاوة، اختبر قوة حفظك، وتعمق في فهم الآيات العظيمة'
            : 'Recite the book of Allah, imitate famous reciters, test your memorization, and study verse meanings'}
        </Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 1. Voice Recitation Challenge */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Voice')}
          activeOpacity={0.85}
        >
          <View style={[styles.iconWrapper, { backgroundColor: '#F7EBF7' }]}>
            <Text style={styles.cardIcon}>🎙️</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>
              {language === 'ar' ? 'تحدي تقليد القراء' : 'Voice Recitation Studio'}
            </Text>
            <Text style={styles.cardDesc}>
              {language === 'ar'
                ? 'رتل الآيات الكريمة محاكياً أصوات عمالقة القراء، واحصل على نسبة مطابقتك.'
                : 'Recite Quranic verses imitating top Qaris and analyze your accuracy.'}
            </Text>
          </View>
          <Text style={styles.arrow}>➔</Text>
        </TouchableOpacity>

        {/* 2. Memorization Challenge */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Memorization')}
          activeOpacity={0.85}
        >
          <View style={[styles.iconWrapper, { backgroundColor: '#F7EBEB' }]}>
            <Text style={styles.cardIcon}>🧠</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>
              {language === 'ar' ? 'اختبارات حفظ الآيات' : 'Quran Memorization'}
            </Text>
            <Text style={styles.cardDesc}>
              {language === 'ar'
                ? 'اختبر جودة حفظك من خلال إكمال الكلمات الناقصة في سياق الآيات.'
                : 'Test your memorization strength by filling in missing verse segments.'}
            </Text>
          </View>
          <Text style={styles.arrow}>➔</Text>
        </TouchableOpacity>

        {/* 3. Reading and Tafseer Challenge */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('ReadingChallenge')}
          activeOpacity={0.85}
        >
          <View style={[styles.iconWrapper, { backgroundColor: '#EBF4F7' }]}>
            <Text style={styles.cardIcon}>📚</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>
              {language === 'ar' ? 'التفسير وفهم معاني السور' : 'Tafsir & Reading'}
            </Text>
            <Text style={styles.cardDesc}>
              {language === 'ar'
                ? 'اقرأ تفسير الآيات، تعلّم أسباب النزول، وأجب عن الأسئلة لقياس فهمك.'
                : 'Read Quranic contexts, historical causes of revelation, and solve quizzes.'}
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
  quranEmoji: {
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
