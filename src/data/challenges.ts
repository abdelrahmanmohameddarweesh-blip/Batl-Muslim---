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
  {
    id: 'sirah-quest',
    title: 'خريطة السيرة النبوية',
    description: 'تتبع مسيرة النبي ﷺ من الولادة إلى المدينة، أجب عن الأسئلة، وافتح أوسمة تاريخية.',
    emoji: '🗺️',
    route: 'SirahQuest',
    color: '#FFF0F5',
    difficulty: 'متقدم',
    points: 50,
  },
  {
    id: 'quran-assessment',
    title: 'تقييم حفظ السور والأجزاء',
    description: 'اختبر مستوى حفظك في جزء أو سورة محددة، واحصل على بطاقة أداء لمشاركتها.',
    emoji: '📖',
    route: 'QuranAssessment',
    color: '#EAF2F8',
    difficulty: 'متقدم',
    points: 25,
  },
  {
    id: 'mutashabihat',
    title: 'تحدي المتشابهات القرآني',
    description: 'اختبار دقيق للمتشابهات في الآيات، ميز بين الألفاظ المتشابهة واحذر مواضع اللبس.',
    emoji: '🧩',
    route: 'Mutashabihat',
    color: '#F4F1EA',
    difficulty: 'متقدم',
    points: 30,
  },
];
