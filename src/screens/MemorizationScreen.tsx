import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { memorizationExercises, type MemorizationExercise } from '../data/memorization';
import { useAuth } from '../contexts/AuthContext';
import { saveUserScore, getCurrentUserProfile } from '../firebase/auth';
import { Colors } from '../config/colors';

export default function MemorizationScreen({ navigation }: any) {
  const { user } = useAuth();
  const [exercises] = useState<MemorizationExercise[]>(() => [...memorizationExercises].sort(() => Math.random() - 0.5));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [answered, setAnswered] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [scoreEarned, setScoreEarned] = useState(0);
  const [completed, setCompleted] = useState(false);

  const currentExercise = exercises[currentIndex];

  const handleSubmit = async () => {
    if (!currentExercise) return;

    if (!selectedAnswer.trim()) {
      Alert.alert('تنبيه', 'الرجاء اختيار كلمة واحدة لتكملة الآية.');
      return;
    }

    const isCorrect = selectedAnswer === currentExercise.missingWord;
    setAnswered(true);

    if (isCorrect) {
      setFeedback('ما شاء الله! إجابة صحيحة وحفظ متقن 🌟');
      const earned = scoreEarned + 20;
      setScoreEarned(earned);

      // Sync score
      if (user?.uid) {
        try {
          const profile = await getCurrentUserProfile(user.uid);
          const currentScore = profile?.score ?? 0;
          await saveUserScore(user.uid, currentScore + 20);
        } catch (err) {
          console.error(err);
        }
      }
    } else {
      setFeedback('إجابة غير صحيحة. الكلمة الصحيحة لتكملة الآية هي:');
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < exercises.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer('');
      setAnswered(false);
      setFeedback('');
    } else {
      setCompleted(true);
    }
  };

  if (exercises.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyState}>لا توجد تمارين حفظ متوفرة حالياً.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.outerContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>تحدي حفظ الآيات</Text>
          <Text style={styles.subtitle}>أكمل الفراغ بالكلمة القرآنية الصحيحة لاختبار دقة حفظك للقرآن الكريم</Text>
        </View>

        {completed ? (
          <View style={styles.resultCard}>
            <Text style={styles.resultEmoji}>🧠</Text>
            <Text style={styles.resultTitle}>أنهيت تحدي الحفظ!</Text>
            <Text style={styles.resultSubtitle}>حفظ مبارك لآيات كتاب الله عز وجل</Text>
            
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{scoreEarned}</Text>
              <Text style={styles.statLbl}>النقاط المكتسبة</Text>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.goBack()} activeOpacity={0.85}>
              <Text style={styles.primaryButtonText}>العودة لقائمة التحديات</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.quizCard}>
            {/* Surah title badge */}
            <View style={styles.metaRow}>
              <View style={styles.surahBadge}>
                <Text style={styles.surahBadgeText}>🕌 {currentExercise.surah}</Text>
              </View>
              <Text style={styles.progressText}>تمرين {currentIndex + 1} من {exercises.length}</Text>
            </View>

            {/* Exercise display */}
            <View style={styles.verseBox}>
              <Text style={styles.verseLabel}>أكمل الآية الكريمة التالية:</Text>
              <View style={styles.verseLine}>
                <Text style={styles.verseText}>{currentExercise.verseBefore}</Text>
                <View style={[styles.blankContainer, answered && (selectedAnswer === currentExercise.missingWord ? styles.blankCorrect : styles.blankIncorrect)]}>
                  <Text style={styles.blankText}>
                    {answered ? selectedAnswer : (selectedAnswer ? selectedAnswer : '.....')}
                  </Text>
                </View>
                <Text style={styles.verseText}>{currentExercise.verseAfter}</Text>
              </View>
            </View>

            {/* Options grid */}
            <Text style={styles.optionHint}>اختر الكلمة الصحيحة:</Text>
            <View style={styles.optionsContainer}>
              {currentExercise.options.map((option) => {
                const isSelected = selectedAnswer === option;
                const isCorrect = option === currentExercise.missingWord;

                let btnStyle: any = styles.optionButton;
                let textStyle: any = styles.optionText;

                if (answered) {
                  if (isCorrect) {
                    btnStyle = [styles.optionButton, styles.optionButtonCorrect];
                    textStyle = [styles.optionText, styles.optionTextWhite];
                  } else if (isSelected) {
                    btnStyle = [styles.optionButton, styles.optionButtonIncorrect];
                    textStyle = [styles.optionText, styles.optionTextWhite];
                  } else {
                    btnStyle = [styles.optionButton, styles.optionButtonDisabled];
                    textStyle = [styles.optionText, styles.optionTextMuted];
                  }
                } else if (isSelected) {
                  btnStyle = [styles.optionButton, styles.optionButtonSelected];
                  textStyle = [styles.optionText, styles.optionTextSelected];
                }

                return (
                  <TouchableOpacity
                    key={option}
                    style={btnStyle}
                    onPress={() => !answered && setSelectedAnswer(option)}
                    disabled={answered}
                    activeOpacity={0.8}
                  >
                    <Text style={textStyle}>{option}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Feedback card */}
            {answered && (
              <View style={[
                styles.feedbackBox,
                selectedAnswer === currentExercise.missingWord ? styles.feedbackBoxCorrect : styles.feedbackBoxIncorrect
              ]}>
                <Text style={styles.feedbackTitle}>{feedback}</Text>
                {selectedAnswer !== currentExercise.missingWord && (
                  <Text style={styles.correctVal}>{currentExercise.missingWord}</Text>
                )}
                <Text style={styles.fullVerseText}>{currentExercise.fullVerse}</Text>
              </View>
            )}

            {/* Submit / Next Button */}
            {answered ? (
              <TouchableOpacity style={styles.primaryButton} onPress={handleNext} activeOpacity={0.85}>
                <Text style={styles.primaryButtonText}>
                  {currentIndex + 1 < exercises.length ? 'التمرين التالي ➔' : 'إنهاء التحدي ✓'}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit} activeOpacity={0.85}>
                <Text style={styles.primaryButtonText}>تأكيد الإجابة ✓</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  container: {
    flex: 1,
    padding: 20,
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
  resultCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resultEmoji: {
    fontSize: 60,
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 6,
  },
  resultSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  statBox: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
    width: '100%',
  },
  statVal: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLbl: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  quizCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metaRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  surahBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  surahBadgeText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  progressText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  verseBox: {
    backgroundColor: Colors.background,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
    alignItems: 'center',
  },
  verseLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '700',
    marginBottom: 12,
  },
  verseLine: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  verseText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  blankContainer: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 70,
    alignItems: 'center',
  },
  blankCorrect: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  blankIncorrect: {
    backgroundColor: Colors.error,
    borderColor: Colors.error,
  },
  blankText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
  },
  optionHint: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 10,
    textAlign: 'right',
  },
  optionsContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    width: '48%',
    alignItems: 'center',
  },
  optionButtonSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  optionButtonCorrect: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  optionButtonIncorrect: {
    backgroundColor: Colors.error,
    borderColor: Colors.error,
  },
  optionButtonDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E2E8F0',
  },
  optionText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  optionTextSelected: {
    color: Colors.primary,
  },
  optionTextWhite: {
    color: Colors.surface,
  },
  optionTextMuted: {
    color: '#A0AEC0',
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Colors.surface,
    fontWeight: '700',
    fontSize: 15,
  },
  feedbackBox: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  feedbackBoxCorrect: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  feedbackBoxIncorrect: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  feedbackTitle: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'right',
    color: Colors.textPrimary,
  },
  correctVal: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.error,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 6,
  },
  fullVerseText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
    color: Colors.primary,
    textAlign: 'center',
    marginTop: 6,
  },
  emptyState: {
    textAlign: 'center',
    color: Colors.textSecondary,
    marginTop: 40,
  },
});
