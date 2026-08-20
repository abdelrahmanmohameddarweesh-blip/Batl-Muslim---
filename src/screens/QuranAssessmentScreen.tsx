import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Share, Dimensions } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { surahsList } from '../data/surahs';
import { quranAssessmentQuestions, type QuranAssessmentQuestion } from '../data/quranAssessment';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import AdBanner from '../components/AdBanner';

export default function QuranAssessmentScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { language } = useLanguage();

  // Screen State: 'lobby' | 'assessment' | 'results'
  const [screenState, setScreenState] = useState<'lobby' | 'assessment' | 'results'>('lobby');

  // Configuration Choices
  const [filterMode, setFilterMode] = useState<'juz' | 'surah'>('juz');
  const [selectedJuz, setSelectedJuz] = useState<number>(30);
  const [selectedSurah, setSelectedSurah] = useState<string>('الملك');
  const [selectedLimit, setSelectedLimit] = useState<number>(5);

  // Active Assessment States
  const [questions, setQuestions] = useState<QuranAssessmentQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback] = useState('');

  const currentQuestion = questions[currentIndex];

  const handleStart = () => {
    // 1. Initial selection pool matching Mode
    let pool = quranAssessmentQuestions;
    if (filterMode === 'juz') {
      pool = pool.filter((q) => q.juz === selectedJuz);
    } else {
      pool = pool.filter((q) => q.surah === selectedSurah);
    }

    if (pool.length === 0) {
      // Fallback: load nearby Juz/Surah questions if exact matching isn't seeded yet
      const fallbackPool = quranAssessmentQuestions.filter(q => filterMode === 'juz' ? q.juz === 30 : q.surah === 'الملك');
      pool = fallbackPool;
      if (filterMode === 'juz') {
        setSelectedJuz(30);
      } else {
        setSelectedSurah('الملك');
      }
    }

    // 2. Difficulty Scaling based on Limit Selection
    let difficultyFilter = ['easy', 'medium'];
    if (selectedLimit === 10) difficultyFilter = ['medium', 'hard'];
    if (selectedLimit === 15) difficultyFilter = ['hard', 'expert'];
    if (selectedLimit === 20) difficultyFilter = ['hard', 'expert'];

    let filtered = pool.filter(q => difficultyFilter.includes(q.difficulty));
    if (filtered.length < selectedLimit) {
      // Fallback to complete pool if not enough questions match selected difficulty
      filtered = pool;
    }

    // 3. Shuffle and Slice
    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    const selectedSet = shuffled.slice(0, Math.min(selectedLimit, shuffled.length));

    setQuestions(selectedSet);
    setCurrentIndex(0);
    setSelectedAnswer('');
    setAnswered(false);
    setCorrectCount(0);
    setFeedback('');
    setScreenState('assessment');
  };

  const handleSubmit = () => {
    if (!selectedAnswer.trim()) {
      Alert.alert(
        language === 'ar' ? 'تنبيه' : 'Alert',
        language === 'ar' ? 'الرجاء اختيار إجابة واحدة للاستمرار.' : 'Please select an option to submit.'
      );
      return;
    }

    const isCorrect = selectedAnswer === currentQuestion.answer;
    setAnswered(true);

    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
      setFeedback(language === 'ar' ? 'إجابة صحيحة! أحسنت وحفظك مبارك 🌟' : 'Correct answer! Excellent memorization 🌟');
    } else {
      setFeedback(language === 'ar' ? 'إجابة غير صحيحة. الإجابة الصحيحة هي:' : 'Incorrect answer. The correct answer is:');
    }
  };

  const handleNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < questions.length) {
      setCurrentIndex(nextIndex);
      setSelectedAnswer('');
      setAnswered(false);
      setFeedback('');
    } else {
      setScreenState('results');
    }
  };

  const activeTargetLabel = useMemo(() => {
    if (filterMode === 'juz') {
      return language === 'ar' ? `جزء ${selectedJuz}` : `Juz' ${selectedJuz}`;
    }
    return language === 'ar' ? `سورة ${selectedSurah}` : `Surah ${selectedSurah}`;
  }, [filterMode, selectedJuz, selectedSurah, language]);

  const handleShareResults = async () => {
    try {
      const accuracy = Math.round((correctCount / (questions.length || 1)) * 100);
      const textAr = `لقد أكملت تقييم حفظ [${activeTargetLabel}] عبر تطبيق بطل مسلم بنجاح! النتيجة: ${accuracy}% (${correctCount}/${questions.length} إجابات صحيحة) 🏆`;
      const textEn = `I have successfully completed the memorization assessment for [${activeTargetLabel}] on Batal Moslem! Result: ${accuracy}% (${correctCount}/${questions.length} correct answers) 🏆`;
      
      await Share.share({
        message: language === 'ar' ? textAr : textEn
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <ScrollView style={[styles.outerContainer, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        
        {/* LOBBY STATE */}
        {screenState === 'lobby' && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {language === 'ar' ? 'تقييم حفظ القرآن الكريم 📖' : 'Quran Memorization Assessment 📖'}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {language === 'ar' 
                ? 'اختبر دقة حفظك في سور وأجزاء محددة، واحصل على تقرير أداء لمشاركته وتتبع مستواك.'
                : 'Assess your memorization level in specific Surahs or Juz, and generate shareable performance logs.'}
            </Text>

            {/* Segmented Filter Mode Selector */}
            <View style={styles.segmentedContainer}>
              <TouchableOpacity 
                style={[styles.segmentBtn, filterMode === 'juz' && { backgroundColor: colors.primaryDeep }]}
                onPress={() => setFilterMode('juz')}
              >
                <Text style={[styles.segmentBtnText, filterMode === 'juz' && { color: '#FFFFFF', fontWeight: '700' }]}>
                  {language === 'ar' ? 'بالجزء' : 'By Juz'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.segmentBtn, filterMode === 'surah' && { backgroundColor: colors.primaryDeep }]}
                onPress={() => setFilterMode('surah')}
              >
                <Text style={[styles.segmentBtnText, filterMode === 'surah' && { color: '#FFFFFF', fontWeight: '700' }]}>
                  {language === 'ar' ? 'بالسورة' : 'By Surah'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Selection Scrollbars (supporting ALL 30 Juz' and 114 Surahs) */}
            {filterMode === 'juz' ? (
              <View style={styles.sectionWrapper}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  {language === 'ar' ? 'اختر الجزء (١ - ٣٠):' : 'Select Juz (1 - 30):'}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollListContainer}>
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((juzNum) => {
                    const isSelected = selectedJuz === juzNum;
                    return (
                      <TouchableOpacity
                        key={juzNum}
                        style={[
                          styles.scrollCell,
                          { borderColor: colors.border, backgroundColor: colors.surface },
                          isSelected && { backgroundColor: colors.primaryTint, borderColor: colors.primary }
                        ]}
                        onPress={() => setSelectedJuz(juzNum)}
                      >
                        <Text style={[styles.scrollCellText, { color: colors.textPrimary }, isSelected && { fontWeight: '700' }]}>
                          {language === 'ar' ? `جزء ${juzNum}` : `Juz ${juzNum}`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            ) : (
              <View style={styles.sectionWrapper}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  {language === 'ar' ? 'اختر السورة (١١٤ سورة):' : 'Select Surah (114 Surahs):'}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollListContainer}>
                  {surahsList.map((surah) => {
                    const isSelected = selectedSurah === surah.name;
                    return (
                      <TouchableOpacity
                        key={surah.number}
                        style={[
                          styles.scrollCell,
                          { borderColor: colors.border, backgroundColor: colors.surface },
                          isSelected && { backgroundColor: colors.primaryTint, borderColor: colors.primary }
                        ]}
                        onPress={() => setSelectedSurah(surah.name)}
                      >
                        <Text style={[styles.scrollCellText, { color: colors.textPrimary }, isSelected && { fontWeight: '700' }]}>
                          {surah.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Questions Limit (Difficulty Scale Filter) */}
            <View style={styles.sectionWrapper}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {language === 'ar' ? 'عدد الأسئلة (يزداد الصعوبة بزيادة العدد):' : 'Questions Limit (Difficulty scales with limit):'}
              </Text>
              <View style={styles.limitOptionRow}>
                {[5, 10, 15, 20].map((limitVal) => {
                  const isSelected = selectedLimit === limitVal;
                  let difficultyLabel = language === 'ar' ? 'مبتدئ' : 'Easy';
                  if (limitVal === 10) difficultyLabel = language === 'ar' ? 'متوسط' : 'Medium';
                  if (limitVal === 15) difficultyLabel = language === 'ar' ? 'متقدم' : 'Hard';
                  if (limitVal === 20) difficultyLabel = language === 'ar' ? 'بطل' : 'Expert';

                  return (
                    <TouchableOpacity
                      key={limitVal}
                      style={[
                        styles.limitPill,
                        { borderColor: colors.border, backgroundColor: colors.surface },
                        isSelected && { backgroundColor: colors.primaryDeep, borderColor: colors.primaryDeep }
                      ]}
                      onPress={() => setSelectedLimit(limitVal)}
                    >
                      <Text style={[styles.limitPillVal, { color: colors.textPrimary }, isSelected && { color: '#FFFFFF', fontWeight: '700' }]}>
                        {limitVal}
                      </Text>
                      <Text style={[styles.limitPillLbl, { color: colors.textSecondary }, isSelected && { color: '#FFFFFF' }]}>
                        {difficultyLabel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Launch Button */}
            <TouchableOpacity style={[styles.startBtn, { backgroundColor: colors.primary }]} onPress={handleStart} activeOpacity={0.85}>
              <Text style={styles.startBtnText}>
                {language === 'ar' ? 'ابدأ تقييم الحفظ ➔' : 'Start Memorization Test ➔'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* QUIZ STATE */}
        {screenState === 'assessment' && currentQuestion && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            
            {/* Header progress bar */}
            <View style={styles.quizHeader}>
              <View style={styles.quizMetaRow}>
                <View style={[styles.categoryBadge, { backgroundColor: colors.primaryTint }]}>
                  <Text style={[styles.categoryBadgeText, { color: colors.primaryOnTint }]}>
                    📖 {language === 'ar' ? 'تقييم الحفظ الجاري' : 'Active Memorization Quiz'}
                  </Text>
                </View>
                <Text style={[styles.quizProgressText, { color: colors.textSecondary }]}>
                  {language === 'ar' 
                    ? `سؤال ${currentIndex + 1} من ${questions.length}`
                    : `Question ${currentIndex + 1} of ${questions.length}`}
                </Text>
              </View>
              <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
                <View style={[styles.progressBarFill, { width: `${((currentIndex + 1) / questions.length) * 100}%`, backgroundColor: colors.primary }]} />
              </View>
            </View>

            {/* Instructions */}
            <Text style={[styles.instructionLabelText, { color: colors.textSecondary }]}>
              {currentQuestion.type === 'missing_ayah' 
                ? (language === 'ar' ? 'اختر الآية الكريمة المناسبة لإكمال السياق:' : 'Select the correct missing Ayah to complete the verse:')
                : (language === 'ar' ? 'في أي سورة وردت هذه الآية الكريمة؟' : 'In which Surah does this Ayah appear?')}
            </Text>

            {/* Prompt Verse (Citation Surah name removed to prevent leaking the answer!) */}
            <View style={[styles.promptCard, { backgroundColor: colors.neutralTint, borderColor: colors.border }]}>
              <Text style={[styles.promptText, { color: colors.textPrimary }]}>
                {currentQuestion.prompt}
              </Text>
              <Text style={[styles.citationText, { color: colors.textSecondary }]}>
                {language === 'ar' 
                  ? `[ الآية رقم ${currentQuestion.ayahNumber} ]`
                  : `[ Ayah No. ${currentQuestion.ayahNumber} ]`}
              </Text>
            </View>

            {/* Options list */}
            <View style={styles.optionsContainer}>
              {currentQuestion.options.map((opt) => {
                const isSelected = selectedAnswer === opt;
                const isCorrectOpt = opt === currentQuestion.answer;

                let optBtnStyle: any = styles.optionBtn;
                let optTextStyle: any = styles.optionBtnText;

                if (answered) {
                  if (isCorrectOpt) {
                    optBtnStyle = [styles.optionBtn, styles.optionBtnCorrect];
                    optTextStyle = [styles.optionBtnText, styles.optionTextWhite];
                  } else if (isSelected) {
                    optBtnStyle = [styles.optionBtn, styles.optionBtnIncorrect];
                    optTextStyle = [styles.optionBtnText, styles.optionTextWhite];
                  } else {
                    optBtnStyle = [styles.optionBtn, styles.optionBtnDisabled];
                    optTextStyle = [styles.optionBtnText, styles.optionTextMuted];
                  }
                } else if (isSelected) {
                  optBtnStyle = [styles.optionBtn, styles.optionBtnSelected];
                  optTextStyle = [styles.optionBtnText, styles.optionTextSelected];
                }

                return (
                  <TouchableOpacity
                    key={opt}
                    style={optBtnStyle}
                    onPress={() => !answered && setSelectedAnswer(opt)}
                    disabled={answered}
                    activeOpacity={0.75}
                  >
                    <Text style={optTextStyle}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Feedback & Actions */}
            {answered && (
              <View style={styles.feedbackWrapper}>
                <Text style={[styles.feedbackTitleText, { color: colors.textPrimary }]}>
                  {feedback}
                </Text>
                {selectedAnswer !== currentQuestion.answer && (
                  <Text style={styles.correctAnswerText}>
                    {currentQuestion.answer}
                  </Text>
                )}
                
                <TouchableOpacity style={[styles.nextBtn, { backgroundColor: colors.primary }]} onPress={handleNext} activeOpacity={0.85}>
                  <Text style={styles.nextBtnText}>
                    {currentIndex + 1 >= questions.length 
                      ? (language === 'ar' ? 'عرض التقييم النهائي ➔' : 'View Report ➔')
                      : (language === 'ar' ? 'السؤال التالي ➔' : 'Next Question ➔')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {!answered && (
              <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.primaryDeep }]} onPress={handleSubmit} activeOpacity={0.85}>
                <Text style={styles.submitBtnText}>
                  {language === 'ar' ? 'تحقق من الإجابة' : 'Check Answer'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* RESULTS STATE */}
        {screenState === 'results' && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.resultsHeader}>
              <View style={[styles.resultsIconHolder, { backgroundColor: colors.primaryTint }]}>
                <Svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={colors.primary} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <Path d="m22 4-10 10.01-3-3" />
                </Svg>
              </View>
              <Text style={[styles.resultsTitleText, { color: colors.textPrimary }]}>
                {language === 'ar' ? 'تم اكتمال التقييم!' : 'Assessment Complete!'}
              </Text>
              <Text style={[styles.resultsSubtitleText, { color: colors.textSecondary }]}>
                {language === 'ar' ? `نتيجتك لتقييم حفظ [${activeTargetLabel}]` : `Your performance report for [${activeTargetLabel}]`}
              </Text>
            </View>

            {/* Performance Stats */}
            <View style={styles.resultsStatsRow}>
              <View style={[styles.resultBox, { backgroundColor: colors.neutralTint, borderColor: colors.border }]}>
                <Text style={[styles.resultVal, { color: colors.primaryDeep }]}>
                  {Math.round((correctCount / (questions.length || 1)) * 100)}%
                </Text>
                <Text style={[styles.resultLbl, { color: colors.textSecondary }]}>
                  {language === 'ar' ? 'نسبة الدقة' : 'Accuracy'}
                </Text>
              </View>

              <View style={[styles.resultBox, { backgroundColor: colors.neutralTint, borderColor: colors.border }]}>
                <Text style={[styles.resultVal, { color: colors.textPrimary }]}>
                  {correctCount} / {questions.length}
                </Text>
                <Text style={[styles.resultLbl, { color: colors.textSecondary }]}>
                  {language === 'ar' ? 'الإجابات الصحيحة' : 'Correct Answers'}
                </Text>
              </View>
            </View>

            {/* Share Log Call-to-action */}
            <TouchableOpacity style={styles.shareReportBtn} onPress={handleShareResults} activeOpacity={0.85}>
              <Text style={styles.shareReportBtnText}>
                {language === 'ar' ? 'مشاركة النتيجة بنص مخصص 💬' : 'Share Performance Log 💬'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.nextBtn, { backgroundColor: colors.primary }]} onPress={() => setScreenState('lobby')} activeOpacity={0.85}>
              <Text style={styles.nextBtnText}>
                {language === 'ar' ? 'تقييم جديد 🔄' : 'New Assessment 🔄'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.backToHomeBtn, { borderColor: colors.border }]} onPress={() => navigation.navigate('Home')} activeOpacity={0.85}>
              <Text style={[styles.backToHomeBtnText, { color: colors.textSecondary }]}>
                {language === 'ar' ? 'العودة للرئيسية' : 'Back to Lobby'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <AdBanner />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 28,
  },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 48,
    gap: 16,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#1D2939',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  segmentedContainer: {
    flexDirection: 'row-reverse',
    backgroundColor: '#F2F4F7',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentBtnText: {
    fontSize: 13,
    color: '#475467',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  sectionWrapper: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'right',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  scrollListContainer: {
    gap: 8,
    flexDirection: 'row-reverse',
    paddingVertical: 4,
  },
  scrollCell: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollCellText: {
    fontSize: 12.5,
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  limitOptionRow: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  limitPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  limitPillVal: {
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  limitPillLbl: {
    fontSize: 9,
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  startBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  startBtnText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },

  // QUIZ STATE
  quizHeader: {
    marginBottom: 16,
  },
  quizMetaRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  quizProgressText: {
    fontSize: 11.5,
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 99,
  },
  instructionLabelText: {
    fontSize: 12.5,
    textAlign: 'right',
    marginBottom: 12,
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  promptCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  promptText: {
    fontSize: 16.5,
    lineHeight: 28,
    textAlign: 'center',
    fontWeight: '600',
    fontFamily: 'IBMPlexSansArabic-Medium',
    marginBottom: 8,
  },
  citationText: {
    fontSize: 11,
    textAlign: 'center',
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  optionBtn: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D0D5DD',
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  optionBtnText: {
    fontSize: 13.5,
    color: '#344054',
    textAlign: 'center',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  optionBtnSelected: {
    borderColor: '#059669',
    backgroundColor: '#E6F4EA',
  },
  optionTextSelected: {
    color: '#047857',
    fontWeight: '700',
  },
  optionBtnCorrect: {
    borderColor: '#059669',
    backgroundColor: '#059669',
  },
  optionBtnIncorrect: {
    borderColor: '#EF4444',
    backgroundColor: '#EF4444',
  },
  optionBtnDisabled: {
    opacity: 0.5,
    backgroundColor: '#F9FAFB',
  },
  optionTextWhite: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  optionTextMuted: {
    color: '#98A2B3',
  },
  submitBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  feedbackWrapper: {
    alignItems: 'center',
    marginTop: 10,
  },
  feedbackTitleText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  correctAnswerText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  nextBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextBtnText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },

  // RESULTS STATE
  resultsHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  resultsIconHolder: {
    width: 68,
    height: 68,
    borderRadius: 99,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  resultsTitleText: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  resultsSubtitleText: {
    fontSize: 12.5,
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  resultsStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  resultBox: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  resultVal: {
    fontSize: 22,
    fontWeight: '800',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  resultLbl: {
    fontSize: 11,
    fontFamily: 'IBMPlexSansArabic-Regular',
    marginTop: 2,
  },
  shareReportBtn: {
    backgroundColor: '#25D366',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  shareReportBtnText: {
    fontSize: 13.5,
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  backToHomeBtn: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  backToHomeBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
    fontFamily: 'IBMPlexSansArabic-SemiBold',
  },
});
