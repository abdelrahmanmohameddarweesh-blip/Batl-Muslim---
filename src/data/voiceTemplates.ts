export type AyahTemplate = {
  ayahId: string;
  baseDurationMs: number;
  baseEnvelope: number[]; // 20-point standard volume profile
  vowelMaddIndices: number[]; // Indices of long vowels where emphasis is expected (0 to 19)
};

export type ReaderModifier = {
  readerId: string;
  speedModifier: number; // Pacing: 0.8 = fast, 1.4 = slow
  transformEnvelope: (val: number) => number;
  rhythmStrictness: number; // Multiplier for timing penalty
  maddEmphasisWeight: number; // How strictly we check long vowel emphasis
  dynamicsProfile: 'soft-steady' | 'dynamic-dramatic' | 'didactic-flat' | 'fast-energetic' | 'soothing-fluid';
};

export type ReferenceProfile = {
  expectedDurationMs: number;
  targetEnvelope: number[];
  style: ReaderModifier;
  vowelMaddIndices: number[];
  recitationStyle: 'murattal' | 'mujawwad';
};

const ayahTemplates: Record<string, AyahTemplate> = {
  a1: {
    // Surah Al-Ikhlas
    ayahId: 'a1',
    baseDurationMs: 7000,
    baseEnvelope: [0.1, 0.4, 0.7, 0.5, 0.2, 0.6, 0.8, 0.6, 0.2, 0.5, 0.7, 0.6, 0.2, 0.6, 0.9, 0.7, 0.3, 0.5, 0.2, 0.1],
    vowelMaddIndices: [6, 14], // "الصَّمَدْ", "أَحَدْ" peak vowel emphasis
  },
  a2: {
    // Surah Al-Fatiha (start)
    ayahId: 'a2',
    baseDurationMs: 8500,
    baseEnvelope: [0.2, 0.5, 0.8, 0.6, 0.3, 0.6, 0.8, 0.5, 0.2, 0.5, 0.7, 0.5, 0.2, 0.6, 0.9, 0.8, 0.4, 0.3, 0.2, 0.1],
    vowelMaddIndices: [2, 6, 14], // "الْحَمْدُ لله", "الرَّحْمَنِ", "الرَّحِيمِ"
  },
  a3: {
    // Ayah al-Kursi (start)
    ayahId: 'a3',
    baseDurationMs: 12000,
    baseEnvelope: [0.15, 0.35, 0.6, 0.7, 0.4, 0.3, 0.6, 0.8, 0.5, 0.3, 0.6, 0.7, 0.4, 0.2, 0.6, 0.8, 0.6, 0.4, 0.3, 0.15],
    vowelMaddIndices: [7, 15], // "الْحَيُّ", "الْقَيُّومُ"
  },
  a4: {
    // Surah Al-Kawthar
    ayahId: 'a4',
    baseDurationMs: 5500,
    baseEnvelope: [0.2, 0.5, 0.8, 0.9, 0.5, 0.3, 0.7, 0.8, 0.4, 0.2, 0.6, 0.8, 0.4, 0.1, 0.3, 0.5, 0.3, 0.2, 0.2, 0.1],
    vowelMaddIndices: [2, 7, 11], // "أَعْطَيْنَاكَ", "الْكَوْثَرَ", "وَانْحَرْ"
  },
  a5: {
    // Surah Al-Duha (start)
    ayahId: 'a5',
    baseDurationMs: 7500,
    baseEnvelope: [0.1, 0.3, 0.6, 0.8, 0.4, 0.2, 0.5, 0.7, 0.4, 0.3, 0.6, 0.8, 0.5, 0.2, 0.5, 0.7, 0.4, 0.2, 0.3, 0.1],
    vowelMaddIndices: [3, 11], // "وَالضُّحَى", "إِذَا سَجَى"
  },
  a6: {
    // Surah Al-Nasr
    ayahId: 'a6',
    baseDurationMs: 6500,
    baseEnvelope: [0.2, 0.4, 0.7, 0.8, 0.4, 0.3, 0.6, 0.7, 0.5, 0.2, 0.6, 0.8, 0.5, 0.3, 0.6, 0.7, 0.4, 0.2, 0.3, 0.1],
    vowelMaddIndices: [3, 11], // "جَاءَ نَصْرُ", "الْفَتْحُ"
  },
};

