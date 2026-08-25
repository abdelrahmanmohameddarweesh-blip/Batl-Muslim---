import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions, PanResponder } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { mutashabihatQuestions, type MutashabahQuestion } from '../data/mutashabihat';
import Svg, { Path, Rect, Circle, G, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// --- UNIFIED HIGH-FIDELITY GRADIENTS ---
const UnifiedGradients = () => (
  <Defs>
    <LinearGradient id="marbleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <Stop offset="0%" stopColor="#FFFFFF" />
      <Stop offset="35%" stopColor="#F9F5EC" />
      <Stop offset="100%" stopColor="#D2C9B9" />
    </LinearGradient>

    <LinearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <Stop offset="0%" stopColor="#FFF2A9" />
      <Stop offset="40%" stopColor="#E5B942" />
      <Stop offset="75%" stopColor="#C9981E" />
      <Stop offset="100%" stopColor="#876106" />
    </LinearGradient>

    <LinearGradient id="turquoiseGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <Stop offset="0%" stopColor="#64FFF5" />
      <Stop offset="50%" stopColor="#00B3A6" />
      <Stop offset="100%" stopColor="#005C55" />
    </LinearGradient>

    <LinearGradient id="cloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
      <Stop offset="60%" stopColor="#FFF0F4" stopOpacity="0.97" />
      <Stop offset="100%" stopColor="#F7C4E5" stopOpacity="0.93" />
    </LinearGradient>
  </Defs>
);

// --- COMPONENT: HEAVEN SUNBEAMS ---
const HeavenSunbeams = React.memo(() => (
  <Svg width={SCREEN_WIDTH} height="200" viewBox={`0 0 ${SCREEN_WIDTH} 200`} style={styles.sunbeams}>
    <Defs>
      <LinearGradient id="beamGrad" x1="0%" y1="0%" x2="50%" y2="100%">
        <Stop offset="0%" stopColor="#FFF4D0" stopOpacity="0.35" />
        <Stop offset="100%" stopColor="#FFF" stopOpacity="0" />
      </LinearGradient>
    </Defs>
    <Path d={`M${SCREEN_WIDTH/2} 0 L0 200 L50 200 Z`} fill="url(#beamGrad)" />
    <Path d={`M${SCREEN_WIDTH/2} 0 L${SCREEN_WIDTH/3} 200 L${SCREEN_WIDTH/2} 200 Z`} fill="url(#beamGrad)" />
    <Path d={`M${SCREEN_WIDTH/2} 0 L${SCREEN_WIDTH*0.6} 200 L${SCREEN_WIDTH*0.8} 200 Z`} fill="url(#beamGrad)" />
    <Path d={`M${SCREEN_WIDTH/2} 0 L${SCREEN_WIDTH} 200 L${SCREEN_WIDTH-50} 200 Z`} fill="url(#beamGrad)" />
  </Svg>
));

// --- COMPONENT: UNIFIED HEAVENLY PALACE (MEMOIZED & CACHED) ---
interface HeavenPalaceProps {
  correctCount: number;
  overlayCorrect: boolean;
  isSnapped: boolean;
  snapPopScale: Animated.Value | Animated.AnimatedInterpolation<number>;
}

const HeavenPalace = React.memo(({ correctCount, overlayCorrect, isSnapped, snapPopScale }: HeavenPalaceProps) => {
  const showWalls = correctCount >= 1 && (correctCount > 1 || !overlayCorrect || isSnapped);
  const showPillars = correctCount >= 2 && (correctCount > 2 || !overlayCorrect || isSnapped);
  const showTurrets = correctCount >= 3 && (correctCount > 3 || !overlayCorrect || isSnapped);
  const showDome = correctCount >= 4 && (correctCount > 4 || !overlayCorrect || isSnapped);

  const showWallsPlaceholder = overlayCorrect && correctCount === 1 && !isSnapped;
  const showPillarsPlaceholder = overlayCorrect && correctCount === 2 && !isSnapped;
  const showTurretsPlaceholder = overlayCorrect && correctCount === 3 && !isSnapped;
  const showDomePlaceholder = overlayCorrect && correctCount === 4 && !isSnapped;

  return (
    <Animated.View style={{ transform: [{ scale: snapPopScale }] }}>
      <Svg width="240" height="200" viewBox="0 0 240 200" fill="none">
        <UnifiedGradients />

        {/* 1. Clouds Base */}
        <G id="cloudsBase">
          <Circle cx="35" cy="175" r="20" fill="#FFEAF2" />
          <Circle cx="35" cy="171" r="18" fill="#FFFFFF" />
          
          <Circle cx="65" cy="167" r="24" fill="#FFEAF2" />
          <Circle cx="65" cy="163" r="22" fill="#FFFFFF" />

          <Circle cx="105" cy="171" r="26" fill="#FFEAF2" />
          <Circle cx="105" cy="167" r="24" fill="#FFFFFF" />

          <Circle cx="145" cy="163" r="28" fill="#FFEAF2" />
          <Circle cx="145" cy="159" r="26" fill="#FFFFFF" />

          <Circle cx="190" cy="169" r="24" fill="#FFEAF2" />
          <Circle cx="190" cy="165" r="22" fill="#FFFFFF" />

          <Circle cx="220" cy="173" r="20" fill="#FFEAF2" />
          <Circle cx="220" cy="169" r="18" fill="#FFFFFF" />

          <Rect width="220" height="16" x="10" y="165" rx="8" fill="#FFFFFF" />
          
          <Circle cx="55" cy="160" r="2.5" fill="#F5D061" />
          <Circle cx="135" cy="152" r="2" fill="#F5D061" />
          <Circle cx="180" cy="162" r="3" fill="#E5B942" />
        </G>

        {/* 2. Main Walls */}
        {showWalls && (
          <G id="walls">
            <Rect width="62" height="75" x="58" y="90" rx="4" fill="#FFFFFF" stroke="#E5B942" strokeWidth="1" />
            <Rect width="62" height="75" x="120" y="90" rx="4" fill="#EAE5DA" stroke="#C9981E" strokeWidth="1" />
            <Rect width="46" height="58" x="97" y="107" rx="3" fill="#D5CDBE" stroke="#E5B942" strokeWidth="1.2" />
            <Path d="M97 165v-37c0-11 8-20 19-20s19 9 19 20v37H97z" fill="#FFFDF0" stroke="#E5B942" strokeWidth="1.5" />
            <Path d="M101 165v-34c0-8 7-14 15-14s15 6 15 14v34H101z" fill="#008080" /> 
            <Path d="M68 128v-18c0-6 4-10 8-10s8 4 8 10v18H68z" fill="#00A89F" stroke="#E5B942" strokeWidth="1" />
            <Path d="M152 128v-18c0-6 4-10 8-10s8 4 8 10v18h-16z" fill="#006660" stroke="#C9981E" strokeWidth="1" />
            <Rect width="64" height="6" x="56" y="86" fill="#F5D061" rx="1" />
            <Rect width="64" height="6" x="120" y="86" fill="#C9981E" rx="1" />
          </G>
        )}
        {showWallsPlaceholder && (
          <G id="wallsPlaceholder" opacity="0.25">
            <Rect width="124" height="75" x="58" y="90" rx="8" fill="none" stroke="#E5B942" strokeWidth="2" strokeDasharray="4,4" />
          </G>
        )}

        {/* 3. Outer Pillars */}
        {showPillars && (
          <G id="pillars">
            <Rect width="12" height="74" x="48" y="92" rx="3" fill="#FFFFFF" stroke="#E5B942" strokeWidth="1" />
            <Rect width="18" height="6" x="45" y="88" rx="1.5" fill="#FFECA7" />
            <Rect width="18" height="6" x="45" y="163" rx="1.5" fill="#E5B942" />

            <Rect width="12" height="74" x="180" y="92" rx="3" fill="#D5CDBE" stroke="#C9981E" strokeWidth="1" />
            <Rect width="18" height="6" x="177" y="88" rx="1.5" fill="#C9981E" />
            <Rect width="18" height="6" x="177" y="163" rx="1.5" fill="#876106" />
          </G>
        )}
        {showPillarsPlaceholder && (
          <G id="pillarsPlaceholder" opacity="0.25">
            <Rect width="12" height="74" x="48" y="92" rx="3" fill="none" stroke="#E5B942" strokeWidth="1.5" strokeDasharray="4,4" />
            <Rect width="12" height="74" x="180" y="92" rx="3" fill="none" stroke="#E5B942" strokeWidth="1.5" strokeDasharray="4,4" />
          </G>
        )}

        {/* 4. Turquoise Domes */}
        {showTurrets && (
          <G id="turrets">
            <Path d="M20 148c0-18 10-25 18-25s18 7 18 25H20z" fill="#48D1CC" stroke="#E5B942" strokeWidth="1" />
            <Path d="M38 123v-10" stroke="#FFECA7" strokeWidth="1.5" />
            <Circle cx="38" cy="111" r="1.5" fill="#FFECA7" />

            <Path d="M182 148c0-18 10-25 18-25s18 7 18 25h-36z" fill="#008080" stroke="#C9981E" strokeWidth="1" />
            <Path d="M200 123v-10" stroke="#C9981E" strokeWidth="1.5" />
            <Circle cx="200" cy="111" r="1.5" fill="#C9981E" />
          </G>
        )}
        {showTurretsPlaceholder && (
          <G id="turretsPlaceholder" opacity="0.25">
            <Path d="M20 148c0-18 10-25 18-25s18 7 18 25H20z" fill="none" stroke="#E5B942" strokeWidth="1.5" strokeDasharray="4,4" />
            <Path d="M182 148c0-18 10-25 18-25s18 7 18 25h-36z" fill="none" stroke="#E5B942" strokeWidth="1.5" strokeDasharray="4,4" />
          </G>
        )}

        {/* 5. Main Golden Dome */}
        {showDome && (
          <G id="dome">
            <Rect width="31" height="8" x="89" y="78" fill="#FFFFFF" stroke="#E5B942" strokeWidth="1" />
            <Rect width="31" height="8" x="120" y="78" fill="#D5CDBE" stroke="#C9981E" strokeWidth="1" />
            <Path d="M90 78C90 48 110 38 120 38v40H90z" fill="#F5D061" stroke="#FFF" strokeWidth="1.5" />
            <Path d="M120 38c10 0 30 10 30 40H120V38z" fill="#C9981E" stroke="#FFF" strokeWidth="1.5" />
            <Path d="M120 38V25" stroke="#FFECA7" strokeWidth="2.5" />
            <Circle cx="120" cy="24" r="3" fill="#F5D061" />
          </G>
        )}
        {showDomePlaceholder && (
          <G id="domePlaceholder" opacity="0.25">
            <Path d="M90 78C90 48 110 38 120 38s30 10 30 40H90z" fill="none" stroke="#E5B942" strokeWidth="1.5" strokeDasharray="4,4" />
          </G>
        )}
      </Svg>
    </Animated.View>
  );
});

export default function MutashabihatScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { language } = useLanguage();

  const [screenState, setScreenState] = useState<'lobby' | 'quiz' | 'results'>('lobby');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard' | 'expert'>('medium');

  const [questions, setQuestions] = useState<MutashabahQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const [showPalaceOverlay, setShowPalaceOverlay] = useState(false);
  const [overlayCorrect, setOverlayCorrect] = useState(false);
  const [unlockedSegment, setUnlockedSegment] = useState('');
  const [isSnapped, setIsSnapped] = useState(false);

  // Gesture animated values
  const pan = useRef(new Animated.ValueXY()).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const pieceGlowAnim = useRef(new Animated.Value(0)).current;
  const snapPopScale = useRef(new Animated.Value(1)).current;

  // Background sparkles animations
  const sparkle1 = useRef(new Animated.Value(0)).current;
  const sparkle2 = useRef(new Animated.Value(0)).current;
  const sparkle3 = useRef(new Animated.Value(0)).current;

  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    const loopSparkle = (anim: Animated.Value, delay: number) => {
      anim.setValue(0);
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 3500 + Math.random() * 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    loopSparkle(sparkle1, 0);
    loopSparkle(sparkle2, 1000);
    loopSparkle(sparkle3, 2000);
  }, []);

  // Decoupled PanResponder Gesture: uses a lightweight, styled card to completely eliminate SVG drag rendering overhead
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isSnapped,
      onMoveShouldSetPanResponder: () => !isSnapped,
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false } // panResponder tracking offset
      ),
      onPanResponderRelease: (e, gestureState) => {
        // Drop success threshold: dragged up past -80px (very forgiving, instant response)
        if (gestureState.dy < -80 && Math.abs(gestureState.dx) < 100) {
          Animated.parallel([
            Animated.spring(pan.x, { toValue: 0, useNativeDriver: false }),
            Animated.spring(pan.y, { toValue: 0, useNativeDriver: false })
          ]).start(() => {
            setIsSnapped(true);
            snapPopScale.setValue(1);
            Animated.sequence([
              Animated.timing(snapPopScale, { toValue: 1.3, duration: 120, useNativeDriver: true }),
              Animated.timing(snapPopScale, { toValue: 1.0, duration: 120, useNativeDriver: true }),
              Animated.timing(pieceGlowAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
              Animated.timing(pieceGlowAnim, { toValue: 0, duration: 250, useNativeDriver: true })
            ]).start();
          });
        } else {
          // Instant spring back to tray
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        }
      }
    })
  ).current;

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

  const handleSelectOption = (option: string) => {
    if (answered) return;
    setSelectedAnswer(option);
    setAnswered(true);

    const isCorrect = option === currentQuestion.answer;
    setOverlayCorrect(isCorrect);
    setIsSnapped(false);
    pan.setValue({ x: 0, y: 0 });

    const segmentNames = [
      'جدران المحراب الرخامية المطعمة بالذهب',
      'أعمدة القصر المرخمة والتيجان الذهبية',
      'القباب الجانبية الفيروزية المشعة',
      'الهيكل الأساسي للقبة الذهبية الكبرى',
      'هلال النصر والرمح المضيء في قمة القصر'
    ];
    const activeSegment = segmentNames[correctCount] || 'ملحقات الزخرفة';
    setUnlockedSegment(activeSegment);

    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
    }

    setShowPalaceOverlay(true);
    overlayOpacity.setValue(0);
    pieceGlowAnim.setValue(0);

    Animated.timing(overlayOpacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  };

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

  const resultsPalaceScale = useRef(new Animated.Value(1)).current;

  // Interpolations for background sparkles
  const sparkle1Y = sparkle1.interpolate({ inputRange: [0, 1], outputRange: [180, 40] });
  const sparkle1Op = sparkle1.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 0.9, 0.9, 0] });

  const sparkle2Y = sparkle2.interpolate({ inputRange: [0, 1], outputRange: [190, 60] });
  const sparkle2Op = sparkle2.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 0.8, 0.8, 0] });

  const sparkle3Y = sparkle3.interpolate({ inputRange: [0, 1], outputRange: [175, 50] });
  const sparkle3Op = sparkle3.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 0.9, 0.9, 0] });

  return (
    <View style={styles.container}>
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => screenState === 'lobby' ? navigation.goBack() : handleReset()}>
          <Text style={[styles.backBtnText, { color: colors.primary }]}>🔙</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary, fontFamily: 'IBMPlexSansArabic-Bold' }]}>
          تحدي المتشابهات القرآني
        </Text>
      </View>

      {screenState === 'lobby' && (
        <ScrollView contentContainerStyle={styles.lobbyScroll}>
          <View style={[styles.infoBox, { backgroundColor: colors.primaryLight }]}>
            <Text style={{ fontSize: 38, marginBottom: 10 }}>🕌</Text>
            <Text style={[styles.infoTitle, { color: colors.primary }]}>
              تحدي بناء قصر المتشابهات
            </Text>
            <Text style={[styles.infoDesc, { color: colors.textSecondary }]}>
              اختبر قوة حفظك في متشابهات القرآن الكريم. كل إجابة صحيحة تضيف قطعة جديدة إلى قصرك العائم في جنان الخلد وتثبّت لبنات حفظك.
            </Text>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>اختر مستوى الصعوبة:</Text>

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

      {screenState === 'quiz' && currentQuestion && (
        <ScrollView contentContainerStyle={styles.quizScroll}>
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

          <View style={[styles.questionBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.ayahText, { color: colors.textPrimary }]}>
              {currentQuestion.prompt}
            </Text>
          </View>

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

      {screenState === 'results' && (
        <ScrollView contentContainerStyle={styles.resultsScroll}>
          <View style={styles.showcaseBox}>
            <View style={styles.palaceContainer}>
              <HeavenPalace 
                correctCount={correctCount} 
                overlayCorrect={false} 
                isSnapped={true} 
                snapPopScale={resultsPalaceScale} 
              />
            </View>
            <Text style={styles.showcaseLabel}>لقد اكتمل تجميع قصر الجنة العائم الخاص بك!</Text>
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

      {showPalaceOverlay && (
        <Animated.View style={[styles.overlayContainer, { opacity: overlayOpacity }]}>
          <View style={styles.skyBackground}>
            <HeavenSunbeams />
            <View style={styles.sunriseSun} />
            <View style={[styles.star, { top: 40, left: 30 }]} />
            <View style={[styles.star, { top: 80, right: 60 }]} />
            <View style={[styles.star, { top: 120, left: 120 }]} />
            <View style={[styles.star, { top: 60, right: 150 }]} />
          </View>

          <Text style={styles.overlayHeader}>قصر المتشابهات في الجنان</Text>
          
          <View style={styles.palaceStage}>
            {/* Ambient Background Aura Glow */}
            <View style={styles.palaceAuraGlow} />

            {/* Rising Sparkle Particles */}
            <Animated.View style={[styles.sparkleDot, { left: 55, transform: [{ translateY: sparkle1Y }], opacity: sparkle1Op }]} />
            <Animated.View style={[styles.sparkleDot, { left: 120, transform: [{ translateY: sparkle2Y }], opacity: sparkle2Op }]} />
            <Animated.View style={[styles.sparkleDot, { right: 60, transform: [{ translateY: sparkle3Y }], opacity: sparkle3Op }]} />

            <HeavenPalace 
              correctCount={correctCount} 
              overlayCorrect={overlayCorrect} 
              isSnapped={isSnapped} 
              snapPopScale={snapPopScale} 
            />
          </View>

          {/* Interactive Drag & Drop Game Zone */}
          {overlayCorrect ? (
            isSnapped ? (
              <View style={styles.statusBox}>
                <Text style={styles.statusTitle}>✨ تم التشييد والتركيب بنجاح!</Text>
                <Text style={styles.statusSubtitle}>تمت إضافة: {unlockedSegment} (+10 XP)</Text>
              </View>
            ) : (
              <View style={[styles.dragArea, { borderColor: colors.primary }]}>
                <Text style={styles.dragInstructions}>👇 اسحب لَبِنَة البناء الذهبية وضعها في هيكل القصر بالأعلى:</Text>
                <Animated.View 
                  style={[
                    styles.draggableItemCard, 
                    {
                      transform: [{ translateX: pan.x }, { translateY: pan.y }]
                    }
                  ]}
                  {...panResponder.panHandlers}
                >
                  <Text style={styles.draggableItemText}>🕌 اسحب للتشييد</Text>
                </Animated.View>
              </View>
            )
          ) : (
            <View style={[styles.statusBox, { backgroundColor: '#FDF2F2', borderColor: '#EF4444' }]}>
              <Text style={[styles.statusTitle, { color: '#E74C3C' }]}>❌ إجابة خاطئة</Text>
              <Text style={[styles.statusSubtitle, { color: '#C0392B' }]}>فشل تركيب القطعة، راجع التوضيح بالأسفل لتشييدها لاحقاً.</Text>
            </View>
          )}

          {(isSnapped || !overlayCorrect) ? (
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
          ) : (
            <View style={styles.bottomSpacer} />
          )}
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
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F3F4F6',
    zIndex: 99999,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  skyBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.48,
    backgroundColor: '#F5F3FF',
    overflow: 'hidden',
  },
  sunbeams: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  sunriseSun: {
    position: 'absolute',
    bottom: -150,
    left: SCREEN_WIDTH / 2 - 160,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#FAE8FF',
    opacity: 0.8,
  },
  star: {
    position: 'absolute',
    width: 3,
    height: 3,
    backgroundColor: '#D4AF37',
    borderRadius: 1.5,
    opacity: 0.6,
  },
  overlayHeader: {
    color: '#312E81',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: 'rgba(255,255,255,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  palaceStage: {
    width: 240,
    height: 200,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 20,
  },
  palaceAuraGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#FFF2CC',
    opacity: 0.25,
    zIndex: -1,
  },
  sparkleDot: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#F5D061',
    zIndex: 1,
  },
  palaceContainer: {
    width: 240,
    height: 200,
    justifyContent: 'center',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
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
  dragArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 15,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    minHeight: 150,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  dragInstructions: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  draggableItemCard: {
    width: 150,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F5D061',
    borderColor: '#C9981E',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
  },
  draggableItemText: {
    color: '#876106',
    fontWeight: 'bold',
    fontSize: 14,
  },
  explanationScroll: {
    flex: 1,
  },
  overlayExplanationCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  overlayExplanationHeader: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 8,
    textAlign: 'right',
  },
  overlayExplanationText: {
    fontSize: 14,
    color: '#374151',
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
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
  },
  overlayNextBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  bottomSpacer: {
    height: 120,
  },
});
