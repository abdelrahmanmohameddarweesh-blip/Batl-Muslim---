import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { Colors } from './config/colors';

import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import TriviaScreen from './screens/TriviaScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import ProfileScreen from './screens/ProfileScreen';
import VoiceScreen from './screens/VoiceScreen';
import ChallengePickerScreen from './screens/ChallengePickerScreen';
import PrayerTrackerScreen from './screens/PrayerTrackerScreen';
import FajrChallengeScreen from './screens/FajrChallengeScreen';
import ReadingChallengeScreen from './screens/ReadingChallengeScreen';
import MemorizationScreen from './screens/MemorizationScreen';
import AdhkarScreen from './screens/AdhkarScreen';
import HadithChallengeScreen from './screens/HadithChallengeScreen';
import LiveDuelScreen from './screens/LiveDuelScreen';
import CommunityFeedScreen from './screens/CommunityFeedScreen';
import SirahQuestScreen from './screens/SirahQuestScreen';
import ArenaHubScreen from './screens/ArenaHubScreen';
import WorshipSanctuaryScreen from './screens/WorshipSanctuaryScreen';
import QuranSanctuaryScreen from './screens/QuranSanctuaryScreen';
import KnowledgeSanctuaryScreen from './screens/KnowledgeSanctuaryScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Custom central elevated tab bar button
function ChallengeHeroButton({ onPress }: any) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  return (
    <TouchableOpacity
      style={styles.heroButtonOuter}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.heroButtonInner}>
        <Text style={styles.heroButtonEmoji}>⚡</Text>
      </View>
    </TouchableOpacity>
  );
}

// Tab Navigator setup
function TabNavigator() {
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: language === 'ar' ? 'الرئيسية' : 'Home',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏡</Text>,
        }}
      />
      <Tab.Screen
        name="CommunityFeed"
        component={CommunityFeedScreen}
        options={{
          title: language === 'ar' ? 'ساحة التلاوة' : 'Recitation Square',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👥</Text>,
        }}
      />
      <Tab.Screen
        name="ArenaHub"
        component={ArenaHubScreen}
        options={{
          title: language === 'ar' ? 'المنافسة' : 'Arena',
          tabBarButton: (props) => <ChallengeHeroButton {...props} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: language === 'ar' ? 'حسابي' : 'Profile',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

function NavigationWrapper() {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const styles = getStyles(colors);

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle: styles.headerStyle,
          headerTintColor: colors.primary,
          headerTitleStyle: styles.headerTitleStyle,
          headerTitleAlign: 'center',
          headerBackTitleVisible: false,
        }}
      >
        {/* Main flow stack */}
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="HomeTabs"
          component={TabNavigator}
          options={{ headerShown: false }}
        />

        {/* Sub challenges stack */}
        <Stack.Screen
          name="Trivia"
          component={TriviaScreen}
          options={{ title: 'تحدي المعرفة' }}
        />
        <Stack.Screen
          name="PrayerTracker"
          component={PrayerTrackerScreen}
          options={{ title: 'الصلوات الخمس' }}
        />
        <Stack.Screen
          name="FajrChallenge"
          component={FajrChallengeScreen}
          options={{ title: 'تحدي صلاة الفجر' }}
        />
        <Stack.Screen
          name="ReadingChallenge"
          component={ReadingChallengeScreen}
          options={{ title: 'تحدي القراءة والفهم' }}
        />
        <Stack.Screen
          name="Memorization"
          component={MemorizationScreen}
          options={{ title: 'تحدي حفظ الآيات' }}
        />
        <Stack.Screen
          name="Adhkar"
          component={AdhkarScreen}
          options={{ title: 'أذكار اليوم والمساء' }}
        />
        <Stack.Screen
          name="HadithChallenge"
          component={HadithChallengeScreen}
          options={{ title: 'تحدي الحديث الشريف' }}
        />
        <Stack.Screen
          name="LiveDuel"
          component={LiveDuelScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Voice"
          component={VoiceScreen}
          options={{ title: language === 'ar' ? 'تحدي محاكاة التلاوة' : 'Recitation Challenge' }}
        />
        <Stack.Screen
          name="SirahQuest"
          component={SirahQuestScreen}
          options={{ title: language === 'ar' ? 'خريطة السيرة النبوية' : 'Sirah Quest Map' }}
        />
        <Stack.Screen
          name="WorshipSanctuary"
          component={WorshipSanctuaryScreen}
          options={{ title: language === 'ar' ? 'أركان العبادة' : 'Pillars of Worship' }}
        />
        <Stack.Screen
          name="QuranSanctuary"
          component={QuranSanctuaryScreen}
          options={{ title: language === 'ar' ? 'محراب القرآن الكريم' : 'Quran Sanctuary' }}
        />
        <Stack.Screen
          name="KnowledgeSanctuary"
          component={KnowledgeSanctuaryScreen}
          options={{ title: language === 'ar' ? 'مسالك المعرفة' : 'Knowledge Quests' }}
        />
        <Stack.Screen
          name="Leaderboard"
          component={LeaderboardScreen}
          options={{ title: language === 'ar' ? 'لوحة الصدارة' : 'Leaderboard' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <LanguageProvider>
          <NavigationWrapper />
        </LanguageProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: 60,
    paddingBottom: 6,
    paddingTop: 6,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  headerStyle: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    elevation: 0,
    shadowOpacity: 0,
  },
  headerTitleStyle: {
    fontWeight: '800',
    fontSize: 16,
    color: colors.primary,
  },
  heroButtonOuter: {
    top: -16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 3,
    borderColor: colors.surface,
  },
  heroButtonEmoji: {
    fontSize: 22,
    color: colors.surface,
  },
});
