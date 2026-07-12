import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function WorshipSanctuaryScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.worshipEmoji}>🕌</Text>
        <Text style={styles.title}>
          {language === 'ar' ? 'أركان العبادة 🕌' : 'Pillars of Worship 🕌'}
        </Text>
        <Text style={styles.subtitle}>
          {language === 'ar'
            ? 'حافظ على صلواتك الخمس، داوم على أذكارك اليومية، وابنِ عاداتك الإيمانية المستدامة'
            : 'Log your 5 daily prayers, maintain your daily Adhkar, and build consistent spiritual habits'}
        </Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 1. Daily Prayer Tracker */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('PrayerTracker')}
          activeOpacity={0.85}
        >
          <View style={[styles.iconWrapper, { backgroundColor: '#EBF7F3' }]}>
            <Text style={styles.cardIcon}>🕌</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>
              {language === 'ar' ? 'متابع الصلوات اليومي' : 'Daily Prayer Tracker'}
            </Text>
            <Text style={styles.cardDesc}>
              {language === 'ar'
                ? 'سجل صلواتك المفروضة خلال اليوم وحافظ على صلاة الجماعة.'
                : 'Track your obligatory prayers and check them off daily.'}
            </Text>
          </View>
          <Text style={styles.arrow}>➔</Text>
        </TouchableOpacity>

        {/* 2. Fajr Challenge */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('FajrChallenge')}
          activeOpacity={0.85}
        >
          <View style={[styles.iconWrapper, { backgroundColor: '#FFF8E6' }]}>
            <Text style={styles.cardIcon}>🌅</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>
              {language === 'ar' ? 'تحدي الفجر' : 'Fajr Shield Challenge'}
            </Text>
            <Text style={styles.cardDesc}>
              {language === 'ar'
                ? 'أثبت التزامك بصلاة الفجر في وقتها لتحصل على درع الفجر.'
                : 'Prove your commitment to Fajr prayer on time and claim rewards.'}
            </Text>
          </View>
          <Text style={styles.arrow}>➔</Text>
        </TouchableOpacity>

        {/* 3. Daily Adhkar */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Adhkar')}
          activeOpacity={0.85}
        >
          <View style={[styles.iconWrapper, { backgroundColor: '#EDF7EB' }]}>
            <Text style={styles.cardIcon}>📿</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>
              {language === 'ar' ? 'أذكار اليوم والمساء' : 'Daily Adhkar'}
            </Text>
            <Text style={styles.cardDesc}>
              {language === 'ar'
                ? 'حصن أذكار الصباح والمساء والصلوات مع مسبحة تفاعلية.'
                : 'Read morning and evening remembrances with an interactive counter.'}
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
  worshipEmoji: {
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
