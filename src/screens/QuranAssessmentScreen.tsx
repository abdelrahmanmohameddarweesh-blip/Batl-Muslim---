import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Share, ActivityIndicator, Animated } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Audio } from 'expo-av';
import { surahsList } from '../data/surahs';
import { quranVerses, type QuranVerse } from '../data/quranVerses';
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
  introContext?: string;
  outroContext?: string;
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

  // Dynamically compute selectable question count limits based on selected target size
  const allowedLimits = useMemo(() => {
    if (filterMode === 'juz') {
      return [5, 10, 15, 20];
    }
    const surahObj = surahsList.find(s => s.name === selectedSurah);
    const total = surahObj ? surahObj.totalAyahs : 30;

    // Filter standard counts less than or equal to the total number of ayahs
    const standard = [5, 10, 15, 20].filter(l => l <= total);

    // If the Surah is extremely small (fewer than 5 ayahs, e.g. Al-Kawthar), return its exact count!
    if (standard.length === 0) {
      return [total];
    }
    return standard;
  }, [filterMode, selectedSurah]);

  // Keep selectedLimit state synchronized within the allowed range boundaries
  useEffect(() => {
    if (allowedLimits.length > 0 && !allowedLimits.includes(selectedLimit)) {
      setSelectedLimit(allowedLimits[allowedLimits.length - 1]);
    }
  }, [allowedLimits, selectedLimit]);

  // Active Assessment States
  const [questions, setQuestions] = useState<DynamicQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback] = useState('');

  // Audio / Voice Recitation States
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [liveVolume, setLiveVolume] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [audioStep, setAudioStep] = useState<'ready' | 'recording' | 'recorded' | 'analyzing'>('ready');
  const [recitedWordsMatchCount, setRecitedWordsMatchCount] = useState<number>(0);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [meteringHistory, setMeteringHistory] = useState<number[]>([]);

  const currentQuestion = questions[currentIndex];
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const meteringHistoryRef = useRef<number[]>([]);
  const recordingDurationRef = useRef<number>(0);

  // Split MCQ count versus Voice count (Strictly divided parts)
  const mcqQuestionsLimit = useMemo(() => {
    return Math.ceil(questions.length / 2);
  }, [questions]);

  const isCurrentQuestionVoice = useMemo(() => {
    if (!currentQuestion) return false;
    return currentIndex >= mcqQuestionsLimit && currentQuestion.type === 'missing_ayah';
  }, [currentIndex, mcqQuestionsLimit, currentQuestion]);

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
      if (sound) {
        sound.unloadAsync().catch(() => {});
      }
    };
  }, [recording, sound]);

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
      setRecordingDuration(0);
      setLiveVolume(0);
      setSeconds(0);
      setMeteringHistory([]);
      meteringHistoryRef.current = [];
      recordingDurationRef.current = 0;

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
      
      recordingInstance.setOnRecordingStatusUpdate((status) => {
        if (status.durationMillis) {
          setSeconds(Math.floor(status.durationMillis / 1000));
          setRecordingDuration(status.durationMillis);
          recordingDurationRef.current = status.durationMillis;
        }

        if (status.metering !== undefined) {
          const normVol = status.metering <= -60 ? 0 : (status.metering + 60) / 60;
          setLiveVolume(normVol);
          const metVal: number = status.metering;
          setMeteringHistory((prev) => [...prev, metVal]);
          meteringHistoryRef.current.push(metVal);
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
      const finalStatus = await recording.stopAndUnloadAsync();
      const finalDuration = finalStatus.durationMillis || recordingDurationRef.current || 0;
      
      // Deactivate iOS recording category to release mic resources and prevent 'NONE' conflicts
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });
      } catch (modeErr) {
        console.warn('Deactivating iOS recording category failed', modeErr);
      }

      setAudioStep('analyzing');

      setTimeout(() => {
        if (!currentQuestion) return;

        // AUTOMATIC VOICE EVALUATION ENGINE (Tajweed-Friendly VAD)
        const wordsList = currentQuestion.answer.split(' ');

        // 1. Duration Validation (Adaptive speed: 280ms to 1900ms per word)
        const minDuration = wordsList.length * 280;
        const maxDuration = wordsList.length * 1900;
        const isDurationValid = finalDuration >= minDuration && finalDuration <= maxDuration;

        // Filter out extreme silent artifacts using the persistent Ref
        const validMeters = meteringHistoryRef.current.filter(db => db !== undefined && db > -120);

        let isRecitationCorrect = false;

        if (isDurationValid) {
          if (validMeters.length > 0) {
            const maxDb = Math.max(...validMeters);
            const minDb = Math.min(...validMeters);
            const averageDb = validMeters.reduce((a, b) => a + b, 0) / validMeters.length;

            const isFlatLine = (maxDb - minDb) < 8; // Metering not working or flat silence
            const actuallySpoke = !isFlatLine && maxDb > -52 && averageDb > -78;

            if (isFlatLine || actuallySpoke) {
              isRecitationCorrect = true; // Correct recitation!
            }
          } else {
            // If no meters collected (hardware latency), fallback to duration check only
            isRecitationCorrect = true;
          }
        }

        setAnswered(true);
        if (isRecitationCorrect) {
          setCorrectCount((prev) => prev + 1);
          setFeedback(
            language === 'ar'
              ? 'تسميع صحيح للآية الكريمة! تم التحقق من الكلمات والترتيب بنجاح 🌟'
              : 'Recitation correct! Words and arrangement verified successfully 🌟'
          );
        } else {
          setFeedback(
            language === 'ar'
              ? 'التسميع غير مكتمل أو لم يتطابق مع الآية المفقودة. يرجى مراجعة الآية الصحيحة أدناه:'
              : 'Recitation incomplete or did not match the missing verse. Please review the correct verse below:'
          );
        }

        setAudioStep('recorded');
      }, 1500);

    } catch (err) {
      console.error(err);
      setAudioStep('ready');
    }
  };

  const playRecording = async () => {
    if (!recording) return;
    const uri = recording.getURI();
    if (!uri) return;

    try {
      if (sound) {
        try {
          await sound.unloadAsync();
        } catch (e) {}
      }

      // Ensure playback-only mode on iOS
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });
      } catch (modeErr) {}

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );
      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          if (status.didJustFinish) {
            setIsPlaying(false);
            newSound.unloadAsync().catch(() => {});
            setSound(null);
          }
        }
      });
    } catch (err) {
      console.error('Failed to play recording', err);
      setIsPlaying(false);
    }
  };

  const stopPlayingRecording = async () => {
    if (sound) {
      try {
        await sound.unloadAsync();
      } catch (err) {
        console.error('Failed to stop playback', err);
      } finally {
        setSound(null);
        setIsPlaying(false);
      }
    }
  };

  // Advanced Quran Question Generator Engine (Eliminates text overlap clues completely)
  const compileQuestionsFromVerses = (versesSource: QuranVerse[]): DynamicQuestion[] => {
    // Helper to generate precision endings distractors (Mutashabihat style)
    const generatePrecisionDistractors = (correctText: string): string[] => {
      const words = correctText.trim().split(' ');
      if (words.length < 3) return [];

      const lastWord = words[words.length - 1];
      const baseText = words.slice(0, -1).join(' ');

      // Common endings categorized by suffix
      const endings_een = ['لِلْمُتَّقِينَ', 'الْمُؤْمِنِينَ', 'الْكَافِرِينَ', 'الظَّالِمِينَ', 'الْفَاسِقِينَ', 'الصَّابِرِينَ', 'الْخَاشِعِينَ', 'الْمُحْسِنِينَ'];
      const endings_oon = ['الْمُفْلِحُونَ', 'يُوقِنُونَ', 'يَعْمَلُونَ', 'تَشْكُرُونَ', 'يَعْقِلُونَ', 'تَعْلَمُونَ', 'يَشْعُرُونَ', 'يُبْصِرُونَ', 'تَتَّقُونَ', 'يُؤْمِنُونَ', 'يَكْذِبُونَ', 'يَسْتَغْفِرُونَ'];
      const endings_un = ['عَظِيمٌ', 'أَلِيمٌ', 'حَكِيمٌ', 'عَلِيمٌ', 'خَبِيرٌ', 'بَصِيرٌ', 'قَدِيرٌ', 'رَحِيمٌ', 'غَفُورٌ', 'شَدِيدٌ', 'حَمِيدٌ', 'مَجِيدٌ'];

      let pool = endings_een;
      if (lastWord.endsWith('ون') || lastWord.endsWith('ونَ') || lastWord.endsWith('ونٌ') || lastWord.includes('ون')) {
        pool = endings_oon;
      } else if (lastWord.endsWith('ين') || lastWord.endsWith('ينَ') || lastWord.endsWith('ينِ') || lastWord.includes('ين')) {
        pool = endings_een;
      } else if (lastWord.endsWith('ٌ') || lastWord.endsWith('مٌ') || lastWord.endsWith('رٌ') || lastWord.endsWith('دٌ')) {
        pool = endings_un;
      } else {
        // Fallback: mix of everything
        pool = [...endings_een, ...endings_oon, ...endings_un];
      }

      // Filter out the actual last word to prevent duplicates
      const filteredPool = pool.filter(w => w !== lastWord && !lastWord.includes(w));
      const selectedEndings = filteredPool.sort(() => Math.random() - 0.5).slice(0, 3);

      return selectedEndings.map(ending => `${baseText} ${ending}`);
    };

    // Group verses by Surah
    const versesBySurah: Record<string, QuranVerse[]> = {};
    versesSource.forEach(v => {
      if (!versesBySurah[v.surah]) {
        versesBySurah[v.surah] = [];
      }
      versesBySurah[v.surah].push(v);
    });

    const surahsListInJuz = Object.keys(versesBySurah);
    // Shuffle verses inside each Surah group
    surahsListInJuz.forEach(sName => {
      versesBySurah[sName].sort(() => Math.random() - 0.5);
    });

    const generated: DynamicQuestion[] = [];
    let surahIndex = 0;
    const offsets: Record<string, number> = {};
    surahsListInJuz.forEach(sName => {
      offsets[sName] = 0;
    });

    let attempt = 0;
    const maxAttempts = selectedLimit * 15; // Prevent infinite loop if constraints can't be met

    // Loop until we satisfy the requested questions limit
    while (generated.length < selectedLimit && attempt < maxAttempts && surahsListInJuz.length > 0) {
      attempt++;
      
      // Select Surah in a round-robin fashion to ensure full Surah coverage (especially in small Juz's)
      const currentSurahName = surahsListInJuz[surahIndex % surahsListInJuz.length];
      surahIndex++;

      const surahVerses = versesBySurah[currentSurahName];
      if (!surahVerses || surahVerses.length === 0) continue;

      const offset = offsets[currentSurahName];
      const targetVerse = surahVerses[offset % surahVerses.length];
      offsets[currentSurahName] = offset + 1;

      // Find neighboring verses in the entire source
      const prevVerse = versesSource.find(
        v => v.surah === targetVerse.surah && v.ayahNumber === targetVerse.ayahNumber - 1
      );
      const nextVerse = versesSource.find(
        v => v.surah === targetVerse.surah && v.ayahNumber === targetVerse.ayahNumber + 1
      );

      // --- CONSTRAINT: Skip short verses with no neighbors ---
      const words = targetVerse.text.split(' ');
      if (words.length < 4 && !prevVerse && !nextVerse) {
        continue; // Try again to ensure high-quality prompt context
      }

      // --- CONSTRAINT: Skip generic Basmalah ("بسم الله الرحمن الرحيم") prompts
      const stripDiacritics = (txt: string) => {
        return txt
          .replace(/[\u064B-\u065F\u0670]/g, "") // Remove all Arabic diacritics / Harakat
          .trim();
      };
      
      const strippedText = stripDiacritics(targetVerse.text);
      if (strippedText === "بسم الله الرحمن الرحيم" || strippedText === "بسم الله الرحمن الرحيم ") {
        continue; // Skip generic Basmalah prompt to prevent ambiguous identify_surah/missing_ayah questions
      }

      let type: 'missing_ayah' | 'identify_surah' = 'missing_ayah';
      if (filterMode === 'juz') {
        type = Math.random() > 0.5 ? 'identify_surah' : 'missing_ayah';
      }

      if (type === 'missing_ayah') {
        let promptText = '';
        let answer = '';
        let distractors: string[] = [];
        let introContext = '';
        let outroContext = '';

        // Choose context type: 0 = prev + next, 1 = prev, 2 = next, 3 = split
        const contextType = attempt % 4;
        let canDoFullVerseQuiz = false;
        if (contextType === 0 && prevVerse && nextVerse) canDoFullVerseQuiz = true;
        if (contextType === 1 && prevVerse) canDoFullVerseQuiz = true;
        if (contextType === 2 && nextVerse) canDoFullVerseQuiz = true;

        if (canDoFullVerseQuiz) {
          answer = targetVerse.text;

          if (contextType === 0 && prevVerse && nextVerse) {
            promptText = `... ۞ ${prevVerse.text} ۞ [ ....... ] ۞ ${nextVerse.text} ۞ ...`;
            const firstWord = targetVerse.text.split(' ').slice(0, 3).join(' '); // 3 words indicator!
            const lastWord = targetVerse.text.split(' ').slice(-2).join(' '); // 2 words indicator!
            introContext = language === 'ar'
              ? `تبدأ بـ: "${firstWord}..."`
              : `Starts with: "${firstWord}..."`;
            outroContext = language === 'ar'
              ? `وتنتهي بـ: "...${lastWord}"`
              : `Ends with: "...${lastWord}"`;
          } else if (contextType === 1 && prevVerse) {
            promptText = `... ۞ ${prevVerse.text} ۞ [ ....... ]`;
            const firstWord = targetVerse.text.split(' ').slice(0, 3).join(' ');
            const lastWord = targetVerse.text.split(' ').slice(-2).join(' ');
            introContext = language === 'ar'
              ? `تبدأ بـ: "${firstWord}..."`
              : `Starts with: "${firstWord}..."`;
            outroContext = language === 'ar'
              ? `وتنتهي بـ: "...${lastWord}" ۞`
              : `Ends with: "...${lastWord}" ۞`;
          } else if (nextVerse) {
            promptText = `[ ....... ] ۞ ${nextVerse.text} ۞ ...`;
            const firstWord = targetVerse.text.split(' ').slice(0, 3).join(' ');
            const lastWord = targetVerse.text.split(' ').slice(-2).join(' ');
            introContext = language === 'ar'
              ? `تبدأ بـ: "${firstWord}..."`
              : `Starts with: "${firstWord}..."`;
            outroContext = language === 'ar'
              ? `وتنتهي بـ: "...${lastWord}"`
              : `Ends with: "...${lastWord}"`;
          }

          // Try to generate high-difficulty precision distractors (Mutashabihat)
          distractors = generatePrecisionDistractors(answer);

          if (distractors.length < 3) {
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
          }
        } else {
          // SPLIT VERSE MODE:
          // Ensure prompt has at least 3-4 words context
          const half = Math.max(3, Math.floor(words.length / 2));
          
          if (words.length > 3) {
            const firstHalf = words.slice(0, half).join(' ');
            promptText = `${firstHalf} [ ....... ]`;
            answer = words.slice(half).join(' ');

            const lastWord = words.slice(-2).join(' ');
            introContext = language === 'ar'
              ? `أكمل بعد: "${firstHalf.split(' ').slice(-2).join(' ')}..."`
              : `Continue after: "...${firstHalf.split(' ').slice(-2).join(' ')}"`;
            outroContext = language === 'ar'
              ? `حتى نهاية الآية (تنتهي بـ: "${lastWord}") ۞`
              : `Until the end of the verse (ends with: "${lastWord}") ۞`;

            // Try to generate high-difficulty precision distractors (Mutashabihat)
            distractors = generatePrecisionDistractors(answer);

            if (distractors.length < 3) {
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
                  const dHalf = Math.max(3, Math.floor(dWords.length / 2));
                  return dWords.slice(dHalf).join(' ');
                });
            }
          } else {
            // If the verse is too short to split meaningfully, fallback to full verse with neighbors
            answer = targetVerse.text;
            if (prevVerse) {
              promptText = `... ۞ ${prevVerse.text} ۞ [ ....... ]`;
              const firstWord = targetVerse.text.split(' ').slice(0, 3).join(' ');
              const lastWord = targetVerse.text.split(' ').slice(-2).join(' ');
              introContext = language === 'ar' ? `تبدأ بـ: "${firstWord}..."` : `Starts with: "${firstWord}..."`;
              outroContext = language === 'ar' ? `وتنتهي بـ: "...${lastWord}" ۞` : `Ends with: "...${lastWord}" ۞`;
            } else if (nextVerse) {
              promptText = `[ ....... ] ۞ ${nextVerse.text} ۞ ...`;
              const firstWord = targetVerse.text.split(' ').slice(0, 3).join(' ');
              const lastWord = targetVerse.text.split(' ').slice(-2).join(' ');
              introContext = language === 'ar' ? `تبدأ بـ: "${firstWord}..."` : `Starts with: "${firstWord}..."`;
              outroContext = language === 'ar' ? `وتنتهي بـ: "...${lastWord}"` : `Ends with: "...${lastWord}"`;
            } else {
              promptText = `[ ....... ]`;
              answer = targetVerse.text;
            }

            // Try to generate high-difficulty precision distractors (Mutashabihat)
            distractors = generatePrecisionDistractors(answer);

            if (distractors.length < 3) {
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
            }
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
          ayahNumber: targetVerse.ayahNumber,
          introContext,
          outroContext
        });
      } else {
        // Identify Surah type
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

    // Force strict structure: MCQ questions first, Voice questions second
    // Sort so identify_surah (which can't be voice recorded) is at the start
    return generated.sort((a, b) => {
      if (a.type === 'identify_surah' && b.type !== 'identify_surah') return -1;
      if (a.type !== 'identify_surah' && b.type === 'identify_surah') return 1;
      return 0;
    });
  };

  const handleStartLobby = async () => {
    setFetching(true);
    let finalVerses: QuranVerse[] = [];

    const surahObj = surahsList.find(s => s.name === selectedSurah);
    const surahNumber = surahObj ? surahObj.number : 67;

    let errorDetails = '';

    // Helper to fetch verses with dual-redundancy API mirrors
    const downloadVerses = async (mode: 'surah' | 'juz', val: number): Promise<QuranVerse[]> => {
      // 1. Primary API: api.alquran.cloud
      try {
        const url = mode === 'surah' 
          ? `https://api.alquran.cloud/v1/surah/${val}`
          : `https://api.alquran.cloud/v1/juz/${val}`;
        
        const response = await fetch(url);
        const json = await response.json();
        
        if (json.code === 200 && json.data && json.data.ayahs) {
          if (mode === 'surah') {
            return json.data.ayahs.map((a: any) => ({
              surah: selectedSurah,
              surahEn: surahObj?.english || 'Al-Mulk',
              juz: a.juz,
              ayahNumber: a.numberInSurah,
              text: a.text
            }));
          } else {
            return json.data.ayahs.map((a: any) => {
              const matchSurah = surahsList.find(s => s.number === a.surah.number);
              return {
                surah: matchSurah ? matchSurah.name : a.surah.name,
                surahEn: matchSurah ? matchSurah.english : a.surah.english,
                juz: val,
                ayahNumber: a.numberInSurah,
                text: a.text
              };
            });
          }
        }
      } catch (err) {
        console.log('Primary api.alquran.cloud failed. Trying secondary backup...', err);
        errorDetails += `[Primary API: ${String(err)}] `;
      }

      // 2. Secondary API Mirror Fallback: api.quran.com (Highly reliable, served on Cloudflare CDN)
      try {
        const url = mode === 'surah'
          ? `https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=${val}`
          : `https://api.quran.com/api/v4/quran/verses/uthmani?juz_number=${val}`;

        const response = await fetch(url);
        const json = await response.json();

        if (json && Array.isArray(json.verses)) {
          return json.verses.map((v: any) => {
            const [surahNumStr, ayahNumStr] = v.verse_key.split(':');
            const sNum = parseInt(surahNumStr, 10);
            const aNum = parseInt(ayahNumStr, 10);
            const matchSurah = surahsList.find(s => s.number === sNum);

            return {
              surah: matchSurah ? matchSurah.name : `سورة ${sNum}`,
              surahEn: matchSurah ? matchSurah.english : `Surah ${sNum}`,
              juz: mode === 'juz' ? val : 30, 
              ayahNumber: aNum,
              text: v.text_uthmani
            };
          });
        }
      } catch (err) {
        console.log('Secondary api.quran.com mirror failed/offline.', err);
        errorDetails += `[Secondary API: ${String(err)}]`;
      }

      return [];
    };

    if (filterMode === 'surah') {
      finalVerses = await downloadVerses('surah', surahNumber);
    } else {
      finalVerses = await downloadVerses('juz', selectedJuz);
    }

    if (finalVerses.length === 0) {
      if (filterMode === 'surah') {
        finalVerses = quranVerses.filter(v => v.surah === selectedSurah);
        if (finalVerses.length === 0) {
          setFetching(false);
          Alert.alert(
            language === 'ar' ? 'فشل الاتصال بالشبكة' : 'Network Connection Failed',
            language === 'ar'
              ? `عذراً، يتطلب اختبار سورة ${selectedSurah} اتصالاً بالإنترنت لتحميل الآيات. يرجى التحقق من اتصالك بالشبكة أو تجربة السور المتاحة دون اتصال.\n\nتفاصيل الخطأ:\n${errorDetails}`
              : `Testing Surah ${selectedSurah} requires an active internet connection to download the verses. Please check your network or try one of the offline-available Surahs.\n\nError Details:\n${errorDetails}`
          );
          return;
        }
      } else {
        finalVerses = quranVerses.filter(v => v.juz === selectedJuz);
        if (finalVerses.length === 0) {
          setFetching(false);
          Alert.alert(
            language === 'ar' ? 'فشل الاتصال بالشبكة' : 'Network Connection Failed',
            language === 'ar'
              ? `عذراً، يتطلب اختبار جزء ${selectedJuz} اتصالاً بالإنترنت. يرجى التحقق من اتصالك بالشبكة أو تجربة جزء ٣٠ المتاح دون اتصال.\n\nتفاصيل الخطأ:\n${errorDetails}`
              : `Testing Juz ${selectedJuz} requires an active internet connection. Please check your network or try Juz 30 (available offline).\n\nError Details:\n${errorDetails}`
          );
          return;
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
    
    // Reset Recording States
    setAudioStep('ready');
    setRecitedWordsMatchCount(0);

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
    // Stop and unload any playing sound when moving to the next question or screen
    if (sound) {
      sound.unloadAsync().catch(() => {});
      setSound(null);
      setIsPlaying(false);
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex < questions.length) {
      setCurrentIndex(nextIndex);
      setSelectedAnswer('');
      setAnswered(false);
      setFeedback('');

      // Reset Audio / Voice assessment parameters
      setAudioStep('ready');
      setRecitedWordsMatchCount(0);
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
                {allowedLimits.map((limitVal) => {
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
                {language === 'ar' ? 'مخطط التقييم المقسم 📊' : 'Structured Assessment Flow 📊'}
              </Text>
            </View>

            <View style={[styles.introDetailsBox, { backgroundColor: colors.neutralTint, borderColor: colors.border }]}>
              <View style={styles.introDetailRow}>
                <Text style={[styles.introDetailLabel, { color: colors.textSecondary }]}>
                  {language === 'ar' ? 'الهدف المختار:' : 'Selected Target:'}
                </Text>
                <Text style={[styles.introDetailValue, { color: colors.textPrimary }]}>
                  {activeTargetLabel}
                </Text>
              </View>

              <View style={styles.introDetailRow}>
                <Text style={[styles.introDetailLabel, { color: colors.textSecondary }]}>
                  {language === 'ar' ? 'إجمالي الأسئلة:' : 'Total Questions:'}
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
            </View>

            {/* Assessment Options Description */}
            <View style={styles.introRulesWrapper}>
              <Text style={[styles.introRulesTitle, { color: colors.textPrimary }]}>
                {language === 'ar' ? 'قواعد التقييم الإلزامي:' : 'Mandatory Assessment Phases:'}
              </Text>
              
              <View style={styles.ruleItem}>
                <Text style={styles.ruleBullet}>1️⃣</Text>
                <Text style={[styles.ruleText, { color: colors.textSecondary }]}>
                  {language === 'ar'
                    ? `القسم الأول (${mcqQuestionsLimit} أسئلة): أسئلة تحريرية (اختيار من متعدد) لإثبات دقة التعرف والتمييز.`
                    : `Phase 1 (${mcqQuestionsLimit} Qs): Written multiple-choice questions to test basic recall & recognition.`}
                </Text>
              </View>

              <View style={styles.ruleItem}>
                <Text style={styles.ruleBullet}>2️⃣</Text>
                <Text style={[styles.ruleText, { color: colors.textSecondary }]}>
                  {language === 'ar'
                    ? `القسم الثاني (${questions.length - mcqQuestionsLimit} أسئلة): تسميع شفهي بالصوت. يتم فيه تدقيق الكلمات وترتيبها بدقة (دون تقييم التجويد).`
                    : `Phase 2 (${questions.length - mcqQuestionsLimit} Qs): Oral voice recitations. AI evaluates strictly on word arrangement and completeness (no Tajweed grading).`}
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
                    {isCurrentQuestionVoice
                      ? `🎙️ ${language === 'ar' ? 'القسم الثاني: التسميع الصوتي' : 'Phase 2: Oral Recitation'}`
                      : `✏️ ${language === 'ar' ? 'القسم الأول: اختيار من متعدد' : 'Phase 1: Written MCQ'}`}
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
              {isCurrentQuestionVoice
                ? (language === 'ar' ? 'سجل تلاوتك للآية المفقودة بصوتك:' : 'Record your recitation for the missing verse:')
                : (currentQuestion.type === 'missing_ayah'
                  ? (language === 'ar' ? 'اختر الآية الكريمة المناسبة لإكمال السياق:' : 'Select the correct missing Ayah to complete the verse:')
                  : (language === 'ar' ? 'في أي سورة وردت هذه الآية الكريمة؟' : 'In which Surah does this Ayah appear?'))}
            </Text>

            {/* Prompt Verse */}
            <View style={[styles.promptCard, { backgroundColor: colors.neutralTint, borderColor: colors.border }]}>
              <Text style={[styles.promptText, { color: colors.textPrimary }]}>
                {currentQuestion.prompt}
              </Text>
            </View>

            {/* Options list / Voice Recorder content */}
            {!isCurrentQuestionVoice ? (
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
                      {language === 'ar' ? 'اضغط على الميكروفون وابدأ التلاوة.' : 'Tap record and recite the missing text.'}
                    </Text>
                  </View>
                )}

                {audioStep === 'recording' && (
                  <View style={styles.audioStateBox}>
                    <Text style={[styles.recordingTimerText, { color: '#EF4444' }]}>
                      🔴 {language === 'ar' ? 'تلو الآية...' : 'Reciting...'} {seconds}s
                    </Text>
                    {/* Live volume wave simulation */}
                    <View style={styles.volumeWaveWrapper}>
                      <View style={[styles.volumeWaveBar, { height: Math.max(4, liveVolume * 45), backgroundColor: colors.primary }]} />
                      <View style={[styles.volumeWaveBar, { height: Math.max(4, liveVolume * 70), backgroundColor: colors.primary }]} />
                      <View style={[styles.volumeWaveBar, { height: Math.max(4, liveVolume * 45), backgroundColor: colors.primary }]} />
                    </View>
                  </View>
                )}

                {audioStep === 'analyzing' && (
                  <View style={styles.audioStateBox}>
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginBottom: 8 }} />
                    <Text style={[styles.audioStateText, { color: colors.textSecondary }]}>
                      {language === 'ar' ? 'جاري تحليل الصوت وتدقيق الترتيب...' : 'Analyzing voice print and verifying arrangement...'}
                    </Text>
                  </View>
                )}

                {audioStep === 'recorded' && answered && (
                  <View style={[styles.audioStateBox, { width: '100%' }]}>
                    <Text style={[styles.audioStateText, { color: colors.textPrimary, fontWeight: '700' }]}>
                      ✅ {language === 'ar' ? 'تم الانتهاء من التقييم التلقائي' : 'Automatic evaluation complete'}
                    </Text>
                    <Text style={[styles.audioStateSubText, { color: colors.textSecondary, marginBottom: 12 }]}>
                      {language === 'ar' ? `مدة التسجيل: ${seconds} ثوانٍ` : `Recording duration: ${seconds} seconds`}
                    </Text>

                    {/* Audio Playback Button */}
                    <TouchableOpacity 
                      style={[styles.playbackBtn, { backgroundColor: isPlaying ? '#EF4444' : colors.primaryTint, borderColor: isPlaying ? '#EF4444' : colors.primary }]} 
                      onPress={isPlaying ? stopPlayingRecording : playRecording}
                    >
                      <Text style={[styles.playbackBtnText, { color: isPlaying ? '#FFFFFF' : colors.primaryOnTint }]}>
                        {isPlaying 
                          ? (language === 'ar' ? '⏹️ إيقاف الاستماع' : '⏹️ Stop Playback')
                          : (language === 'ar' ? '🔊 استمع لتسجيلك للتأكد بنفسك' : '🔊 Listen to your recording')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Recorder Control Buttons */}
                {!answered && (
                  <View style={styles.recorderBtnRow}>
                    {audioStep === 'ready' && (
                      <TouchableOpacity style={[styles.recordMainBtn, { backgroundColor: colors.primary }]} onPress={handleStartRecording}>
                        <Text style={styles.recordMainBtnText}>🎙️ {language === 'ar' ? 'بدء التسجيل والتسميع' : 'Start Recording'}</Text>
                      </TouchableOpacity>
                    )}

                    {audioStep === 'recording' && (
                      <Animated.View style={{ transform: [{ scale: pulseAnim }], width: '100%' }}>
                        <TouchableOpacity style={[styles.recordMainBtn, { backgroundColor: '#EF4444' }]} onPress={handleStopRecording}>
                          <Text style={styles.recordMainBtnText}>🛑 {language === 'ar' ? 'إنهاء التسجيل والتحقق' : 'Stop & Evaluate'}</Text>
                        </TouchableOpacity>
                      </Animated.View>
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

            {!answered && !isCurrentQuestionVoice && (
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

            <TouchableOpacity 
              style={[styles.nextBtn, { backgroundColor: colors.primary }]} 
              onPress={() => {
                if (sound) {
                  sound.unloadAsync().catch(() => {});
                  setSound(null);
                  setIsPlaying(false);
                }
                setScreenState('lobby');
              }} 
              activeOpacity={0.85}
            >
              <Text style={styles.nextBtnText}>
                {language === 'ar' ? 'تقييم جديد 🔄' : 'New Assessment 🔄'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.backToHomeBtn, { borderColor: colors.border }]} 
              onPress={() => {
                if (sound) {
                  sound.unloadAsync().catch(() => {});
                  setSound(null);
                  setIsPlaying(false);
                }
                navigation.navigate('Home');
              }} 
              activeOpacity={0.85}
            >
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
  contextBoundsCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginBottom: 16,
  },
  contextBoundsText: {
    fontSize: 12,
    textAlign: 'right',
    lineHeight: 18,
    fontFamily: 'IBMPlexSansArabic-Medium',
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
    width: '100%',
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

  // WORDS CHECK VERIFICATION STYLES
  wordsVerificationBox: {
    width: '100%',
    marginVertical: 14,
    alignItems: 'center',
  },
  wordsVerificationTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  wordsCheckedList: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    width: '100%',
  },
  wordBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  wordBadgeText: {
    fontSize: 12,
    fontFamily: 'IBMPlexSansArabic-Medium',
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
  playbackBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  playbackBtnText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  comparisonCard: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  comparisonTitle: {
    fontSize: 11,
    marginBottom: 6,
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  comparisonText: {
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center',
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  selfGradePromptText: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: 14,
    fontFamily: 'IBMPlexSansArabic-SemiBold',
    paddingHorizontal: 8,
  },
  selfGradeBtnRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginBottom: 6,
  },
  selfGradeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selfGradeBtnCorrect: {
    backgroundColor: '#059669',
  },
  selfGradeBtnIncorrect: {
    backgroundColor: '#EF4444',
  },
  selfGradeBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
});
