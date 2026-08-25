import React, { useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { mutashabihatQuestions, type MutashabahQuestion } from '../data/mutashabihat';
import Svg, { Path, Rect, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// --- BULLETPROOF LOCAL GRADIENT DEFS ---
// Injected into each SVG layer to resolve iOS referencing bugs across absolute trees
const GradientDefs = () => (
  <Defs>
    <LinearGradient id="marbleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <Stop offset="0%" stopColor="#FFFFFF" />
      <Stop offset="30%" stopColor="#F9F6F0" />
      <Stop offset="100%" stopColor="#D9D4C7" />
    </LinearGradient>

    <LinearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <Stop offset="0%" stopColor="#FFECA7" />
      <Stop offset="40%" stopColor="#E2B842" />
      <Stop offset="75%" stopColor="#C59B27" />
      <Stop offset="100%" stopColor="#8A6611" />
    </LinearGradient>

    <LinearGradient id="turquoiseGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <Stop offset="0%" stopColor="#5CEEE6" />
      <Stop offset="40%" stopColor="#00A89F" />
      <Stop offset="100%" stopColor="#006660" />
    </LinearGradient>

    <LinearGradient id="cloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
      <Stop offset="50%" stopColor="#FFF2F6" stopOpacity="0.95" />
      <Stop offset="100%" stopColor="#F8D3E9" stopOpacity="0.9" />
    </LinearGradient>
  </Defs>
);

// --- HEAVENLY PALACE VECTOR SVG LAYERS ---

function HeavenSunbeams() {
  return (
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
  );
}

function HeavenCloudsBase() {
  return (
    <Svg width="250" height="50" viewBox="0 0 250 50" fill="none">
      <GradientDefs />
      <Circle cx="30" cy="30" r="20" fill="url(#cloudGrad)" />
      <Circle cx="60" cy="22" r="24" fill="url(#cloudGrad)" />
      <Circle cx="100" cy="26" r="26" fill="url(#cloudGrad)" />
      <Circle cx="145" cy="18" r="28" fill="url(#cloudGrad)" />
      <Circle cx="190" cy="24" r="24" fill="url(#cloudGrad)" />
      <Circle cx="220" cy="28" r="20" fill="url(#cloudGrad)" />
      <Rect width="230" height="18" x="10" y="24" rx="9" fill="url(#cloudGrad)" />
    </Svg>
  );
}

function HeavenWallsLayer() {
  return (
    <Svg width="130" height="85" viewBox="0 0 130 85" fill="none">
      <GradientDefs />
      <Rect width="124" height="75" x="3" y="5" rx="8" fill="url(#marbleGrad)" stroke="url(#goldGrad)" strokeWidth="1.8" />
      <Rect width="46" height="58" x="42" y="25" rx="5" fill="none" stroke="url(#goldGrad)" strokeWidth="1.2" strokeDasharray="3,3" />
      <Path d="M46 85V48c0-11 8-20 19-20s19 9 19 20v37H46z" fill="url(#marbleGrad)" stroke="url(#goldGrad)" strokeWidth="1.5" />
      <Path d="M50 85V51c0-8 7-14 15-14s15 6 15 14v34H50z" fill="url(#turquoiseGrad)" /> 
      <Path d="M14 48V30c0-6 4-10 8-10s8 4 8 10v18H14z" fill="url(#turquoiseGrad)" stroke="url(#goldGrad)" strokeWidth="1.5" />
      <Path d="M14 36h16M22 20v28" stroke="url(#goldGrad)" strokeWidth="0.8" />
      <Path d="M98 48V30c0-6 4-10 8-10s8 4 8 10v18H98z" fill="url(#turquoiseGrad)" stroke="url(#goldGrad)" strokeWidth="1.5" />
      <Path d="M98 36h16M106 20v28" stroke="url(#goldGrad)" strokeWidth="0.8" />
      <Rect width="128" height="6" x="1" y="1" fill="url(#goldGrad)" rx="2" />
    </Svg>
  );
}

function HeavenPillarsLayer() {
  return (
    <Svg width="150" height="85" viewBox="0 0 150 85" fill="none">
      <GradientDefs />
      <Rect width="12" height="74" x="6" y="8" rx="3" fill="url(#marbleGrad)" stroke="url(#goldGrad)" strokeWidth="1" />
      <Path d="M10 8v74" stroke="#FFF" strokeWidth="0.8" />
      <Rect width="18" height="6" x="3" y="4" rx="1.5" fill="url(#goldGrad)" />
      <Rect width="18" height="6" x="3" y="79" rx="1.5" fill="url(#goldGrad)" />
      <Rect width="12" height="74" x="132" y="8" rx="3" fill="url(#marbleGrad)" stroke="url(#goldGrad)" strokeWidth="1" />
      <Path d="M136 8v74" stroke="#FFF" strokeWidth="0.8" />
      <Rect width="18" height="6" x="129" y="4" rx="1.5" fill="url(#goldGrad)" />
      <Rect width="18" height="6" x="129" y="79" rx="1.5" fill="url(#goldGrad)" />
    </Svg>
  );
}

function HeavenTurretsLayer() {
  return (
    <Svg width="160" height="75" viewBox="0 0 160 75" fill="none">
      <GradientDefs />
      <Path d="M0 60c0-18 10-25 18-25s18 7 18 25H0z" fill="url(#turquoiseGrad)" stroke="url(#goldGrad)" strokeWidth="1.2" />
      <Path d="M18 35V25" stroke="url(#goldGrad)" strokeWidth="1.5" />
      <Circle cx="18" cy="23" r="1.5" fill="url(#goldGrad)" />
      <Path d="M124 60c0-18 10-25 18-25s18 7 18 25h-36z" fill="url(#turquoiseGrad)" stroke="url(#goldGrad)" strokeWidth="1.2" />
      <Path d="M142 35V25" stroke="url(#goldGrad)" strokeWidth="1.5" />
      <Circle cx="142" cy="23" r="1.5" fill="url(#goldGrad)" />
    </Svg>
  );
}

function HeavenDomeLayer() {
  return (
    <Svg width="90" height="75" viewBox="0 0 90 75" fill="none">
      <GradientDefs />
      <Rect width="62" height="8" x="14" y="48" fill="url(#marbleGrad)" stroke="url(#goldGrad)" strokeWidth="1.2" />
      <Circle cx="22" cy="52" r="1.8" fill="url(#goldGrad)" />
      <Circle cx="34" cy="52" r="1.8" fill="url(#goldGrad)" />
      <Circle cx="46" cy="52" r="1.8" fill="url(#goldGrad)" />
      <Circle cx="58" cy="52" r="1.8" fill="url(#goldGrad)" />
      <Path d="M15 48C15 18 35 8 45 8s30 10 30 40H15z" fill="url(#goldGrad)" stroke="#FFF" strokeWidth="1.5" />
      <Path d="M45 8c-6 10-12 25-12 40" stroke="#FFF" strokeWidth="1" opacity="0.45" />
      <Path d="M45 8c6 10 12 25 12 40" stroke="#FFF" strokeWidth="1" opacity="0.45" />
      <Path d="M45 8c-10 12-18 25-18 40" stroke="#8A6611" strokeWidth="1.2" opacity="0.3" />
      <Path d="M45 8c10 12 18 25 18 40" stroke="#8A6611" strokeWidth="1.2" opacity="0.3" />
      <Path d="M45 8V-5" stroke="url(#goldGrad)" strokeWidth="2.8" />
      <Circle cx="45" cy="-6" r="3" fill="url(#goldGrad)" />
    </Svg>
  );
}

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

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const pieceFlyAnim = useRef(new Animated.Value(0)).current;
  const pieceGlowAnim = useRef(new Animated.Value(0)).current;

  const currentQuestion = questions[currentIndex];

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
              <HeavenCloudsBase />
              <View style={{ position: 'absolute', bottom: 15 }}><HeavenPillarsLayer /></View>
              <View style={{ position: 'absolute', bottom: 15 }}><HeavenWallsLayer /></View>
              <View style={{ position: 'absolute', bottom: 20 }}><HeavenTurretsLayer /></View>
              <View style={{ position: 'absolute', bottom: 85 }}><HeavenDomeLayer /></View>
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
            <HeavenCloudsBase />

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
                <HeavenWallsLayer />
              </Animated.View>
            )}

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
                <HeavenPillarsLayer />
              </Animated.View>
            )}

            {correctCount >= (overlayCorrect ? 3 : 4) && (
              <Animated.View 
                style={[
                  styles.palacePiece, 
                  { bottom: 20 },
                  (overlayCorrect && correctCount === 3) && {
                    transform: [{ translateY: fallingPieceY }, { scale: fallingPieceScale }],
                    opacity: fallingPieceOpacity
                  }
                ]}
              >
                <HeavenTurretsLayer />
              </Animated.View>
            )}

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
                <HeavenDomeLayer />
              </Animated.View>
            )}
          </View>

          {overlayCorrect ? (
            <View style={styles.statusBox}>
              <Text style={styles.statusTitle}>✅ إجابة صحيحة!</Text>
              <Text style={styles.statusSubtitle}>تم تشييد وتركيب: {unlockedSegment} (+10 XP)</Text>
            </View>
          ) : (
            <View style={[styles.statusBox, { backgroundColor: '#FDF2F2', borderColor: '#EF4444' }]}>
              <Text style={[styles.statusTitle, { color: '#E74C3C' }]}>❌ إجابة خاطئة</Text>
              <Text style={[styles.statusSubtitle, { color: '#C0392B' }]}>فشل تركيب القطعة، راجع التوضيح بالأسفل لتشييدها لاحقاً.</Text>
            </View>
          )}

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
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 35,
  },
  palaceContainer: {
    width: 240,
    height: 200,
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
});
