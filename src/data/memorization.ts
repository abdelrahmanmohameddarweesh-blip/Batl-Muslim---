export type MemorizationExercise = {
  id: string;
  verseBefore: string;
  verseAfter: string;
  missingWord: string;
  options: string[];
  surah: string;
  fullVerse: string;
};

export const memorizationExercises: MemorizationExercise[] = [
  {
    id: 'm1',
    verseBefore: 'اهْدِنَا الصِّرَاطَ',
    verseAfter: '۞ صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ',
    missingWord: 'الْمُسْتَقِيمَ',
    options: ['الْمُسْتَقِيمَ', 'الْحَمِيدَ', 'الْعَظِيمَ', 'الْكَرِيمَ'],
    surah: 'سورة الفاتحة - الآية ٦',
    fullVerse: '«اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ»',
  },
  {
    id: 'm2',
    verseBefore: 'اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ',
    verseAfter: 'لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ',
    missingWord: 'الْقَيُّومُ',
    options: ['الْقَيُّومُ', 'الْعَلِيُّ', 'الْعَظِيمُ', 'الْقَاهِرُ'],
    surah: 'سورة البقرة (آية الكرسي) - الآية ٢٥٥',
    fullVerse: '«اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ»',
  },
  {
    id: 'm3',
    verseBefore: 'وَالْعَصْرِ ۞ إِنَّ الْإِنْسَانَ لَفِي',
    verseAfter: '۞ إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ',
    missingWord: 'خُسْرٍ',
    options: ['خُسْرٍ', 'يُسْرٍ', 'خَوْفٍ', 'ضَلَالٍ'],
    surah: 'سورة العصر - الآية ٢',
    fullVerse: '«إِنَّ الْإِنْسَانَ لَفِي خُسْرٍ»',
  },
];
