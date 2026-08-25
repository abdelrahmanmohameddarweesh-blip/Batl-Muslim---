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
  <Svg width={SCREEN_WIDTH} height="240" viewBox={`0 0 ${SCREEN_WIDTH} 240`} style={styles.sunbeams}>
    <Path d={`M${SCREEN_WIDTH/2} 0 L0 240 L60 240 Z`} fill="#FFE082" opacity="0.12" />
    <Path d={`M${SCREEN_WIDTH/2} 0 L${SCREEN_WIDTH/4} 240 L${SCREEN_WIDTH/2} 240 Z`} fill="#FFE082" opacity="0.08" />
    <Path d={`M${SCREEN_WIDTH/2} 0 L${SCREEN_WIDTH*0.55} 240 L${SCREEN_WIDTH*0.75} 240 Z`} fill="#FFE082" opacity="0.1" />
    <Path d={`M${SCREEN_WIDTH/2} 0 L${SCREEN_WIDTH} 240 L${SCREEN_WIDTH-60} 240 Z`} fill="#FFE082" opacity="0.07" />
  </Svg>
));

// --- COMPONENT: STARDUST PARTICLES ---
interface SparkleProps {
  delay: number;
  left: number;
  size: number;
}
const Sparkle = React.memo(({ delay, left, size }: SparkleProps) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let active = true;
    const run = () => {
      if (!active) return;
      anim.setValue(0);
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: 3500 + Math.random() * 2000,
          useNativeDriver: true,
        })
      ]).start(() => run());
    };
    run();
    return () => { active = false; };
  }, []);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [180, 20]
  });

  const opacity = anim.interpolate({
    inputRange: [0, 0.2, 0.8, 1],
    outputRange: [0, 0.9, 0.9, 0]
  });

  const scale = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 1.2, 0.6]
  });

  return (
    <Animated.View
      style={[
        styles.absoluteSparkle,
        {
          left,
          width: size,
          height: size,
          borderRadius: size / 2,
          transform: [{ translateY }, { scale }],
          opacity,
        }
      ]}
    />
  );
});

// --- INDIVIDUAL HIGH-DETAILED PIECE DRAWINGS (CODE-DRIVEN VECTORS) ---
// Walls: Detailed marble blocks, drawbridge, gate arches, gold chain, windows
const WallsPiece = () => (
  <G id="walls">
    {/* Left Wall (Light Side) */}
    <Rect width="62" height="75" x="58" y="90" rx="4" fill="url(#marbleGrad)" stroke="url(#goldGrad)" strokeWidth="1.2" />
    {/* Right Wall (Dark/Shadow Side) */}
    <Rect width="62" height="75" x="120" y="90" rx="4" fill="#D5CDBE" stroke="#C9981E" strokeWidth="1.2" />
    
    {/* Detailed Stone Bricks Lines */}
    <Path d="M58 115h124M58 140h124M89 90v75M151 90v75" stroke="#FFFFFF" strokeWidth="0.8" opacity="0.4" />
    <Path d="M120 90v75" stroke="#876106" strokeWidth="0.8" opacity="0.25" />

    {/* Doorway Arch Frame */}
    <Rect width="46" height="58" x="97" y="107" rx="3" fill="#D5CDBE" stroke="url(#goldGrad)" strokeWidth="1.2" />
    <Path d="M97 165v-37c0-11 8-20 19-20s19 9 19 20v37H97z" fill="url(#marbleGrad)" stroke="url(#goldGrad)" strokeWidth="1.5" />
    <Path d="M101 165v-34c0-8 7-14 15-14s15 6 15 14v34H101z" fill="url(#turquoiseGrad)" /> 

    {/* Drawbridge Chains */}
    <Path d="M99 165 L106 130" stroke="url(#goldGrad)" strokeWidth="1.2" />
    <Path d="M141 165 L134 130" stroke="url(#goldGrad)" strokeWidth="1.2" />
    <Circle cx="106" cy="130" r="1.5" fill="#FFECA7" />
    <Circle cx="134" cy="130" r="1.5" fill="#FFECA7" />

    {/* Windows */}
    <Path d="M68 128v-18c0-6 4-10 8-10s8 4 8 10v18H68z" fill="url(#turquoiseGrad)" stroke="url(#goldGrad)" strokeWidth="1" />
    <Path d="M152 128v-18c0-6 4-10 8-10s8 4 8 10v18h-16z" fill="#005C55" stroke="url(#goldGrad)" strokeWidth="1" />
    
    {/* Cornice trim */}
    <Rect width="64" height="6" x="56" y="86" fill="url(#goldGrad)" rx="1" />
    <Rect width="64" height="6" x="120" y="86" fill="#C9981E" rx="1" />
  </G>
);

