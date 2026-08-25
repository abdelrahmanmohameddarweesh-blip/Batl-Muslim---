import React, { useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { mutashabihatQuestions, type MutashabahQuestion } from '../data/mutashabihat';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// --- DETAILED QURAN PALACE VECTOR SVG LAYERS ---
// Scalable, high-fidelity skeuomorphic vector designs for the Palace elements

function PalaceBaseLayer() {
  return (
    <Svg width="220" height="40" viewBox="0 0 220 40" fill="none">
      {/* Tier 1 (Lowest Platform) */}
      <Rect width="220" height="15" y="22" rx="4" fill="#7E7264" stroke="#4D4338" strokeWidth="1" />
      <Path d="M10 22h200v2H10z" fill="#FFFDF0" opacity="0.15" />
      {/* Tier 2 (Middle Step) */}
      <Rect width="190" height="10" x="15" y="12" rx="3" fill="#A39687" stroke="#6C6053" strokeWidth="1" />
      {/* Tier 3 (Upper Step) */}
      <Rect width="160" height="7" x="30" y="5" rx="2" fill="#C5B8A9" stroke="#8E8071" strokeWidth="1" />
      {/* Tile Joints */}
      <Path d="M40 37v-15M80 37v-15M120 37v-15M160 37v-15M180 37v-15" stroke="#3E352E" strokeWidth="1" opacity="0.3" />
      <Path d="M50 22v-10M110 22v-10M170 22v-10" stroke="#3E352E" strokeWidth="1" opacity="0.3" />
    </Svg>
  );
}

function PalaceWallsLayer() {
  return (
    <Svg width="130" height="85" viewBox="0 0 130 85" fill="none">
      {/* Main Palace Hall Walls with Marble Texture */}
      <Rect width="130" height="80" y="5" rx="6" fill="#FFFDF0" stroke="#D4AF37" strokeWidth="2" />
      
      {/* Islamic Arch Border around doorway */}
      <Rect width="48" height="60" x="41" y="25" rx="4" fill="none" stroke="#D4AF37" strokeWidth="1.2" strokeDasharray="3,3" />
      
      {/* Main Entrance Archway */}
      <Path d="M45 85V48c0-11 8-20 20-20s20 9 20 20v37H45z" fill="#B89742" stroke="#3D1C06" strokeWidth="1.5" />
      <Path d="M49 85V51c0-8 7-14 16-14s16 6 16 14v34H49z" fill="#1F2937" />
      
      {/* Inset Decorative door grills */}
      <Path d="M57 37v48M65 37v48M73 37v48" stroke="#D4AF37" strokeWidth="0.8" opacity="0.4" />

      {/* Intricate Arched Windows (Left & Right) */}
      <Path d="M12 48V30c0-6 4-10 9-10s9 4 9 10v18H12z" fill="#111827" stroke="#D4AF37" strokeWidth="1.5" />
      <Path d="M12 36h18M21 20v28" stroke="#D4AF37" strokeWidth="1" />
      
      <Path d="M100 48V30c0-6 4-10 9-10s9 4 9 10v18H100z" fill="#111827" stroke="#D4AF37" strokeWidth="1.5" />
      <Path d="M100 36h18M109 20v28" stroke="#D4AF37" strokeWidth="1" />

      {/* Roof trim details */}
      <Rect width="134" height="6" x="-2" y="0" fill="#D4AF37" />
    </Svg>
  );
}

function PalacePillarsLayer() {
  return (
    <Svg width="150" height="85" viewBox="0 0 150 85" fill="none">
      {/* Flanking Columns with Capitals */}
      {/* Left Column */}
      <Rect width="14" height="74" x="4" y="8" rx="2" fill="#EADFCE" stroke="#A4957D" strokeWidth="1" />
      {/* Column grooves */}
      <Path d="M8 8v74M14 8v74" stroke="#FFFDF0" strokeWidth="0.8" />
      {/* Golden Capital */}
      <Path d="M0 8h22v-4H0v4z" fill="#D4AF37" stroke="#3D1C06" strokeWidth="1" />
      {/* Column Base */}
      <Rect width="20" height="6" x="1" y="79" rx="1.5" fill="#A4957D" />

      {/* Right Column */}
      <Rect width="14" height="74" x="132" y="8" rx="2" fill="#EADFCE" stroke="#A4957D" strokeWidth="1" />
      <Path d="M136 8v74M142 8v74" stroke="#FFFDF0" strokeWidth="0.8" />
      <Path d="M128 8h22v-4h-22v4z" fill="#D4AF37" stroke="#3D1C06" strokeWidth="1" />
      <Rect width="20" height="6" x="129" y="79" rx="1.5" fill="#A4957D" />
    </Svg>
  );
}

function PalaceMinaretLayer() {
  return (
    <Svg width="45" height="155" viewBox="0 0 45 155" fill="none">
      {/* Tower Base */}
      <Rect width="18" height="105" x="13.5" y="50" fill="#FFFDF0" stroke="#D4AF37" strokeWidth="1.5" />
      {/* Brick texture lines */}
      <Path d="M13.5 70h18M13.5 90h18M13.5 110h18M13.5 130h18" stroke="#E5DDD0" strokeWidth="0.8" />

      {/* Balcony 1 */}
      <Rect width="28" height="8" x="8.5" y="42" rx="2" fill="#B89742" stroke="#3D1C06" strokeWidth="1" />
      {/* Balcony Railings */}
      <Path d="M9 42h17v-4H9v4z" fill="#1F2937" />
      <Path d="M12 38v4M16 38v4M20 38v4M24 38v4" stroke="#D4AF37" strokeWidth="0.8" />

      {/* Upper Spire Shaft */}
      <Rect width="12" height="30" x="16.5" y="12" fill="#FFFDF0" stroke="#D4AF37" strokeWidth="1.2" />

      {/* Balcony 2 */}
      <Rect width="20" height="6" x="12.5" y="9" rx="1.5" fill="#B89742" />

      {/* Dome Top of Minaret */}
      <Path d="M14.5 9c0-6 8-10 8-10s8 4 8 10h-16z" fill="#D4AF37" stroke="#3D1C06" strokeWidth="1" />
      <Path d="M22.5-1v-4" stroke="#D4AF37" strokeWidth="1.5" />
    </Svg>
  );
}

function PalaceDomeLayer() {
  return (
    <Svg width="90" height="70" viewBox="0 0 90 70" fill="none">
      {/* Base Ring with small windows */}
      <Rect width="62" height="10" x="14" y="45" fill="#B89742" stroke="#3D1C06" strokeWidth="1" />
      <Rect width="6" height="6" x="22" y="47" rx="1" fill="#1F2937" />
      <Rect width="6" height="6" x="34" y="47" rx="1" fill="#1F2937" />
      <Rect width="6" height="6" x="46" y="47" rx="1" fill="#1F2937" />
      <Rect width="6" height="6" x="58" y="47" rx="1" fill="#1F2937" />
      
      {/* Main Dome Body */}
      <Path d="M15 45C15 15 35 5 45 5s30 10 30 40H15z" fill="#D4AF37" stroke="#3D1C06" strokeWidth="1.8" />
      {/* 3D Fluting / Segment Lines */}
      <Path d="M45 5c-8 10-15 25-15 40" stroke="#B89742" strokeWidth="1.5" />
      <Path d="M45 5c8 10 15 25 15 40" stroke="#B89742" strokeWidth="1.5" />
      <Path d="M45 5c-2 12-5 28-5 40" stroke="#F5B841" strokeWidth="1" />
      <Path d="M45 5c2 12 5 28 5 40" stroke="#F5B841" strokeWidth="1" />
      
      {/* Golden Spire & Crescent */}
      <Path d="M45 5V-4" stroke="#D4AF37" strokeWidth="2.5" />
      <Circle cx="45" cy="-5" r="2.5" fill="#D4AF37" />
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

  // Handle Option selection and trigger full-screen Palace Construction transition Screen
  const handleSelectOption = (option: string) => {
    if (answered) return;
    setSelectedAnswer(option);
    setAnswered(true);

    const isCorrect = option === currentQuestion.answer;
    setOverlayCorrect(isCorrect);

    // Identify which specific segment of the palace is unlocked
    const segmentNames = [
      'جدران المحراب والرخام الداخلي',
      'أعمدة المدخل الرخامية المزخرفة',
      'مئذنة القصر الكبرى والشرفات النحاسية',
      'القبة الذهبية المنقوشة',
      'هلال الهيكل وقرص النصر'
    ];
    const activeSegment = segmentNames[correctCount] || 'ملحقات الزخرفة';
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
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      isCorrect 
        ? Animated.sequence([
            Animated.timing(pieceFlyAnim, {
              toValue: 1,
              duration: 950,
              useNativeDriver: true,
            }),
            Animated.timing(pieceGlowAnim, {
              toValue: 1,
              duration: 350,
              useNativeDriver: true,
            })
          ])
        : Animated.delay(200)
    ]).start();
  };

  // Move to next question or show results
  const handleNextQuestion = () => {
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
    outputRange: [-250, 0],
  });

  const fallingPieceScale = pieceFlyAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1.7, 1],
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
              اختبر قوة حفظك في متشابهات القرآن الكريم. كل إجابة صحيحة تضيف قطعة مزخرفة جديدة في قصرك وتكمل بناء المعلم الإسلامي الفاخر.
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
          {/* Fully Built Detailed Palace Showcase */}
          <View style={styles.showcaseBox}>
            <View style={styles.palaceContainer}>
              <PalaceBaseLayer />
              <View style={{ position: 'absolute', bottom: 15 }}><PalacePillarsLayer /></View>
              <View style={{ position: 'absolute', bottom: 15 }}><PalaceWallsLayer /></View>
              <View style={{ position: 'absolute', bottom: 85 }}><PalaceDomeLayer /></View>
              <View style={{ position: 'absolute', bottom: 15, right: 0 }}><PalaceMinaretLayer /></View>
            </View>
            <Text style={styles.showcaseLabel}>لقد اكتمل تشييد قصر المتشابهات الفاخر الخاص بك!</Text>
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
          {/* Cosmic Dusk Sky Scenic Background */}
          <View style={styles.skyBackground}>
            <View style={styles.sunriseSun} />
            {/* Glowing Stars */}
            <View style={[styles.star, { top: 40, left: 30 }]} />
            <View style={[styles.star, { top: 80, right: 60 }]} />
            <View style={[styles.star, { top: 120, left: 120, width: 4, height: 4 }]} />
            <View style={[styles.star, { top: 60, right: 150 }]} />
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
              <Text style={styles.statusSubtitle}>تم تشييد وتركيب: {unlockedSegment} (+10 XP)</Text>
            </View>
          ) : (
            <View style={[styles.statusBox, { backgroundColor: '#FDF2F2', borderColor: '#EF4444' }]}>
              <Text style={[styles.statusTitle, { color: '#E74C3C' }]}>❌ إجابة خاطئة</Text>
              <Text style={[styles.statusSubtitle, { color: '#C0392B' }]}>فشل تركيب القطعة الفنية، راجع التوضيح بالأسفل لإتمام البناء لاحقاً.</Text>
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
    backgroundColor: '#0A0F1D', // Deep night sky background
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
    bottom: -120,
    left: SCREEN_WIDTH / 2 - 160,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#D97706', // Golden sunrise glow at the horizon
    opacity: 0.25,
  },
  star: {
    position: 'absolute',
    width: 3,
    height: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 1.5,
    opacity: 0.7,
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
    width: 220,
    height: 195,
    alignSelf: 'center',
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 35,
  },
  palaceContainer: {
    width: 220,
    height: 195,
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
