import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Share } from 'react-native';
import { questionBank, type Question } from '../data/questions';
import { useAuth } from '../contexts/AuthContext';
import { saveUserScore, getCurrentUserProfile } from '../firebase/auth';
import { Colors } from '../config/colors';
import { useInterstitialAd } from '../config/adsService';
import { AdMobConfig } from '../config/ads';
import AdBanner from '../components/AdBanner';

const tiers = ['Beginner', 'Intermediate', 'Advanced', 'Hero'] as const;
type TierType = (typeof tiers)[number];

const tierTranslations: Record<TierType, string> = {
  Beginner: 'مبتدئ',
  Intermediate: 'متوسط',
  Advanced: 'متقدم',
  Hero: 'بطل',
};

const categories = ['الكل', 'القرآن', 'السنة', 'الفقه', 'السيرة', 'العقيدة', 'التاريخ'] as const;
type CategoryType = (typeof categories)[number];

const questionLimits = [5, 10, 15, 20] as const;
type LimitType = (typeof questionLimits)[number];

export default function TriviaScreen({ navigation }: any) {
  const { user } = useAuth();
  
  // Game states: 'config' | 'quiz' | 'completed'
  const [gameState, setGameState] = useState<'config' | 'quiz' | 'completed'>('config');
  const [pendingScore, setPendingScore] = useState<number | null>(null);

  // Interstitial Ad setup
  const { isLoaded, isClosed, load, show } = useInterstitialAd(AdMobConfig.interstitialAdUnitID, {
    requestNonPersonalizedAdsOnly: true,
  });

  // Load interstitial on mount
  useEffect(() => {
    load();
  }, [load]);

  // Reload interstitial when closed
  useEffect(() => {
    if (isClosed) {
      load();
    }
  }, [isClosed, load]);

  const completeQuiz = async (finalScore: number) => {
    setGameState('completed');
    if (user?.uid) {
      try {
        const profile = await getCurrentUserProfile(user.uid);
        const currentScore = profile?.score ?? 0;
        await saveUserScore(user.uid, currentScore + finalScore);
      } catch (err) {
        console.error(err);
      }
    }
  };

  useEffect(() => {
    if (isClosed && pendingScore !== null) {
      completeQuiz(pendingScore);
      setPendingScore(null);
    }
  }, [isClosed, pendingScore]);

  // Config States
  const [selectedTier, setSelectedTier] = useState<TierType>('Beginner');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('الكل');
  const [questionLimit, setQuestionLimit] = useState<LimitType>(10);

  // Play States
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [answered, setAnswered] = useState(false);
  const [streak, setStreak] = useState(0);
  const [explanation, setExplanation] = useState('');

  const currentQuestion = questions[currentIndex];

  // Dynamic point calculation
  const getPointsPerQuestion = () => {
    let base = 5;
    if (selectedTier === 'Intermediate') base = 10;
    if (selectedTier === 'Advanced') base = 15;
    if (selectedTier === 'Hero') base = 25;

    // Focused topic gives 1.2x points multiplier
    const multiplier = selectedCategory === 'الكل' ? 1.0 : 1.2;
    return Math.round(base * multiplier);
  };

  const startChallenge = () => {
    // Build question pool based on filters
    let pool = questionBank.filter((item) => item.tier === selectedTier);
    
    if (selectedCategory !== 'الكل') {
      pool = pool.filter((item) => item.category === selectedCategory);
    }

    if (pool.length === 0) {
      Alert.alert('تخصيص فارغ', 'عذراً، لا توجد أسئلة متوفرة حالياً تطابق هذا التصنيف ومستوى الصعوبة. جرب تصنيفاً آخر.');
      return;
    }

    // Shuffle and slice
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const selectedSet = shuffled.slice(0, Math.min(questionLimit, shuffled.length));

    if (selectedSet.length < questionLimit) {
      Alert.alert(
        'أسئلة محدودة',
        `تتوفر فقط ${selectedSet.length} أسئلة في هذا التصنيف حالياً. سنبدأ التحدي بالأسئلة المتوفرة.`
      );
    }

    setQuestions(selectedSet);
    setCurrentIndex(0);
    setScore(0);
    setSelectedAnswer('');
    setFeedback('');
    setAnswered(false);
    setStreak(0);
    setExplanation('');
    setGameState('quiz');
  };

  const handleSubmit = async () => {
    if (!currentQuestion) return;

    if (!selectedAnswer.trim()) {
      Alert.alert('تنبيه', 'الرجاء اختيار إجابة واحدة للاستمرار.');
      return;
    }

    const isCorrect = selectedAnswer === currentQuestion.answer;
    const nextStreak = isCorrect ? streak + 1 : 0;
    
    // Dynamic point evaluation + streak bonus (+2 bonus per streak step, capped at +8)
    const pointsPerQuestion = getPointsPerQuestion();
    const streakBonus = isCorrect ? Math.min(8, nextStreak * 2) : 0;
    const earnedPoints = isCorrect ? (pointsPerQuestion + streakBonus) : 0;
    const nextScore = score + earnedPoints;

    setScore(nextScore);
    setStreak(nextStreak);
    setFeedback(isCorrect ? 'إجابة صحيحة! أحسنت 🌟' : `إجابة غير صحيحة. الإجابة الصحيحة هي:`);
    setExplanation(currentQuestion.explanation);
    setAnswered(true);

    if (currentIndex + 1 >= questions.length) {
      setPendingScore(nextScore);
      setTimeout(() => {
        if (isLoaded) {
          show();
        } else {
          completeQuiz(nextScore);
        }
      }, 1000);
    }
  };

  const handleNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < questions.length) {
      setCurrentIndex(nextIndex);
      setSelectedAnswer('');
      setFeedback('');
      setAnswered(false);
      setExplanation('');
    }
  };

  const handleShareChallenge = async () => {
    try {
      const message = `🏆 لقد أتممت تحدي *بطل مسلم* بنجاح!
      
📖 نوع التحدي: تفوق في قسم *${selectedCategory === 'الكل' ? 'المعرفة العامة' : selectedCategory}*
💪 مستوى الصعوبة: *${tierTranslations[selectedTier]}*
📊 عدد الأسئلة: *${questions.length} أسئلة*
⭐ النقاط المحرزة: *${score} نقطة إيمانية*

هل تجرؤ على منافستي وتحقيق لقب "بطل مسلم"؟ حمّل التطبيق الآن وابدأ التحدي! 🚀`;

      await Share.share({
        message,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleBackToConfig = () => {
    setGameState('config');
  };

  return (
    <ScrollView style={styles.outerContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        
        {/* GAME STATE 1: Config Dashboard */}
        {gameState === 'config' && (
          <View style={styles.configCard}>
            <Text style={styles.configHeaderTitle}>تخصيص تحدي المعرفة</Text>
            <Text style={styles.configHeaderSub}>اختر مستوى الصعوبة، التصنيف، وعدد الأسئلة لبدء رحلة التحدي</Text>

            {/* 1. Difficulty Level */}
            <View style={styles.configSection}>
              <Text style={styles.configSectionTitle}>💪 مستوى الصعوبة:</Text>
              <View style={styles.configRow}>
                {tiers.map((tier) => (
                  <TouchableOpacity
                    key={tier}
                    style={[styles.configBtn, selectedTier === tier && styles.configBtnActive]}
                    onPress={() => setSelectedTier(tier)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.configBtnText, selectedTier === tier && styles.configBtnTextActive]}>
                      {tierTranslations[tier]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 2. Category Selector */}
            <View style={styles.configSection}>
              <Text style={styles.configSectionTitle}>📖 تصنيف الأسئلة:</Text>
              <View style={styles.categoryGrid}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[styles.categoryBtn, selectedCategory === category && styles.categoryBtnActive]}
                    onPress={() => setSelectedCategory(category)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.categoryBtnText, selectedCategory === category && styles.categoryBtnTextActive]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 3. Question Limits */}
            <View style={styles.configSection}>
              <Text style={styles.configSectionTitle}>📊 عدد الأسئلة:</Text>
              <View style={styles.configRow}>
                {questionLimits.map((limit) => (
                  <TouchableOpacity
                    key={limit}
                    style={[styles.configBtn, questionLimit === limit && styles.configBtnActive]}
                    onPress={() => setQuestionLimit(limit)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.configBtnText, questionLimit === limit && styles.configBtnTextActive]}>
                      {limit} أسئلة
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Live Points Preview Card */}
            <View style={styles.pointsPreviewCard}>
              <Text style={styles.previewTitle}>النقاط التقديرية للتحدي</Text>
              <View style={styles.previewStatsRow}>
                <View style={styles.previewStatCol}>
                  <Text style={styles.previewVal}>+{getPointsPerQuestion()} ن</Text>
                  <Text style={styles.previewLbl}>لكل إجابة صحيحة</Text>
                </View>
                <View style={styles.previewDivider} />
                <View style={styles.previewStatCol}>
                  <Text style={styles.previewVal}>+{getPointsPerQuestion() * questionLimit} ن</Text>
                  <Text style={styles.previewLbl}>النقاط القصوى</Text>
                </View>
              </View>
            </View>

            {/* Play Button */}
            <TouchableOpacity style={styles.startButton} onPress={startChallenge} activeOpacity={0.85}>
              <Text style={styles.startButtonText}>ابدأ التحدي الآن 🚀</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* GAME STATE 2: Quiz Question */}
        {gameState === 'quiz' && currentQuestion && (
          <View style={styles.quizCard}>
            {/* Header info */}
            <View style={styles.quizHeader}>
              <View style={styles.metaRow}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>📖 {currentQuestion.category}</Text>
                </View>
                <Text style={styles.progressText}>سؤال {currentIndex + 1} من {questions.length}</Text>
              </View>
              
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${((currentIndex + 1) / questions.length) * 100}%` }]} />
              </View>
            </View>

            {/* Question Text */}
            <Text style={styles.questionText}>{currentQuestion.question}</Text>

            {/* Options */}
            <View style={styles.optionsContainer}>
              {currentQuestion.options.map((option) => {
                const isSelected = selectedAnswer === option;
                const isCorrectAnswer = option === currentQuestion.answer;
                
                let btnStyle: any = styles.optionButton;
                let textStyle: any = styles.optionText;

                if (answered) {
                  if (isCorrectAnswer) {
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

            {/* Feedback details */}
            {answered && (
              <View style={[
                styles.feedbackBox,
                selectedAnswer === currentQuestion.answer ? styles.feedbackBoxCorrect : styles.feedbackBoxIncorrect
              ]}>
                <Text style={styles.feedbackTitle}>{feedback}</Text>
                {selectedAnswer !== currentQuestion.answer && (
                  <Text style={styles.correctAnswerVal}>{currentQuestion.answer}</Text>
                )}
                {explanation ? <Text style={styles.explanationText}>{explanation}</Text> : null}
              </View>
            )}

            {/* Action buttons */}
            <View style={styles.actionRow}>
              {answered ? (
                <TouchableOpacity style={styles.primaryButton} onPress={handleNext} activeOpacity={0.85}>
                  <Text style={styles.primaryButtonText}>
                    {currentIndex + 1 < questions.length ? 'السؤال التالي ➔' : 'إنهاء الجولة وعرض النتائج'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit} activeOpacity={0.85}>
                  <Text style={styles.primaryButtonText}>تأكيد الإجابة ✓</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Score & Streak display */}
            <View style={styles.scoreRow}>
              <Text style={styles.scoreText}>🔥 المتتالية: {streak}</Text>
              <Text style={styles.scoreText}>🏆 النقاط: {score}</Text>
            </View>
          </View>
        )}

        {/* GAME STATE 3: Completed Score Card */}
        {gameState === 'completed' && (
          <View style={styles.resultCard}>
            <Text style={styles.resultEmoji}>🎉</Text>
            <Text style={styles.resultTitle}>انتهت الجولة بنجاح!</Text>
            <Text style={styles.resultSubtitle}>
              المستوى: {tierTranslations[selectedTier]} | القسم: {selectedCategory === 'الكل' ? 'شامل' : selectedCategory}
            </Text>
            
            <View style={styles.resultStatsRow}>
              <View style={styles.resultStatBox}>
                <Text style={styles.resultStatVal}>{score}</Text>
                <Text style={styles.resultStatLbl}>النقاط المكتسبة</Text>
              </View>
              <View style={styles.resultStatBox}>
                <Text style={styles.resultStatVal}>{streak}</Text>
                <Text style={styles.resultStatLbl}>أعلى متتالية</Text>
              </View>
            </View>

            {/* Share on WhatsApp Button */}
            <TouchableOpacity style={styles.whatsappButton} onPress={handleShareChallenge} activeOpacity={0.85}>
              <Text style={styles.whatsappButtonText}>شارك النتيجة على واتساب 💬</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.primaryButton} onPress={handleBackToConfig} activeOpacity={0.85}>
              <Text style={styles.primaryButtonText}>تحدي جديد 🔄</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Home')} activeOpacity={0.85}>
              <Text style={styles.secondaryButtonText}>العودة للرئيسية</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      <AdBanner />
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
  configCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  configHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 6,
  },
  configHeaderSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  configSection: {
    marginBottom: 18,
  },
  configSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'right',
    marginBottom: 10,
  },
  configRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: 8,
  },
  configBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  configBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  configBtnText: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  configBtnTextActive: {
    color: Colors.surface,
  },
  categoryGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  categoryBtn: {
    width: '31%',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    marginBottom: 2,
  },
  categoryBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryBtnText: {
    fontSize: 11,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  categoryBtnTextActive: {
    color: Colors.surface,
  },
  pointsPreviewCard: {
    backgroundColor: '#FAF8F0',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F0EAD6',
    marginBottom: 20,
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.accent,
    marginBottom: 10,
  },
  previewStatsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  previewStatCol: {
    flex: 1,
    alignItems: 'center',
  },
  previewVal: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.primary,
    marginBottom: 2,
  },
  previewLbl: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  previewDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E2DDCB',
  },
  startButton: {
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  startButtonText: {
    color: Colors.surface,
    fontWeight: '800',
    fontSize: 15,
  },
  quizCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  quizHeader: {
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  progressText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: Colors.background,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  questionText: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'right',
    marginBottom: 20,
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
    paddingVertical: 14,
    paddingHorizontal: 18,
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
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
    color: Colors.textPrimary,
  },
  correctAnswerVal: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.error,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 6,
  },
  explanationText: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginTop: 6,
  },
  actionRow: {
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    width: '100%',
  },
  primaryButtonText: {
    color: Colors.surface,
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    width: '100%',
  },
  secondaryButtonText: {
    color: Colors.textSecondary,
    fontWeight: '700',
    fontSize: 14,
  },
  scoreRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  resultCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  resultEmoji: {
    fontSize: 60,
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 6,
  },
  resultSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  resultStatsRow: {
    flexDirection: 'row-reverse',
    gap: 16,
    marginBottom: 20,
    width: '100%',
  },
  resultStatBox: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resultStatVal: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 4,
  },
  resultStatLbl: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
    borderRadius: 14,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  whatsappButtonText: {
    color: Colors.surface,
    fontWeight: '800',
    fontSize: 15,
  },
});