const readerModifiers: Record<string, ReaderModifier> = {
  minshawi: {
    readerId: 'minshawi',
    speedModifier: 1.18, // Slow, reverent Tartil pacing
    transformEnvelope: (val) => Math.max(0.15, Math.pow(val, 0.8) * 0.82), // Soft, weeping voice, low range variance
    rhythmStrictness: 1.2,
    maddEmphasisWeight: 0.7, // Steady emotional delivery
    dynamicsProfile: 'soft-steady',
  },
  abdulbasit: {
    readerId: 'abdulbasit',
    speedModifier: 1.45, // Extremely slow, majestic pacing
    transformEnvelope: (val) => Math.min(1.0, Math.pow(val, 2.0) * 1.3), // Massive dynamic ranges (Jawwab)
    rhythmStrictness: 0.7, // Forgiving timing due to long breath holds
    maddEmphasisWeight: 1.5, // High strictness on long vowel extensions (Madd)
    dynamicsProfile: 'dynamic-dramatic',
  },
  husary: {
    readerId: 'husary',
    speedModifier: 1.0, // Standard pacing for educational teaching
    transformEnvelope: (val) => val, // Perfect balanced profile
    rhythmStrictness: 2.0, // Extremely strict timing (no mistakes in teacher style)
    maddEmphasisWeight: 1.0, // Balanced Tajweed rules
    dynamicsProfile: 'didactic-flat',
  },
  sudais: {
    readerId: 'sudais',
    speedModifier: 0.82, // Quick, energetic Grand Mosque pacing
    transformEnvelope: (val) => Math.min(1.0, Math.pow(val, 1.4) * 1.15), // Sharp, hugh-pitched climaxes
    rhythmStrictness: 1.4,
    maddEmphasisWeight: 0.9,
    dynamicsProfile: 'fast-energetic',
  },
  muaiqly: {
    readerId: 'muaiqly',
    speedModifier: 0.95, // Smooth, warm Makkah pacing
    transformEnvelope: (val) => Math.max(0.18, Math.pow(val, 0.95) * 0.88), // Soothing, fluid volume curves
    rhythmStrictness: 1.0,
    maddEmphasisWeight: 0.8,
    dynamicsProfile: 'soothing-fluid',
  },
};

export function generateReferenceProfile(
  ayahId: string,
  readerId: string,
  recitationStyle: 'murattal' | 'mujawwad',
  customText?: string
): ReferenceProfile {
  let base = ayahTemplates[ayahId];

  if (!base) {
    const text = customText || 'قُلْ هُوَ اللَّهُ أَحَدٌ';
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const baseDurationMs = Math.max(4000, Math.min(22000, wordCount * 1400));

    const baseEnvelope = Array.from({ length: 20 }, (_, i) => {
      const progress = i / 19;
      const wave = 0.4 + 0.35 * Math.sin(progress * Math.PI * Math.max(1, wordCount / 1.5));
      return Math.max(0.1, Math.min(0.9, wave));
    });

    const vowelMaddIndices: number[] = [];
    const searchChars = ['ا', 'و', 'ي', 'أ', 'إ', 'ى'];
    for (let i = 0; i < Math.min(30, text.length); i++) {
      if (searchChars.includes(text[i])) {
        const idx = Math.floor((i / text.length) * 20);
        if (!vowelMaddIndices.includes(idx)) {
          vowelMaddIndices.push(idx);
        }
      }
    }

    base = {
      ayahId: ayahId || 'dynamic',
      baseDurationMs,
      baseEnvelope,
      vowelMaddIndices,
    };
  }

  const mod = readerModifiers[readerId] || readerModifiers.husary;

  let speedFactor = mod.speedModifier;
  let maddWeight = mod.maddEmphasisWeight;
  let finalEnvelope: number[];

  if (recitationStyle === 'mujawwad') {
    // Mujawwad: Much slower, majestic pacing, prolonged vowels and dramatic dynamic contrast
    speedFactor = mod.speedModifier * 2.2;
    maddWeight = mod.maddEmphasisWeight * 1.5;
    
    // Transform with increased dynamic contrast (deeper silent pauses, sharper vocal peaks)
    finalEnvelope = base.baseEnvelope.map((val, idx) => {
      // Insert strategic pauses (breath holds) between verses
      if (idx === 4 || idx === 8 || idx === 12 || idx === 16) return 0.02;
      
      const transformed = mod.transformEnvelope(val);
      return Math.min(1.0, Math.pow(transformed, 1.6) * 1.25);
    });
  } else {
    // Murattal: Faster, steady, rhythmic pacing with flatter dynamic curves
    speedFactor = mod.speedModifier * 0.9;
    maddWeight = mod.maddEmphasisWeight * 0.9;
    
    finalEnvelope = base.baseEnvelope.map((val) => {
      const transformed = mod.transformEnvelope(val);
      return Math.max(0.12, Math.pow(transformed, 0.8)); // flatter dynamic transitions
    });
  }

  return {
    expectedDurationMs: Math.round(base.baseDurationMs * speedFactor),
    targetEnvelope: finalEnvelope,
    style: {
      ...mod,
      speedModifier: speedFactor,
      maddEmphasisWeight: maddWeight,
    },
    vowelMaddIndices: base.vowelMaddIndices,
    recitationStyle,
  };
}

