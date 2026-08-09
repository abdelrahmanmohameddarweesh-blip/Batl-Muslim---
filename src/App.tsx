import React, { useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Svg, { Path, Circle } from 'react-native-svg';
import { useFonts } from 'expo-font';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import GrowScreen from './screens/GrowScreen';
import TriviaScreen from './screens/TriviaScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import ProfileScreen from './screens/ProfileScreen';
import VoiceScreen from './screens/VoiceScreen';
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

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// SVG outline tab icons
function TabIcon({ name, color }: { name: string; color: string }) {
  if (name === 'Home') {
    return (
      <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <Path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <Path d="M9 22V12h6v10" />
      </Svg>
    );
  }
  if (name === 'Grow') {
    return (
      <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 22 2c-2.48 5-3 6.5-4.1 12.2A7 7 0 0 1 11 20z" />
        <Path d="M9 9c2 2 4 3 6 4" />
      </Svg>
    );
  }
  if (name === 'CommunityFeed') {
    return (
      <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </Svg>
    );
  }
  // Profile
  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <Circle cx="12" cy="7" r="4" />
    </Svg>
  );
}

// Custom central elevated tab bar FAB button matching the mock
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
        {/* Thunder Bolt / Sword SVG */}
        <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={colors.surface} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </Svg>
      </View>
    </TouchableOpacity>
  );
}

// Tab Navigator setup
function TabNavigator() {
  const { language } = useLanguage();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primaryDeep,
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
          tabBarIcon: ({ color }) => <TabIcon name="Home" color={color} />,
        }}
      />
      <Tab.Screen
        name="Grow"
        component={GrowScreen}
        options={{
          title: language === 'ar' ? 'التطوّر' : 'Grow',
          tabBarIcon: ({ color }) => <TabIcon name="Grow" color={color} />,
        }}
      />
      <Tab.Screen
        name="ArenaHub"
        component={ArenaHubScreen}
        options={{
          title: language === 'ar' ? 'الميدان' : 'Arena',
          tabBarButton: (props) => <ChallengeHeroButton {...props} />,
        }}
      />
      <Tab.Screen
        name="CommunityFeed"
        component={CommunityFeedScreen}
        options={{
          title: language === 'ar' ? 'المجتمع' : 'Community',
          tabBarIcon: ({ color }) => <TabIcon name="CommunityFeed" color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: language === 'ar' ? 'حسابي' : 'Profile',
          tabBarIcon: ({ color }) => <TabIcon name="Profile" color={color} />,
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
          headerTintColor: colors.primaryDeep,
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
          options={{ title: language === 'ar' ? 'تحدي المعرفة' : 'Knowledge Quest' }}
        />
        <Stack.Screen
          name="PrayerTracker"
          component={PrayerTrackerScreen}
          options={{ title: language === 'ar' ? 'الصلوات الخمس' : 'Daily Prayers' }}
        />
        <Stack.Screen
          name="FajrChallenge"
          component={FajrChallengeScreen}
          options={{ title: language === 'ar' ? 'تحدي صلاة الفجر' : 'Fajr Challenge' }}
        />
        <Stack.Screen
          name="ReadingChallenge"
          component={ReadingChallengeScreen}
          options={{ title: language === 'ar' ? 'تحدي القراءة والفهم' : 'Reading Challenge' }}
        />
        <Stack.Screen
          name="Memorization"
          component={MemorizationScreen}
          options={{ title: language === 'ar' ? 'تحدي حفظ الآيات' : 'Ayah Memorization' }}
        />
        <Stack.Screen
          name="Adhkar"
          component={AdhkarScreen}
          options={{ title: language === 'ar' ? 'أذكار اليوم والمساء' : 'Daily Adhkar' }}
        />
        <Stack.Screen
          name="HadithChallenge"
          component={HadithChallengeScreen}
          options={{ title: language === 'ar' ? 'تحدي الحديث الشريف' : 'Hadith Challenge' }}
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
          name="Leaderboard"
          component={LeaderboardScreen}
          options={{ title: language === 'ar' ? 'لوحة الصدارة' : 'Leaderboard' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    'IBMPlexSansArabic-Regular': require('./assets/fonts/IBMPlexSansArabic-Regular.ttf'),
    'IBMPlexSansArabic-Medium': require('./assets/fonts/IBMPlexSansArabic-Medium.ttf'),
    'IBMPlexSansArabic-SemiBold': require('./assets/fonts/IBMPlexSansArabic-SemiBold.ttf'),
    'IBMPlexSansArabic-Bold': require('./assets/fonts/IBMPlexSansArabic-Bold.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

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

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
});

const getStyles = (colors: any) => StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: 80,
    paddingBottom: 16,
    paddingTop: 8,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  headerStyle: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    elevation: 0,
    shadowOpacity: 0,
  },
  headerTitleStyle: {
    fontWeight: '700',
    fontSize: 16,
    color: colors.primaryDeep,
  },
  heroButtonOuter: {
    top: -26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: colors.primaryDeep,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primaryDeep,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 5,
    borderWidth: 3,
    borderColor: colors.surface,
  },
});
