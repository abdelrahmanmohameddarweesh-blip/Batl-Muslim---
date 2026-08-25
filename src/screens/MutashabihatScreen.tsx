import React, { useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions, PanResponder } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { mutashabihatQuestions, type MutashabahQuestion } from '../data/mutashabihat';
import Svg, { Path, Rect, Circle, Defs, LinearGradient, Stop, G } from 'react-native-svg';

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
          <Circle cx="35" cy="175" r="20" fill="url(#cloudGrad)" />
          <Circle cx="65" cy="167" r="24" fill="url(#cloudGrad)" />
          <Circle cx="105" cy="171" r="26" fill="url(#cloudGrad)" />
          <Circle cx="145" cy="163" r="28" fill="url(#cloudGrad)" />
          <Circle cx="190" cy="169" r="24" fill="url(#cloudGrad)" />
          <Circle cx="220" cy="173" r="20" fill="url(#cloudGrad)" />
          <Rect width="220" height="16" x="10" y="169" rx="8" fill="url(#cloudGrad)" />
          
          <Circle cx="55" cy="169" r="2.5" fill="url(#goldGrad)" opacity="0.6" />
          <Circle cx="135" cy="161" r="2" fill="url(#goldGrad)" opacity="0.7" />
          <Circle cx="180" cy="171" r="3" fill="url(#goldGrad)" opacity="0.5" />
        </G>

        {/* 2. Main Walls */}
        {showWalls && (
          <G id="walls">
            <Rect width="124" height="75" x="58" y="90" rx="8" fill="url(#marbleGrad)" stroke="url(#goldGrad)" strokeWidth="1.8" />
            <Rect width="46" height="58" x="97" y="107" rx="5" fill="none" stroke="url(#goldGrad)" strokeWidth="1.2" strokeDasharray="3,3" />
            <Path d="M97 165v-37c0-11 8-20 19-20s19 9 19 20v37H97z" fill="url(#marbleGrad)" stroke="url(#goldGrad)" strokeWidth="1.5" />
            <Path d="M101 165v-34c0-8 7-14 15-14s15 6 15 14v34H101z" fill="url(#turquoiseGrad)" /> 
            <Path d="M68 128v-18c0-6 4-10 8-10s8 4 8 10v18H68z" fill="url(#turquoiseGrad)" stroke="url(#goldGrad)" strokeWidth="1.5" />
            <Path d="M68 116h16M76 100v28" stroke="url(#goldGrad)" strokeWidth="0.8" />
            <Path d="M152 128v-18c0-6 4-10 8-10s8 4 8 10v18h-16z" fill="url(#turquoiseGrad)" stroke="url(#goldGrad)" strokeWidth="1.5" />
            <Path d="M152 116h16M160 100v28" stroke="url(#goldGrad)" strokeWidth="0.8" />
            <Rect width="128" height="6" x="56" y="86" fill="url(#goldGrad)" rx="2" />
          </G>
        )}
        {showWallsPlaceholder && (
          <G id="wallsPlaceholder" opacity="0.25">
            <Rect width="124" height="75" x="58" y="90" rx="8" fill="none" stroke="url(#goldGrad)" strokeWidth="2" strokeDasharray="4,4" />
          </G>
        )}

        {/* 3. Outer Pillars */}
        {showPillars && (
          <G id="pillars">
            <Rect width="12" height="74" x="48" y="92" rx="3" fill="url(#marbleGrad)" stroke="url(#goldGrad)" strokeWidth="1" />
            <Path d="M54 92v74" stroke="#FFF" strokeWidth="0.8" />
            <Rect width="18" height="6" x="45" y="88" rx="1.5" fill="url(#goldGrad)" />
            <Rect width="18" height="6" x="45" y="163" rx="1.5" fill="url(#goldGrad)" />

            <Rect width="12" height="74" x="180" y="92" rx="3" fill="url(#marbleGrad)" stroke="url(#goldGrad)" strokeWidth="1" />
            <Path d="M186 92v74" stroke="#FFF" strokeWidth="0.8" />
            <Rect width="18" height="6" x="177" y="88" rx="1.5" fill="url(#goldGrad)" />
            <Rect width="18" height="6" x="177" y="163" rx="1.5" fill="url(#goldGrad)" />
          </G>
        )}
        {showPillarsPlaceholder && (
          <G id="pillarsPlaceholder" opacity="0.25">
            <Rect width="12" height="74" x="48" y="92" rx="3" fill="none" stroke="url(#goldGrad)" strokeWidth="1.5" strokeDasharray="4,4" />
            <Rect width="12" height="74" x="180" y="92" rx="3" fill="none" stroke="url(#goldGrad)" strokeWidth="1.5" strokeDasharray="4,4" />
          </G>
        )}

        {/* 4. Turquoise Domes */}
        {showTurrets && (
          <G id="turrets">
            <Path d="M20 148c0-18 10-25 18-25s18 7 18 25H20z" fill="url(#turquoiseGrad)" stroke="url(#goldGrad)" strokeWidth="1.2" />
            <Path d="M38 123v-10" stroke="url(#goldGrad)" strokeWidth="1.5" />
            <Circle cx="38" cy="111" r="1.5" fill="url(#goldGrad)" />

            <Path d="M182 148c0-18 10-25 18-25s18 7 18 25h-36z" fill="url(#turquoiseGrad)" stroke="url(#goldGrad)" strokeWidth="1.2" />
            <Path d="M200 123v-10" stroke="url(#goldGrad)" strokeWidth="1.5" />
            <Circle cx="200" cy="111" r="1.5" fill="url(#goldGrad)" />
          </G>
        )}
        {showTurretsPlaceholder && (
          <G id="turretsPlaceholder" opacity="0.25">
            <Path d="M20 148c0-18 10-25 18-25s18 7 18 25H20z" fill="none" stroke="url(#goldGrad)" strokeWidth="1.5" strokeDasharray="4,4" />
            <Path d="M182 148c0-18 10-25 18-25s18 7 18 25h-36z" fill="none" stroke="url(#goldGrad)" strokeWidth="1.5" strokeDasharray="4,4" />
          </G>
        )}

        {/* 5. Main Golden Dome */}
        {showDome && (
          <G id="dome">
            <Rect width="62" height="8" x="89" y="78" fill="url(#marbleGrad)" stroke="url(#goldGrad)" strokeWidth="1.2" />
            <Circle cx="97" cy="82" r="1.8" fill="url(#goldGrad)" />
            <Circle cx="109" cy="82" r="1.8" fill="url(#goldGrad)" />
            <Circle cx="121" cy="82" r="1.8" fill="url(#goldGrad)" />
            <Circle cx="133" cy="82" r="1.8" fill="url(#goldGrad)" />
            <Circle cx="145" cy="82" r="1.8" fill="url(#goldGrad)" />
            
            <Path d="M90 78C90 48 110 38 120 38s30 10 30 40H90z" fill="url(#goldGrad)" stroke="#FFF" strokeWidth="1.5" />
            <Path d="M120 38c-6 10-12 25-12 40" stroke="#FFF" strokeWidth="1" opacity="0.45" />
            <Path d="M120 38c6 10 12 25 12 40" stroke="#FFF" strokeWidth="1" opacity="0.45" />
            <Path d="M120 38V25" stroke="url(#goldGrad)" strokeWidth="2.8" />
            <Circle cx="120" cy="24" r="3" fill="url(#goldGrad)" />
          </G>
        )}
        {showDomePlaceholder && (
          <G id="domePlaceholder" opacity="0.25">
            <Path d="M90 78C90 48 110 38 120 38s30 10 30 40H90z" fill="none" stroke="url(#goldGrad)" strokeWidth="1.5" strokeDasharray="4,4" />
          </G>
        )}
      </Svg>
    </Animated.View>
  );
});

