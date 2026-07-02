import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { challenges, type Challenge } from '../data/challenges';
import { Colors } from '../config/colors';

export default function ChallengePickerScreen({ navigation }: any) {
  const handleSelectChallenge = (challenge: Challenge) => {
    navigation.navigate(challenge.route);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ابدأ تحدياً جديداً</Text>
        <Text style={styles.subtitle}>اختر نوع التحدي المناسب لرحلتك المعرفية والإيمانية اليوم</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {challenges.map((challenge) => (
            <TouchableOpacity
              key={challenge.id}
              style={[styles.card, { borderLeftColor: Colors.primary }]}
              onPress={() => handleSelectChallenge(challenge)}
              activeOpacity={0.85}
            >
              <View style={[styles.emojiContainer, { backgroundColor: challenge.color }]}>
                <Text style={styles.emoji}>{challenge.emoji}</Text>
              </View>
              
              <View style={styles.info}>
                <View style={styles.row}>
                  <View style={[
                    styles.difficultyBadge,
                    challenge.difficulty === 'سهل' && styles.bgEasy,
                    challenge.difficulty === 'متوسط' && styles.bgMedium,
                    challenge.difficulty === 'متقدم' && styles.bgHard,
                    challenge.difficulty === 'بطل' && styles.bgHero,
                  ]}>
                    <Text style={[
                      styles.difficultyText,
                      challenge.difficulty === 'سهل' && styles.txtEasy,
                      challenge.difficulty === 'متوسط' && styles.txtMedium,
                      challenge.difficulty === 'متقدم' && styles.txtHard,
                      challenge.difficulty === 'بطل' && styles.txtHero,
                    ]}>
                      {challenge.difficulty}
                    </Text>
                  </View>
                  <Text style={styles.cardTitle}>{challenge.title}</Text>
                </View>
                
                <Text style={styles.cardDesc}>{challenge.description}</Text>
                
                <View style={styles.metaRow}>
                  <Text style={styles.pointsText}>🏆 +{challenge.points} نقطة</Text>
                  <Text style={styles.actionText}>ابدأ التحدي ➔</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  grid: {
    gap: 14,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 5,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  emojiContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  emoji: {
    fontSize: 28,
  },
  info: {
    flex: 1,
  },
  row: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'right',
  },
  cardDesc: {
    fontSize: 12,
    lineHeight: 17,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.accent,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '800',
  },
  bgEasy: {
    backgroundColor: '#ECFDF5',
  },
  txtEasy: {
    color: '#059669',
  },
  bgMedium: {
    backgroundColor: '#FEF3C7',
  },
  txtMedium: {
    color: '#D97706',
  },
  bgHard: {
    backgroundColor: '#FFF5F5',
  },
  txtHard: {
    color: '#E53E3E',
  },
  bgHero: {
    backgroundColor: '#F5F3FF',
  },
  txtHero: {
    color: '#7C3AED',
  },
});