// Resamples an array to a target length using linear interpolation
function resampleArray(array: number[], targetLength: number): number[] {
  if (array.length === 0) return Array(targetLength).fill(0);
  if (array.length === 1) return Array(targetLength).fill(array[0]);

  const resampled: number[] = [];
  for (let i = 0; i < targetLength; i++) {
    const index = (i * (array.length - 1)) / (targetLength - 1);
    const low = Math.floor(index);
    const high = Math.ceil(index);
    const weight = index - low;
    resampled.push(array[low] * (1 - weight) + array[high] * weight);
  }
  return resampled;
}

// Calculates Pearson Correlation Coefficient
function calculatePearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  
  let numerator = 0;
  let denX = 0;
  let denY = 0;
  
  for (let i = 0; i < n; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    numerator += diffX * diffY;
    denX += diffX * diffX;
    denY += diffY * diffY;
  }
  
  if (denX === 0 || denY === 0) return 0;
  return numerator / Math.sqrt(denX * denY);
}

// Helper to analyze user metering array and compute comparison scores
export function analyzeVocalImitation(
  userMetering: number[], // List of decibels (-160 to 0)
  durationMs: number,
  reference: ReferenceProfile
) {
  // 1. Guard against empty/silent recordings
  if (userMetering.length === 0 || durationMs < 500) {
    return { pronunciation: 5, tone: 5, rhythm: 5, overall: 5 };
  }

  // Convert decibels to a 0.0 - 1.0 amplitude range
  const amplitudes = userMetering.map(db => {
    if (db <= -60) return 0;
    return (db + 60) / 60; // scale -60..0 to 0..1
  });

  const totalAmplitude = amplitudes.reduce((sum, a) => sum + a, 0);
  const averageAmplitude = totalAmplitude / amplitudes.length;
  
  // Guard: If average amplitude is extremely quiet (silence/background hum), return minimal score
  if (averageAmplitude < 0.08) {
    return { pronunciation: 8, tone: 8, rhythm: 8, overall: 8 };
  }

  // 2. Calculate Rhythm Score (الإيقاع)
  // Compares how close user's duration is to the expected Qari duration, factoring in the Qari's strictness
  const durationDiff = Math.abs(durationMs - reference.expectedDurationMs);
  const durationRatio = durationDiff / reference.expectedDurationMs;
  let rhythmScore = Math.max(0, 100 - Math.round(durationRatio * 160 * reference.style.rhythmStrictness));
  rhythmScore = Math.max(10, Math.min(100, rhythmScore));

  // 3. Resample user envelope to match reference target envelope length (20 elements)
  const resampledUser = resampleArray(amplitudes, reference.targetEnvelope.length);

  // 4. Tone/Style Match Score (طبقة الصوت والنغمة)
  // Computes the Pearson correlation coefficient between user envelope shape and target Qari envelope shape
  const correlation = calculatePearsonCorrelation(resampledUser, reference.targetEnvelope);
  
  let shapeScore = 10;
  if (correlation > 0.45) {
    // Normal similarity
    shapeScore = Math.max(45, Math.min(100, Math.round(correlation * 100)));
  } else if (correlation > 0.15) {
    // Weak similarity - scale down
    shapeScore = Math.max(15, Math.round(correlation * 100 * 0.8));
  } else {
    // Extremely poor or negative correlation - random sounds
    shapeScore = Math.max(5, Math.min(15, Math.round((correlation + 1) * 10)));
  }

  // 5. Evaluate Long Vowel (Madd) Emphasis (أحكام المد ومخارج الضغط)
  // We compare user volume at vowelMaddIndices vs other parts.
  let maddScore = 100;
  if (reference.vowelMaddIndices.length > 0) {
    let penalty = 0;

    reference.vowelMaddIndices.forEach(idx => {
      // Find volume at this index
      const val = resampledUser[idx];
      const targetVal = reference.targetEnvelope[idx];

      // If the Qari has a tall peak (> 0.7) but the user is quiet (< 0.48) at this syllable
      if (targetVal > 0.65 && val < 0.48) {
        penalty += 25 * reference.style.maddEmphasisWeight;
      }
      // User is loud where Qari is quiet/steady
      else if (targetVal < 0.35 && val > 0.65) {
        penalty += 18 * reference.style.maddEmphasisWeight;
      }
    });

    // General envelope difference check on non-Madd parts
    let nonMaddDiff = 0;
    reference.targetEnvelope.forEach((targetVal, idx) => {
      if (!reference.vowelMaddIndices.includes(idx)) {
        nonMaddDiff += Math.abs(resampledUser[idx] - targetVal);
      }
    });
    const avgNonMaddDiff = nonMaddDiff / (reference.targetEnvelope.length - reference.vowelMaddIndices.length);
    if (avgNonMaddDiff > 0.32) {
      penalty += (avgNonMaddDiff * 40);
    }

    maddScore = Math.max(10, 100 - Math.round(penalty));
  }

  // 6. Pronunciation/Syllable Peak Matching (مخارج الحروف وسكتات التلاوة)
  // Detect where emphasis peaks occur in both profiles
  const detectPeaks = (arr: number[]) => {
    const peaks: number[] = [];
    for (let i = 1; i < arr.length - 1; i++) {
      if (arr[i] > arr[i - 1] && arr[i] > arr[i + 1] && arr[i] > 0.22) {
        peaks.push(i / arr.length);
      }
    }
    return peaks;
  };

  const userPeaks = detectPeaks(resampledUser);
  const targetPeaks = detectPeaks(reference.targetEnvelope);

  let pronunciationScore = 50; // lower default baseline
  if (targetPeaks.length === 0) {
    pronunciationScore = userPeaks.length === 0 ? 95 : 40;
  } else if (userPeaks.length === 0) {
    pronunciationScore = 10;
  } else {
    let distanceSum = 0;
    targetPeaks.forEach(tPeak => {
      let minD = 1.0;
      userPeaks.forEach(uPeak => {
        const d = Math.abs(uPeak - tPeak);
        if (d < minD) minD = d;
      });
      distanceSum += minD;
    });
    const avgDistance = distanceSum / targetPeaks.length;
    // Base score from spatial peak matching
    let rawPronunciation = Math.round(100 - avgDistance * 360);
    
    // Deduct points for mismatch in peak density (talking too fast/slow or speaking gibberish)
    const densityDiff = Math.abs(userPeaks.length - targetPeaks.length);
    const densityPenalty = densityDiff * 14;
    
    pronunciationScore = Math.max(10, Math.min(100, rawPronunciation - densityPenalty));
  }

  // 7. Calculate final combined Tone score:
  // Combines the Pearson envelope correlation with the vowel/Madd accent matching
  const finalToneScore = Math.round((shapeScore * 0.65) + (maddScore * 0.35));

  // 8. Calculate Weighted Overall Match
  // Weight distribution: 40% Tone/Dynamics Match, 35% Syllable peaks/Pronunciation, 25% Pacing/Rhythm
  const overall = Math.round((finalToneScore * 0.40) + (pronunciationScore * 0.35) + (rhythmScore * 0.25));

  return {
    pronunciation: pronunciationScore,
    rhythm: rhythmScore,
    tone: finalToneScore,
    overall: Math.min(100, Math.max(5, overall)),
  };
}