// Pillars: Detailed columns, capitals, winding gold vines
const PillarsPiece = () => (
  <G id="pillars">
    {/* Left Pillar */}
    <Rect width="12" height="74" x="48" y="92" rx="3" fill="url(#marbleGrad)" stroke="url(#goldGrad)" strokeWidth="1" />
    {/* Column fluting */}
    <Path d="M52 92v74M56 92v74" stroke="#FFF" strokeWidth="0.8" opacity="0.6" />
    {/* Capital/Base */}
    <Rect width="18" height="6" x="45" y="88" rx="1.5" fill="url(#goldGrad)" />
    <Rect width="18" height="6" x="45" y="163" rx="1.5" fill="url(#goldGrad)" />
    {/* Gold vine winding */}
    <Path d="M48 160 C55 140 45 120 54 100" stroke="#FFECA7" strokeWidth="1" fill="none" />

    {/* Right Pillar */}
    <Rect width="12" height="74" x="180" y="92" rx="3" fill="#D5CDBE" stroke="#C9981E" strokeWidth="1" />
    <Path d="M184 92v74M188 92v74" stroke="#FFF" strokeWidth="0.8" opacity="0.3" />
    <Rect width="18" height="6" x="177" y="88" rx="1.5" fill="#C9981E" />
    <Rect width="18" height="6" x="177" y="163" rx="1.5" fill="#876106" />
    <Path d="M180 160 C187 140 177 120 186 100" stroke="#C9981E" strokeWidth="1" fill="none" />
  </G>
);

// Turrets: Side towers, turquoise conical roofs, shingle shading, waving red flags
const TurretsPiece = () => (
  <G id="turrets">
    {/* Left Tower Wall */}
    <Rect width="24" height="40" x="26" y="125" fill="url(#marbleGrad)" stroke="url(#goldGrad)" strokeWidth="1" />
    <Path d="M26 135h24M26 148h24" stroke="#FFF" strokeWidth="0.8" opacity="0.4" />
    {/* Left Turquoise Dome */}
    <Path d="M20 125c0-18 18-25 18-25s18 7 18 25H20z" fill="url(#turquoiseGrad)" stroke="url(#goldGrad)" strokeWidth="1" />
    {/* Left Shingles */}
    <Path d="M38 100c-5 6-10 14-10 25M38 100c5 6 10 14 10 25" stroke="#FFECA7" strokeWidth="1.2" opacity="0.5" />
    <Path d="M38 100v-10" stroke="url(#goldGrad)" strokeWidth="1.5" />
    {/* Red Flag */}
    <Path d="M38 90 L48 86 L38 82 Z" fill="#E74C3C" />
    <Circle cx="38" cy="90" r="1" fill="url(#goldGrad)" />

    {/* Right Tower Wall */}
    <Rect width="24" height="40" x="190" y="125" fill="#D5CDBE" stroke="#C9981E" strokeWidth="1" />
    <Path d="M190 135h24M190 148h24" stroke="#FFF" strokeWidth="0.8" opacity="0.2" />
    {/* Right Turquoise Dome */}
    <Path d="M184 125c0-18 18-25 18-25s18 7 18 25h-36z" fill="#008080" stroke="#C9981E" strokeWidth="1" />
    {/* Right Shingles */}
    <Path d="M202 100c-5 6-10 14-10 25M202 100c5 6 10 14 10 25" stroke="#005C55" strokeWidth="1.2" opacity="0.5" />
    <Path d="M202 100v-10" stroke="#C9981E" strokeWidth="1.5" />
    {/* Red Flag */}
    <Path d="M202 90 L212 86 L202 82 Z" fill="#C0392B" />
    <Circle cx="202" cy="90" r="1" fill="#C9981E" />
  </G>
);

// Main Golden Dome: Grand golden dome, vertical rib lines, gold crescent
const DomePiece = () => (
  <G id="dome">
    {/* Arch base */}
    <Rect width="31" height="8" x="89" y="78" fill="url(#marbleGrad)" stroke="url(#goldGrad)" strokeWidth="1" />
    <Rect width="31" height="8" x="120" y="78" fill="#D5CDBE" stroke="#C9981E" strokeWidth="1" />
    
    {/* Dome Body (Flat-3D) */}
    <Path d="M90 78C90 48 110 38 120 38v40H90z" fill="#F5D061" stroke="#FFF" strokeWidth="1.5" />
    <Path d="M120 38c10 0 30 10 30 40H120V38z" fill="#C9981E" stroke="#FFF" strokeWidth="1.5" />

    {/* Rib details */}
    <Path d="M120 38c-6 10-12 25-12 40 M120 38c6 10 12 25 12 40" stroke="#FFF" strokeWidth="1" opacity="0.45" />

    {/* Gold spire and crescent */}
    <Path d="M120 38V25" stroke="url(#goldGrad)" strokeWidth="2.5" />
    <Path d="M117 21a3 3 0 1 1 6 0 3 3 0 1 0-6 0z" fill="url(#goldGrad)" />
    <Circle cx="120" cy="24" r="1.5" fill="#FFECA7" />
  </G>
);

