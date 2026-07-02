export type Challenge = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  route: string;
  color: string;
  difficulty: 'سهل' | 'متوسط' | 'متقدم' | 'بطل';
  points: number;
};

export const challenges: Challenge[] = [
  {
    id: 'prayer-tracker',
    title: 'الصلوات الخمس',
    description: 'تتبع صلواتك المفروضة خلال اليوم وحافظ على جماعتك.',
    emoji: '🕌',
    route: 'PrayerTracker',
    color: '#EBF7F3',
    difficulty: 'سهل',
    points: 15,
  },
  {
    id: 'fajr-challenge',
    title: 'تحدي الفجر',
    description: 'تأكيد أداء صلاة الفجر في وقتها لتحقيق انطلاقة مباركة ليومك.',
    emoji: '🌅',
    route: 'FajrChallenge',
    color: '#FFF8E6',
    difficulty: 'متوسط',
    points: 20,
  },
  {
    id: 'voice-challenge',
    title: 'تحدي الصوت والتقليد',
    description: 'اختر قارئك المفضل، رتل الآية، واكتشف نسبة محاكاتك لصوته.',
    emoji: '🎙️',
    route: 'Voice',
    color: '#F7EBF7',
    difficulty: 'بطل',
    points: 25,
  },
  {
    id: 'reading-challenge',
    title: 'تحدي القراءة والفهم',
    description: 'اقرأ نصوصاً إسلامية قصيرة وأجب عن أسئلة لقياس فهمك.',
    emoji: '📚',
    route: 'ReadingChallenge',
    color: '#EBF4F7',
    difficulty: 'سهل',
    points: 10,
  },
  {
    id: 'memorization',
    title: 'تحدي حفظ الآيات',
    description: 'اختبر حفظك من خلال إكمال الكلمات الناقصة في الآيات الكريمة.',
    emoji: '🧠',
    route: 'Memorization',
    color: '#F7EBEB',
    difficulty: 'متقدم',
    points: 20,
  },
  {
    id: 'adhkar',
    title: 'أذكار اليوم والمساء',
    description: 'حافظ على حصنك اليومي من الأذكار المسنونة في الصباح والمساء.',
    emoji: '📿',
    route: 'Adhkar',
    color: '#EDF7EB',
    difficulty: 'سهل',
    points: 10,
  },
  {
    id: 'hadith',
    title: 'تحدي الحديث الشريف',
    description: 'اختبارات في رواة الأحاديث، صحتها، ودلالاتها التربوية.',
    emoji: '💬',
    route: 'HadithChallenge',
    color: '#EBEBF7',
    difficulty: 'متوسط',
    points: 15,
  },
  {
    id: 'knowledge',
    title: 'تحدي المعرفة الإسلامية',
    description: 'المسابقة الكبرى في الفقه، السيرة، القرآن، والتاريخ الإسلامي.',
    emoji: '📝',
    route: 'Trivia',
    color: '#F2F2F2',
    difficulty: 'متوسط',
    points: 10,
  },
];
