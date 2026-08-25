import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions, PanResponder, Image as RNImage } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { mutashabihatQuestions, type MutashabahQuestion } from '../data/mutashabihat';
import Svg, { Path, Rect, Circle, G, Defs, ClipPath, Image as SvgImage } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// --- COMPONENT: HEAVEN SUNBEAMS ---
const HeavenSunbeams = React.memo(() => (
  <Svg width={SCREEN_WIDTH} height="280" viewBox={`0 0 ${SCREEN_WIDTH} 280`} style={styles.sunbeams}>
    <Path d={`M${SCREEN_WIDTH/2} 0 L0 280 L80 280 Z`} fill="#FFF2A9" opacity="0.1" />
    <Path d={`M${SCREEN_WIDTH/2} 0 L${SCREEN_WIDTH/3} 280 L${SCREEN_WIDTH/2} 280 Z`} fill="#FFF2A9" opacity="0.07" />
    <Path d={`M${SCREEN_WIDTH/2} 0 L${SCREEN_WIDTH*0.6} 280 L${SCREEN_WIDTH*0.85} 280 Z`} fill="#FFF2A9" opacity="0.08" />
    <Path d={`M${SCREEN_WIDTH/2} 0 L${SCREEN_WIDTH} 280 L${SCREEN_WIDTH-80} 280 Z`} fill="#FFF2A9" opacity="0.06" />
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
          duration: 4000 + Math.random() * 2000,
          useNativeDriver: true,
        })
      ]).start(() => run());
    };
    run();
    return () => { active = false; };
  }, []);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [220, 20]
  });

  const opacity = anim.interpolate({
    inputRange: [0, 0.2, 0.8, 1],
    outputRange: [0, 1, 1, 0]
  });

  const scale = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.5, 1.3, 0.5]
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

// --- DEFINE THE HIGH-FIDELITY CLIPPINGS ---
const PalaceClipDefs = () => (
  <Defs>
    {/* Clouds Base */}
    <ClipPath id="clipClouds">
      <Rect x="5" y="140" width="270" height="70" rx="15" />
    </ClipPath>

    {/* Main Walls */}
    <ClipPath id="clipWalls">
      <Rect x="78" y="85" width="124" height="75" rx="8" />
    </ClipPath>

    {/* Pillars */}
    <ClipPath id="clipPillars">
      <G>
        <Rect x="52" y="80" width="25" height="85" rx="3" />
        <Rect x="202" y="80" width="25" height="85" rx="3" />
      </G>
    </ClipPath>

    {/* Turrets/Side Towers */}
    <ClipPath id="clipTurrets">
      <G>
        <Rect x="10" y="85" width="45" height="75" rx="6" />
        <Rect x="225" y="85" width="45" height="75" rx="6" />
      </G>
    </ClipPath>

    {/* Main Golden Dome */}
    <ClipPath id="clipDome">
      <Path d="M80 85 C80 20 120 10 140 10 C160 10 200 20 200 85 Z" />
    </ClipPath>
  </Defs>
);

// --- COMPONENT: UNIFIED HIGH-QUALITY CLIP PALACE ---
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
      <Svg width="280" height="210" viewBox="0 0 280 210" fill="none">
        <PalaceClipDefs />

        {/* 1. Underlying Blueprint */}
        <SvgImage 
          href={require('../../assets/heaven_palace_render.jpg')}
          width="280"
          height="210"
          opacity="0.18"
        />

        {/* 2. Clouds Base */}
        <G id="cloudsLayer">
          <SvgImage 
            href={require('../../assets/heaven_palace_render.jpg')}
            width="280"
            height="210"
            clipPath="url(#clipClouds)"
          />
        </G>

        {/* 3. Main Walls */}
        {showWalls && (
          <SvgImage 
            href={require('../../assets/heaven_palace_render.jpg')}
            width="280"
            height="210"
            clipPath="url(#clipWalls)"
          />
        )}
        {showWallsPlaceholder && (
          <Rect x="78" y="85" width="124" height="75" rx="8" fill="none" stroke="#F5D061" strokeWidth="3" strokeDasharray="6,6" />
        )}

        {/* 4. Pillars */}
        {showPillars && (
          <SvgImage 
            href={require('../../assets/heaven_palace_render.jpg')}
            width="280"
            height="210"
            clipPath="url(#clipPillars)"
          />
        )}
        {showPillarsPlaceholder && (
          <G>
            <Rect x="52" y="80" width="25" height="85" rx="3" fill="none" stroke="#F5D061" strokeWidth="3" strokeDasharray="6,6" />
            <Rect x="202" y="80" width="25" height="85" rx="3" fill="none" stroke="#F5D061" strokeWidth="3" strokeDasharray="6,6" />
          </G>
        )}

        {/* 5. Turrets */}
        {showTurrets && (
          <SvgImage 
            href={require('../../assets/heaven_palace_render.jpg')}
            width="280"
            height="210"
            clipPath="url(#clipTurrets)"
          />
        )}
        {showTurretsPlaceholder && (
          <G>
            <Rect x="10" y="85" width="45" height="75" rx="6" fill="none" stroke="#F5D061" strokeWidth="3" strokeDasharray="6,6" />
            <Rect x="225" y="85" width="45" height="75" rx="6" fill="none" stroke="#F5D061" strokeWidth="3" strokeDasharray="6,6" />
          </G>
        )}

        {/* 6. Main Golden Dome */}
        {showDome && (
          <SvgImage 
            href={require('../../assets/heaven_palace_render.jpg')}
            width="280"
            height="210"
            clipPath="url(#clipDome)"
          />
        )}
        {showDomePlaceholder && (
          <Path d="M80 85 C80 20 120 10 140 10 C160 10 200 20 200 85 Z" fill="none" stroke="#F5D061" strokeWidth="3" strokeDasharray="6,6" />
        )}
      </Svg>
    </Animated.View>
  );
});

// --- TRAY PIECE PREVIEWS ---
const WallsPreview = () => (
  <Svg width="100" height="70" viewBox="50 50 180 130" fill="none">
    <PalaceClipDefs />
    <SvgImage 
      href={require('../../assets/heaven_palace_render.jpg')}
      width="280"
      height="210"
      clipPath="url(#clipWalls)"
    />
  </Svg>
);

const PillarsPreview = () => (
  <Svg width="100" height="70" viewBox="40 70 200 110" fill="none">
    <PalaceClipDefs />
    <SvgImage 
      href={require('../../assets/heaven_palace_render.jpg')}
      width="280"
      height="210"
      clipPath="url(#clipPillars)"
    />
  </Svg>
);

const TurretsPreview = () => (
  <Svg width="100" height="70" viewBox="0 70 280 110" fill="none">
    <PalaceClipDefs />
    <SvgImage 
      href={require('../../assets/heaven_palace_render.jpg')}
      width="280"
      height="210"
      clipPath="url(#clipTurrets)"
    />
  </Svg>
);

const DomePreview = () => (
  <Svg width="85" height="70" viewBox="60 0 160 110" fill="none">
    <PalaceClipDefs />
    <SvgImage 
      href={require('../../assets/heaven_palace_render.jpg')}
      width="280"
      height="210"
      clipPath="url(#clipDome)"
    />
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
      'جدران المحراب الرخامية المكتملة',
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