// --- COMPONENT: UNIFIED HEAVENLY PALACE ---
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
          <Rect width="220" height="16" x="10" y="165" rx="8" fill="url(#cloudGrad)" />
          
          <Circle cx="55" cy="160" r="2.5" fill="url(#goldGrad)" opacity="0.6" />
          <Circle cx="135" cy="152" r="2" fill="url(#goldGrad)" opacity="0.7" />
          <Circle cx="180" cy="162" r="3" fill="url(#goldGrad)" opacity="0.5" />
        </G>

        {/* 2. Main Walls */}
        {showWalls && <WallsPiece />}
        {showWallsPlaceholder && (
          <G id="wallsPlaceholder" opacity="0.35">
            <Rect width="124" height="75" x="58" y="90" rx="8" fill="none" stroke="#E5B942" strokeWidth="2.5" strokeDasharray="5,5" />
          </G>
        )}

        {/* 3. Outer Pillars */}
        {showPillars && <PillarsPiece />}
        {showPillarsPlaceholder && (
          <G id="pillarsPlaceholder" opacity="0.35">
            <Rect width="12" height="74" x="48" y="92" rx="3" fill="none" stroke="#E5B942" strokeWidth="2.5" strokeDasharray="5,5" />
            <Rect width="12" height="74" x="180" y="92" rx="3" fill="none" stroke="#E5B942" strokeWidth="2.5" strokeDasharray="5,5" />
          </G>
        )}

        {/* 4. Turquoise Domes */}
        {showTurrets && <TurretsPiece />}
        {showTurretsPlaceholder && (
          <G id="turretsPlaceholder" opacity="0.35">
            <Path d="M20 125c0-18 18-25 18-25s18 7 18 25H20z" fill="none" stroke="#E5B942" strokeWidth="2.5" strokeDasharray="5,5" />
            <Path d="M184 125c0-18 18-25 18-25s18 7 18 25h-36z" fill="none" stroke="#E5B942" strokeWidth="2.5" strokeDasharray="5,5" />
          </G>
        )}

        {/* 5. Main Golden Dome */}
        {showDome && <DomePiece />}
        {showDomePlaceholder && (
          <G id="domePlaceholder" opacity="0.35">
            <Path d="M90 78C90 48 110 38 120 38s30 10 30 40H90z" fill="none" stroke="#E5B942" strokeWidth="2.5" strokeDasharray="5,5" />
          </G>
        )}
      </Svg>
    </Animated.View>
  );
});

// --- INDIVIDUAL PIECE DRAGGABLE PREVIEWS (RENDERED LOCALLY FROM THE ACTUAL SVG PATHS) ---
const WallsPreview = () => (
  <Svg width="110" height="75" viewBox="0 0 240 200" fill="none">
    <UnifiedGradients />
    <WallsPiece />
  </Svg>
);

const PillarsPreview = () => (
  <Svg width="110" height="75" viewBox="0 0 240 200" fill="none">
    <UnifiedGradients />
    <PillarsPiece />
  </Svg>
);

const TurretsPreview = () => (
  <Svg width="110" height="75" viewBox="0 0 240 200" fill="none">
    <UnifiedGradients />
    <TurretsPiece />
  </Svg>
);

