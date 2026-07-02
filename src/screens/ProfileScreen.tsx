import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { getCurrentUserProfile } from '../firebase/auth';
import AdBanner from '../components/AdBanner';
import { Colors } from '../config/colors';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.uid) {
        return;
      }
      setLoading(true);
      try {
        const currentProfile = await getCurrentUserProfile(user.uid);
        setProfile(currentProfile);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user?.uid]);

  const currentScore = profile?.score ?? 0;

  const levelName = useMemo(() => {
    if (currentScore >= 100) return 'بطل ذهبي';
    if (currentScore >= 50) return 'بطل فضي';
    return 'مبتدئ';
  }, [currentScore]);

  const formattedDate = useMemo(() => {
    if (!profile?.lastPlayedAt) return 'لم تلعب بعد';
    try {
      const date = new Date(profile.lastPlayedAt);
      return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'تاريخ غير معروف';
    }
  }, [profile?.lastPlayedAt]);

  return (
    <ScrollView style={styles.outerContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        <Text style={styles.title}>الملف الشخصي</Text>
        
        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
        ) : (
          <>
            {/* Profile Card Header */}
            <View style={styles.profileHeaderCard}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {user?.displayName ? user.displayName[0].toUpperCase() : '👤'}
                </Text>
              </View>
              <Text style={styles.profileName}>
                {user?.displayName || 'ضيف'}
              </Text>
              <View style={styles.levelBadge}>
                <Text style={styles.levelBadgeText}>🏆 {levelName}</Text>
              </View>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{currentScore}</Text>
                <Text style={styles.statLbl}>مجموع النقاط</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>
                  {currentScore >= 100 ? '١٠٠٪' : `${currentScore}%`}
                </Text>
                <Text style={styles.statLbl}>نسبة التقدم</Text>
              </View>
            </View>

            {/* Details Card */}
            <View style={styles.detailsCard}>
              <Text style={styles.cardTitle}>تفاصيل الحساب</Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailValue}>{user?.uid ? 'نشط (محلي)' : 'غير متصل'}</Text>
                <Text style={styles.detailLabel}>حالة الاتصال</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailValue}>{formattedDate}</Text>
                <Text style={styles.detailLabel}>آخر نشاط</Text>
              </View>

              <View style={styles.progressBarSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>التقدم للمستوى التالي</Text>
                  <Text style={styles.progressVal}>{Math.min(currentScore, 100)}/100</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${Math.min(currentScore, 100)}%` }]} />
                </View>
              </View>
            </View>

            {/* Motivational Note */}
            <View style={styles.noteCard}>
              <Text style={styles.noteText}>
                💡 "من سلك طريقًا يلتمس فيه علمًا، سهّل الله له به طريقًا إلى الجنة." استمر في تحدي المعرفة اليومي!
              </Text>
            </View>

            {/* Logout Button */}
            <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.85}>
              <Text style={styles.logoutButtonText}>تسجيل الخروج ➔</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.adWrapper}>
          <AdBanner />
        </View>
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
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  loader: {
    marginTop: 40,
  },
  profileHeaderCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    paddingVertical: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.primary,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  levelBadge: {
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.accent + '33',
  },
  levelBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.accent,
  },
  statsGrid: {
    flexDirection: 'row-reverse',
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statVal: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLbl: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  detailsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 16,
    textAlign: 'right',
  },
  detailRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: Colors.background,
  },
  detailLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  detailValue: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  progressBarSection: {
    marginTop: 16,
  },
  progressHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  progressVal: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: Colors.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  noteCard: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '22',
    marginBottom: 20,
  },
  noteText: {
    fontSize: 13,
    lineHeight: 20,
    color: Colors.primary,
    textAlign: 'right',
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: Colors.error,
    fontWeight: '700',
    fontSize: 15,
  },
  adWrapper: {
    marginTop: 20,
  },
});
