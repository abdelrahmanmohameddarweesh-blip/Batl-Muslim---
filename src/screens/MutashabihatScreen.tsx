import React, { useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { mutashabihatQuestions, type MutashabahQuestion } from '../data/mutashabihat';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// --- QURAN PALACE VECTOR SVG LAYERS ---
// Fully scalable, layered vector representation of a majestic Islamic Palace

function PalaceBaseLayer({ color = '#8E8070' }) {
  return (
    <Svg width="180" height="25" viewBox="0 0 180 25" fill="none">
      {/* Base Platform */}
      <Rect width="180" height="15" y="10" rx="3" fill={color} />
      <Rect width="150" height="6" x="15" y="4" rx="2" fill="#5D5247" />
      <Path d="M45 25h90v-5H45z" fill="#3E352E" />
    </Svg>
  );
}

function PalaceWallsLayer({ color = '#FFFDF0' }) {
  return (
    <Svg width="110" height="75" viewBox="0 0 110 75" fill="none">
      {/* Main Palace Hall Walls */}
      <Rect width="110" height="70" y="5" rx="4" fill={color} stroke="#D4AF37" strokeWidth="1.5" />
      {/* Main Arch Doorway */}
      <Path d="M38 75V45c0-8 6-15 17-15s17 7 17 15v30H38z" fill="#B89742" />
      <Path d="M42 75V48c0-5 5-10 13-10s13 5 13 10v27H42z" fill="#3D1C06" />
      {/* Window Arches */}
      <Path d="M12 45V30c0-4 3-7 7-7s7 3 7 7v15H12z" fill="#3D1C06" stroke="#D4AF37" />
      <Path d="M74 45V30c0-4 3-7 7-7s7 3 7 7v15H74z" fill="#3D1C06" stroke="#D4AF37" />
    </Svg>
  );
}

function PalacePillarsLayer({ color = '#E6DCC5' }) {
  return (
    <Svg width="130" height="75" viewBox="0 0 130 75" fill="none">
      {/* Side Pillars/Columns supporting the roof */}
      <Rect width="12" height="68" x="2" y="7" rx="2" fill={color} stroke="#A4957D" />
      <Rect width="16" height="6" x="0" y="2" rx="1" fill="#A4957D" />
      <Rect width="16" height="6" x="0" y="71" rx="1" fill="#A4957D" />

      <Rect width="12" height="68" x="116" y="7" rx="2" fill={color} stroke="#A4957D" />
      <Rect width="16" height="6" x="114" y="2" rx="1" fill="#A4957D" />
      <Rect width="16" height="6" x="114" y="71" rx="1" fill="#A4957D" />
    </Svg>
  );
}

function PalaceMinaretLayer({ color = '#FFFDF0' }) {
  return (
    <Svg width="35" height="135" viewBox="0 0 35 135" fill="none">
      {/* Tall Minaret Tower */}
      <Rect width="16" height="90" x="9.5" y="45" fill={color} stroke="#D4AF37" />
      {/* Balcony */}
      <Rect width="24" height="8" x="5.5" y="37" rx="2" fill="#B89742" />
      <Path d="M6 37l11.5-12L29 37H6z" fill="#3D1C06" />
      {/* Upper Shaft */}
      <Rect width="10" height="25" x="12.5" y="12" fill={color} />
      {/* Dome top of minaret */}
      <Path d="M12.5 12c0-8 5-12 5-12s5 4 5 12h-10z" fill="#D4AF37" />
      <Circle cx="17.5" cy="2" r="1.5" fill="#3D1C06" />
    </Svg>
  );
}

function PalaceDomeLayer({ color = '#D4AF37' }) {
  return (
    <Svg width="70" height="55" viewBox="0 0 70 55" fill="none">
      {/* Golden Crowning Dome */}
      <Path d="M5 50c0-28 20-45 30-45s30 17 30 45H5z" fill={color} />
      <Path d="M12 50c0-22 17-37 23-37s23 15 23 37H12z" fill="#B89742" />
      {/* Crescent Spire */}
      <Rect width="3" height="15" x="33.5" fill="#B89742" />
      <Circle cx="35" cy="3" r="3" fill="#D4AF37" />
    </Svg>
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

  // Palace construction progress states
  const [showPalaceOverlay, setShowPalaceOverlay] = useState(false);
  const [overlayCorrect, setOverlayCorrect] = useState(false);
  const [unlockedSegment, setUnlockedSegment] = useState('');

  // Animations
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const pieceFlyAnim = useRef(new Animated.Value(0)).current;
  const pieceGlowAnim = useRef(new Animated.Value(0)).current;

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
    setScreenState('quiz');
  };

  // Handle Option selection and trigger dedicated Palace Construction transition Screen
  const handleSelectOption = (option: string) => {
    if (answered) return;
    setSelectedAnswer(option);
    setAnswered(true);

    const isCorrect = option === currentQuestion.answer;
    setOverlayCorrect(isCorrect);

    // Identify which segment of the palace is unlocked with this correct answer
    // Segments: 1: Walls, 2: Pillars, 3: Minaret, 4: Golden Dome, 5: Crescent/Spire
    const segmentNames = ['جدران القصر', 'أعمدة القصر الخارجية', 'مئذنة القصر الكبرى', 'القبة الذهبية الملكية', 'هلال القمة والنصر'];
    const activeSegment = segmentNames[correctCount] || 'ملحقات القصر';
    setUnlockedSegment(activeSegment);

    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
    }

    // Trigger full-screen Palace Construction Transition Overlay
    setShowPalaceOverlay(true);
    overlayOpacity.setValue(0);
    pieceFlyAnim.setValue(0);
    pieceGlowAnim.setValue(0);

    Animated.sequence([
      // 1. Fade-in the serene construction site scene
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // 2. If correct, play the physical puzzle piece falling from the sky onto the palace structure
      isCorrect 
        ? Animated.sequence([
            Animated.timing(pieceFlyAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(pieceGlowAnim, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            })
          ])
        : Animated.delay(200)
    ]).start();
  };

  // Move to next question or show results
  const handleNextQuestion = () => {
    // Fade out overlay first
    Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowPalaceOverlay(false);
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setSelectedAnswer('');
        setAnswered(false);
      } else {
        setScreenState('results');
      }
    });
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

  // Interpolations for the falling palace piece block
  const fallingPieceY = pieceFlyAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 0], // falls from sky onto its slot
  });

  const fallingPieceScale = pieceFlyAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1.6, 1],
  });

  const fallingPieceOpacity = pieceFlyAnim.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0, 1, 1],
  });

  return (
    <View style={styles.container}>
      {/* Clean Header */}
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
            <Text style={{ fontSize: 38, marginBottom: 10 }}>🕌</Text>
            <Text style={[styles.infoTitle, { color: colors.primary }]}>
              تحدي بناء قصر المتشابهات
            </Text>
            <Text style={[styles.infoDesc, { color: colors.textSecondary }]}>
              اختبر قوة حفظك في متشابهات القرآن الكريم. كل إجابة صحيحة تركب قطعة جديدة في قصرك وتكمل بناء المعلم الإسلامي الفاخر.
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
                  { backgroundColor: diffMeta.color, borderColor: isSelected ? colors.primary : diffMeta.border, borderWidth: isSelected ? 2.5 : 1.5 }
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
            <Text style={styles.startBtnText}>ابدأ التشييد الآن</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Quiz State (Clean MCQ Card) */}
      {screenState === 'quiz' && currentQuestion && (
        <ScrollView contentContainerStyle={styles.quizScroll}>
          {/* Progress Tracker */}
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

          {/* Clean Question Box */}
          <View style={[styles.questionBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.ayahText, { color: colors.textPrimary }]}>
              {currentQuestion.prompt}
            </Text>
          </View>

          {/* Simple Choice buttons */}
          <Text style={[styles.hintLabel, { color: colors.textSecondary }]}>اختر الكلمة أو التكملة الصحيحة:</Text>
          {currentQuestion.options.map((option, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.optionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => handleSelectOption(option)}
              disabled={answered}
              activeOpacity={0.8}
            >
              <Text style={[styles.optionText, { color: colors.textPrimary }]}>{option}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Results State */}
      {screenState === 'results' && (
        <ScrollView contentContainerStyle={styles.resultsScroll}>
          {/* Fully Built Palace Showcase */}
          <View style={styles.showcaseBox}>
            <View style={styles.palaceContainer}>
              <PalaceBaseLayer />
              <View style={{ position: 'absolute', bottom: 15 }}><PalacePillarsLayer /></View>
              <View style={{ position: 'absolute', bottom: 15 }}><PalaceWallsLayer /></View>
              <View style={{ position: 'absolute', bottom: 85 }}><PalaceDomeLayer /></View>
              <View style={{ position: 'absolute', bottom: 15, right: 0 }}><PalaceMinaretLayer /></View>
            </View>
            <Text style={styles.showcaseLabel}>لقد اكتمل تشييد قصر المتشابهات الخاص بك!</Text>
          </View>

          <View style={[styles.scoreCircle, { borderColor: colors.primary }]}>
            <Text style={[styles.scorePercent, { color: colors.primary }]}>
              {finalScore}%
            </Text>
            <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>
              نسبة اكتمال البناء
            </Text>
          </View>

          <Text style={[styles.resultTitle, { color: colors.textPrimary }]}>
            {finalScore === 100 
              ? 'ما شاء الله! قصرك متكامل وحفظك متقن للمتشابهات.' 
              : finalScore >= 70 
                ? 'أداء رائع! قصر شبه مكتمل ولديك علم واسع.' 
                : 'أداء جيد، راجع مواضع الفروق لتكتمل أركان قصرك.'}
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
            <Text style={styles.startBtnText}>شيد قصراً جديداً</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.homeBtn, { borderColor: colors.primary }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.homeBtnText, { color: colors.primary }]}>العودة للرئيسية</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* --- SEPARATE FULL-SCREEN PALACE CONSTRUCTION SITE OVERLAY --- */}
      {showPalaceOverlay && (
        <Animated.View style={[styles.overlayContainer, { opacity: overlayOpacity }]}>
          {/* Dusk Sky Scenic Background */}
          <View style={styles.skyBackground}>
            {/* Sunrise Glow circle */}
            <View style={styles.sunriseSun} />
          </View>

          <Text style={styles.overlayHeader}>قصر المتشابهات (تحت التشييد)</Text>
          
          {/* Palace Construction Area */}
          <View style={styles.palaceStage}>
            
            {/* 1. Base Platform - Always visible */}
            <PalaceBaseLayer />

            {/* 2. Main Walls - Unlocked at Correct Count >= 1 */}
            {correctCount >= (overlayCorrect ? 1 : 2) && (
              <Animated.View 
                style={[
                  styles.palacePiece, 
                  { bottom: 15 },
                  (overlayCorrect && correctCount === 1) && {
                    transform: [{ translateY: fallingPieceY }, { scale: fallingPieceScale }],
                    opacity: fallingPieceOpacity
                  }
                ]}
              >
                <PalaceWallsLayer />
              </Animated.View>
            )}

            {/* 3. Outer Columns - Unlocked at Correct Count >= 2 */}
            {correctCount >= (overlayCorrect ? 2 : 3) && (
              <Animated.View 
                style={[
                  styles.palacePiece, 
                  { bottom: 15 },
                  (overlayCorrect && correctCount === 2) && {
                    transform: [{ translateY: fallingPieceY }, { scale: fallingPieceScale }],
                    opacity: fallingPieceOpacity
                  }
                ]}
              >
                <PalacePillarsLayer />
              </Animated.View>
            )}

            {/* 4. Minaret Tower - Unlocked at Correct Count >= 3 */}
            {correctCount >= (overlayCorrect ? 3 : 4) && (
              <Animated.View 
                style={[
                  styles.palacePiece, 
                  { bottom: 15, right: 0 },
                  (overlayCorrect && correctCount === 3) && {
                    transform: [{ translateY: fallingPieceY }, { scale: fallingPieceScale }],
                    opacity: fallingPieceOpacity
                  }
                ]}
              >
                <PalaceMinaretLayer />
              </Animated.View>
            )}

            {/* 5. Golden Dome - Unlocked at Correct Count >= 4 */}
            {correctCount >= (overlayCorrect ? 4 : 5) && (
              <Animated.View 
                style={[
                  styles.palacePiece, 
                  { bottom: 85 },
                  (overlayCorrect && correctCount === 4) && {
                    transform: [{ translateY: fallingPieceY }, { scale: fallingPieceScale }],
                    opacity: fallingPieceOpacity
                  }
                ]}
              >
                <PalaceDomeLayer />
              </Animated.View>
            )}
          </View>

          {/* Constructing Status Text */}
          {overlayCorrect ? (
            <View style={styles.statusBox}>
              <Text style={styles.statusTitle}>✅ إجابة صحيحة!</Text>
              <Text style={styles.statusSubtitle}>تم تجميع وتركيب: {unlockedSegment} (+10 XP)</Text>
            </View>
          ) : (
            <View style={[styles.statusBox, { backgroundColor: '#FDF2F2' }]}>
              <Text style={[styles.statusTitle, { color: '#E74C3C' }]}>❌ إجابة خاطئة</Text>
              <Text style={[styles.statusSubtitle, { color: '#C0392B' }]}>فشل تركيب القطعة، راجع التوضيح بالأسفل لإتمام البناء لاحقاً.</Text>
            </View>
          )}

          {/* Educational Explanation Box (Spacious & Clean) */}
          <ScrollView style={styles.explanationScroll} contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
            <View style={styles.overlayExplanationCard}>
              <Text style={styles.overlayExplanationHeader}>💡 توضيح متشابهة الآية:</Text>
              <Text style={styles.overlayExplanationText}>{currentQuestion.explanation}</Text>
            </View>

            <TouchableOpacity style={styles.overlayNextBtn} onPress={handleNextQuestion}>
              <Text style={styles.overlayNextBtnText}>
                {currentIndex === questions.length - 1 ? 'متابعة وعرض النتيجة النهائية' : 'متابعة التحدي'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 5,
  },
  backBtnText: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  lobbyScroll: {
    padding: 20,
  },
  infoBox: {
    padding: 24,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
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
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
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
    fontWeight: '600',
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
    minHeight: 160,
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
  resultsScroll: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  showcaseBox: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 35,
  },
  showcaseLabel: {
    fontSize: 14,
    color: '#8E8070',
    fontWeight: 'bold',
    marginTop: 15,
    textAlign: 'center',
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
  // --- FULL SCREEN OVERLAY CONTAINER ---
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0F172A', // Dark night sky theme
    zIndex: 99999,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  skyBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.45,
    backgroundColor: '#1E1B4B',
    overflow: 'hidden',
  },
  sunriseSun: {
    position: 'absolute',
    bottom: -100,
    left: SCREEN_WIDTH / 2 - 150,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#F59E0B',
    opacity: 0.15,
  },
  overlayHeader: {
    color: '#FFF8E7',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  palaceStage: {
    width: 200,
    height: 180,
    alignSelf: 'center',
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 35,
  },
  palaceContainer: {
    width: 200,
    height: 180,
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
  },
  palacePiece: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBox: {
    backgroundColor: '#EBF7F3',
    borderWidth: 1.5,
    borderColor: '#2ECC71',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27AE60',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 13,
    color: '#2E7D32',
    textAlign: 'center',
  },
  explanationScroll: {
    flex: 1,
  },
  overlayExplanationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  overlayExplanationHeader: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FCD34D',
    marginBottom: 8,
    textAlign: 'right',
  },
  overlayExplanationText: {
    fontSize: 14,
    color: '#E2E8F0',
    textAlign: 'right',
    lineHeight: 22,
  },
  overlayNextBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  overlayNextBtnText: {
    color: '#1E1B4B',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
