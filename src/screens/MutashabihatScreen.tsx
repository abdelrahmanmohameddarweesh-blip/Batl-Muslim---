import React, { useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { mutashabihatQuestions, type MutashabahQuestion } from '../data/mutashabihat';
import Svg, { Path } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// SVG Jigsaw Puzzle Piece Icon
function PuzzlePieceIcon({ color, size = 30 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M19.5 9h-3V6c0-1.1-.9-2-2-2h-3V1.5C11.5.67 10.83 0 10 0s-1.5.67-1.5 1.5V4h-3c-1.1 0-2 .9-2 2v3H1.5C.67 9 0 9.67 0 10.5S.67 12 1.5 12H3.5v3c0 1.1.9 2 2 2h3v1.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V17h3c1.1 0 2-.9 2-2v-3h1.5c.83 0 1.5-.67 1.5-1.5S20.33 9 19.5 9z" />
    </Svg>
  );
}

// Decorative Verse Marker
function VerseMarker({ number, color }: { number: number; color: string }) {
  return (
    <View style={[styles.markerContainer, { borderColor: color }]}>
      <Text style={[styles.markerText, { color }]}>{number}</Text>
    </View>
  );
}

export default function MutashabihatScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { language } = useLanguage();

  // Screen State: 'lobby' | 'quiz' | 'results'
  const [screenState, setScreenState] = useState<'lobby' | 'quiz' | 'results'>('lobby');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard' | 'expert'>('medium');

  // Quiz States
  const [questions, setQuestions] = useState<MutashabahQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  // Puzzle board assemblies: stores the text of correctly/incorrectly solved verses
  const [assembledVerses, setAssembledVerses] = useState<(string | null)[]>([null, null, null, null, null]);
  const [verseCorrectStatus, setVerseCorrectStatus] = useState<boolean[]>([]);

  // Animations
  const puzzleAnim = useRef(new Animated.Value(0)).current;
  const boardScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  
  // Animation coordinates tracking for flying puzzle block
  const [showPuzzlePiece, setShowPuzzlePiece] = useState(false);
  const [flyingText, setFlyingText] = useState('');
  const [tappedOptionY, setTappedOptionY] = useState(0);

  const currentQuestion = questions[currentIndex];

  // Start the Mutashabihat Quiz
  const handleStartQuiz = () => {
    const filtered = mutashabihatQuestions.filter(q => q.difficulty === selectedDifficulty);
    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 5);

    setQuestions(selected);
    setCurrentIndex(0);
    setSelectedAnswer('');
    setAnswered(false);
    setCorrectCount(0);
    setAssembledVerses([null, null, null, null, null]);
    setVerseCorrectStatus([false, false, false, false, false]);
    setScreenState('quiz');
  };

  // Handle Option selection and trigger full-screen flying puzzle block
  const handleSelectOption = (option: string, pageY: number) => {
    if (answered) return;
    setSelectedAnswer(option);
    setAnswered(true);

    const isCorrect = option === currentQuestion.answer;
    
    // Save correctness status for board rendering
    const newStatus = [...verseCorrectStatus];
    newStatus[currentIndex] = isCorrect;
    setVerseCorrectStatus(newStatus);

    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
    }

    // Set the flying text and start position
    setFlyingText(option);
    setTappedOptionY(pageY - 60); // Account for header offset
    setShowPuzzlePiece(true);
    puzzleAnim.setValue(0);

    // Formulate the full completed verse for assembly board display
    const completedVerse = currentQuestion.prompt.replace('...', option);

    Animated.sequence([
      // 1. Scale & fly puzzle piece from tapped option straight to its specific slot on the Quran board
      Animated.timing(puzzleAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      // 2. Snapping effect on Board (Pulsing glow and Board scale jump)
      Animated.parallel([
        Animated.sequence([
          Animated.timing(boardScale, { toValue: 1.05, duration: 150, useNativeDriver: true }),
          Animated.timing(boardScale, { toValue: 1, duration: 250, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(glowOpacity, { toValue: 0.9, duration: 150, useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: 0, duration: 450, useNativeDriver: true }),
        ]),
      ]),
    ]).start(() => {
      // 3. Formally reveal the verse inside the Quran Board slot
      const newAssembled = [...assembledVerses];
      newAssembled[currentIndex] = completedVerse;
      setAssembledVerses(newAssembled);
      setShowPuzzlePiece(false);
    });
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
    setAssembledVerses([null, null, null, null, null]);
    setVerseCorrectStatus([false, false, false, false, false]);
  };

  const finalScore = useMemo(() => {
    if (questions.length === 0) return 0;
    return Math.round((correctCount / questions.length) * 100);
  }, [correctCount, questions]);

  const earnedXP = useMemo(() => {
    return correctCount * 10;
  }, [correctCount]);

  // Target Y coordinate for the active slot inside the Quran Board
  // Slots are 55px tall, starting from top of Quran Board (roughly Y=150px)
  const targetSlotY = useMemo(() => {
    return 130 + currentIndex * 58;
  }, [currentIndex]);

  // Interpolated animation values for the flying puzzle piece block
  const puzzleX = puzzleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 20], // Stays full-width aligned
  });

  const puzzleY = puzzleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [tappedOptionY, targetSlotY], // Fly from tapped position to the Quran board slot
  });

  const puzzleScale = puzzleAnim.interpolate({
    inputRange: [0, 0.8, 1],
    outputRange: [1, 1.05, 0.98],
  });

  const puzzleOpacity = puzzleAnim.interpolate({
    inputRange: [0, 0.15, 0.85, 1],
    outputRange: [0, 1, 1, 0.9],
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => screenState === 'lobby' ? navigation.goBack() : handleReset()}>
          <Text style={[styles.backBtnText, { color: colors.primary }]}>🔙</Text>
        </TouchableOpacity>
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
        <View style={styles.quizWrapper}>
          {/* Progress Tracker */}
          <View style={styles.progressRow}>
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              تجميع صفحة القرآن: السؤال {currentIndex + 1} من {questions.length}
            </Text>
          </View>

          {/* FULL SCREEN PARCHMENT QURAN PAGE BOARD */}
          <Animated.View
            style={[
              styles.quranBoard,
              {
                borderColor: colors.accent,
                backgroundColor: colors.surface,
                transform: [{ scale: boardScale }],
              },
            ]}
          >
            <Animated.View style={[styles.boardGlow, { opacity: glowOpacity, backgroundColor: colors.accent }]} />
            
            {/* The 5 Jigsaw Slots */}
            {questions.map((q, idx) => {
              const assembledText = assembledVerses[idx];
              const isCurrent = idx === currentIndex;
              const isCorrect = verseCorrectStatus[idx];

              return (
                <View
                  key={idx}
                  style={[
                    styles.quranSlot,
                    { borderColor: colors.border },
                    isCurrent && styles.activeSlot,
                    assembledText && (isCorrect ? styles.correctSlot : styles.wrongSlot)
                  ]}
                >
                  <VerseMarker number={idx + 1} color={colors.primary} />
                  
                  {assembledText ? (
                    <Text style={[styles.slotVerseText, { color: colors.textPrimary }]} numberOfLines={1}>
                      {assembledText}
                    </Text>
                  ) : (
                    <View style={styles.emptySlotRow}>
                      <PuzzlePieceIcon color={isCurrent ? colors.accent : colors.textTertiary} size={18} />
                      <Text style={[styles.slotPlaceholderText, { color: isCurrent ? colors.accent : colors.textTertiary }]}>
                        {isCurrent ? 'بانتظار تركيب القطعة المناسبة للآية...' : 'موضع مغلق'}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </Animated.View>

          {/* Quiz Question Prompter (Middle) */}
          <View style={styles.prompterBox}>
            <Text style={[styles.prompterText, { color: colors.textPrimary }]}>
              {currentQuestion.prompt}
            </Text>
          </View>

          {/* Puzzle Option Choices */}
          <ScrollView contentContainerStyle={styles.choicesScroll}>
            {!answered ? (
              currentQuestion.options.map((option, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.puzzleOption, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  activeOpacity={0.8}
                  onPress={(e) => handleSelectOption(option, e.nativeEvent.pageY)}
                >
                  {/* Left & Right Jigsaw notches */}
                  <View style={[styles.notchOut, { backgroundColor: colors.surface, borderColor: colors.border }]} />
                  <View style={[styles.notchIn, { backgroundColor: colors.background }]} />
                  
                  <Text style={[styles.optionText, { color: colors.textPrimary }]}>{option}</Text>
                </TouchableOpacity>
              ))
            ) : (
              /* Explanation & Next Card after snapping */
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
        </View>
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

      {/* Gamification Animation Overlay - flying puzzle piece block */}
      {showPuzzlePiece && (
        <Animated.View
          style={[
            styles.puzzleOption,
            styles.flyingPuzzlePiece,
            {
              backgroundColor: colors.accentLight,
              borderColor: colors.accent,
              transform: [
                { translateX: puzzleX },
                { translateY: puzzleY },
                { scale: puzzleScale },
              ],
              opacity: puzzleOpacity,
            },
          ]}
        >
          <View style={[styles.notchOut, { backgroundColor: colors.accentLight, borderColor: colors.accent }]} />
          <View style={[styles.notchIn, { backgroundColor: colors.background }]} />
          <Text style={[styles.optionText, { color: colors.accentDark }]}>{flyingText}</Text>
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
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingTop: 45,
  },
  backBtn: {
    position: 'absolute',
    right: 20,
    top: 52,
    padding: 5,
  },
  backBtnText: {
    fontSize: 20,
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
  },
  startBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quizWrapper: {
    flex: 1,
    padding: 20,
  },
  progressRow: {
    marginBottom: 10,
    alignItems: 'flex-end',
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // QURAN PAGE BOARD
  quranBoard: {
    borderWidth: 3,
    borderRadius: 15,
    padding: 10,
    minHeight: 295,
    justifyContent: 'space-around',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  boardGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  quranSlot: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 48,
    marginBottom: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    zIndex: 2,
  },
  activeSlot: {
    borderColor: '#F5B841',
    backgroundColor: '#FEF9E7',
    borderStyle: 'solid',
  },
  correctSlot: {
    borderColor: '#2ECC71',
    backgroundColor: '#EBF7F3',
    borderStyle: 'solid',
  },
  wrongSlot: {
    borderColor: '#E74C3C',
    backgroundColor: '#FDF2F2',
    borderStyle: 'solid',
  },
  emptySlotRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    flex: 1,
  },
  slotPlaceholderText: {
    fontSize: 13,
    marginRight: 8,
  },
  slotVerseText: {
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'right',
    flex: 1,
    marginRight: 10,
  },
  markerContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  // QUESTION PROMPTER (MIDDLE)
  prompterBox: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  prompterText: {
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: '600',
  },
  choicesScroll: {
    paddingBottom: 20,
  },
  // JIGSAW PUZZLE OPTION CARDS
  puzzleOption: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 12,
    position: 'relative',
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  optionText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  notchOut: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    right: -7,
    top: '50%',
    marginTop: -7,
    borderWidth: 1.5,
  },
  notchIn: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    left: -7,
    top: '50%',
    marginTop: -7,
  },
  flyingPuzzlePiece: {
    position: 'absolute',
    width: SCREEN_WIDTH - 40,
    zIndex: 9999,
  },
  explanationCard: {
    borderWidth: 1,
    borderRadius: 15,
    padding: 20,
    marginTop: 5,
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
});
