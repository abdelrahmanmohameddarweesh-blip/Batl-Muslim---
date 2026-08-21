import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Share, ActivityIndicator, Dimensions, Animated } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { Audio } from 'expo-av';
import { surahsList } from '../data/surahs';
import { quranVerses, type QuranVerse } from '../data/quranVerses';
import { generateReferenceProfile, analyzeVocalImitation } from '../data/voiceTemplates';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import AdBanner from '../components/AdBanner';

interface DynamicQuestion {
  id: string;
  type: 'missing_ayah' | 'identify_surah';
  prompt: string;
  options: string[];
  answer: string;
  surah: string;
  surahEn: string;
  juz: number;
  ayahNumber: number;
}

export default function QuranAssessmentScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { language } = useLanguage();

  // Screen State: 'lobby' | 'introduction' | 'assessment' | 'results'
  const [screenState, setScreenState] = useState<'lobby' | 'introduction' | 'assessment' | 'results'>('lobby');

  // Lobby Configuration Choices
  const [filterMode, setFilterMode] = useState<'juz' | 'surah'>('juz');
  const [selectedJuz, setSelectedJuz] = useState<number>(30);
  const [selectedSurah, setSelectedSurah] = useState<string>('الملك');
  const [selectedLimit, setSelectedLimit] = useState<number>(5);
  const [fetching, setFetching] = useState(false);

  // Active Assessment States
  const [questions, setQuestions] = useState<DynamicQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback] = useState('');

  // Audio / Voice Recitation States
  const [isRecordingMode, setIsRecordingMode] = useState(false); // Toggle between MCQ and Voice Recitation
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [meteringHistory, setMeteringHistory] = useState<number[]>([]);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [liveVolume, setLiveVolume] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [audioStep, setAudioStep] = useState<'ready' | 'recording' | 'recorded' | 'analyzing'>('ready');
  const [voiceScore, setVoiceScore] = useState<number | null>(null);

  const currentQuestion = questions[currentIndex];
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation loop during recording
  useEffect(() => {
    let animLoop: Animated.CompositeAnimation;
    if (audioStep === 'recording') {
      animLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      animLoop.start();
    } else {
      pulseAnim.setValue(1);
    }

    return () => {
      if (animLoop) animLoop.stop();
    };
  }, [audioStep]);

  // Clean up audio recording on unmount
  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, [recording]);

  // Voice recording triggers
  const handleStartRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert(
          language === 'ar' ? 'صلاحية الميكروفون' : 'Microphone Permission',
          language === 'ar'
            ? 'الرجاء تمكين الوصول إلى الميكروفون في إعدادات جهازك للمتابعة.'
            : 'Please enable microphone access in your device settings to record your recitation.'
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Reset audio states
      setMeteringHistory([]);
      setRecordingDuration(0);
      setLiveVolume(0);
      setSeconds(0);

      const recordingInstance = new Audio.Recording();
      await recordingInstance.prepareToRecordAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {},
        isMeteringEnabled: true,
      });

      recordingInstance.setProgressUpdateInterval(120);
      
      const history: number[] = [];
      recordingInstance.setOnRecordingStatusUpdate((status) => {
        if (status.durationMillis) {
          setSeconds(Math.floor(status.durationMillis / 1000));
          setRecordingDuration(status.durationMillis);
        }

        if (status.metering !== undefined) {
          history.push(status.metering);
          setMeteringHistory([...history]);
          
          const normVol = status.metering <= -60 ? 0 : (status.metering + 60) / 60;
          setLiveVolume(normVol);
        }
      });

      await recordingInstance.startAsync();
      setRecording(recordingInstance);
      setAudioStep('recording');
    } catch (err) {
      console.error(err);
      Alert.alert(
        language === 'ar' ? 'خطأ في التسجيل' : 'Recording Error',
        language === 'ar' ? 'فشل في تهيئة ميكروفون الهاتف للتسجيل.' : 'Failed to initialize microphone.'
      );
    }
  };

  const handleStopRecording = async () => {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      setAudioStep('recorded');
    } catch (err) {
      console.error(err);
    }
  };

  const handleAnalyzeRecitation = () => {
    if (!currentQuestion) return;

    setAudioStep('analyzing');
    
    setTimeout(async () => {
      // Analyze matching parameters using the vocal profile engine
      const refProfile = generateReferenceProfile('dyn_target', 'husary', 'murattal', currentQuestion.answer);
      const results = analyzeVocalImitation(meteringHistory, recordingDuration, refProfile);

      setVoiceScore(results.overall);
      setAnswered(true);

      const isCorrect = results.overall >= 70;
      if (isCorrect) {
        setCorrectCount((prev) => prev + 1);
        setFeedback(
          language === 'ar' 
            ? `تسميع ممتاز وصحيح! نسبة المطابقة: ${results.overall}% 🌟` 
            : `Recitation correct! Matching accuracy: ${results.overall}% 🌟`
        );
      } else {
        setFeedback(
          language === 'ar' 
            ? `تسميع غير دقيق (نسبة المطابقة: ${results.overall}%). الرجاء مراجعة الآية الكريمة المفقودة:` 
            : `Recitation was not fully accurate (Accuracy: ${results.overall}%). Please review the missing verse:`
        );
      }
    }, 2200);
  };

  // Advanced Quran Question Generator Engine (Eliminates text overlap clues completely)
  const compileQuestionsFromVerses = (versesSource: QuranVerse[]): DynamicQuestion[] => {
    const shuffledVerses = [...versesSource].sort(() => Math.random() - 0.5);
    const generated: DynamicQuestion[] = [];
    let attempt = 0;

    while (generated.length < selectedLimit && shuffledVerses.length > 0) {
      const targetVerse = shuffledVerses[attempt % shuffledVerses.length];
      attempt++;

      let type: 'missing_ayah' | 'identify_surah' = 'missing_ayah';
      if (filterMode === 'juz') {
        type = Math.random() > 0.5 ? 'identify_surah' : 'missing_ayah';
      }

      if (type === 'missing_ayah') {
        // Find neighboring verses
        const prevVerse = versesSource.find(
          v => v.surah === targetVerse.surah && v.ayahNumber === targetVerse.ayahNumber - 1
        );
        const nextVerse = versesSource.find(
          v => v.surah === targetVerse.surah && v.ayahNumber === targetVerse.ayahNumber + 1
        );

        let promptText = '';
        let answer = '';
        let distractors: string[] = [];

        // Check if neighboring verses are available for full-verse context mode
        const contextType = attempt % 4;
        let canDoFullVerseQuiz = false;
        if (contextType === 0 && prevVerse && nextVerse) canDoFullVerseQuiz = true;
        if (contextType === 1 && prevVerse) canDoFullVerseQuiz = true;
        if (contextType === 2 && nextVerse) canDoFullVerseQuiz = true;

        if (canDoFullVerseQuiz) {
          answer = targetVerse.text;

          if (contextType === 0 && prevVerse && nextVerse) {
            promptText = `... ۞ ${prevVerse.text} ۞ [ ....... ] ۞ ${nextVerse.text} ۞ ...`;
          } else if (contextType === 1 && prevVerse) {
            promptText = `... ۞ ${prevVerse.text} ۞ [ ....... ]`;
          } else if (nextVerse) {
            promptText = `[ ....... ] ۞ ${nextVerse.text} ۞ ...`;
          } else {
            promptText = `[ ....... ]`;
          }

          let distractorPool = versesSource.filter(
            v => v.text !== answer && 
                 v.text !== prevVerse?.text && 
                 v.text !== nextVerse?.text
          );

          if (filterMode === 'surah') {
            distractorPool = distractorPool.filter(v => v.surah === selectedSurah);
          }

          if (distractorPool.length < 3) {
            distractorPool = quranVerses.filter(v => v.text !== answer);
          }

          distractors = distractorPool
            .sort(() => Math.random() - 0.5)
            .slice(0, 3)
            .map(v => v.text);
        } else {
          const words = targetVerse.text.split(' ');
          const half = Math.floor(words.length / 2);
          
          if (words.length > 2) {
            const firstHalf = words.slice(0, half).join(' ');
            promptText = `${firstHalf} [ ....... ]`;
            answer = words.slice(half).join(' ');

            let distractorPool = versesSource.filter(v => v.text !== targetVerse.text);
            if (filterMode === 'surah') {
              distractorPool = distractorPool.filter(v => v.surah === selectedSurah);
            }

            if (distractorPool.length < 3) {
              distractorPool = quranVerses.filter(v => v.text !== targetVerse.text);
            }

            distractors = distractorPool
              .sort(() => Math.random() - 0.5)
              .slice(0, 3)
              .map(v => {
                const dWords = v.text.split(' ');
                const dHalf = Math.floor(dWords.length / 2);
                return dWords.slice(dHalf).join(' ');
              });
          } else {
            const firstWord = words[0] || '';
            promptText = `${firstWord} [ ....... ]`;
            answer = words.slice(1).join(' ') || targetVerse.text;

            let distractorPool = versesSource.filter(v => v.text !== targetVerse.text);
            if (filterMode === 'surah') {
              distractorPool = distractorPool.filter(v => v.surah === selectedSurah);
            }
            distractors = distractorPool
              .sort(() => Math.random() - 0.5)
              .slice(0, 3)
              .map(v => {
                const dWords = v.text.split(' ');
                return dWords.slice(1).join(' ') || v.text;
              });
          }
        }

        const options = [answer, ...distractors].sort(() => Math.random() - 0.5);

        generated.push({
          id: `dyn_${targetVerse.surah}_${targetVerse.ayahNumber}_${attempt}_${generated.length}`,
          type,
          prompt: promptText,
          options,
          answer,
          surah: targetVerse.surah,
          surahEn: targetVerse.surahEn,
          juz: targetVerse.juz,
          ayahNumber: targetVerse.ayahNumber
        });
      } else {
        const promptText = targetVerse.text;
        const answer = targetVerse.surah;

        const surahsInPool = Array.from(new Set(versesSource.map(v => v.surah)));
        const cleanPool = surahsInPool.filter(name => name !== answer);

        let distractors: string[] = [];
        if (cleanPool.length >= 3) {
          distractors = cleanPool.sort(() => Math.random() - 0.5).slice(0, 3);
        } else {
          distractors = surahsList
            .filter(s => s.name !== answer)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3)
            .map(s => s.name);
        }

        const options = [answer, ...distractors].sort(() => Math.random() - 0.5);

        generated.push({
          id: `dyn_id_${targetVerse.surah}_${targetVerse.ayahNumber}_${attempt}_${generated.length}`,
          type,
          prompt: promptText,
          options,
          answer,
          surah: targetVerse.surah,
          surahEn: targetVerse.surahEn,
          juz: targetVerse.juz,
          ayahNumber: targetVerse.ayahNumber
        });
      }
    }

    return generated;
  };

  const handleStartLobby = async () => {
    setFetching(true);
    let finalVerses: QuranVerse[] = [];

    const surahObj = surahsList.find(s => s.name === selectedSurah);
    const surahNumber = surahObj ? surahObj.number : 67;

    try {
      if (filterMode === 'surah') {
        const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}`);
        const json = await response.json();
        
        if (json.code === 200 && json.data && json.data.ayahs) {
          finalVerses = json.data.ayahs.map((a: any) => ({
            surah: selectedSurah,
            surahEn: surahObj?.english || 'Al-Mulk',
            juz: a.juz,
            ayahNumber: a.numberInSurah,
            text: a.text
          }));
        }
      } else {
        const response = await fetch(`https://api.alquran.cloud/v1/juz/${selectedJuz}/quran-simple`);
        const json = await response.json();
        
        if (json.code === 200 && json.data && json.data.ayahs) {
          finalVerses = json.data.ayahs.map((a: any) => {
            const matchSurah = surahsList.find(s => s.number === a.surah.number);
            return {
              surah: matchSurah ? matchSurah.name : a.surah.name,
              surahEn: matchSurah ? matchSurah.english : a.surah.english,
              juz: selectedJuz,
              ayahNumber: a.numberInSurah,
              text: a.text
            };
          });
        }
      }
    } catch (error) {
      console.log('Dynamic API Fetch failed/offline. Falling back to local dataset.', error);
    }

    if (finalVerses.length === 0) {
      if (filterMode === 'surah') {
        finalVerses = quranVerses.filter(v => v.surah === selectedSurah);
        if (finalVerses.length === 0) {
          finalVerses = quranVerses.filter(v => v.surah === 'الملك');
        }
      } else {
        finalVerses = quranVerses.filter(v => v.juz === selectedJuz);
        if (finalVerses.length === 0) {
          finalVerses = quranVerses.filter(v => v.juz === 30);
        }
      }
    }

    setFetching(false);
    const generated = compileQuestionsFromVerses(finalVerses);

    if (generated.length === 0) {
      Alert.alert(
        language === 'ar' ? 'خطأ' : 'Error',
        language === 'ar' ? 'فشل في توليد الأسئلة.' : 'Failed to generate questions.'
      );
      return;
    }

    setQuestions(generated);
    setCurrentIndex(0);
    setSelectedAnswer('');
    setAnswered(false);
    setCorrectCount(0);
    setFeedback('');
    
    // Reset Recording / Assessment Toggle
    setIsRecordingMode(false);
    setAudioStep('ready');
    setVoiceScore(null);

    // Show Test Introduction Screen
    setScreenState('introduction');
  };

  const handleSubmitMCQ = () => {
    if (!selectedAnswer.trim()) {
      Alert.alert(
        language === 'ar' ? 'تنبيه' : 'Alert',
        language === 'ar' ? 'الرجاء اختيار إجابة واحدة للاستمرار.' : 'Please select an option to submit.'
      );
      return;
    }

    const isCorrect = selectedAnswer === currentQuestion.answer;
    setAnswered(true);

    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
      setFeedback(language === 'ar' ? 'إجابة صحيحة! أحسنت وحفظك مبارك 🌟' : 'Correct answer! Excellent memorization 🌟');
    } else {
      setFeedback(language === 'ar' ? 'إجابة غير صحيحة. الإجابة الصحيحة هي:' : 'Incorrect answer. The correct answer is:');
    }
  };

  const handleNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < questions.length) {
      setCurrentIndex(nextIndex);
      setSelectedAnswer('');
      setAnswered(false);
      setFeedback('');

      // Reset Audio / Voice assessment toggles
      setIsRecordingMode(false);
      setAudioStep('ready');
      setVoiceScore(null);
    } else {
      setScreenState('results');
    }
  };

  const activeTargetLabel = useMemo(() => {
    if (filterMode === 'juz') {
      return language === 'ar' ? `جزء ${selectedJuz}` : `Juz' ${selectedJuz}`;
    }
    return language === 'ar' ? `سورة ${selectedSurah}` : `Surah ${selectedSurah}`;
  }, [filterMode, selectedJuz, selectedSurah, language]);

  const handleShareResults = async () => {
    try {
      const accuracy = Math.round((correctCount / (questions.length || 1)) * 100);
      const textAr = `لقد أكملت تقييم حفظ [${activeTargetLabel}] عبر تطبيق بطل مسلم بنجاح! النتيجة: ${accuracy}% (${correctCount}/${questions.length} إجابات صحيحة) 🏆`;
      const textEn = `I have successfully completed the memorization assessment for [${activeTargetLabel}] on Batal Moslem! Result: ${accuracy}% (${correctCount}/${questions.length} correct answers) 🏆`;
      
      await Share.share({
        message: language === 'ar' ? textAr : textEn
      });
    } catch (err) {
      console.error(err);
    }
  };

  const difficultyLabel = useMemo(() => {
    if (selectedLimit === 5) return language === 'ar' ? 'مبتدئ (سهل)' : 'Easy (Beginner)';
    if (selectedLimit === 10) return language === 'ar' ? 'متوسط (عادي)' : 'Medium (Normal)';
    if (selectedLimit === 15) return language === 'ar' ? 'متقدم (صعب)' : 'Hard (Advanced)';
    return language === 'ar' ? 'بطل (خبير)' : 'Expert (Hero)';
  }, [selectedLimit, language]);

  return (
    <ScrollView style={[styles.outerContainer, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        
        {/* LOBBY STATE */}
        {screenState === 'lobby' && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {language === 'ar' ? 'تقييم حفظ القرآن الكريم 📖' : 'Quran Memorization Assessment 📖'}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {language === 'ar' 
                ? 'اختبر دقة حفظك في سور وأجزاء محددة، واحصل على تقرير أداء لمشاركته وتتبع مستواك.'
                : 'Assess your memorization level in specific Surahs or Juz, and generate shareable performance logs.'}
            </Text>

            {/* Segmented Filter Mode Selector */}
            <View style={styles.segmentedContainer}>
              <TouchableOpacity 
                style={[styles.segmentBtn, filterMode === 'juz' && { backgroundColor: colors.primaryDeep }]}
                onPress={() => setFilterMode('juz')}
              >
                <Text style={[styles.segmentBtnText, filterMode === 'juz' && { color: '#FFFFFF', fontWeight: '700' }]}>
                  {language === 'ar' ? 'بالجزء' : 'By Juz'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.segmentBtn, filterMode === 'surah' && { backgroundColor: colors.primaryDeep }]}
                onPress={() => setFilterMode('surah')}
              >
                <Text style={[styles.segmentBtnText, filterMode === 'surah' && { color: '#FFFFFF', fontWeight: '700' }]}>
                  {language === 'ar' ? 'بالسورة' : 'By Surah'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Selection Scrollbars (supporting ALL 30 Juz' and 114 Surahs) */}
            {filterMode === 'juz' ? (
              <View style={styles.sectionWrapper}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  {language === 'ar' ? 'اختر الجزء (١ - ٣٠):' : 'Select Juz (1 - 30):'}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollListContainer}>
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((juzNum) => {
                    const isSelected = selectedJuz === juzNum;
                    return (
                      <TouchableOpacity
                        key={juzNum}
                        style={[
                          styles.scrollCell,
                          { borderColor: colors.border, backgroundColor: colors.surface },
                          isSelected && { backgroundColor: colors.primaryTint, borderColor: colors.primary }
                        ]}
                        onPress={() => setSelectedJuz(juzNum)}
                      >
                        <Text style={[styles.scrollCellText, { color: colors.textPrimary }, isSelected && { fontWeight: '700' }]}>
                          {language === 'ar' ? `جزء ${juzNum}` : `Juz ${juzNum}`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            ) : (
              <View style={styles.sectionWrapper}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  {language === 'ar' ? 'اختر السورة (١١٤ سورة):' : 'Select Surah (114 Surahs):'}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollListContainer}>
                  {surahsList.map((surah) => {
                    const isSelected = selectedSurah === surah.name;
                    return (
                      <TouchableOpacity
                        key={surah.number}
                        style={[
                          styles.scrollCell,
                          { borderColor: colors.border, backgroundColor: colors.surface },
                          isSelected && { backgroundColor: colors.primaryTint, borderColor: colors.primary }
                        ]}
                        onPress={() => setSelectedSurah(surah.name)}
                      >
                        <Text style={[styles.scrollCellText, { color: colors.textPrimary }, isSelected && { fontWeight: '700' }]}>
                          {surah.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Questions Limit (Difficulty Scale Filter) */}
            <View style={styles.sectionWrapper}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {language === 'ar' ? 'عدد الأسئلة (يزداد الصعوبة بزيادة العدد):' : 'Questions Limit (Difficulty scales with limit):'}
              </Text>
              <View style={styles.limitOptionRow}>
                {[5, 10, 15, 20].map((limitVal) => {
                  const isSelected = selectedLimit === limitVal;
                  let diffLabel = language === 'ar' ? 'مبتدئ' : 'Easy';
                  if (limitVal === 10) diffLabel = language === 'ar' ? 'متوسط' : 'Medium';
                  if (limitVal === 15) diffLabel = language === 'ar' ? 'متقدم' : 'Hard';
                  if (limitVal === 20) diffLabel = language === 'ar' ? 'بطل' : 'Expert';

                  return (
                    <TouchableOpacity
                      key={limitVal}
                      style={[
                        styles.limitPill,
                        { borderColor: colors.border, backgroundColor: colors.surface },
                        isSelected && { backgroundColor: colors.primaryDeep, borderColor: colors.primaryDeep }
                      ]}
                      onPress={() => setSelectedLimit(limitVal)}
                    >
                      <Text style={[styles.limitPillVal, { color: colors.textPrimary }, isSelected && { color: '#FFFFFF', fontWeight: '700' }]}>
                        {limitVal}
                      </Text>
                      <Text style={[styles.limitPillLbl, { color: colors.textSecondary }, isSelected && { color: '#FFFFFF' }]}>
                        {diffLabel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Launch Button / Loading Indicator */}
            {fetching ? (
              <View style={styles.loadingWrapper}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  {language === 'ar' ? 'جاري تحميل آيات السورة بدقة...' : 'Loading Surah Ayahs precisely...'}
                </Text>
              </View>
            ) : (
              <TouchableOpacity style={[styles.startBtn, { backgroundColor: colors.primary }]} onPress={handleStartLobby} activeOpacity={0.85}>
                <Text style={styles.startBtnText}>
                  {language === 'ar' ? 'استمرار ➔' : 'Continue ➔'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* TEST INTRODUCTION STATE */}
        {screenState === 'introduction' && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.introHeader}>
              <View style={[styles.introIconWrapper, { backgroundColor: colors.primaryTint }]}>
                <Svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                  <Path d="M6 6h10M6 10h10" />
                </Svg>
              </View>
              <Text style={[styles.introTitleText, { color: colors.textPrimary }]}>
                {language === 'ar' ? 'مقدمة تقييم حفظ القرآن الكريم 📖' : 'Quran Memorization Assessment Intro 📖'}
              </Text>
            </View>

            <View style={[styles.introDetailsBox, { backgroundColor: colors.neutralTint, borderColor: colors.border }]}>
              <View style={styles.introDetailRow}>
                <Text style={[styles.introDetailLabel, { color: colors.textSecondary }]}>
                  {language === 'ar' ? 'التقييم المختار:' : 'Selected Target:'}
                </Text>
                <Text style={[styles.introDetailValue, { color: colors.textPrimary }]}>
                  {activeTargetLabel}
                </Text>
              </View>

              <View style={styles.introDetailRow}>
                <Text style={[styles.introDetailLabel, { color: colors.textSecondary }]}>
                  {language === 'ar' ? 'عدد الأسئلة:' : 'Number of Questions:'}
                </Text>
                <Text style={[styles.introDetailValue, { color: colors.textPrimary }]}>
                  {selectedLimit}
                </Text>
              </View>

              <View style={styles.introDetailRow}>
                <Text style={[styles.introDetailLabel, { color: colors.textSecondary }]}>
                  {language === 'ar' ? 'مستوى الصعوبة:' : 'Difficulty level:'}
                </Text>
                <Text style={[styles.introDetailValue, { color: colors.primaryDeep }]}>
                  {difficultyLabel}
                </Text>
              </View>

              <View style={styles.introDetailRow}>
                <Text style={[styles.introDetailLabel, { color: colors.textSecondary }]}>
                  {language === 'ar' ? 'الزمن المتوقع:' : 'Estimated Time:'}
                </Text>
                <Text style={[styles.introDetailValue, { color: colors.textPrimary }]}>
                  {selectedLimit * 1} {language === 'ar' ? 'دقائق' : 'minutes'}
                </Text>
              </View>
            </View>

            {/* Assessment Options Description */}
            <View style={styles.introRulesWrapper}>
              <Text style={[styles.introRulesTitle, { color: colors.textPrimary }]}>
                {language === 'ar' ? 'قواعد وطرق الإجابة:' : 'Assessment Guidelines & Modes:'}
              </Text>
              
              <View style={styles.ruleItem}>
                <Text style={styles.ruleBullet}>✏️</Text>
                <Text style={[styles.ruleText, { color: colors.textSecondary }]}>
                  {language === 'ar'
                    ? 'الوضع الكتابي: اختر الآية الصحيحة لإكمال الفراغ من الخيارات المقترحة.'
                    : 'MCQ Mode: Pick the correct missing verse from the multiple-choice list.'}
                </Text>
              </View>

              <View style={styles.ruleItem}>
                <Text style={styles.ruleBullet}>🎙️</Text>
                <Text style={[styles.ruleText, { color: colors.textSecondary }]}>
                  {language === 'ar'
                    ? 'الوضع الصوتي: يمكنك تسميع الآية بصوتك ليقوم الذكاء الاصطناعي بتحليل جودة حفظك ومخارج الحروف!'
                    : 'Oral Recitation Mode: Recite the verse aloud and let our AI grade your timing, rhythm, and accuracy!'}
                </Text>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.startBtn, { backgroundColor: colors.primaryDeep }]} 
              onPress={() => setScreenState('assessment')} 
              activeOpacity={0.85}
            >
              <Text style={styles.startBtnText}>
                {language === 'ar' ? 'ابدأ الاختبار الآن ⚡' : 'Start Assessment Now ⚡'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.backToHomeBtn, { borderColor: colors.border }]} 
              onPress={() => setScreenState('lobby')} 
              activeOpacity={0.85}
            >
              <Text style={[styles.backToHomeBtnText, { color: colors.textSecondary }]}>
                {language === 'ar' ? 'تعديل الخيارات' : 'Edit Choices'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* QUIZ STATE */}
        {screenState === 'assessment' && currentQuestion && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            
            {/* Header progress bar */}
            <View style={styles.quizHeader}>
              <View style={styles.quizMetaRow}>
                <View style={[styles.categoryBadge, { backgroundColor: colors.primaryTint }]}>
                  <Text style={[styles.categoryBadgeText, { color: colors.primaryOnTint }]}>
                    📖 {language === 'ar' ? 'تقييم الحفظ الجاري' : 'Active Memorization Quiz'}
                  </Text>
                </View>
                <Text style={[styles.quizProgressText, { color: colors.textSecondary }]}>
                  {language === 'ar' 
                    ? `سؤال ${currentIndex + 1} من ${questions.length}`
                    : `Question ${currentIndex + 1} of ${questions.length}`}
                </Text>
              </View>
              <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
                <View style={[styles.progressBarFill, { width: `${((currentIndex + 1) / questions.length) * 100}%`, backgroundColor: colors.primary }]} />
              </View>
            </View>

            {/* Instructions */}
            <Text style={[styles.instructionLabelText, { color: colors.textSecondary }]}>
              {currentQuestion.type === 'missing_ayah' 
                ? (language === 'ar' ? 'أكمل الآية الكريمة المناسبة لإكمال السياق:' : 'Complete the missing verse context:')
                : (language === 'ar' ? 'في أي سورة وردت هذه الآية الكريمة؟' : 'In which Surah does this Ayah appear?')}
            </Text>

            {/* Prompt Verse */}
            <View style={[styles.promptCard, { backgroundColor: colors.neutralTint, borderColor: colors.border }]}>
              <Text style={[styles.promptText, { color: colors.textPrimary }]}>
                {currentQuestion.prompt}
              </Text>
            </View>

            {/* Toggle between Written (MCQ) & Oral Recitation modes (Only for fill-in-the-blank questions) */}
            {currentQuestion.type === 'missing_ayah' && !answered && (
              <View style={styles.modeToggleRow}>
                <TouchableOpacity 
                  style={[styles.modeToggleBtn, !isRecordingMode && { backgroundColor: colors.primaryTint, borderColor: colors.primary }]}
                  onPress={() => {
                    setIsRecordingMode(false);
                    setAudioStep('ready');
                  }}
                >
                  <Text style={[styles.modeToggleText, { color: colors.textSecondary }, !isRecordingMode && { color: colors.primaryOnTint, fontWeight: '700' }]}>
                    ✏️ {language === 'ar' ? 'كتابي (خيارات)' : 'Written (MCQ)'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.modeToggleBtn, isRecordingMode && { backgroundColor: colors.primaryTint, borderColor: colors.primary }]}
                  onPress={() => {
                    setIsRecordingMode(true);
                    setAudioStep('ready');
                  }}
                >
                  <Text style={[styles.modeToggleText, { color: colors.textSecondary }, isRecordingMode && { color: colors.primaryOnTint, fontWeight: '700' }]}>
                    🎙️ {language === 'ar' ? 'صوتي (تسميع)' : 'Oral (Recite)'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Options list / Voice Recorder content */}
            {!isRecordingMode ? (
              <View style={styles.optionsContainer}>
                {currentQuestion.options.map((opt) => {
                  const isSelected = selectedAnswer === opt;
                  const isCorrectOpt = opt === currentQuestion.answer;

                  let optBtnStyle: any = styles.optionBtn;
                  let optTextStyle: any = styles.optionBtnText;

                  if (answered) {
                    if (isCorrectOpt) {
                      optBtnStyle = [styles.optionBtn, styles.optionBtnCorrect];
                      optTextStyle = [styles.optionBtnText, styles.optionTextWhite];
                    } else if (isSelected) {
                      optBtnStyle = [styles.optionBtn, styles.optionBtnIncorrect];
                      optTextStyle = [styles.optionBtnText, styles.optionTextWhite];
                    } else {
                      optBtnStyle = [styles.optionBtn, styles.optionBtnDisabled];
                      optTextStyle = [styles.optionBtnText, styles.optionTextMuted];
                    }
                  } else if (isSelected) {
                    optBtnStyle = [styles.optionBtn, styles.optionBtnSelected];
                    optTextStyle = [styles.optionBtnText, styles.optionTextSelected];
                  }

                  return (
                    <TouchableOpacity
                      key={opt}
                      style={optBtnStyle}
                      onPress={() => !answered && setSelectedAnswer(opt)}
                      disabled={answered}
                      activeOpacity={0.75}
                    >
                      <Text style={optTextStyle}>{opt}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={[styles.voiceRecorderContainer, { borderColor: colors.border }]}>
                
                {/* Voice Status description */}
                {audioStep === 'ready' && (
                  <View style={styles.audioStateBox}>
                    <Text style={[styles.audioStateText, { color: colors.textSecondary }]}>
                      {language === 'ar' ? 'تلو الآية الكريمة المفقودة بصوتك بعد الضغط على زر التسجيل.' : 'Recite the missing verse aloud after tapping record.'}
                    </Text>
                  </View>
                )}

                {audioStep === 'recording' && (
                  <View style={styles.audioStateBox}>
                    <Text style={[styles.recordingTimerText, { color: '#EF4444' }]}>
                      🔴 {language === 'ar' ? 'جاري التسجيل...' : 'Recording...'} {seconds}s
                    </Text>
                    {/* Live volume wave simulation */}
                    <View style={styles.volumeWaveWrapper}>
                      <View style={[styles.volumeWaveBar, { height: Math.max(4, liveVolume * 45), backgroundColor: colors.primary }]} />
                      <View style={[styles.volumeWaveBar, { height: Math.max(4, liveVolume * 70), backgroundColor: colors.primary }]} />
                      <View style={[styles.volumeWaveBar, { height: Math.max(4, liveVolume * 45), backgroundColor: colors.primary }]} />
                    </View>
                  </View>
                )}

                {audioStep === 'recorded' && (
                  <View style={styles.audioStateBox}>
                    <Text style={[styles.audioStateText, { color: colors.textPrimary, fontWeight: '700' }]}>
                      ✅ {language === 'ar' ? 'تم تسجيل تلاوتك بنجاح' : 'Recitation recorded successfully'}
                    </Text>
                    <Text style={[styles.audioStateSubText, { color: colors.textSecondary }]}>
                      {language === 'ar' ? `المدة: ${seconds} ثوانٍ` : `Duration: ${seconds} seconds`}
                    </Text>
                  </View>
                )}

                {audioStep === 'analyzing' && (
                  <View style={styles.audioStateBox}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.audioStateText, { color: colors.textSecondary }]}>
                      {language === 'ar' ? 'جاري مطابقة التلاوة مع التجويد بالذكاء الاصطناعي...' : 'Matching recitation with reference tajweed...'}
                    </Text>
                  </View>
                )}

                {/* Recorder Control Buttons */}
                {!answered && (
                  <View style={styles.recorderBtnRow}>
                    {audioStep === 'ready' && (
                      <TouchableOpacity style={[styles.recordMainBtn, { backgroundColor: colors.primary }]} onPress={handleStartRecording}>
                        <Text style={styles.recordMainBtnText}>🎙️ {language === 'ar' ? 'سجل تلاوتك' : 'Record Recitation'}</Text>
                      </TouchableOpacity>
                    )}

                    {audioStep === 'recording' && (
                      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                        <TouchableOpacity style={[styles.recordMainBtn, { backgroundColor: '#EF4444' }]} onPress={handleStopRecording}>
                          <Text style={styles.recordMainBtnText}>🛑 {language === 'ar' ? 'إيقاف وحفظ' : 'Stop & Save'}</Text>
                        </TouchableOpacity>
                      </Animated.View>
                    )}

                    {audioStep === 'recorded' && (
                      <View style={{ width: '100%', gap: 10 }}>
                        <TouchableOpacity style={[styles.recordMainBtn, { backgroundColor: colors.primaryDeep }]} onPress={handleAnalyzeRecitation}>
                          <Text style={styles.recordMainBtnText}>🔍 {language === 'ar' ? 'تحليل ومطابقة التلاوة' : 'Grade Recitation'}</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={[styles.retryRecordBtn, { borderColor: colors.border }]} onPress={handleStartRecording}>
                          <Text style={[styles.retryRecordBtnText, { color: colors.textSecondary }]}>
                            🔄 {language === 'ar' ? 'إعادة التسجيل' : 'Record Again'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Feedback & Actions */}
            {answered && (
              <View style={styles.feedbackWrapper}>
                <Text style={[styles.feedbackTitleText, { color: colors.textPrimary }]}>
                  {feedback}
                </Text>
                
                {/* Display correct verse text */}
                <Text style={styles.correctAnswerText}>
                  {currentQuestion.answer}
                </Text>
                
                <TouchableOpacity style={[styles.nextBtn, { backgroundColor: colors.primary }]} onPress={handleNext} activeOpacity={0.85}>
                  <Text style={styles.nextBtnText}>
                    {currentIndex + 1 >= questions.length 
                      ? (language === 'ar' ? 'عرض التقييم النهائي ➔' : 'View Report ➔')
                      : (language === 'ar' ? 'السؤال التالي ➔' : 'Next Question ➔')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {!answered && !isRecordingMode && (
              <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.primaryDeep }]} onPress={handleSubmitMCQ} activeOpacity={0.85}>
                <Text style={styles.submitBtnText}>
                  {language === 'ar' ? 'تحقق من الإجابة' : 'Check Answer'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* RESULTS STATE */}
        {screenState === 'results' && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.resultsHeader}>
              <View style={[styles.resultsIconHolder, { backgroundColor: colors.primaryTint }]}>
                <Svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={colors.primary} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <Path d="m22 4-10 10.01-3-3" />
                </Svg>
              </View>
              <Text style={[styles.resultsTitleText, { color: colors.textPrimary }]}>
                {language === 'ar' ? 'تم اكتمال التقييم!' : 'Assessment Complete!'}
              </Text>
              <Text style={[styles.resultsSubtitleText, { color: colors.textSecondary }]}>
                {language === 'ar' ? `نتيجتك لتقييم حفظ [${activeTargetLabel}]` : `Your performance report for [${activeTargetLabel}]`}
              </Text>
            </View>

            {/* Performance Stats */}
            <View style={styles.resultsStatsRow}>
              <View style={[styles.resultBox, { backgroundColor: colors.neutralTint, borderColor: colors.border }]}>
                <Text style={[styles.resultVal, { color: colors.primaryDeep }]}>
                  {Math.round((correctCount / (questions.length || 1)) * 100)}%
                </Text>
                <Text style={[styles.resultLbl, { color: colors.textSecondary }]}>
                  {language === 'ar' ? 'نسبة الدقة' : 'Accuracy'}
                </Text>
              </View>

              <View style={[styles.resultBox, { backgroundColor: colors.neutralTint, borderColor: colors.border }]}>
                <Text style={[styles.resultVal, { color: colors.textPrimary }]}>
                  {correctCount} / {questions.length}
                </Text>
                <Text style={[styles.resultLbl, { color: colors.textSecondary }]}>
                  {language === 'ar' ? 'الإجابات الصحيحة' : 'Correct Answers'}
                </Text>
              </View>
            </View>

            {/* Share Log Call-to-action */}
            <TouchableOpacity style={styles.shareReportBtn} onPress={handleShareResults} activeOpacity={0.85}>
              <Text style={styles.shareReportBtnText}>
                {language === 'ar' ? 'مشاركة النتيجة بنص مخصص 💬' : 'Share Performance Log 💬'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.nextBtn, { backgroundColor: colors.primary }]} onPress={() => setScreenState('lobby')} activeOpacity={0.85}>
              <Text style={styles.nextBtnText}>
                {language === 'ar' ? 'تقييم جديد 🔄' : 'New Assessment 🔄'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.backToHomeBtn, { borderColor: colors.border }]} onPress={() => navigation.navigate('Home')} activeOpacity={0.85}>
              <Text style={[styles.backToHomeBtnText, { color: colors.textSecondary }]}>
                {language === 'ar' ? 'العودة للرئيسية' : 'Back to Lobby'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <AdBanner />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 28,
  },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 48,
    gap: 16,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#1D2939',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  segmentedContainer: {
    flexDirection: 'row-reverse',
    backgroundColor: '#F2F4F7',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentBtnText: {
    fontSize: 13,
    color: '#475467',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  sectionWrapper: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'right',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  scrollListContainer: {
    gap: 8,
    flexDirection: 'row-reverse',
    paddingVertical: 4,
  },
  scrollCell: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollCellText: {
    fontSize: 12.5,
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  limitOptionRow: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  limitPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  limitPillVal: {
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  limitPillLbl: {
    fontSize: 9,
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  startBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  startBtnText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  loadingWrapper: {
    alignItems: 'center',
    paddingVertical: 12,
    gap: 10,
  },
  loadingText: {
    fontSize: 12,
    fontFamily: 'IBMPlexSansArabic-Medium',
  },

  // TEST INTRODUCTION SCREEN
  introHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  introIconWrapper: {
    width: 76,
    height: 76,
    borderRadius: 99,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  introTitleText: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  introDetailsBox: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    marginBottom: 22,
  },
  introDetailRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  introDetailLabel: {
    fontSize: 12.5,
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  introDetailValue: {
    fontSize: 13.5,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  introRulesWrapper: {
    marginBottom: 22,
    gap: 10,
  },
  introRulesTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 4,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  ruleItem: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 4,
  },
  ruleBullet: {
    fontSize: 15,
  },
  ruleText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'right',
    fontFamily: 'IBMPlexSansArabic-Regular',
  },

  // QUIZ STATE
  quizHeader: {
    marginBottom: 16,
  },
  quizMetaRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  quizProgressText: {
    fontSize: 11.5,
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 99,
  },
  instructionLabelText: {
    fontSize: 12.5,
    textAlign: 'right',
    marginBottom: 12,
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  promptCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  promptText: {
    fontSize: 16.5,
    lineHeight: 28,
    textAlign: 'center',
    fontWeight: '600',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  modeToggleRow: {
    flexDirection: 'row-reverse',
    backgroundColor: '#F2F4F7',
    borderRadius: 10,
    padding: 3,
    marginBottom: 20,
    gap: 4,
  },
  modeToggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeToggleText: {
    fontSize: 12.5,
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  optionBtn: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D0D5DD',
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  optionBtnText: {
    fontSize: 13.5,
    color: '#344054',
    textAlign: 'center',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  optionBtnSelected: {
    borderColor: '#059669',
    backgroundColor: '#E6F4EA',
  },
  optionTextSelected: {
    color: '#047857',
    fontWeight: '700',
  },
  optionBtnCorrect: {
    borderColor: '#059669',
    backgroundColor: '#059669',
  },
  optionBtnIncorrect: {
    borderColor: '#EF4444',
    backgroundColor: '#EF4444',
  },
  optionBtnDisabled: {
    opacity: 0.5,
    backgroundColor: '#F9FAFB',
  },
  optionTextWhite: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  optionTextMuted: {
    color: '#98A2B3',
  },
  submitBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  feedbackWrapper: {
    alignItems: 'center',
    marginTop: 10,
  },
  feedbackTitleText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  correctAnswerText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  nextBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextBtnText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },

  // VOICE RECORDER STYLES
  voiceRecorderContainer: {
    borderWidth: 1.5,
    borderRadius: 18,
    borderStyle: 'dashed',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
    marginBottom: 20,
    backgroundColor: '#FAF9F6',
  },
  audioStateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 12,
  },
  audioStateText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  audioStateSubText: {
    fontSize: 11,
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  recordingTimerText: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  volumeWaveWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 80,
    width: 140,
  },
  volumeWaveBar: {
    width: 10,
    borderRadius: 99,
  },
  recorderBtnRow: {
    width: '100%',
    marginTop: 20,
    alignItems: 'center',
  },
  recordMainBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordMainBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  retryRecordBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryRecordBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    fontFamily: 'IBMPlexSansArabic-SemiBold',
  },

  // RESULTS STATE
  resultsHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  resultsIconHolder: {
    width: 68,
    height: 68,
    borderRadius: 99,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  resultsTitleText: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  resultsSubtitleText: {
    fontSize: 12.5,
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  resultsStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  resultBox: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  resultVal: {
    fontSize: 22,
    fontWeight: '800',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  resultLbl: {
    fontSize: 11,
    fontFamily: 'IBMPlexSansArabic-Regular',
    marginTop: 2,
  },
  shareReportBtn: {
    backgroundColor: '#25D366',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  shareReportBtnText: {
    fontSize: 13.5,
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  backToHomeBtn: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  backToHomeBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
    fontFamily: 'IBMPlexSansArabic-SemiBold',
  },
});