// --- INDIVIDUAL TRAY PREVIEW COMPONENTS ---
const WallsPreview = React.memo(() => (
  <Svg width="100" height="65" viewBox="0 0 130 85" fill="none">
    <UnifiedGradients />
    <Rect width="124" height="75" x="3" y="5" rx="8" fill="url(#marbleGrad)" stroke="url(#goldGrad)" strokeWidth="2" />
    <Path d="M46 85V48c0-11 8-20 19-20s19 9 19 20v37H46z" fill="url(#marbleGrad)" stroke="url(#goldGrad)" strokeWidth="1.5" />
    <Path d="M50 85V51c0-8 7-14 15-14s15 6 15 14v34H50z" fill="url(#turquoiseGrad)" /> 
    <Rect width="128" height="6" x="1" y="1" fill="url(#goldGrad)" rx="2" />
  </Svg>
));

const PillarsPreview = React.memo(() => (
  <Svg width="100" height="65" viewBox="0 0 150 85" fill="none">
    <UnifiedGradients />
    <Rect width="12" height="74" x="15" y="8" rx="3" fill="url(#marbleGrad)" stroke="url(#goldGrad)" strokeWidth="1.2" />
    <Rect width="18" height="6" x="12" y="4" rx="1.5" fill="url(#goldGrad)" />
    <Rect width="18" height="6" x="12" y="79" rx="1.5" fill="url(#goldGrad)" />
    <Rect width="12" height="74" x="120" y="8" rx="3" fill="url(#marbleGrad)" stroke="url(#goldGrad)" strokeWidth="1.2" />
    <Rect width="18" height="6" x="117" y="4" rx="1.5" fill="url(#goldGrad)" />
    <Rect width="18" height="6" x="117" y="79" rx="1.5" fill="url(#goldGrad)" />
  </Svg>
));

