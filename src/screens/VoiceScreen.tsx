import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Animated, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { readers, type Reader } from '../data/readers';
import { ayahs, type Ayah } from '../data/ayahs';
import { generateReferenceProfile, analyzeVocalImitation } from '../data/voiceTemplates';
import { useAuth } from '../contexts/AuthContext';
import { saveUserScore, getCurrentUserProfile } from '../firebase/auth';
import { Colors } from '../config/colors';
import { useInterstitialAd } from '../config/adsService';
import { AdMobConfig } from '../config/ads';

export default function VoiceScreen({ navigation }: any) {
  const { user } = useAuth();
  
  // Navigation states: 'select-reader' | 'ready' | 'recording' | 'recorded' | 'analyzing' | 'scored'
  const [step, setStep] = useState<'select-reader' | 'ready' | 'recording' | 'recorded' | 'analyzing' | 'scored'>('select-reader');
  
  const [pendingScoreData, setPendingScoreData] = useState<{ results: any, earnedPoints: number } | null>(null);

  // Interstitial Ad setup
  const { isLoaded, isClosed, load, show } = useInterstitialAd(AdMobConfig.interstitialAdUnitID, {
    requestNonPersonalizedAdsOnly: true,
  });

  // Load interstitial on mount
  useEffect(() => {
    load();
  }, [load]);

  // Reload interstitial when closed
  useEffect(() => {
    if (isClosed) {
      load();
    }
  }, [isClosed, load]);

  const completeScoring = async (results: any, earnedPoints: number) => {
    setStep('scored');
    if (user?.uid && results.overall > 15) {
      try {
        const profile = await getCurrentUserProfile(user.uid);
        const currentScore = profile?.score ?? 0;
        await saveUserScore(user.uid, currentScore + earnedPoints);

        // Track daily voice quest completion
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
        await AsyncStorage.setItem(`quest-voice-done-${todayStr}`, 'true');

        // Track total completed recitations count for badges
        const count = await AsyncStorage.getItem('completed-recitations-count');
        const nextCount = count ? parseInt(count, 10) + 1 : 1;
        await AsyncStorage.setItem('completed-recitations-count', nextCount.toString());
      } catch (err) {
        console.error(err);
      }
    }
  };

  useEffect(() => {
    if (isClosed && pendingScoreData !== null) {
      completeScoring(pendingScoreData.results, pendingScoreData.earnedPoints);
      setPendingScoreData(null);
    }
  }, [isClosed, pendingScoreData]);
  
  const [selectedReader, setSelectedReader] = useState<Reader | null>(null);
  const [currentAyah, setCurrentAyah] = useState<Ayah | null>(null);
  const [recitationStyle, setRecitationStyle] = useState<'murattal' | 'mujawwad'>('murattal');
  const [seconds, setSeconds] = useState(0);
  
  // Audio state
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [meteringHistory, setMeteringHistory] = useState<number[]>([]);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [liveVolume, setLiveVolume] = useState(0); // 0.0 to 1.0

  // Scoring parameters
  const [scoreBreakdown, setScoreBreakdown] = useState({
    pronunciation: 0,
    tone: 0,
    rhythm: 0,
    overall: 0,
  });

  // Pulse animation for recording button
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation loop during recording
  useEffect(() => {
    let animLoop: Animated.CompositeAnimation;
    if (step === 'recording') {
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
  }, [step]);

  // Cleanup audio recording on unmount
  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, [recording]);

  const handleSelectReader = (reader: Reader) => {
    setSelectedReader(reader);
    
    // Choose a random Ayah
    const randomIndex = Math.floor(Math.random() * ayahs.length);
    setCurrentAyah(ayahs[randomIndex]);
    setStep('ready');
  };

  const handleStartRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('صلاحية الميكروفون', 'الرجاء تمكين الوصول إلى الميكروفون في إعدادات جهازك للمتابعة.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Clear previous recording state
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
          
          // Map decibels (-160 to 0) to standard normalized value (0.0 to 1.0)
          const normVol = status.metering <= -60 ? 0 : (status.metering + 60) / 60;
          setLiveVolume(normVol);
        }
      });

      await recordingInstance.startAsync();
      setRecording(recordingInstance);
      setStep('recording');
    } catch (err) {
      console.error(err);
      Alert.alert('خطأ في التسجيل', 'فشل في تهيئة ميكروفون الهاتف للتسجيل.');
    }
  };

  const handleStopRecording = async () => {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      setStep('recorded');
    } catch (err) {
      console.error(err);
    }
  };

  const handleAnalyzeRecitation = () => {
    if (!currentAyah || !selectedReader) return;

    setStep('analyzing');
    
    setTimeout(async () => {
      // Calculate dynamic vocal matching using the updated Pearson correlation matching engine
      const refProfile = generateReferenceProfile(currentAyah.id, selectedReader.id, recitationStyle);
      const results = analyzeVocalImitation(meteringHistory, recordingDuration, refProfile);

      setScoreBreakdown(results);
      
      const earnedPoints = Math.round((results.overall / 100) * 25);
      setPendingScoreData({ results, earnedPoints });

      if (isLoaded) {
        show();
      } else {
        completeScoring(results, earnedPoints);
      }
    }, 2500);
  };

  const handleReset = () => {
    setRecording(null);
    setSelectedReader(null);
    setCurrentAyah(null);
    setMeteringHistory([]);
    setRecordingDuration(0);
    setLiveVolume(0);
    setStep('select-reader');
  };

  return (
    <ScrollView style={styles.outerContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>محاكاة تلاوة القراء</Text>
          <Text style={styles.subtitle}>تحدي الصوت المتقدم: رتل كالقراء المشاهير وقس دقة محاكاتك لنغمتهم وأحكامهم</Text>
        </View>

        {/* STEP 1: Qari Selection */}
        {step === 'select-reader' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>اختر الشيخ القارئ لمحاكاة تلاوته:</Text>
            <View style={styles.readersList}>
              {readers.map((reader) => (
                <TouchableOpacity
                  key={reader.id}
                  style={styles.readerRow}
                  onPress={() => handleSelectReader(reader)}
                  activeOpacity={0.85}
                >
                  <View style={styles.readerEmojiContainer}>
                    <Text style={styles.readerEmoji}>{reader.emoji}</Text>
                  </View>
                  <View style={styles.readerInfo}>
                    <Text style={styles.readerName}>{reader.name}</Text>
                    <Text style={styles.readerDesc}>{reader.styleDescription}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* STEP 2: Ready State */}
        {step === 'ready' && selectedReader && currentAyah && (
          <View style={styles.card}>
            <View style={styles.qariHeader}>
              <Text style={styles.qariName}>المحاكاة المطلوبة: {selectedReader.name}</Text>
              <Text style={styles.qariAdvice}>💡 نصيحة النبرة: {selectedReader.tuneAdvice}</Text>
            </View>

            {/* Recitation Style Selection Toggle */}
            <View style={styles.styleSelectorContainer}>
              <Text style={styles.styleSelectorTitle}>اختر طريقة التلاوة للتحدي:</Text>
              <View style={styles.styleSelectorRow}>
                <TouchableOpacity 
                  style={[styles.styleSelectorBtn, recitationStyle === 'mujawwad' && styles.styleSelectorBtnActive]}
                  onPress={() => setRecitationStyle('mujawwad')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.styleSelectorText, recitationStyle === 'mujawwad' && styles.styleSelectorTextActive]}>
                    🎨 مجوّد (بطيء ونغمي)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.styleSelectorBtn, recitationStyle === 'murattal' && styles.styleSelectorBtnActive]}
                  onPress={() => setRecitationStyle('murattal')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.styleSelectorText, recitationStyle === 'murattal' && styles.styleSelectorTextActive]}>
                    📖 مرتل (سريع ومنظم)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.verseBox}>
              <Text style={styles.verseLabel}>{currentAyah.surah} - الآية {currentAyah.number}</Text>
              <Text style={styles.verseText}>{currentAyah.text}</Text>
            </View>

            <Text style={styles.statusHint}>استعد واضغط على الزر للبدء بالتسجيل</Text>
            <TouchableOpacity style={styles.micButton} onPress={handleStartRecording} activeOpacity={0.85}>
              <Text style={styles.micIcon}>🎙️</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backButton} onPress={handleReset}>
              <Text style={styles.backButtonText}>تغيير القارئ</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 3: Recording State */}
        {step === 'recording' && selectedReader && currentAyah && (
          <View style={styles.card}>
            <Text style={styles.recordingTitle}>جاري تسجيل صوتك الآن ({recitationStyle === 'mujawwad' ? 'مجوّد' : 'مرتل'})...</Text>
            <Text style={styles.timerText}>الوقت: 00:{seconds < 10 ? `0${seconds}` : seconds}</Text>

            <View style={styles.verseBox}>
              <Text style={styles.verseLabel}>{currentAyah.surah}</Text>
              <Text style={styles.verseText}>{currentAyah.text}</Text>
            </View>

            {/* REAL-TIME Sound Wave Visualizer matching microphone amplitude */}
            <View style={styles.waveContainer}>
              <View style={[styles.waveBar, { height: 10 + liveVolume * 40 }]} />
              <View style={[styles.waveBar, { height: 15 + liveVolume * 65 }]} />
              <View style={[styles.waveBar, { height: 12 + liveVolume * 50 }]} />
              <View style={[styles.waveBar, { height: 20 + liveVolume * 80 }]} />
              <View style={[styles.waveBar, { height: 14 + liveVolume * 60 }]} />
            </View>

            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity style={[styles.micButton, styles.micButtonRecording]} onPress={handleStopRecording} activeOpacity={0.85}>
                <Text style={styles.micIcon}>⏹️</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}

        {/* STEP 4: Recorded State */}
        {step === 'recorded' && selectedReader && currentAyah && (
          <View style={styles.card}>
            <Text style={styles.statusSuccess}>تم تسجيل تلاوتك بنجاز! 🎉</Text>
            <Text style={styles.subtitle}>
              الأسلوب: {recitationStyle === 'mujawwad' ? 'مجوّد' : 'مرتل'} | المدة: {(recordingDuration / 1000).toFixed(1)} ثانية.
            </Text>

            <View style={styles.verseBox}>
              <Text style={styles.verseText}>{currentAyah.text}</Text>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.primaryButton} onPress={handleAnalyzeRecitation} activeOpacity={0.85}>
                <Text style={styles.primaryButtonText}>تحليل دقة المحاكاة الصوتية 🔍</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.secondaryButton} onPress={handleStartRecording} activeOpacity={0.85}>
                <Text style={styles.secondaryButtonText}>إعادة تسجيل التلاوة</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 5: Analyzing State */}
        {step === 'analyzing' && (
          <View style={styles.card}>
            <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
            <Text style={styles.analyzingText}>جاري استخراج الخصائص الصوتية ومطابقتها مع تلاوة الشيخ...</Text>
            <Text style={styles.analyzingSub}>تحليل النبرة والطبقة، إيقاع القراءة، ومخارج المقاطع التجويدية</Text>
          </View>
        )}

        {/* STEP 6: Scored Result State */}
        {step === 'scored' && selectedReader && (
          <View style={styles.card}>
            <Text style={styles.resultTitle}>نتائج التلاوة والمحاكاة</Text>
            <Text style={styles.resultSubtitle}>
              أسلوب التحدي: {recitationStyle === 'mujawwad' ? 'مجوّد (نغمي)' : 'مرتل (رسمي)'} | الشيخ {selectedReader.name}
            </Text>

            {/* Overall score box */}
            <View style={[
              styles.overallScoreBox,
              scoreBreakdown.overall < 40 && styles.scoreBoxLow,
              scoreBreakdown.overall >= 75 && styles.scoreBoxHigh
            ]}>
              <Text style={[
                styles.overallVal,
                scoreBreakdown.overall < 40 && styles.textLow,
                scoreBreakdown.overall >= 75 && styles.textHigh
              ]}>
                {scoreBreakdown.overall}%
              </Text>
              <Text style={styles.overallLbl}>نسبة المحاكاة العامة</Text>
            </View>

            {/* Detailed breakdowns */}
            <View style={styles.breakdownList}>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownPercent}>{scoreBreakdown.pronunciation}%</Text>
                <Text style={styles.breakdownLabel}>مخارج الحروف والتجويد (سكتات ومقاطع)</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownPercent}>{scoreBreakdown.rhythm}%</Text>
                <Text style={styles.breakdownLabel}>إيقاع الترتيل والسرعة الزمنية</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownPercent}>{scoreBreakdown.tone}%</Text>
                <Text style={styles.breakdownLabel}>طبقة الصوت والتحكم بالنغمة (طاقة المقاطع)</Text>
              </View>
            </View>

            {/* Reward feedback */}
            {scoreBreakdown.overall >= 40 ? (
              <View style={styles.rewardBox}>
                <Text style={styles.rewardText}>🏆 أحسنت! حصلت على +{Math.round((scoreBreakdown.overall / 100) * 25)} نقطة إضافية</Text>
              </View>
            ) : (
              <View style={[styles.rewardBox, styles.rewardBoxLow]}>
                <Text style={[styles.rewardText, styles.rewardTextLow]}>💡 حاول ترتيل الآية بنبرة مطابقة وسرعة متزنة لتحصل على نقاط.</Text>
              </View>
            )}

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.primaryButton} onPress={handleReset} activeOpacity={0.85}>
                <Text style={styles.primaryButtonText}>تحدي قارئ آخر 🔄</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()} activeOpacity={0.85}>
                <Text style={styles.secondaryButtonText}>العودة لقائمة التحديات</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 16,
    textAlign: 'right',
    width: '100%',
  },
  readersList: {
    width: '100%',
    gap: 12,
  },
  readerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#FAFCFB',
  },
  readerEmojiContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 14,
  },
  readerEmoji: {
    fontSize: 20,
  },
  readerInfo: {
    flex: 1,
  },
  readerName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'right',
    marginBottom: 4,
  },
  readerDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'right',
    lineHeight: 15,
  },
  qariHeader: {
    width: '100%',
    backgroundColor: '#FAF5FF',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8D5F5',
    marginBottom: 18,
  },
  qariName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#7C3AED',
    textAlign: 'right',
    marginBottom: 4,
  },
  qariAdvice: {
    fontSize: 11,
    color: '#6B21A8',
    textAlign: 'right',
    lineHeight: 16,
  },
  styleSelectorContainer: {
    width: '100%',
    marginBottom: 18,
  },
  styleSelectorTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'right',
    marginBottom: 8,
  },
  styleSelectorRow: {
    flexDirection: 'row-reverse',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  styleSelectorBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  styleSelectorBtnActive: {
    backgroundColor: Colors.primary,
  },
  styleSelectorText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  styleSelectorTextActive: {
    color: Colors.surface,
  },
  verseBox: {
    width: '100%',
    backgroundColor: Colors.background,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
    alignItems: 'center',
  },
  verseLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '700',
    marginBottom: 10,
  },
  verseText: {
    fontSize: 20,
    lineHeight: 30,
    fontWeight: '800',
    color: Colors.primary,
    textAlign: 'center',
  },
  statusHint: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
    fontWeight: '600',
  },
  micButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 14,
  },
  micButtonRecording: {
    backgroundColor: Colors.error,
    shadowColor: Colors.error,
  },
  micIcon: {
    fontSize: 32,
    color: Colors.surface,
  },
  backButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  backButtonText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  recordingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.error,
    marginBottom: 4,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.error,
    marginBottom: 18,
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 80,
    marginBottom: 20,
  },
  waveBar: {
    width: 6,
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  statusSuccess: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.success,
    marginBottom: 8,
  },
  actionRow: {
    width: '100%',
    gap: 10,
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
  },
  primaryButtonText: {
    color: Colors.surface,
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
  },
  secondaryButtonText: {
    color: Colors.textSecondary,
    fontWeight: '700',
    fontSize: 14,
  },
  loader: {
    marginVertical: 16,
  },
  analyzingText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  analyzingSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 4,
  },
  resultSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
    textAlign: 'center',
  },
  overallScoreBox: {
    backgroundColor: '#F7F6EB',
    borderWidth: 1,
    borderColor: Colors.accent + '44',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 30,
    alignItems: 'center',
    marginVertical: 18,
    width: '80%',
  },
  scoreBoxLow: {
    backgroundColor: '#FFF5F5',
    borderColor: Colors.error + '44',
  },
  scoreBoxHigh: {
    backgroundColor: '#EBF7F3',
    borderColor: Colors.success + '44',
  },
  overallVal: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.accent,
    marginBottom: 4,
  },
  textLow: {
    color: Colors.error,
  },
  textHigh: {
    color: Colors.success,
  },
  overallLbl: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  breakdownList: {
    width: '100%',
    gap: 12,
    marginBottom: 18,
  },
  breakdownRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: Colors.background,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  breakdownLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  breakdownPercent: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '800',
  },
  rewardBox: {
    backgroundColor: Colors.accentLight,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  rewardBoxLow: {
    backgroundColor: Colors.background,
  },
  rewardText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.accent,
  },
  rewardTextLow: {
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
