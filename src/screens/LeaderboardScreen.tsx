import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { getTopPlayers } from '../firebase/auth';
import AdBanner from '../components/AdBanner';
import { Colors } from '../config/colors';

export default function LeaderboardScreen() {
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPlayers = async () => {
    setLoading(true);
    try {
      const topPlayers = await getTopPlayers();
      setPlayers(topPlayers);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlayers();
  }, []);

  // Split players into top 3 (podium) and rest
  const firstPlace = players[0] || null;
  const secondPlace = players[1] || null;
  const thirdPlace = players[2] || null;
  const remainingPlayers = players.slice(3);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>ترتيب أبطال المعرفة</Text>
        <Text style={styles.subtitle}>أعلى النتائج المحققة بين المنافسين</Text>
      </View>

      {/* Refresh Button */}
      <TouchableOpacity style={styles.refreshButton} onPress={loadPlayers} disabled={loading} activeOpacity={0.85}>
        {loading ? (
          <ActivityIndicator size="small" color={Colors.surface} />
        ) : (
          <Text style={styles.refreshButtonText}>تحديث الترتيب 🔄</Text>
        )}
      </TouchableOpacity>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {players.length === 0 && !loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}>🌱</Text>
            <Text style={styles.emptyStateText}>لا توجد لوحة صدارة بعد. كن البطل الأول وابدأ اللعب!</Text>
          </View>
        ) : (
          <>
            {/* Top 3 Podium Section */}
            <View style={styles.podiumContainer}>
              
              {/* 2nd Place (Left) */}
              <View style={[styles.podiumCol, styles.podiumColSide]}>
                <View style={[styles.avatarFrame, styles.avatarSilver]}>
                  <Text style={styles.avatarEmoji}>🥈</Text>
                </View>
                <Text style={styles.podiumName} numberOfLines={1}>
                  {secondPlace ? secondPlace.displayName : 'شاغر'}
                </Text>
                <Text style={styles.podiumScore}>
                  {secondPlace ? `${secondPlace.score} ن` : '-'}
                </Text>
                <View style={[styles.podiumBar, styles.barSilver]}>
                  <Text style={styles.podiumRankText}>٢</Text>
                </View>
              </View>

              {/* 1st Place (Center - Elevated) */}
              <View style={[styles.podiumCol, styles.podiumColCenter]}>
                <View style={[styles.avatarFrame, styles.avatarGold]}>
                  <Text style={styles.avatarEmoji}>🏆</Text>
                </View>
                <Text style={[styles.podiumName, styles.podiumNameGold]} numberOfLines={1}>
                  {firstPlace ? firstPlace.displayName : 'شاغر'}
                </Text>
                <Text style={styles.podiumScoreGold}>
                  {firstPlace ? `${firstPlace.score} ن` : '-'}
                </Text>
                <View style={[styles.podiumBar, styles.barGold]}>
                  <Text style={styles.podiumRankTextGold}>١</Text>
                </View>
              </View>

              {/* 3rd Place (Right) */}
              <View style={[styles.podiumCol, styles.podiumColSide]}>
                <View style={[styles.avatarFrame, styles.avatarBronze]}>
                  <Text style={styles.avatarEmoji}>🥉</Text>
                </View>
                <Text style={styles.podiumName} numberOfLines={1}>
                  {thirdPlace ? thirdPlace.displayName : 'شاغر'}
                </Text>
                <Text style={styles.podiumScore}>
                  {thirdPlace ? `${thirdPlace.score} ن` : '-'}
                </Text>
                <View style={[styles.podiumBar, styles.barBronze]}>
                  <Text style={styles.podiumRankText}>٣</Text>
                </View>
              </View>

            </View>

            {/* Remaining Players List */}
            {remainingPlayers.length > 0 && (
              <View style={styles.listContainer}>
                {remainingPlayers.map((player, index) => (
                  <View key={player.uid} style={styles.playerRow}>
                    <Text style={styles.playerScore}>{player.score ?? 0} نقطة</Text>
                    <View style={styles.playerInfo}>
                      <Text style={styles.playerName}>{player.displayName || 'ضيف'}</Text>
                      <Text style={styles.playerRankHint}>الترتيب #{index + 4}</Text>
                    </View>
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankBadgeText}>{index + 4}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <View style={styles.adWrapper}>
        <AdBanner />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: Colors.background,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  refreshButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  refreshButtonText: {
    color: Colors.surface,
    fontWeight: '700',
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStateText: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 30,
  },
  podiumContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-end',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  podiumCol: {
    alignItems: 'center',
    flex: 1,
  },
  podiumColSide: {
    marginTop: 20,
  },
  podiumColCenter: {
    zIndex: 1,
  },
  avatarFrame: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
  },
  avatarGold: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderColor: '#F59E0B',
    backgroundColor: '#FEF3C7',
  },
  avatarSilver: {
    borderColor: '#94A3B8',
    backgroundColor: '#F1F5F9',
  },
  avatarBronze: {
    borderColor: '#D97706',
    backgroundColor: '#FFEDD5',
  },
  avatarEmoji: {
    fontSize: 24,
  },
  podiumName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 2,
    width: 80,
  },
  podiumNameGold: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '800',
  },
  podiumScore: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: 8,
  },
  podiumScoreGold: {
    fontSize: 14,
    color: Colors.accent,
    fontWeight: '800',
    marginBottom: 8,
  },
  podiumBar: {
    width: '80%',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  barGold: {
    height: 60,
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  barSilver: {
    height: 45,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#94A3B8',
  },
  barBronze: {
    height: 35,
    backgroundColor: '#FFEDD5',
    borderWidth: 1.5,
    borderColor: '#D97706',
  },
  podiumRankText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  podiumRankTextGold: {
    fontSize: 16,
    fontWeight: '900',
    color: '#F59E0B',
  },
  listContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  playerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: Colors.background,
    paddingHorizontal: 8,
  },
  playerName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'right',
  },
  playerScore: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
  },
  playerInfo: {
    flex: 1,
    marginRight: 12,
  },
  playerRankHint: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginTop: 2,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  adWrapper: {
    marginTop: 12,
  },
});
