import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { getCurrentUserProfile, unlockShopItem } from '../firebase/auth';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Define Shop Item Interface
interface ShopItem {
  id: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  cost: number;
  category: 'titles' | 'themes' | 'audio';
  badge: string;
}

const SHOP_ITEMS: ShopItem[] = [
  // Quranic Titles
  {
    id: 'title_hafidh',
    titleAr: 'الحافظ المتقن',
    titleEn: 'Precise Memorizer',
    descAr: 'لقب شريف يعكس دقة وضبط حفظك للمتشابهات.',
    descEn: 'A noble title reflecting the precision of your Quranic memorization.',
    cost: 50,
    category: 'titles',
    badge: '🏆',
  },
  {
    id: 'title_knight',
    titleAr: 'فارس المتشابهات',
    titleEn: 'Knight of Mutashabihat',
    descAr: 'لقب خاص بفرسان متشابهات التنزيل الكريم.',
    descEn: 'A title reserved for champions of Quranic parallels.',
    cost: 100,
    category: 'titles',
    badge: '🛡️',
  },
  {
    id: 'title_pulpit',
    titleAr: 'سراج المنبر',
    titleEn: 'Lantern of the Pulpit',
    descAr: 'لقب يعكس ضياء علمك وتألقك في القراءة.',
    descEn: 'Reflects the light of your recitation and learning.',
    cost: 150,
    category: 'titles',
    badge: '🕯️',
  },
  {
    id: 'title_heavens',
    titleAr: 'قارئ الجنان',
    titleEn: 'Reciter of Heavens',
    descAr: 'اللقب الأسمى لمن يرتقون بالقرآن درجات في الجنة.',
    descEn: 'The highest honor for those ascending levels of Paradise.',
    cost: 200,
    category: 'titles',
    badge: '👑',
  },
  // Background Themes
  {
    id: 'theme_nabawi',
    titleAr: 'محراب المسجد النبوي',
    titleEn: 'Masjid Nabawi Sanctuary',
    descAr: 'خلفية خضراء داكنة بنقوش المسجد النبوي الشريف.',
    descEn: 'A deep emerald theme inspired by the Prophet’s Mosque.',
    cost: 150,
    category: 'themes',
    badge: '🟢',
  },
  {
    id: 'theme_kaaba',
    titleAr: 'كسوة الكعبة المشرفة',
    titleEn: 'Holy Kaaba Kiswah',
    descAr: 'خلفية سوداء فاخرة مطرزة بخطوط ذهبية قرآنية.',
    descEn: 'A luxurious dark theme inspired by the Kiswah of the Kaaba.',
    cost: 200,
    category: 'themes',
    badge: '⚫',
  },
  {
    id: 'theme_waterfalls',
    titleAr: 'شلالات الجنان',
    titleEn: 'Heavenly Waterfalls',
    descAr: 'سمة متحركة ناعمة مستوحاة من عيون الجنة وأنهارها.',
    descEn: 'A soft blue theme inspired by the springs of Paradise.',
    cost: 250,
    category: 'themes',
    badge: '🔵',
  },
  // Audio Reciters / المقام
  {
    id: 'audio_warsh',
    titleAr: 'رواية ورش عن نافع',
    titleEn: 'Warsh Recitation Guide',
    descAr: 'حزمة تعليمية كاملة لأصول وقواعد رواية ورش.',
    descEn: 'Unlock full resources and audio guides for Warsh recitation.',
    cost: 100,
    category: 'audio',
    badge: '📖',
  },
  {
    id: 'audio_nahawand',
    titleAr: 'مقام النهاوند الصوتي',
    titleEn: 'Maqam Nahawand Pack',
    descAr: 'أدلة صوتية وتمارين عملية لترتيل القرآن بمقام النهاوند العذب.',
    descEn: 'Guides and exercises for reciting in the beautiful Nahawand maqam.',
    cost: 120,
    category: 'audio',
    badge: '🎵',
  },
];

