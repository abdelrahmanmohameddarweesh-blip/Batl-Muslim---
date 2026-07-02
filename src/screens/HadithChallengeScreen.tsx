import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { hadiths, type HadithQuestion } from '../data/hadith';
import { useAuth } from '../contexts/AuthContext';
import { saveUserScore, getCurrentUserProfile } from '../firebase/auth';
import { Colors } from '../config/colors';

export default function HadithChallengeScreen({ navigation }: any) {
  const { user } = useAuth();
  const [questions] = useState<HadithQuestion[]>(() => [...hadiths].sort(() => Math.random() - 0.5));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [answered, setAnswered] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [scoreEarned, setScoreEarned] = useState(0);
  const [completed, setCompleted] = useState(false);

  const currentQuestion = questions[currentIndex];

  const handleSubmit = async () => {
    if (!currentQuestion) return;

    if (!selectedAnswer.trim()) {
      Alert.alert('تنبيه', 'الرجاء اختيار إجابة واحدة للاستمرار.');
      return;
    }

    const isCorrect = selectedAnswer === currentQuestion.answer;
    setAnswered(true);

    if (isCorrect) {
      setFeedback('إجابة صحيحة! بورك علمك بالحديث الشريف 🌟');
      const earned = scoreEarned + 15;
      setScoreEarned(earned);

      // Sync user profile score
      if (user?.uid) {
        try {
          const profile = await getCurrentUserProfile(user.uid);
          const currentScore = profile?.score ?? 0;
          await saveUserScore(user.uid, currentScore + 15);
        } catch (err) {
          console.error(err);
        }
      }
    } else {
      setFeedback(`إجابة غير صحيحة. الإجابة الصحيحة هي:`);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer('');
      setAnswered(false);
      setFeedback('');
    } else {
      setCompleted(true);
    }
  };

  if (questions.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyState}>لا توجد أسئلة حديث متوفرة حالياً.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.outerContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>تحدي الحديث الشريف</Text>
          <Text style={styles.subtitle}>تعلّم الأحاديث النبوية المأثورة وميّز صحتها ورواتها لزيادة نقاط معرفتك</Text>
        </View>

        {completed ? (
          <View style={styles.resultCard}>
            <Text style={styles.resultEmoji}>💬</Text>
            <Text style={styles.resultTitle}>أنهيت تحدي الحديث!</Text>
            <Text style={styles.resultSubtitle}>أحسنت تعلماً وسيراً على خطى السنة النبوية</Text>
            
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
            {/* Authenticity Indicator Badge */}
            <View style={styles.metaRow}>
              <View style={styles.authBadge}>
                <Text style={styles.authBadgeText}>درجة الصحة: {currentQuestion.authenticity}</Text>
              </View>
              <Text style={styles.progressText}>سؤال {currentIndex + 1} من {questions.length}</Text>
            </View>

            {/* Hadith Quote Box */}
            <View style={styles.hadithQuoteBox}>
              <Text style={styles.quoteMark}>«</Text>
              <Text style={styles.hadithQuoteText}>{currentQuestion.hadithText}</Text>
              <Text style={styles.quoteMark}>»</Text>
            </View>

            {/* Question Title */}
            <Text style={styles.questionText}>{currentQuestion.question}</Text>

            {/* Options List */}
            <View style={styles.optionsContainer}>
              {currentQuestion.options.map((option) => {
                const isSelected = selectedAnswer === option;
                const isCorrect = option === currentQuestion.answer;

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

            {/* Feedback Detail */}
            {answered && (
              <View style={[
                styles.feedbackBox,
                selectedAnswer === currentQuestion.answer ? styles.feedbackBoxCorrect : styles.feedbackBoxIncorrect
              ]}>
                <Text style={styles.feedbackTitle}>{feedback}</Text>
                {selectedAnswer !== currentQuestion.answer && (
                  <Text style={styles.correctVal}>{currentQuestion.answer}</Text>
                )}
                <Text style={styles.explanationText}>{currentQuestion.explanation}</Text>
              </View>
            )}

            {/* Primary Action Button */}
            {answered ? (
              <TouchableOpacity style={styles.primaryButton} onPress={handleNext} activeOpacity={0.85}>
                <Text style={styles.primaryButtonText}>
                  {currentIndex + 1 < questions.length ? 'السؤال التالي ➔' : 'إنهاء التحدي ✓'}
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
  authBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  authBadgeText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  progressText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  hadithQuoteBox: {
    backgroundColor: Colors.background,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 18,
    alignItems: 'center',
  },
  quoteMark: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.accent,
    lineHeight: 20,
  },
  hadithQuoteText: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '700',
    color: Colors.primary,
    textAlign: 'center',
    marginVertical: 4,
  },
  questionText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'right',
    marginBottom: 16,
  },
  optionsContainer: {
    gap: 10,
    marginBottom: 18,
  },
  optionButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
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
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  optionTextSelected: {
    color: Colors.primary,
    fontWeight: '700',
  },
  optionTextWhite: {
    color: Colors.surface,
    fontWeight: '700',
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
    marginBottom: 18,
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
  explanationText: {
    fontSize: 12,
    lineHeight: 18,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  emptyState: {
    textAlign: 'center',
    color: Colors.textSecondary,
    marginTop: 40,
  },
});
