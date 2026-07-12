import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Circle, Defs, Pattern, Rect } from 'react-native-svg';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

// Gold repeating background pattern
function ArabesqueBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern id="arabesque" width={100} height={100} patternUnits="userSpaceOnUse">
            <Path
              d="M 50 15 L 75 50 L 50 85 L 25 50 Z"
              stroke="#D4AF37"
              strokeWidth={0.5}
              opacity={0.12}
              fill="none"
            />
            <Path
              d="M 50 0 L 50 100 M 0 50 L 100 50 M 0 0 L 100 100 M 100 0 L 0 100"
              stroke="#D4AF37"
              strokeWidth={0.4}
              opacity={0.08}
              fill="none"
            />
            <Circle cx={50} cy={50} r={6} stroke="#D4AF37" strokeWidth={0.5} opacity={0.12} fill="none" />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#arabesque)" />
      </Svg>
    </View>
  );
}

const prayersCatalog = [
  { key: 'fajr', labelAr: 'صلاة الفجر 🌅', labelEn: 'Fajr Prayer 🌅' },
  { key: 'dhuhr', labelAr: 'صلاة الظهر ☀️', labelEn: 'Dhuhr Prayer ☀️' },
  { key: 'asr', labelAr: 'صلاة العصر ⛅', labelEn: 'Asr Prayer ⛅' },
  { key: 'maghrib', labelAr: 'صلاة المغرب 🌇', labelEn: 'Maghrib Prayer 🌇' },
  { key: 'isha', labelAr: 'صلاة العشاء 🌌', labelEn: 'Isha Prayer 🌌' },
];

const deedsCatalog = [
  { key: 'quran', labelAr: 'قراءة الورد القرآني 📖', labelEn: 'Quran Daily Reading 📖' },
  { key: 'adhkar', labelAr: 'أذكار الصباح والمساء 📿', labelEn: 'Morning & Evening Adhkar 📿' },
  { key: 'charity', labelAr: 'الصدقة أو صلة الرحم 🤝', labelEn: 'Charity or Family Bond 🤝' },
  { key: 'tongue', labelAr: 'حفظ اللسان وغض البصر 👁️', labelEn: 'Guarding Tongue & Gaze 👁️' },
  { key: 'knowledge', labelAr: 'طلب العلم النافع 📚', labelEn: 'Seeking Useful Knowledge 📚' },
];

