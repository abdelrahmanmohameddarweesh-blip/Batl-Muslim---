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
  {
    id: 'finish-ayah-camera',
    title: 'تحدي فلتر أكمل الآية (الكاميرا)',
    description: 'افتح الكاميرا الأمامية وشاهد بطاقة الآيات العشوائية فوق رأسك كفلاتر الانستغرام والتيك توك!',
    emoji: '📸',
    route: 'FinishAyahCamera',
    color: '#FFF7ED',
    difficulty: 'متوسط',
    points: 25,
  },
  {
    id: 'finish-ayah',
    title: 'تحدي إكمال الآية القرانية',
    description: 'استمع إلى مقطع التلاوة وأكمل نهاية الآية الكريمة بالكلمات أو الألفاظ الصحيحة.',
    emoji: '🎧',
    route: 'FinishAyah',
    color: '#E6F4EA',
    difficulty: 'متوسط',
    points: 20,
  },
];
