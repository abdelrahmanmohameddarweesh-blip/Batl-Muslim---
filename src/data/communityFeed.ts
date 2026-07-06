import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CommunityPost {
  id: string;
  userName: string;
  userLevel: number;
  countryCode: string;
  surahName: string;
  ayahNumber: number;
  readerId: string;
  readerName: string;
  matchPercentage: number;
  style: 'murattal' | 'mujawwad';
  mashallahCount: number;
  subhanallahCount: number;
  createdAt: string;
  hasVotedMashallah?: boolean;
  hasVotedSubhanallah?: boolean;
}

export const seedCommunityPosts: CommunityPost[] = [
  {
    id: 'p1',
    userName: 'خالد عبد الرحمن',
    userLevel: 7,
    countryCode: 'EG',
    surahName: 'سورة الكهف',
    ayahNumber: 13,
    readerId: 'abdulbasit',
    readerName: 'عبد الباسط عبد الصمد',
    matchPercentage: 88,
    style: 'mujawwad',
    mashallahCount: 142,
    subhanallahCount: 98,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
  },
  {
    id: 'p2',
    userName: 'عائشة المالكي',
    userLevel: 5,
    countryCode: 'SA',
    surahName: 'سورة يس',
    ayahNumber: 1,
    readerId: 'husary',
    readerName: 'محمود خليل الحصري',
    matchPercentage: 92,
    style: 'murattal',
    mashallahCount: 205,
    subhanallahCount: 110,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours ago
  },
  {
    id: 'p3',
    userName: 'سليمان الخطيب',
    userLevel: 12,
    countryCode: 'JO',
    surahName: 'سورة الملك',
    ayahNumber: 1,
    readerId: 'minshawi',
    readerName: 'محمد صديق المنشاوي',
    matchPercentage: 74,
    style: 'mujawwad',
    mashallahCount: 64,
    subhanallahCount: 42,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(), // 12 hours ago
  },
  {
    id: 'p4',
    userName: 'ياسين الفاسي',
    userLevel: 9,
    countryCode: 'MA',
    surahName: 'سورة الرحمن',
    ayahNumber: 1,
    readerId: 'sudais',
    readerName: 'عبد الرحمن السديس',
    matchPercentage: 81,
    style: 'murattal',
    mashallahCount: 119,
    subhanallahCount: 76,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 24 hours ago
  },
];

const FEED_STORAGE_KEY = 'community-recitation-posts-data';

export async function readCommunityPosts(): Promise<CommunityPost[]> {
  try {
    const data = await AsyncStorage.getItem(FEED_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    // Initialize storage with seeds if empty
    await AsyncStorage.setItem(FEED_STORAGE_KEY, JSON.stringify(seedCommunityPosts));
    return seedCommunityPosts;
  } catch (err) {
    console.error('Error reading community posts:', err);
    return seedCommunityPosts;
  }
}

export async function saveCommunityPosts(posts: CommunityPost[]): Promise<void> {
  try {
    await AsyncStorage.setItem(FEED_STORAGE_KEY, JSON.stringify(posts));
  } catch (err) {
    console.error('Error saving community posts:', err);
  }
}

export async function addCommunityPost(post: Omit<CommunityPost, 'id' | 'mashallahCount' | 'subhanallahCount' | 'createdAt'>): Promise<CommunityPost[]> {
  const current = await readCommunityPosts();
  const newPost: CommunityPost = {
    ...post,
    id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    mashallahCount: 0,
    subhanallahCount: 0,
    createdAt: new Date().toISOString(),
  };
  const updated = [newPost, ...current];
  await saveCommunityPosts(updated);
  return updated;
}
