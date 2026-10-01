import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { readingPassages, type ReadingPassage } from '../data/reading';
import { useAuth } from '../contexts/AuthContext';
import { saveUserScore, getCurrentUserProfile, addSirajPoints } from '../firebase/auth';
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
  const [profile, setProfile] = useState<any>(null);

  const currentPassage = passages[currentIndex];

  const loadProfile = async () => {
    if (user?.uid) {
      try {
        const data = await getCurrentUserProfile(user.uid);
        setProfile(data);
      } catch (err) {
        console.error(err);
      }
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user?.uid]);

  const handleSubmit = async () => {
    if (!currentPassage) return;

    if (!selectedAnswer.trim()) {
      Alert.alert('تنبيه', 'الرجاء اختيار إجابة واحدة للاستمرار.');
      return;
    }

    const isCorrect = selectedAnswer === currentPassage.answer;
    setAnswered(true);

    if (isCorrect) {
      setFeedback('إجابة صحيحة! أحسنت وبوركت قراءتك 🌟 (+١٠ 🕯️ سراج)');
      const earned = scoreEarned + 10;
      setScoreEarned(earned);

      // Sync user profile score and Siraj points
      if (user?.uid) {
        try {
          const updated = await addSirajPoints(user.uid, 10);
          setProfile(updated);
          const currentScore = updated.score ?? 0;
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
    <View style={styles.outerContainer}>
      {/* Top Header Bar with Icon-Only Back Button and Siraj Badge on Left */}
      <View style={styles.headerCustom}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 20, color: Colors.primary }}>➔</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>تحدي القراءة وفهم المقروء</Text>

        <View style={styles.walletBadge}>
          <Text style={{ fontSize: 15, marginRight: 4 }}>🕯️</Text>
          <Text style={styles.walletText}>
            {profile?.sirajBalance ?? 50}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.subtitle}>اقرأ النصوص بدقة وتدبر لتجيب على الأسئلة وتزيد أنوار السراج 🕯️</Text>
          </View>

          {completed ? (
            <View style={styles.resultCard}>
              <Text style={styles.resultEmoji}>📚</Text>
              <Text style={styles.resultTitle}>أنهيت القراءة بنجاح!</Text>
              <Text style={styles.resultSubtitle}>قراءة هادفة تغذي العقل والروح وتزيد حصيلتك من أنوار السراج</Text>
              
              <View style={styles.statBox}>
                <Text style={styles.statVal}>+{scoreEarned} 🕯️</Text>
                <Text style={styles.statLbl}>أنوار السراج المكتسبة</Text>
              </View>

              <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.goBack()} activeOpacity={0.85}>
                <Text style={styles.primaryButtonText}>➔</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerCustom: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 55,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'center',
  },
  walletBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
  },
  walletText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
    fontFamily: 'IBMPlexSansArabic-Bold',
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
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 12.5,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    fontFamily: 'IBMPlexSansArabic-Regular',
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
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  resultSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'IBMPlexSansArabic-Regular',
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
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  statLbl: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
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
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  passageText: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textPrimary,
    textAlign: 'right',
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  questionText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'right',
    marginBottom: 16,
    fontFamily: 'IBMPlexSansArabic-Bold',
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
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  optionTextSelected: {
    color: Colors.primary,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  optionTextWhite: {
    color: Colors.surface,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
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
    fontFamily: 'IBMPlexSansArabic-Bold',
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
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  correctVal: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.error,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 6,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  explanationText: {
    fontSize: 12,
    lineHeight: 18,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  emptyState: {
    textAlign: 'center',
    color: Colors.textSecondary,
    marginTop: 40,
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
});
