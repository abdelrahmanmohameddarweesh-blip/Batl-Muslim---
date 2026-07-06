import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Animated, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { readers, type Reader } from '../data/readers';
import { ayahs, type Ayah } from '../data/ayahs';
import { generateReferenceProfile, analyzeVocalImitation } from '../data/voiceTemplates';
import { surahsList } from '../data/surahs';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { saveUserScore, getCurrentUserProfile } from '../firebase/auth';
import { addCommunityPost } from '../data/communityFeed';
import { Colors } from '../config/colors';
import { useInterstitialAd } from '../config/adsService';
import { AdMobConfig } from '../config/ads';

export default function VoiceScreen({ navigation }: any) {
  const { user } = useAuth();
  const { colors, isLightMode } = useTheme();
  const { language } = useLanguage();
  const styles = getStyles(colors);
  
  // Navigation states: 'select-reader' | 'setup-ayah' | 'ready' | 'recording' | 'recorded' | 'analyzing' | 'scored'
  const [step, setStep] = useState<'select-reader' | 'setup-ayah' | 'ready' | 'recording' | 'recorded' | 'analyzing' | 'scored'>('select-reader');
  const [hasShared, setHasShared] = useState(false);
  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number>(1);
  const [startAyahNumber, setStartAyahNumber] = useState<number>(1);
  const [endAyahNumber, setEndAyahNumber] = useState<number>(1);
  const [recordWholeSurah, setRecordWholeSurah] = useState<boolean>(false);
  const [fetchingAyah, setFetchingAyah] = useState<boolean>(false);
  
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
    setStep('setup-ayah');
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
      const refProfile = generateReferenceProfile(currentAyah.id, selectedReader.id, recitationStyle, currentAyah.text);
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
    setHasShared(false);
    setStep('select-reader');
  };

  const handleShareToFeed = async () => {
    if (!selectedReader || !currentAyah) return;
    try {
      const userProfile = user?.uid ? await getCurrentUserProfile(user.uid) : null;
      await addCommunityPost({
        userName: userProfile?.displayName || user?.displayName || 'بطل مسلم',
        userLevel: Math.max(1, Math.floor((userProfile?.score ?? 0) / 100)),
        countryCode: userProfile?.countryCode || 'EG',
        surahName: currentAyah.surah,
        ayahNumber: currentAyah.number,
        readerId: selectedReader.id,
        readerName: selectedReader.name,
        matchPercentage: scoreBreakdown.overall,
        style: recitationStyle,
      });
      setHasShared(true);
      Alert.alert(
        'تم النشر بنجاح! 🎉',
        'لقد تم نشر تلاوتك في منبر التلاوة الجماعي ليراها ويتفاعل معها مجتمع الأبطال.'
      );
    } catch (err) {
      console.error(err);
      Alert.alert('خطأ', 'فشل في نشر التلاوة على Feed.');
    }
  };

  const loadSelectedAyahRange = async (surahNum: number, startNum: number, endNum: number) => {
    setFetchingAyah(true);
    try {
      const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahNum}/ar.alafasy`);
      const resJson = await response.json();
      if (resJson?.data?.ayahs) {
        const allAyahs = resJson.data.ayahs;
        const rangeAyahs = allAyahs.slice(startNum - 1, endNum);

        let combinedText = rangeAyahs.map((a: any) => a.text).join(' ۞ ');

        const bismillah = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';
        if (surahNum !== 1 && startNum === 1 && combinedText.startsWith(bismillah)) {
          combinedText = combinedText.replace(bismillah, '').trim();
        }

        setCurrentAyah({
          id: `dynamic-${surahNum}-${startNum}-${endNum}`,
          text: combinedText,
          surah: `سورة ${surahsList.find(s => s.number === surahNum)?.name || 'مخصصة'}`,
          number: startNum === endNum ? startNum : `${startNum} - ${endNum}`,
        });
        setStep('ready');
      } else {
        throw new Error('Invalid response');
      }
    } catch (err) {
      console.error(err);
      Alert.alert(
        'خطأ في الشبكة 📡',
        'فشل تحميل السورة أو الآيات من خوادم القرآن الكريم. الرجاء التأكد من اتصالك بالإنترنت.'
      );
    } finally {
      setFetchingAyah(false);
    }
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

        {/* STEP 1.5: Setup Ayah Selection */}
        {step === 'setup-ayah' && selectedReader && (
          <View style={styles.card}>
            <View style={styles.qariHeader}>
              <Text style={styles.qariName}>المحاكاة المطلوبة: {selectedReader.name}</Text>
              <Text style={styles.qariAdvice}>💡 نصيحة النبرة: {selectedReader.tuneAdvice}</Text>
            </View>

            <Text style={styles.sectionTitle}>اختر الآية الكريمة للتحدي:</Text>

            {/* Path A: Quick Select Popular Verses */}
            <Text style={styles.subSectionTitle}>⚡ آيات سريعة مقترحة:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickAyahScroll}>
              {ayahs.map((a) => (
                <TouchableOpacity
                  key={a.id}
                  style={styles.quickAyahBadge}
                  onPress={() => {
                    setCurrentAyah(a);
                    setStep('ready');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.quickAyahBadgeText}>{a.surah}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Path B: Select from Quran */}
            <Text style={styles.subSectionTitle}>🌍 تصفح المصحف الشريف كاملاً:</Text>

            {/* Surah Picker Container */}
            <Text style={styles.pickerLabel}>اختر السورة:</Text>
            <ScrollView style={styles.pickerScrollView} nestedScrollEnabled={true}>
              <View style={styles.pickerGrid}>
                {surahsList.map((s) => (
                  <TouchableOpacity
                    key={s.number}
                    style={[
                      styles.pickerGridItem,
                      selectedSurahNumber === s.number && styles.pickerGridItemActive
                    ]}
                    onPress={() => {
                      setSelectedSurahNumber(s.number);
                      setStartAyahNumber(1);
                      setEndAyahNumber(1);
                      setRecordWholeSurah(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.pickerGridItemText,
                      selectedSurahNumber === s.number && styles.pickerGridItemTextActive
                    ]}>
                      {s.number}. {s.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Record Whole Surah Toggle Option */}
            <TouchableOpacity 
              style={[styles.wholeSurahToggleRow, recordWholeSurah && styles.wholeSurahToggleRowActive]}
              onPress={() => {
                const total = surahsList.find(s => s.number === selectedSurahNumber)?.totalAyahs || 1;
                setRecordWholeSurah(!recordWholeSurah);
                if (!recordWholeSurah) {
                  setStartAyahNumber(1);
                  setEndAyahNumber(total);
                } else {
                  setStartAyahNumber(1);
                  setEndAyahNumber(1);
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.wholeSurahToggleText, recordWholeSurah && styles.wholeSurahToggleTextActive]}>
                {language === 'ar' ? '📖 تلاوة السورة كاملة' : '📖 Record Entire Surah'}
              </Text>
            </TouchableOpacity>

            {!recordWholeSurah && (
              <View style={{ width: '100%' }}>
                {/* Start Ayah Picker */}
                <Text style={styles.pickerLabel}>آية البداية:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ayahNumberScroll}>
                  {Array.from(
                    { length: surahsList.find(s => s.number === selectedSurahNumber)?.totalAyahs || 7 },
                    (_, i) => i + 1
                  ).map((num) => (
                    <TouchableOpacity
                      key={`start-${num}`}
                      style={[
                        styles.ayahNumBadge,
                        startAyahNumber === num && styles.ayahNumBadgeActive
                      ]}
                      onPress={() => {
                        setStartAyahNumber(num);
                        if (endAyahNumber < num) {
                          setEndAyahNumber(num);
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.ayahNumBadgeText,
                        startAyahNumber === num && styles.ayahNumBadgeTextActive
                      ]}>
                        {num}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* End Ayah Picker */}
                <Text style={styles.pickerLabel}>آية النهاية:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ayahNumberScroll}>
                  {Array.from(
                    { length: (surahsList.find(s => s.number === selectedSurahNumber)?.totalAyahs || 7) - startAyahNumber + 1 },
                    (_, i) => i + startAyahNumber
                  ).map((num) => (
                    <TouchableOpacity
                      key={`end-${num}`}
                      style={[
                        styles.ayahNumBadge,
                        endAyahNumber === num && styles.ayahNumBadgeActive
                      ]}
                      onPress={() => setEndAyahNumber(num)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.ayahNumBadgeText,
                        endAyahNumber === num && styles.ayahNumBadgeTextActive
                      ]}>
                        {num}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {fetchingAyah ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 20 }} />
            ) : (
              <TouchableOpacity
                style={styles.loadAyahBtn}
                onPress={() => loadSelectedAyahRange(selectedSurahNumber, startAyahNumber, endAyahNumber)}
                activeOpacity={0.85}
              >
                <Text style={styles.loadAyahBtnText}>تحميل الآيات ومتابعة التحدي 📖</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.backButton} onPress={handleReset}>
              <Text style={styles.backButtonText}>تغيير القارئ</Text>
            </TouchableOpacity>
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
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
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
              {!hasShared && (
                <TouchableOpacity 
                  style={[styles.primaryButton, { backgroundColor: colors.accent, marginBottom: 12 }]} 
                  onPress={handleShareToFeed} 
                  activeOpacity={0.85}
                >
                  <Text style={[styles.primaryButtonText, { color: '#09120F', fontWeight: '900' }]}>
                    نشر في منبر التلاوة الجماعي 🌍
                  </Text>
                </TouchableOpacity>
              )}

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

const getStyles = (colors: any) => StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
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
    borderColor: colors.border,
    backgroundColor: '#FAFCFB',
  },
  readerEmojiContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
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
    color: colors.textPrimary,
    textAlign: 'right',
    marginBottom: 4,
  },
  readerDesc: {
    fontSize: 11,
    color: colors.textSecondary,
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
    color: colors.textPrimary,
    textAlign: 'right',
    marginBottom: 8,
  },
  styleSelectorRow: {
    flexDirection: 'row-reverse',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  styleSelectorBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  styleSelectorBtnActive: {
    backgroundColor: colors.primary,
  },
  styleSelectorText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  styleSelectorTextActive: {
    color: colors.surface,
  },
  verseBox: {
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
    alignItems: 'center',
  },
  verseLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '700',
    marginBottom: 10,
  },
  verseText: {
    fontSize: 20,
    lineHeight: 30,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
  },
  statusHint: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
    fontWeight: '600',
  },
  micButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 14,
  },
  micButtonRecording: {
    backgroundColor: colors.error,
    shadowColor: colors.error,
  },
  micIcon: {
    fontSize: 32,
    color: colors.surface,
  },
  backButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  backButtonText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  recordingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.error,
    marginBottom: 4,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.error,
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
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  statusSuccess: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.success,
    marginBottom: 8,
  },
  actionRow: {
    width: '100%',
    gap: 10,
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
  },
  primaryButtonText: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 14,
  },
  loader: {
    marginVertical: 16,
  },
  analyzingText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  analyzingSub: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 4,
  },
  resultSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
    textAlign: 'center',
  },
  overallScoreBox: {
    backgroundColor: '#F7F6EB',
    borderWidth: 1,
    borderColor: colors.accent + '44',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 30,
    alignItems: 'center',
    marginVertical: 18,
    width: '80%',
  },
  scoreBoxLow: {
    backgroundColor: '#FFF5F5',
    borderColor: colors.error + '44',
  },
  scoreBoxHigh: {
    backgroundColor: '#EBF7F3',
    borderColor: colors.success + '44',
  },
  overallVal: {
    fontSize: 36,
    fontWeight: '900',
    color: colors.accent,
    marginBottom: 4,
  },
  textLow: {
    color: colors.error,
  },
  textHigh: {
    color: colors.success,
  },
  overallLbl: {
    fontSize: 12,
    color: colors.textSecondary,
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
    borderColor: colors.background,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  breakdownLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  breakdownPercent: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '800',
  },
  rewardBox: {
    backgroundColor: colors.accentLight,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  rewardBoxLow: {
    backgroundColor: colors.background,
  },
  rewardText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.accent,
  },
  rewardTextLow: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  subSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 14,
    marginBottom: 8,
    textAlign: 'right',
    width: '100%',
  },
  quickAyahScroll: {
    width: '100%',
    flexDirection: 'row',
    marginBottom: 10,
  },
  quickAyahBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#09120F',
    borderWidth: 1,
    borderColor: '#1E3A2F',
    marginRight: 8,
  },
  quickAyahBadgeText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '800',
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    marginTop: 10,
    marginBottom: 6,
    textAlign: 'right',
    width: '100%',
  },
  pickerScrollView: {
    width: '100%',
    maxHeight: 140,
    backgroundColor: '#09120F',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 12,
  },
  pickerGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerGridItem: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pickerGridItemActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pickerGridItemText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '800',
  },
  pickerGridItemTextActive: {
    color: '#09120F',
    fontWeight: '900',
  },
  ayahNumberScroll: {
    width: '100%',
    flexDirection: 'row',
    marginBottom: 16,
  },
  ayahNumBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#09120F',
    borderWidth: 1,
    borderColor: '#1E3A2F',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  ayahNumBadgeActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  ayahNumBadgeText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '800',
  },
  ayahNumBadgeTextActive: {
    color: '#09120F',
    fontWeight: '900',
  },
  loadAyahBtn: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
    marginVertical: 12,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  loadAyahBtnText: {
    color: '#09120F',
    fontWeight: '900',
    fontSize: 15,
  },
  wholeSurahToggleRow: {
    width: '100%',
    backgroundColor: '#09120F',
    borderWidth: 1.5,
    borderColor: '#1E3A2F',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginVertical: 10,
  },
  wholeSurahToggleRowActive: {
    backgroundColor: '#1E3A2F',
    borderColor: colors.primary,
  },
  wholeSurahToggleText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  wholeSurahToggleTextActive: {
    color: colors.textPrimary,
    fontWeight: '900',
  },
});
