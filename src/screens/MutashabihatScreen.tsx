import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions, PanResponder, Image } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { mutashabihatQuestions, type MutashabahQuestion } from '../data/mutashabihat';
import Svg, { Path, Circle } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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

// --- COMPONENT: PHOTOREALISTIC HEAVENLY PALACE CANVAS ---
interface HeavenPalaceProps {
  correctCount: number;
  overlayCorrect: boolean;
  isSnapped: boolean;
  revealHeight: Animated.Value;
}

const HeavenPalace = React.memo(({ correctCount, overlayCorrect, isSnapped, revealHeight }: HeavenPalaceProps) => {
  // Glow beam pulse animation
  const glowPulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0.4, duration: 800, useNativeDriver: true })
      ])
    ).start();
  }, []);

  // Determine current construction target label based on correctCount
  const showPlaceholderHighlight = overlayCorrect && !isSnapped;

  return (
    <View style={styles.palaceCanvasOuter}>
      {/* 1. Underlying Blueprint: Desaturated, low opacity version of the gorgeous photorealistic render */}
      <Image 
        source={require('../../assets/heaven_palace_render.jpg')}
        style={[styles.palaceImageBase, { opacity: 0.15 }]}
        resizeMode="cover"
      />

      {/* 2. Full Color Construction Layer: Clipped height container revealing from bottom to top */}
      <Animated.View style={[styles.palaceRevealContainer, { height: revealHeight }]}>
        <Image 
          source={require('../../assets/heaven_palace_render.jpg')}
          style={styles.palaceImageFull}
          resizeMode="cover"
        />
      </Animated.View>

      {/* 3. Golden Laser/Glow beam at the construction boundary */}
      <Animated.View 
        style={[
          styles.constructionLaser, 
          { 
            bottom: Animated.subtract(revealHeight, 1.5),
            opacity: showPlaceholderHighlight ? glowPulse : 0.85
          }
        ]} 
      />
    </View>
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

  // Reveal height animation value (image height is 210)
  const revealHeight = useRef(new Animated.Value(0)).current;

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
          useNativeDriver: true,
        })
      ).start();

      // Key Bobbing loop
      Animated.loop(
        Animated.sequence([
          Animated.timing(bobAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
          Animated.timing(bobAnim, { toValue: 0, duration: 1400, useNativeDriver: true })
        ])
      ).start();
    }
  }, [showPalaceOverlay]);

  // Decoupled PanResponder Gesture: utilizes offset accumulation to prevent layout jump and guarantees zero JS latency
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
            Animated.spring(pan.x, { toValue: 0, useNativeDriver: true }),
            Animated.spring(pan.y, { toValue: 0, useNativeDriver: true })
          ]).start(() => {
            setIsSnapped(true);
            
            // Animate reveal of the next stage of the photorealistic image (height limits: 0 to 210)
            const targetHeights = [52, 105, 147, 184, 210];
            const targetH = targetHeights[correctCount - 1] || 210;

            Animated.spring(revealHeight, {
              toValue: targetH,
              tension: 20,
              friction: 6,
              useNativeDriver: false // height layout changes require JS thread
            }).start();

            Animated.sequence([
              Animated.timing(pieceGlowAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
              Animated.timing(pieceGlowAnim, { toValue: 0, duration: 250, useNativeDriver: true })
            ]).start();
          });
        } else {
          // Instant spring back using native driver
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
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
    revealHeight.setValue(0);
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
      'الأساسات السحابية ومصارف الشلالات الجنة',
      'الساحات السفلية والأدراج الرخامية الفاخرة',
      'المحراب الأوسط والقباب الهيكلية الحامية',
      'المنابر العلوية والأبراج الفيروزية العالية',
      'القبة الذهبية الكبرى وهلال صرح النور السماوي'
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
    revealHeight.setValue(0);
  };

  const finalScore = useMemo(() => {
    if (questions.length === 0) return 0;
    return Math.round((correctCount / questions.length) * 100);
  }, [correctCount, questions]);

  const earnedXP = useMemo(() => {
    return correctCount * 10;
  }, [correctCount]);

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
              {/* Full high-fidelity complete heaven palace display card */}
              <Image 
                source={require('../../assets/heaven_palace_render.jpg')}
                style={styles.resultsPalaceImage}
                resizeMode="cover"
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
              revealHeight={revealHeight} 
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
                    <Text style={styles.draggableItemText}>🕌 اسحب للتشييد</Text>
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
    width: 280,
    height: 210,
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
    width: 280,
    height: 210,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 20,
  },
  palaceCanvasOuter: {
    width: 280,
    height: 210,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000',
    borderWidth: 2,
    borderColor: '#E5B942',
  },
  palaceImageBase: {
    width: 280,
    height: 210,
  },
  palaceRevealContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 280,
    overflow: 'hidden',
  },
  palaceImageFull: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 280,
    height: 210,
  },
  constructionLaser: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#FFF2A9',
    shadowColor: '#FFECA7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
  palaceAuraGlow: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#FFF2CC',
    opacity: 0.12,
    zIndex: -1,
  },
  palaceRotateRing: {
    position: 'absolute',
    width: 270,
    height: 270,
    borderRadius: 135,
    borderWidth: 2,
    borderColor: 'rgba(229, 185, 66, 0.25)',
    borderStyle: 'dashed',
    zIndex: -1,
  },
  palaceContainer: {
    width: 280,
    height: 210,
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
    height: 70,
  },
  draggableItemCard: {
    width: 150,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F5D061',
    borderColor: '#FFECA7',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
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
