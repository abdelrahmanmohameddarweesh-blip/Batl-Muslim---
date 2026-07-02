import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { readingPassages, type ReadingPassage } from '../data/reading';
import { useAuth } from '../contexts/AuthContext';
import { saveUserScore, getCurrentUserProfile } from '../firebase/auth';
import { Colors } from '../config/colors';

export default function ReadingChallengeScreen({ navigation }: any) {
  const { user } = useAuth();
  const [passages] = useState<ReadingPassage[]>(() => [...readingPassages].sort(() => Math.random() - 0.5));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [answered, setAnswered] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [scoreEarned, setScoreEarned] = useState(0);
  const [completed, setCompleted] = useState(false);

  const currentPassage = passages[currentIndex];

  const handleSubmit = async () => {
    if (!currentPassage) return;

    if (!selectedAnswer.trim()) {
      Alert.alert('تنبيه', 'الرجاء اختيار إجابة واحدة للاستمرار.');
      return;
    }

    const isCorrect = selectedAnswer === currentPassage.answer;
    setAnswered(true);

    if (isCorrect) {
      setFeedback('إجابة صحيحة! أحسنت وبوركت قراءتك 🌟');
      const earned = scoreEarned + 10;
      setScoreEarned(earned);

      // Sync user profile score
      if (user?.uid) {
        try {
          const profile = await getCurrentUserProfile(user.uid);
          const currentScore = profile?.score ?? 0;
          await saveUserScore(user.uid, currentScore + 10);
        } catch (err) {
          console.error(err);
        }
      }
    } else {
      setFeedback(`إجابة غير دقيقة. الإجابة الأصح هي:`);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < passages.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer('');
      setAnswered(false);
      setFeedback('');
    } else {
      setCompleted(true);
    }
  };

  if (passages.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyState}>لا توجد نصوص متوفرة حالياً.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.outerContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>تحدي القراءة والفهم</Text>
          <Text style={styles.subtitle}>اقرأ النصوص بدقة وتدبر لتجيب على الأسئلة وتزيد معرفتك</Text>
        </View>

        {completed ? (
          <View style={styles.resultCard}>
            <Text style={styles.resultEmoji}>📚</Text>
            <Text style={styles.resultTitle}>أنهيت القراءة بنجاح!</Text>
            <Text style={styles.resultSubtitle}>قراءة هادفة تغذي العقل والروح</Text>
            
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
            {/* Passage Text */}
            <View style={styles.passageContainer}>
              <Text style={styles.passageTitle}>📖 {currentPassage.title}</Text>
              <Text style={styles.passageText}>{currentPassage.passage}</Text>
            </View>

            {/* Question Text */}
            <Text style={styles.questionText}>{currentPassage.question}</Text>

            {/* Options */}
            <View style={styles.optionsContainer}>
              {currentPassage.options.map((option) => {
                const isSelected = selectedAnswer === option;
                const isCorrect = option === currentPassage.answer;

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

            {/* Feedback block */}
            {answered && (
              <View style={[
                styles.feedbackBox,
                selectedAnswer === currentPassage.answer ? styles.feedbackBoxCorrect : styles.feedbackBoxIncorrect
              ]}>
                <Text style={styles.feedbackTitle}>{feedback}</Text>
                {selectedAnswer !== currentPassage.answer && (
                  <Text style={styles.correctVal}>{currentPassage.answer}</Text>
                )}
                <Text style={styles.explanationText}>{currentPassage.explanation}</Text>
              </View>
            )}

            {/* Actions */}
            {answered ? (
              <TouchableOpacity style={styles.primaryButton} onPress={handleNext} activeOpacity={0.85}>
                <Text style={styles.primaryButtonText}>
                  {currentIndex + 1 < passages.length ? 'النص التالي ➔' : 'إنهاء التحدي ✓'}
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
  passageContainer: {
    backgroundColor: Colors.background,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 18,
  },
  passageTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primary,
    textAlign: 'right',
    marginBottom: 8,
  },
  passageText: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textPrimary,
    textAlign: 'right',
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