const DomePreview = () => (
  <Svg width="90" height="75" viewBox="0 0 240 200" fill="none">
    <UnifiedGradients />
    <DomePiece />
  </Svg>
);

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

  // Ambient rotation for the gold halo ring
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Celestial key idle bobbing
  const bobAnim = useRef(new Animated.Value(0)).current;

  const currentQuestion = questions[currentIndex];

  // Run ambient animations
  useEffect(() => {
    if (showPalaceOverlay) {
      // Celestial Ring rotation
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 25000,
          useNativeDriver: false,
        })
      ).start();

      // Key Bobbing loop
      Animated.loop(
        Animated.sequence([
          Animated.timing(bobAnim, { toValue: 1, duration: 1400, useNativeDriver: false }),
          Animated.timing(bobAnim, { toValue: 0, duration: 1400, useNativeDriver: false })
        ])
      ).start();
    }
  }, [showPalaceOverlay]);

  // Decoupled PanResponder Gesture: uses JS driver layout tracking to prevent iOS native module errors
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isSnapped,
      onMoveShouldSetPanResponder: () => !isSnapped,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false } // panResponder tracking offset
      ),
      onPanResponderRelease: (e, gestureState) => {
        pan.flattenOffset();
        // Snaps magnetically if dragged above -80px threshold (very smooth and forgiving)
        if (gestureState.dy < -80 && Math.abs(gestureState.dx) < 100) {
          Animated.parallel([
            Animated.spring(pan.x, { toValue: 0, useNativeDriver: false }),
            Animated.spring(pan.y, { toValue: 0, useNativeDriver: false })
          ]).start(() => {
            setIsSnapped(true);
            snapPopScale.setValue(1);
            Animated.sequence([
              Animated.timing(snapPopScale, { toValue: 1.3, duration: 120, useNativeDriver: false }),
              Animated.timing(snapPopScale, { toValue: 1.0, duration: 120, useNativeDriver: false }),
              Animated.timing(pieceGlowAnim, { toValue: 1, duration: 250, useNativeDriver: false }),
              Animated.timing(pieceGlowAnim, { toValue: 0, duration: 250, useNativeDriver: false })
            ]).start();
          });
        } else {
          // Instant spring back using JS driver
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
      'جدران القلعة الرخامية المكتملة',
      'أعمدة الصرح المرخمة والتيجان الذهبية',
      'الأبراج والقنوات الفيروزية الحامية',
      'القبة الكبرى والهلال الذهبي المشع صرح النور'
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
      useNativeDriver: false,
    }).start();
  };

  const handleNextQuestion = () => {
    Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
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

  // Spin rotation for rotating celestial halo ring
  const spinRotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  // Bob translation for idle key
  const keyBobY = bobAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8]
  });

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
            <Text style={styles.showcaseLabel}>لقد اكتمل تجميع صرح النور العائم الخاص بك!</Text>
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
            
            {/* Drifting Sparkles Loops */}
            <Sparkle left={30} size={6} delay={0} />
            <Sparkle left={80} size={4} delay={1200} />
            <Sparkle left={130} size={8} delay={500} />
            <Sparkle left={190} size={5} delay={2000} />
            <Sparkle left={60} size={7} delay={2800} />
            <Sparkle left={160} size={4} delay={1500} />
            <Sparkle left={210} size={6} delay={800} />
            <Sparkle left={110} size={5} delay={3500} />
          </View>

          <Text style={styles.overlayHeader}>قصر المتشابهات في الجنان</Text>
          
          <View style={styles.palaceStage}>
            {/* Ambient Rotating Gold Ring */}
            <Animated.View style={[styles.palaceRotateRing, { transform: [{ rotate: spinRotation }] }]} />

            {/* Glowing Aura Backplate */}
            <View style={styles.palaceAuraGlow} />

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
                <Text style={styles.dragInstructions}>👇 اسحب القطعة اللؤلؤية وضعها في هيكل القصر بالأعلى:</Text>
                <View style={styles.cushionContainer}>
                  <Animated.View 
                    style={[
                      styles.draggableItemCard, 
                      {
                        transform: [
                          { translateX: pan.x },
                          { translateY: Animated.add(pan.y, keyBobY) }
                        ]
                      }
                    ]}
                    {...panResponder.panHandlers}
                  >
                    {renderActivePiecePreview()}
                  </Animated.View>
                </View>
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
  resultsPalaceImage: {
    width: 240,
    height: 200,
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: '#E5B942',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
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
    backgroundColor: '#0F0926',
    overflow: 'hidden',
  },
  sunbeams: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 240,
  },
  sunriseSun: {
    position: 'absolute',
    bottom: -150,
    left: SCREEN_WIDTH / 2 - 160,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#2A1A54',
    opacity: 0.8,
  },
  absoluteSparkle: {
    position: 'absolute',
    backgroundColor: '#FFF2A9',
    zIndex: 1,
    shadowColor: '#FFF2A9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  overlayHeader: {
    color: '#E5B942',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: 'rgba(0,0,0,0.6)',
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
    opacity: 0.12,
    zIndex: -1,
  },
  palaceRotateRing: {
    position: 'absolute',
    width: 236,
    height: 236,
    borderRadius: 118,
    borderWidth: 2,
    borderColor: 'rgba(229, 185, 66, 0.25)',
    borderStyle: 'dashed',
    zIndex: -1,
  },
  palaceContainer: {
    width: 240,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
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
    borderWidth: 2.5,
    borderColor: '#E5B942',
    borderStyle: 'dashed',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 9, 38, 0.45)',
    minHeight: 150,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dragInstructions: {
    fontSize: 14,
    color: '#E5B942',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  cushionContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    height: 90,
  },
  draggableItemCard: {
    width: 130,
    height: 80,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(229, 185, 66, 0.3)',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
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