export default function AccountabilityScreen() {
  const { language } = useLanguage();
  const { colors } = useTheme();
  
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

  // State hooks
  const [prayers, setPrayers] = useState<Record<string, 'congregation' | 'individual' | 'missed' | null>>({
    fajr: null,
    dhuhr: null,
    asr: null,
    maghrib: null,
    isha: null,
  });
  const [deeds, setDeeds] = useState<Record<string, boolean>>({
    quran: false,
    adhkar: false,
    charity: false,
    tongue: false,
    knowledge: false,
  });
  const [pledged, setPledged] = useState(false);
  const [weeklyHistory, setWeeklyHistory] = useState<{ dateStr: string, completedCount: number }[]>([]);

  // Load daily logs
  const loadDailyLogs = async () => {
    try {
      const stored = await AsyncStorage.getItem(`accountability-log-${todayStr}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPrayers(parsed.prayers || {});
        setDeeds(parsed.deeds || {});
        setPledged(parsed.pledged || false);
      } else {
        setPrayers({ fajr: null, dhuhr: null, asr: null, maghrib: null, isha: null });
        setDeeds({ quran: false, adhkar: false, charity: false, tongue: false, knowledge: false });
        setPledged(false);
      }

      // Generate history for past 7 days
      const history = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dStr = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
        const log = await AsyncStorage.getItem(`accountability-log-${dStr}`);
        let completed = 0;
        if (log) {
          const parsedLog = JSON.parse(log);
          const pCompleted = Object.values(parsedLog.prayers || {}).filter(val => val === 'congregation' || val === 'individual').length;
          const dCompleted = Object.values(parsedLog.deeds || {}).filter(Boolean).length;
          completed = pCompleted + dCompleted;
        }
        history.push({ dateStr: dStr, completedCount: completed });
      }
      setWeeklyHistory(history);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadDailyLogs();
  }, []);

  // Save changes
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
      
      // Update history scores live
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

  return (
    <ScrollView style={styles.outerContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        <ArabesqueBackground />

        {/* Header Title */}
        <View style={styles.header}>
          <Text style={styles.title}>{language === 'ar' ? 'سجل المحاسبة اليومية' : 'Daily Accountability Journal'}</Text>
          <Text style={styles.subtitle}>
            {language === 'ar'
              ? 'حاسبوا أنفسكم قبل أن تُحاسبوا، وزِنوا أعمالكم قبل أن تُوزن عليكم'
              : 'Hold yourself accountable before you are held accountable'}
          </Text>
        </View>

        {/* PRAYER ACCOUNTABILITY CARD */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{language === 'ar' ? '🕌 سجل الصلوات المفروضة' : '🕌 Daily Prayers Log'}</Text>
          <Text style={styles.cardSubtitle}>
            {language === 'ar'
              ? 'وثق صلواتك الخمس اليومية بأمانة وصدق:'
              : 'Log your 5 daily prayers reflectively and honestly:'}
          </Text>

          <View style={styles.prayersList}>
            {prayersCatalog.map((p) => {
              const currentStatus = prayers[p.key];
              return (
                <View key={p.key} style={styles.prayerRow}>
                  <Text style={styles.prayerName}>{language === 'ar' ? p.labelAr : p.labelEn}</Text>
                  
                  <View style={styles.optionsRow}>
                    <TouchableOpacity
                      style={[styles.optionBtn, currentStatus === 'congregation' && styles.optionCongregationActive]}
                      onPress={() => handleTogglePrayer(p.key, 'congregation')}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.optionBtnText, currentStatus === 'congregation' && styles.textWhite]}>
                        {language === 'ar' ? 'جماعة' : 'Congr.'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.optionBtn, currentStatus === 'individual' && styles.optionIndividualActive]}
                      onPress={() => handleTogglePrayer(p.key, 'individual')}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.optionBtnText, currentStatus === 'individual' && styles.textWhite]}>
                        {language === 'ar' ? 'منفرداً' : 'Indiv.'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.optionBtn, currentStatus === 'missed' && styles.optionMissedActive]}
                      onPress={() => handleTogglePrayer(p.key, 'missed')}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.optionBtnText, currentStatus === 'missed' && styles.textWhite]}>
                        {language === 'ar' ? 'فاتتني' : 'Missed'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* DEEDS ACCOUNTABILITY CARD */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{language === 'ar' ? '📖 سجل محاسبة الطاعات' : '📖 Accountability of Deeds'}</Text>
          <Text style={styles.cardSubtitle}>
            {language === 'ar' ? 'طاعات وسنن يومية تعهد نفسك عليها:' : 'Daily spiritual habits to maintain:'}
          </Text>

          <View style={styles.deedsList}>
            {deedsCatalog.map((d) => {
              const isChecked = deeds[d.key];
              return (
                <TouchableOpacity
                  key={d.key}
                  style={[styles.deedItem, isChecked && styles.deedItemActive]}
                  onPress={() => handleToggleDeed(d.key)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.deedCheck, isChecked && styles.deedCheckActive]}>
                    {isChecked ? '✓' : '○'}
                  </Text>
                  <Text style={[styles.deedLabel, isChecked && styles.deedLabelActive]}>
                    {language === 'ar' ? d.labelAr : d.labelEn}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* TRUTHFULNESS PLEDGE CARD */}
        <TouchableOpacity
          style={[styles.pledgeCard, pledged && styles.pledgeCardActive]}
          onPress={handleTogglePledge}
          activeOpacity={0.9}
        >
          <View style={[styles.pledgeCheckbox, pledged && styles.pledgeCheckboxActive]}>
            {pledged && <Text style={styles.pledgeCheckIcon}>✓</Text>}
          </View>
          <View style={styles.pledgeTextContainer}>
            <Text style={styles.pledgeTitle}>{language === 'ar' ? 'ميثاق الصدق والأمانة 🤝' : 'Pledge of Honesty 🤝'}</Text>
            <Text style={styles.pledgeDesc}>
              {language === 'ar'
                ? 'أشهد الله تعالى أني أقيد عبادتي اليوم بصدق وأمانة تامة دون رياء أو كذب.'
                : 'I testify before Allah that I log my daily deeds truthfully and honestly.'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* WEEKLY HISTORY OVERVIEW */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{language === 'ar' ? '📈 التقرير الأسبوعي الصادق' : '📈 Weekly Accountability Report'}</Text>
          <Text style={styles.cardSubtitle}>
            {language === 'ar'
              ? 'مجموع الطاعات والصلوات المؤداة بصدق طوال الأسبوع (من أصل ١٠ عبادات يومية):'
              : 'Total deeds/prayers completed honestly this week (out of 10 daily actions):'}
          </Text>

          <View style={styles.weeklyGrid}>
            {weeklyHistory.map((h, idx) => {
              const d = new Date(h.dateStr);
              const dayLabel = d.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { weekday: 'short' });
              return (
                <View key={h.dateStr} style={styles.historyCol}>
                  <View style={styles.historyBarBg}>
                    <View style={[styles.historyBarFill, { height: `${(h.completedCount / 10) * 100}%` }]} />
                  </View>
                  <Text style={styles.historyScoreText}>{h.completedCount}/10</Text>
                  <Text style={styles.historyDayText}>{dayLabel}</Text>
                </View>
              );
            })}
          </View>
        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#09120F',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  container: {
    flex: 1,
    padding: 18,
  },
  header: {
    alignItems: 'center',
    marginTop: 50,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FBBF24',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 11.5,
    color: '#86A597',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#0D1A15',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#142E24',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FBBF24',
    textAlign: 'right',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#86A597',
    textAlign: 'right',
    marginBottom: 16,
  },
  prayersList: {
    gap: 12,
  },
  prayerRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#142E2480',
    paddingBottom: 10,
  },
  prayerName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E6F4EE',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#09120F',
    borderWidth: 1,
    borderColor: '#142E24',
  },
  optionBtnText: {
    fontSize: 10,
    color: '#86A597',
    fontWeight: '700',
  },
  optionCongregationActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  optionIndividualActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  optionMissedActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  textWhite: {
    color: '#FFFFFF',
  },
  deedsList: {
    gap: 10,
  },
  deedItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#09120F',
    borderWidth: 1,
    borderColor: '#142E24',
  },
  deedItemActive: {
    borderColor: '#10B98133',
    backgroundColor: '#10B98108',
  },
  deedCheck: {
    fontSize: 16,
    color: '#86A597',
    marginLeft: 12,
  },
  deedCheckActive: {
    color: '#10B981',
    fontWeight: '900',
  },
  deedLabel: {
    fontSize: 12.5,
    color: '#86A597',
    flex: 1,
    textAlign: 'right',
  },
  deedLabelActive: {
    color: '#E6F4EE',
    fontWeight: '700',
  },
  pledgeCard: {
    backgroundColor: 'rgba(251, 191, 36, 0.05)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(251, 191, 36, 0.15)',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 16,
    gap: 14,
  },
  pledgeCardActive: {
    borderColor: 'rgba(251, 191, 36, 0.4)',
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
  },
  pledgeCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#09120F',
  },
  pledgeCheckboxActive: {
    backgroundColor: '#FBBF24',
    borderColor: '#FBBF24',
  },
  pledgeCheckIcon: {
    color: '#09120F',
    fontWeight: '900',
    fontSize: 14,
  },
  pledgeTextContainer: {
    flex: 1,
  },
  pledgeTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FBBF24',
    textAlign: 'right',
    marginBottom: 2,
  },
  pledgeDesc: {
    fontSize: 10.5,
    color: '#86A597',
    textAlign: 'right',
    lineHeight: 14,
  },
  weeklyGrid: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  historyCol: {
    alignItems: 'center',
    flex: 1,
  },
  historyBarBg: {
    width: 14,
    height: 80,
    backgroundColor: '#09120F',
    borderRadius: 7,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    borderWidth: 1,
    borderColor: '#142E24',
    marginBottom: 6,
  },
  historyBarFill: {
    width: '100%',
    backgroundColor: '#10B981',
    borderRadius: 7,
  },
  historyScoreText: {
    fontSize: 9,
    color: '#86A597',
    fontWeight: '700',
    marginBottom: 4,
  },
  historyDayText: {
    fontSize: 9,
    color: '#E6F4EE',
    fontWeight: '900',
  },
});
