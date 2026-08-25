import React, { useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { mutashabihatQuestions, type MutashabahQuestion } from '../data/mutashabihat';
import Svg, { Path } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Skeuomorphic Wood Corner Decorations
function WoodCorner() {
  return (
    <Svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={styles.woodCorner}>
      <Path d="M0 0h16v4H4v12H0V0z" fill="#3D1C06" />
      <Path d="M4 4h8v2H6v6H4V4z" fill="#D4AF37" />
    </Svg>
  );
}

// Decorative Engraved Verse Marker (Metallic Gold Ring)
function VerseMarker({ number }: { number: number }) {
  return (
    <View style={styles.markerContainer}>
      <Text style={styles.markerText}>{number}</Text>
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

    const completedVerse = currentQuestion.prompt.replace('...', option);

    Animated.sequence([
      // 1. Scale & fly puzzle piece from tapped option straight to its specific slot on the wood board
      Animated.timing(puzzleAnim, {
        toValue: 1,
        duration: 850,
        useNativeDriver: true,
      }),
      // 2. Snapping effect on Board (Pulsing glow and Board scale jump)
      Animated.parallel([
        Animated.sequence([
          Animated.timing(boardScale, { toValue: 1.04, duration: 150, useNativeDriver: true }),
          Animated.timing(boardScale, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(glowOpacity, { toValue: 0.8, duration: 150, useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
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
  const targetSlotY = useMemo(() => {
    return 132 + currentIndex * 62;
  }, [currentIndex]);

  // Interpolated animation values for the flying puzzle piece block
  const puzzleX = puzzleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 20],
  });

  const puzzleY = puzzleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [tappedOptionY, targetSlotY],
  });

  const puzzleScale = puzzleAnim.interpolate({
    inputRange: [0, 0.85, 1],
    outputRange: [1, 1.03, 0.98],
  });

  const puzzleOpacity = puzzleAnim.interpolate({
    inputRange: [0, 0.1, 0.9, 1],
    outputRange: [0, 1, 1, 0.95],
  });

  return (
    <View style={styles.container}>
      {/* Wooden Finished Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => screenState === 'lobby' ? navigation.goBack() : handleReset()}>
          <Text style={styles.backBtnText}>🔙</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          تحدي المتشابهات القرآني
        </Text>
      </View>

      {/* Lobby State */}
      {screenState === 'lobby' && (
        <ScrollView contentContainerStyle={styles.lobbyScroll}>
          <View style={styles.infoBox}>
            <Text style={{ fontSize: 36, marginBottom: 10 }}>🪵</Text>
            <Text style={styles.infoTitle}>
              تحدي تركيب آيات المتشابهات
            </Text>
            <Text style={styles.infoDesc}>
              اجمع سور وآيات القرآن الكريم في لوحة خشبية متكاملة. اختبر تركيزك ودقتك في الألفاظ المتشابهة وركّب القطعة الصحيحة لتكتمل لوحة المصحف الشريف.
            </Text>
          </View>

          <Text style={styles.sectionTitle}>اختر مستوى الصعوبة:</Text>

          {/* Wooden Styled Difficulty Cards */}
          {(['easy', 'medium', 'hard', 'expert'] as const).map(diff => {
            const isSelected = selectedDifficulty === diff;
            const diffMeta = {
              easy: { title: 'سهل (Easy)', desc: 'مواضع متشابهة يسيرة في السور القصيرة.', color: '#F5DEB3', border: '#CD853F' },
              medium: { title: 'متوسط (Medium)', desc: 'تداخلات الألفاظ الشائعة والتقديم والتأخير.', color: '#E8D8C8', border: '#8B5A2B' },
              hard: { title: 'صعب (Hard)', desc: 'مواضع الجار والمجرور ودقائق الحروف.', color: '#DEB887', border: '#A0522D' },
              expert: { title: 'خبير (Expert)', desc: 'مواضع التشابه الكبرى في السور الطوال.', color: '#D2B48C', border: '#5C3A21' }
            }[diff];

            return (
              <TouchableOpacity
                key={diff}
                style={[
                  styles.diffCard,
                  { backgroundColor: diffMeta.color, borderColor: isSelected ? '#3D1C06' : diffMeta.border, borderWidth: isSelected ? 3 : 1.5 }
                ]}
                onPress={() => setSelectedDifficulty(diff)}
                activeOpacity={0.8}
              >
                <View style={styles.diffHeader}>
                  <Text style={styles.diffTitle}>{diffMeta.title}</Text>
                  {isSelected && <Text style={{ color: '#3D1C06', fontSize: 18, fontWeight: 'bold' }}>✓</Text>}
                </View>
                <Text style={styles.diffDesc}>{diffMeta.desc}</Text>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={styles.startBtn}
            onPress={handleStartQuiz}
          >
            <Text style={styles.startBtnText}>ابدأ التجميع الآن</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Quiz State */}
      {screenState === 'quiz' && currentQuestion && (
        <View style={styles.quizWrapper}>
          {/* Progress Row */}
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>
              تجميع لوحة المصحف: آية {currentIndex + 1} من {questions.length}
            </Text>
          </View>

          {/* SKEUOMORPHIC POLISHED OLIVE WOOD TRAY BOARD */}
          <Animated.View
            style={[
              styles.quranBoard,
              {
                transform: [{ scale: boardScale }],
              },
            ]}
          >
            {/* Wooden Frame Corner Ornaments */}
            <WoodCorner />
            <View style={{ position: 'absolute', right: 0, top: 0, transform: [{ rotate: '90deg' }] }}><WoodCorner /></View>
            <View style={{ position: 'absolute', left: 0, bottom: 0, transform: [{ rotate: '270deg' }] }}><WoodCorner /></View>
            <View style={{ position: 'absolute', right: 0, bottom: 0, transform: [{ rotate: '180deg' }] }}><WoodCorner /></View>

            <Animated.View style={[styles.boardGlow, { opacity: glowOpacity }]} />
            
            {/* The 5 Recessed Wooden Slots */}
            {questions.map((q, idx) => {
              const assembledText = assembledVerses[idx];
              const isCurrent = idx === currentIndex;
              const isCorrect = verseCorrectStatus[idx];

              return (
                <View
                  key={idx}
                  style={[
                    styles.quranSlot,
                    isCurrent && styles.activeSlot,
                    assembledText && (isCorrect ? styles.correctSlot : styles.wrongSlot)
                  ]}
                >
                  <VerseMarker number={idx + 1} />
                  
                  {assembledText ? (
                    <Text style={styles.slotVerseText} numberOfLines={1}>
                      {assembledText}
                    </Text>
                  ) : (
                    <View style={styles.emptySlotRow}>
                      <Text style={[styles.slotPlaceholderText, { color: isCurrent ? '#A0522D' : '#7F6A56' }]}>
                        {isCurrent ? 'بانتظار تركيب القطعة الخشبية الملائمة...' : 'موضع فارغ'}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </Animated.View>

          {/* Quiz Question Box (Engraved Ivory Board) */}
          <View style={styles.prompterBox}>
            <Text style={styles.prompterText}>
              {currentQuestion.prompt}
            </Text>
          </View>

          {/* Puzzle Wooden Tiles choices */}
          <ScrollView contentContainerStyle={styles.choicesScroll} showsVerticalScrollIndicator={false}>
            {!answered ? (
              currentQuestion.options.map((option, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.puzzleOption}
                  activeOpacity={0.85}
                  onPress={(e) => handleSelectOption(option, e.nativeEvent.pageY)}
                >
                  {/* Skeuomorphic Wooden Pegs/Tabs */}
                  <View style={styles.notchOut} />
                  <View style={styles.notchIn} />
                  
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              ))
            ) : (
              /* Carved Wooden Explanation Card */
              <Animated.View style={styles.explanationCard}>
                <Text style={styles.explanationHeader}>
                  💡 توضيح متشابهة الآية:
                </Text>
                <Text style={styles.explanationText}>
                  {currentQuestion.explanation}
                </Text>
                <TouchableOpacity
                  style={styles.nextBtn}
                  onPress={handleNextQuestion}
                >
                  <Text style={styles.nextBtnText}>
                    {currentIndex === questions.length - 1 ? 'عرض النتيجة' : 'تأكيد وتركيب القطعة التالية'}
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
          <View style={styles.scoreCircle}>
            <Text style={styles.scorePercent}>
              {finalScore}%
            </Text>
            <Text style={styles.scoreLabel}>
              معدل دقة التجميع
            </Text>
          </View>

          <Text style={styles.resultTitle}>
            {finalScore === 100 
              ? 'تبارك الله! لوحتك الخشبية متكاملة وحفظك متقن.' 
              : finalScore >= 70 
                ? 'عمل رائع! أكملت اللوحة بمهارة ممتازة.' 
                : 'أداء طيب، ننصح بمراجعة المتشابهات لتفادي اللبس.'}
          </Text>

          <View style={styles.xpCard}>
            <Text style={styles.xpText}>
              🎉 لقد حصلت على +{earnedXP} نقطة خبرة (XP)
            </Text>
          </View>

          <TouchableOpacity
            style={styles.startBtn}
            onPress={handleReset}
          >
            <Text style={styles.startBtnText}>تجميع لوحة جديدة</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.homeBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.homeBtnText}>العودة للرئيسية</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Gamification Animation Overlay - flying skeuomorphic wooden puzzle tile */}
      {showPuzzlePiece && (
        <Animated.View
          style={[
            styles.puzzleOption,
            styles.flyingPuzzlePiece,
            {
              backgroundColor: '#DEB887',
              borderColor: '#8B5A2B',
              transform: [
                { translateX: puzzleX },
                { translateY: puzzleY },
                { scale: puzzleScale },
              ],
              opacity: puzzleOpacity,
            },
          ]}
        >
          <View style={[styles.notchOut, { backgroundColor: '#DEB887', borderColor: '#8B5A2B' }]} />
          <View style={styles.notchIn} />
          <Text style={styles.optionText}>{flyingText}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5EFEB', // Linen/Parchment Desk Background
  },
  header: {
    height: 110,
    backgroundColor: '#3D1C06', // Rich Mahogany wood header
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 45,
    borderBottomWidth: 4,
    borderBottomColor: '#1A0B02',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  backBtn: {
    position: 'absolute',
    right: 20,
    top: 55,
    padding: 5,
    backgroundColor: '#5C3A21',
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#8B5A2B',
  },
  backBtnText: {
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    color: '#F4E6D6',
    fontWeight: 'bold',
  },
  lobbyScroll: {
    padding: 20,
  },
  infoBox: {
    padding: 20,
    borderRadius: 15,
    backgroundColor: '#E6D2B8',
    alignItems: 'center',
    marginBottom: 25,
    borderWidth: 2,
    borderColor: '#8B5A2B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3D1C06',
    marginBottom: 8,
    textAlign: 'center',
  },
  infoDesc: {
    fontSize: 14,
    color: '#5C3A21',
    textAlign: 'center',
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3D1C06',
    marginBottom: 15,
    textAlign: 'right',
  },
  diffCard: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
    color: '#3D1C06',
  },
  diffDesc: {
    fontSize: 13,
    color: '#5C3A21',
    textAlign: 'right',
    lineHeight: 18,
  },
  startBtn: {
    backgroundColor: '#8B4513', // Carved wood action button
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 25,
    borderBottomWidth: 4,
    borderBottomColor: '#3D1C06',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  startBtnText: {
    color: '#FFF8F0',
    fontSize: 17,
    fontWeight: 'bold',
  },
  quizWrapper: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  progressRow: {
    marginBottom: 10,
    alignItems: 'flex-end',
  },
  progressText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#5C3A21',
  },
  // SKEUOMORPHIC WOOD TRAY BOARD
  quranBoard: {
    borderWidth: 6,
    borderColor: '#3D1C06', // Outer Wooden Rim Frame
    borderRadius: 16,
    padding: 12,
    minHeight: 310,
    justifyContent: 'space-around',
    marginBottom: 15,
    backgroundColor: '#EBDCB9', // Polished tray bottom
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    position: 'relative',
  },
  woodCorner: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  boardGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(212, 175, 55, 0.2)', // Warm Gold glow burst
    borderRadius: 10,
  },
  quranSlot: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#C6B29C',
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    minHeight: 50,
    marginBottom: 6,
    backgroundColor: '#DECBA5', // Inset / recessed depth color
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  activeSlot: {
    borderColor: '#8B5A2B',
    backgroundColor: '#EADBB6',
    borderStyle: 'solid',
  },
  correctSlot: {
    borderColor: '#2ECC71',
    backgroundColor: '#E5F3EC',
    borderStyle: 'solid',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
  },
  wrongSlot: {
    borderColor: '#E74C3C',
    backgroundColor: '#F9EBEA',
    borderStyle: 'solid',
  },
  emptySlotRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    flex: 1,
  },
  slotPlaceholderText: {
    fontSize: 13,
    fontWeight: 'bold',
    marginRight: 8,
  },
  slotVerseText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#3D1C06',
    textAlign: 'right',
    flex: 1,
    marginRight: 10,
  },
  markerContainer: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#C5A059',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3D1C06',
  },
  markerText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#3D1C06',
  },
  // QUESTION BOARD (IVORY PLATE)
  prompterBox: {
    backgroundColor: '#FFFDF0', // Polished Ivory sheet
    borderWidth: 1.5,
    borderColor: '#CD853F',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  prompterText: {
    fontSize: 16,
    color: '#3D1C06',
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '600',
  },
  choicesScroll: {
    paddingBottom: 25,
  },
  // SKEUOMORPHIC WOOD PUZZLE PIECES
  puzzleOption: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#8B5A2B',
    borderRadius: 10,
    backgroundColor: '#DEB887', // Polished Oak wood block
    paddingVertical: 14,
    marginBottom: 12,
    position: 'relative',
    overflow: 'visible',
    // 3D Block Dimension
    borderBottomWidth: 4,
    borderBottomColor: '#5C3A21',
    borderRightWidth: 3,
    borderRightColor: '#8B5A2B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  optionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3D1C06',
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
    backgroundColor: '#DEB887',
    borderWidth: 1.5,
    borderColor: '#8B5A2B',
  },
  notchIn: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    left: -7,
    top: '50%',
    marginTop: -7,
    backgroundColor: '#F5EFEB', // Matches the linen desk color, cutting out the piece
  },
  flyingPuzzlePiece: {
    position: 'absolute',
    width: SCREEN_WIDTH - 40,
    zIndex: 9999,
  },
  // EXPLANATION BOARD (CARVED mahogany PLATE)
  explanationCard: {
    borderWidth: 2,
    borderColor: '#8B5A2B',
    borderRadius: 15,
    padding: 20,
    backgroundColor: '#F4E6D6',
    marginTop: 5,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  explanationHeader: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#3D1C06',
    marginBottom: 8,
    textAlign: 'right',
  },
  explanationText: {
    fontSize: 14,
    color: '#5C3A21',
    textAlign: 'right',
    lineHeight: 22,
    marginBottom: 20,
  },
  nextBtn: {
    backgroundColor: '#8B4513',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: '#3D1C06',
  },
  nextBtnText: {
    color: '#FFF8F0',
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
    borderColor: '#3D1C06',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    backgroundColor: '#DEB887',
  },
  scorePercent: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#3D1C06',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#5C3A21',
    marginTop: 4,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#3D1C06',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  xpCard: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#E6D2B8',
    marginBottom: 40,
    borderWidth: 1.5,
    borderColor: '#8B5A2B',
  },
  xpText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3D1C06',
  },
  homeBtn: {
    borderWidth: 1.5,
    borderColor: '#8B4513',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    width: '100%',
    marginTop: 12,
  },
  homeBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B4513',
  },
});
