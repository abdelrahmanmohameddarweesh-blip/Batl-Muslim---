import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
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

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Custom central elevated tab bar button
function ChallengeHeroButton({ onPress }: any) {
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
  const { t } = useLanguage();
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: t('profileTab'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👤</Text>,
        }}
      />
      <Tab.Screen
        name="Voice"
        component={VoiceScreen}
        options={{
          title: t('voiceTab'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🎙️</Text>,
        }}
      />
      <Tab.Screen
        name="ChallengePicker"
        component={ChallengePickerScreen}
        options={{
          title: t('challengeTab'),
          tabBarButton: (props) => <ChallengeHeroButton {...props} />,
        }}
      />
      <Tab.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{
          title: t('leaderboardTab'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏆</Text>,
        }}
      />
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: t('homeTab'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏡</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <NavigationContainer>
          <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{
            headerStyle: styles.headerStyle,
            headerTintColor: Colors.primary,
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
        </Stack.Navigator>
      </NavigationContainer>
      </LanguageProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    height: 60,
    paddingBottom: 6,
    paddingTop: 6,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  headerStyle: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    elevation: 0,
    shadowOpacity: 0,
  },
  headerTitleStyle: {
    fontWeight: '800',
    fontSize: 16,
    color: Colors.primary,
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
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 3,
    borderColor: Colors.surface,
  },
  heroButtonEmoji: {
    fontSize: 22,
    color: Colors.surface,
  },
});