const TurretsPreview = React.memo(() => (
  <Svg width="100" height="65" viewBox="0 0 160 75" fill="none">
    <UnifiedGradients />
    <Path d="M10 60c0-18 10-25 18-25s18 7 18 25H10z" fill="url(#turquoiseGrad)" stroke="url(#goldGrad)" strokeWidth="1.2" />
    <Path d="M28 35V25" stroke="url(#goldGrad)" strokeWidth="1.5" />
    <Circle cx="28" cy="23" r="1.5" fill="url(#goldGrad)" />
    <Path d="M114 60c0-18 10-25 18-25s18 7 18 25h-36z" fill="url(#turquoiseGrad)" stroke="url(#goldGrad)" strokeWidth="1.2" />
    <Path d="M132 35V25" stroke="url(#goldGrad)" strokeWidth="1.5" />
    <Circle cx="132" cy="23" r="1.5" fill="url(#goldGrad)" />
  </Svg>
));

const DomePreview = React.memo(() => (
  <Svg width="80" height="65" viewBox="0 0 90 75" fill="none">
    <UnifiedGradients />
    <Rect width="62" height="8" x="14" y="48" fill="url(#marbleGrad)" stroke="url(#goldGrad)" strokeWidth="1.2" />
    <Path d="M15 48C15 18 35 8 45 8s30 10 30 40H15z" fill="url(#goldGrad)" stroke="#FFF" strokeWidth="1.5" />
    <Path d="M45 8V-5" stroke="url(#goldGrad)" strokeWidth="2.8" />
    <Circle cx="45" cy="-6" r="3" fill="url(#goldGrad)" />
  </Svg>
));

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

  const currentQuestion = questions[currentIndex];

  // Drag and Drop Gesture Setup with Native Driver for buttery smooth 60 FPS translation
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isSnapped,
      onMoveShouldSetPanResponder: () => !isSnapped,
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (e, gestureState) => {
        // Drop success threshold: dragged high enough (dy < -110)
        if (gestureState.dy < -110 && Math.abs(gestureState.dx) < 95) {
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

  const renderActivePiecePreview = () => {
    const targetIdx = overlayCorrect ? correctCount - 1 : correctCount;
    if (targetIdx === 0) return <WallsPreview />;
    if (targetIdx === 1) return <PillarsPreview />;
    if (targetIdx === 2) return <TurretsPreview />;
    if (targetIdx === 3) return <DomePreview />;
    return null;
  };

  const resultsPalaceScale = useRef(new Animated.Value(1)).current;

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
            <HeavenPalace 
              correctCount={correctCount} 
              overlayCorrect={overlayCorrect} 
              isSnapped={isSnapped} 
              snapPopScale={snapPopScale} 
            />
          </View>

          {overlayCorrect ? (
            isSnapped ? (
              <View style={styles.statusBox}>
                <Text style={styles.statusTitle}>✨ تم التشييد والتركيب بنجاح!</Text>
                <Text style={styles.statusSubtitle}>تمت إضافة: {unlockedSegment} (+10 XP)</Text>
              </View>
            ) : (
              <View style={[styles.dragArea, { borderColor: colors.primary }]}>
                <Text style={styles.dragInstructions}>👇 اسحب القطعة اللؤلؤية إلى مكانها المناسب على القصر:</Text>
                <Animated.View 
                  style={[
                    styles.draggableItem, 
                    {
                      transform: [{ translateX: pan.x }, { translateY: pan.y }]
                    }
                  ]}
                  {...panResponder.panHandlers}
                >
                  {renderActivePiecePreview()}
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
  draggableItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
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