export default function ShopScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const { user, updateUserFields } = useAuth();

  const [activeTab, setActiveTab] = useState<'titles' | 'themes' | 'audio'>('titles');
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [buyingId, setBuyingId] = useState<string | null>(null);

  const loadProfile = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const currentProfile = await getCurrentUserProfile(user.uid);
      setProfile(currentProfile);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user?.uid]);

  const handlePurchase = async (item: ShopItem) => {
    if (!user?.uid) return;

    const currentBalance = profile?.sirajBalance ?? 50;
    const unlocked = profile?.unlockedItems ?? [];

    if (unlocked.includes(item.id)) {
      Alert.alert(
        language === 'ar' ? 'تنبيه' : 'Alert',
        language === 'ar' ? 'لقد قمت بشراء هذا العنصر بالفعل!' : 'You already own this item!'
      );
      return;
    }

    if (currentBalance < item.cost) {
      Alert.alert(
        language === 'ar' ? 'عذراً' : 'Sorry',
        language === 'ar' 
          ? `رصيد السراج الخاص بك غير كافٍ. تحتاج إلى ${item.cost - currentBalance} سراج إضافي للوصول لهذا العنصر.` 
          : `Insufficient Siraj balance. You need ${item.cost - currentBalance} more Siraj to buy this item.`
      );
      return;
    }

    setBuyingId(item.id);
    try {
      const updatedUser = await unlockShopItem(user.uid, item.id, item.cost);
      setProfile(updatedUser);
      updateUserFields({
        sirajBalance: updatedUser.sirajBalance,
        unlockedItems: updatedUser.unlockedItems,
      });
      Alert.alert(
        language === 'ar' ? 'تهانينا! 🎉' : 'Congratulations! 🎉',
        language === 'ar' 
          ? `تم تفعيل "${item.titleAr}" بنجاح وخصم ${item.cost} سراج من محفظتك.` 
          : `"${item.titleEn}" unlocked successfully. Deducted ${item.cost} Siraj.`
      );
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'حدث خطأ أثناء الشراء');
    } finally {
      setBuyingId(null);
    }
  };

  const filteredItems = useMemo(() => {
    return SHOP_ITEMS.filter(item => item.category === activeTab);
  }, [activeTab]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER ROW */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 20, color: colors.primary }}>🔙</Text>
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary, fontFamily: 'IBMPlexSansArabic-Bold' }]}>
            {language === 'ar' ? 'متجر السراج' : 'The Siraj Shop'}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {language === 'ar' ? 'استبدل أنوار السراج بمميزات حصرية' : 'Redeem Siraj Points for Custom Features'}
          </Text>
        </View>

        {/* Wallet Balance */}
        <View style={[styles.walletBadge, { backgroundColor: colors.primaryLight }]}>
          <Text style={{ fontSize: 16, marginRight: 4 }}>🕯️</Text>
          <Text style={[styles.walletText, { color: colors.primary, fontFamily: 'IBMPlexSansArabic-Bold' }]}>
            {profile?.sirajBalance ?? 50}
          </Text>
        </View>
      </View>

      {/* TABS SELECTOR */}
      <View style={styles.tabContainer}>
        {(['titles', 'themes', 'audio'] as const).map(tab => {
          const isActive = activeTab === tab;
          const tabLabel = {
            titles: language === 'ar' ? 'الألقاب الشريفة' : 'Titles',
            themes: language === 'ar' ? 'سمات الصرح' : 'Themes',
            audio: language === 'ar' ? 'أدلة المقامات' : 'Audio'
          }[tab];

          return (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabBtn,
                { borderBottomColor: isActive ? colors.primary : 'transparent', borderBottomWidth: isActive ? 3 : 0 }
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: isActive ? colors.primary : colors.textSecondary, fontFamily: isActive ? 'IBMPlexSansArabic-Bold' : 'IBMPlexSansArabic-Medium' }
                ]}
              >
                {tabLabel}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ITEMS LIST */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          {filteredItems.map(item => {
            const isUnlocked = profile?.unlockedItems?.includes(item.id);
            const isBuying = buyingId === item.id;

            return (
              <View
                key={item.id}
                style={[
                  styles.itemCard,
                  { backgroundColor: colors.surface, borderColor: isUnlocked ? colors.primary : colors.border }
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.badgeContainer, { backgroundColor: colors.border }]}>
                    <Text style={{ fontSize: 24 }}>{item.badge}</Text>
                  </View>
                  
                  <View style={styles.metaContainer}>
                    <Text style={[styles.itemTitle, { color: colors.textPrimary, fontFamily: 'IBMPlexSansArabic-Bold' }]}>
                      {language === 'ar' ? item.titleAr : item.titleEn}
                    </Text>
                    <Text style={[styles.itemDesc, { color: colors.textSecondary }]}>
                      {language === 'ar' ? item.descAr : item.descEn}
                    </Text>
                  </View>
                </View>

                <View style={[styles.cardDivider, { backgroundColor: colors.border }]} />

                <View style={styles.cardFooter}>
                  {isUnlocked ? (
                    <View style={[styles.unlockedTag, { backgroundColor: colors.primaryLight }]}>
                      <Text style={[styles.unlockedText, { color: colors.primary, fontFamily: 'IBMPlexSansArabic-Bold' }]}>
                        {language === 'ar' ? '✓ تم التفعيل' : '✓ Unlocked'}
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.buyBtn, { backgroundColor: colors.primary }]}
                      onPress={() => handlePurchase(item)}
                      disabled={isBuying}
                    >
                      {isBuying ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={styles.buyBtnText}>
                            {language === 'ar' ? `شراء بـ ${item.cost}` : `Redeem for ${item.cost}`}
                          </Text>
                          <Text style={{ fontSize: 13, marginLeft: 4 }}>🕯️</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 5,
  },
  headerTitleContainer: {
    flex: 1,
    marginHorizontal: 15,
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  walletBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  walletText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  tabBtn: {
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  itemCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  badgeContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaContainer: {
    flex: 1,
    marginRight: 14,
    alignItems: 'flex-end',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemDesc: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'right',
  },
  cardDivider: {
    height: 1,
    marginVertical: 12,
    opacity: 0.6,
  },
  cardFooter: {
    alignItems: 'flex-start',
  },
  buyBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  unlockedTag: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 15,
  },
  unlockedText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});
