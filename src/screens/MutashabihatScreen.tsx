import React, { useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { mutashabihatQuestions, type MutashabahQuestion } from '../data/mutashabihat';
import Svg, { Path } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Premium Custom SVGs for Quran Book and Puzzle Piece
function QuranBookIcon({ color }: { color: string }) {
  return (
    <Svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <Path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <Path d="M12 6v10" strokeWidth="1.5" />
    </Svg>
  );
}

function PuzzlePieceIcon({ color }: { color: string }) {
  return (
    <Svg width="36" height="36" viewBox="0 0 24 24" fill={color}>
      <Path d="M19.5 9h-3V6c0-1.1-.9-2-2-2h-3V1.5C11.5.67 10.83 0 10 0s-1.5.67-1.5 1.5V4h-3c-1.1 0-2 .9-2 2v3H1.5C.67 9 0 9.67 0 10.5S.67 12 1.5 12H3.5v3c0 1.1.9 2 2 2h3v1.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V17h3c1.1 0 2-.9 2-2v-3h1.5c.83 0 1.5-.67 1.5-1.5S20.33 9 19.5 9z" />
    </Svg>
  );
}

export default function MutashabihatScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { language, formatNumber } = useLanguage();

  // Screen State: 'lobby' | 'quiz' | 'results'
  const [screenState, setScreenState] = useState<'lobby' | 'quiz' | 'results'>('lobby');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard' | 'expert'>('medium');

  // Quiz States
  const [questions, setQuestions] = useState<MutashabahQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  // Animation values
  const puzzleAnim = useRef(new Animated.Value(0)).current;
  const bookScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const [showPuzzlePiece, setShowPuzzlePiece] = useState(false);

  const currentQuestion = questions[currentIndex];

  // Start the Mutashabihat Quiz
  const handleStartQuiz = () => {
    // Filter questions based on selected difficulty
    const filtered = mutashabihatQuestions.filter(q => q.difficulty === selectedDifficulty);
    
    // Shuffle filtered questions
    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    
    // Select up to 5 questions
    setQuestions(shuffled.slice(0, 5));
    setCurrentIndex(0);
    setSelectedAnswer('');
    setAnswered(false);
    setCorrectCount(0);
    setScreenState('quiz');
  };

  // Handle Option selection with animated gamification feedback
  const handleSelectOption = (option: string) => {
    if (answered) return;
    setSelectedAnswer(option);
    setAnswered(true);

    if (option === currentQuestion.answer) {
      setCorrectCount(prev => prev + 1);

      // Trigger Puzzle Piece Flying and Quran Book Glow/Pulse animation
      setShowPuzzlePiece(true);
      puzzleAnim.setValue(0);

      Animated.sequence([
        // 1. Puzzle piece flies up, spins, and moves to the top-left Quran book
        Animated.timing(puzzleAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        // 2. Pulse & Golden Glow triggers on Quran book upon merging
        Animated.parallel([
          Animated.sequence([
            Animated.timing(bookScale, { toValue: 1.35, duration: 150, useNativeDriver: true }),
            Animated.timing(bookScale, { toValue: 1, duration: 250, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(glowOpacity, { toValue: 0.9, duration: 150, useNativeDriver: true }),
            Animated.timing(glowOpacity, { toValue: 0, duration: 450, useNativeDriver: true }),
          ]),
        ]),
      ]).start(() => {
        setShowPuzzlePiece(false);
      });
    }
  };

  // Move to next question or show results
  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer('');
      setAnswered(false);
    } else {
      setScreenState('results');
    }
  };

  // Restart Quiz
  const handleReset = () => {
    setScreenState('lobby');
    setQuestions([]);
    setCurrentIndex(0);
    setSelectedAnswer('');
    setAnswered(false);
    setCorrectCount(0);
  };

  const finalScore = useMemo(() => {
    if (questions.length === 0) return 0;
    return Math.round((correctCount / questions.length) * 100);
  }, [correctCount, questions]);

  const earnedXP = useMemo(() => {
    return correctCount * 10;
  }, [correctCount]);

  // Interpolated values for flying puzzle piece
  const puzzleX = puzzleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_WIDTH / 2 - 18, 20],
  });

  const puzzleY = puzzleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT / 2 + 50, 55],
  });

  const puzzleScale = puzzleAnim.interpolate({
    inputRange: [0, 0.85, 1],
    outputRange: [1.7, 1.1, 0.45],
  });

  const puzzleRotate = puzzleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '720deg'],
  });

  const puzzleOpacity = puzzleAnim.interpolate({
    inputRange: [0, 0.15, 0.85, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => screenState === 'lobby' ? navigation.goBack() : handleReset()}>
          <Text style={[styles.backBtnText, { color: colors.primary }]}>🔙</Text>
        </TouchableOpacity>

        {/* Pulsing & Glowing Quran Book */}
        {screenState === 'quiz' && (
          <View style={styles.bookWrapper}>
            <Animated.View style={[styles.glowRing, { opacity: glowOpacity, backgroundColor: colors.accent }]} />
            <Animated.View style={{ transform: [{ scale: bookScale }] }}>
              <QuranBookIcon color={colors.primary} />
            </Animated.View>
          </View>
        )}

        <Text style={[styles.headerTitle, { color: colors.textPrimary, fontFamily: 'IBMPlexSansArabic-Bold' }]}>
          تحدي المتشابهات القرآني
        </Text>
      </View>

      {/* Lobby State */}
      {screenState === 'lobby' && (
        <ScrollView contentContainerStyle={styles.lobbyScroll}>
          <View style={[styles.infoBox, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.infoEmoji, { fontSize: 36 }]}>🧩</Text>
            <Text style={[styles.infoTitle, { color: colors.primary }]}>
              ما هو تحدي المتشابهات؟
            </Text>
            <Text style={[styles.infoDesc, { color: colors.textSecondary }]}>
              يهدف هذا التحدي لمساعدتك في اختبار وتثبيت حفظك عبر تمييز الفروق الدقيقة والتشابه اللفظي بين آيات القرآن الكريم (التقديم والتأخير، زيادة الحروف، وتبديل الألفاظ).
            </Text>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>اختر مستوى الصعوبة:</Text>

          {/* Difficulty Cards */}
          {(['easy', 'medium', 'hard', 'expert'] as const).map(diff => {
            const isSelected = selectedDifficulty === diff;
            const diffMeta = {
              easy: { title: 'سهل (Easy)', desc: 'مواضع متشابهة يسيرة في السور القصيرة.', color: '#EBF7F3', border: '#B2E5D4' },
              medium: { title: 'متوسط (Medium)', desc: 'تداخلات الألفاظ الشائعة والتقديم والتأخير.', color: '#FFF8E6', border: '#FAD7A0' },
              hard: { title: 'صعب (Hard)', desc: 'مواضع الجار والمجرور ودقائق الحروف.', color: '#F7EBEB', border: '#F1948A' },
              expert: { title: 'خبير (Expert)', desc: 'مواضع التشابه الكبرى في السور الطوال.', color: '#F7EBF7', border: '#D7BDE2' }
            }[diff];

            return (
              <TouchableOpacity
                key={diff}
                style={[
                  styles.diffCard,
                  { backgroundColor: diffMeta.color, borderColor: isSelected ? colors.primary : diffMeta.border }
                ]}
                onPress={() => setSelectedDifficulty(diff)}
                activeOpacity={0.8}
              >
                <View style={styles.diffHeader}>
                  <Text style={[styles.diffTitle, { color: '#2C3E50' }]}>{diffMeta.title}</Text>
                  {isSelected && <Text style={{ color: colors.primary, fontSize: 18 }}>✓</Text>}
                </View>
                <Text style={[styles.diffDesc, { color: '#5D6D7E' }]}>{diffMeta.desc}</Text>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={[styles.startBtn, { backgroundColor: colors.primary }]}
            onPress={handleStartQuiz}
          >
            <Text style={styles.startBtnText}>ابدأ التحدي الآن</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Quiz State */}
      {screenState === 'quiz' && currentQuestion && (
        <ScrollView contentContainerStyle={styles.quizScroll}>
          {/* Progress Bar */}
          <View style={styles.progressRow}>
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              السؤال {currentIndex + 1} من {questions.length}
            </Text>
            <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: colors.primary,
                    width: `${((currentIndex + 1) / questions.length) * 100}%`
                  }
                ]}
              />
            </View>
          </View>

          {/* Question Text Box */}
          <View style={[styles.questionBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.ayahText, { color: colors.textPrimary }]}>
              {currentQuestion.prompt}
            </Text>
          </View>

          {/* Options List */}
          <Text style={[styles.hintLabel, { color: colors.textSecondary }]}>اختر الكلمة أو التكملة الصحيحة:</Text>
          {currentQuestion.options.map((option, idx) => {
            const isCorrect = option === currentQuestion.answer;
            const isSelected = option === selectedAnswer;

            let cardBg = colors.surface;
            let cardBorder = colors.border;
            let textColor = colors.textPrimary;

            if (answered) {
              if (isCorrect) {
                cardBg = '#EBF7F3';
                cardBorder = '#2ECC71';
                textColor = '#27AE60';
              } else if (isSelected) {
                cardBg = '#FDF2F2';
                cardBorder = '#E74C3C';
                textColor = '#C0392B';
              } else {
                cardBg = colors.surface;
                cardBorder = colors.border;
                textColor = colors.textSecondary;
              }
            }

            return (
              <TouchableOpacity
                key={idx}
                style={[styles.optionBtn, { backgroundColor: cardBg, borderColor: cardBorder }]}
                onPress={() => handleSelectOption(option)}
                disabled={answered}
                activeOpacity={0.8}
              >
                <Text style={[styles.optionText, { color: textColor }]}>{option}</Text>
              </TouchableOpacity>
            );
          })}

          {/* Explanation & Next Card */}
          {answered && (
            <Animated.View style={[styles.explanationCard, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
              <Text style={[styles.explanationHeader, { color: colors.primary }]}>
                💡 توضيح متشابهة الآية:
              </Text>
              <Text style={[styles.explanationText, { color: colors.textPrimary }]}>
                {currentQuestion.explanation}
              </Text>
              <TouchableOpacity
                style={[styles.nextBtn, { backgroundColor: colors.primary }]}
                onPress={handleNextQuestion}
              >
                <Text style={styles.nextBtnText}>
                  {currentIndex === questions.length - 1 ? 'عرض النتيجة' : 'السؤال التالي'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </ScrollView>
      )}

      {/* Results State */}
      {screenState === 'results' && (
        <ScrollView contentContainerStyle={styles.resultsScroll}>
          <View style={[styles.scoreCircle, { borderColor: colors.primary }]}>
            <Text style={[styles.scorePercent, { color: colors.primary }]}>
              {finalScore}%
            </Text>
            <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>
              معدل الدقة
            </Text>
          </View>

          <Text style={[styles.resultTitle, { color: colors.textPrimary }]}>
            {finalScore === 100 
              ? 'ما شاء الله! حفظك متقن وممتاز.' 
              : finalScore >= 70 
                ? 'أداء رائع! لديك معرفة جيدة بالمتشابهات.' 
                : 'أداء جيد، ينصح بمراجعة الفروق لتثبيت الحفظ.'}
          </Text>

          <View style={[styles.xpCard, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.xpText, { color: colors.primary }]}>
              🎉 لقد حصلت على +{earnedXP} نقطة خبرة (XP)
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.startBtn, { backgroundColor: colors.primary }]}
            onPress={handleReset}
          >
            <Text style={styles.startBtnText}>تحدي جديد</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.homeBtn, { borderColor: colors.primary }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.homeBtnText, { color: colors.primary }]}>العودة للرئيسية</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Gamification Animation Overlay */}
      {showPuzzlePiece && (
        <Animated.View
          style={[
            styles.floatingPuzzle,
            {
              transform: [
                { translateX: puzzleX },
                { translateY: puzzleY },
                { scale: puzzleScale },
                { rotate: puzzleRotate },
              ],
              opacity: puzzleOpacity,
            },
          ]}
        >
          <PuzzlePieceIcon color={colors.accent} />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingTop: 45,
  },
  backBtn: {
    position: 'absolute',
    right: 20,
    top: 55,
    padding: 5,
  },
  backBtnText: {
    fontSize: 20,
  },
  bookWrapper: {
    position: 'absolute',
    left: 20,
    top: 52,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  headerTitle: {
    fontSize: 18,
  },
  lobbyScroll: {
    padding: 20,
  },
  infoBox: {
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 25,
  },
  infoEmoji: {
    marginBottom: 10,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  infoDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'right',
  },
  diffCard: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  diffHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  diffTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  diffDesc: {
    fontSize: 13,
    textAlign: 'right',
    lineHeight: 18,
  },
  startBtn: {
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  startBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quizScroll: {
    padding: 20,
  },
  progressRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressText: {
    fontSize: 14,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    flex: 1,
    marginRight: 15,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  questionBox: {
    borderWidth: 1,
    borderRadius: 15,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
    minHeight: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  ayahText: {
    fontSize: 20,
    textAlign: 'center',
    lineHeight: 34,
    fontWeight: '600',
  },
  hintLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'right',
  },
  optionBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 1,
    elevation: 1,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  explanationCard: {
    borderWidth: 1,
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
    marginBottom: 30,
  },
  explanationHeader: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'right',
  },
  explanationText: {
    fontSize: 14,
    textAlign: 'right',
    lineHeight: 22,
    marginBottom: 20,
  },
  nextBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  nextBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  resultsScroll: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  scoreCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  scorePercent: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  xpCard: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  xpText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  homeBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    width: '100%',
    marginTop: 12,
  },
  homeBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  floatingPuzzle: {
    position: 'absolute',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
});
