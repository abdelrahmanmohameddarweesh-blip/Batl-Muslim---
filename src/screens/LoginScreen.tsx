import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  StyleSheet, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../config/colors';

export default function LoginScreen({ navigation }: any) {
  const { user, loading, login } = useAuth();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      navigation.replace('HomeTabs');
    }
  }, [user, navigation]);

  const handleContinue = async () => {
    if (!name.trim()) {
      setError('الرجاء كتابة اسمك للبدء في رحلة التحدي!');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await login(name.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.decorativeShape1} />
        <View style={styles.decorativeShape2} />
        
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>🕌</Text>
          </View>
          
          <Text style={styles.title}>بطل مسلم</Text>
          <Text style={styles.subtitle}>ابدأ رحلتك الإسلامية الممتعة ونافس اللاعبين حول العالم</Text>
          
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.input, error ? styles.inputError : null]}
              placeholder="اكتب اسمك هنا للبدء..."
              placeholderTextColor={Colors.textSecondary + 'B3'}
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (error) setError('');
              }}
              maxLength={18}
              returnKeyType="done"
              onSubmitEditing={handleContinue}
              blurOnSubmit={true}
            />
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {(loading || saving) ? (
            <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
          ) : (
            <TouchableOpacity style={styles.button} onPress={handleContinue} activeOpacity={0.85}>
              <Text style={styles.buttonText}>ابدأ اللعب الآن 🚀</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: Colors.background,
    position: 'relative',
  },
  decorativeShape1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.primaryLight,
    opacity: 0.7,
  },
  decorativeShape2: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: Colors.accentLight,
    opacity: 0.5,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconText: {
    fontSize: 40,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  inputWrapper: {
    width: '100%',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    textAlign: 'center',
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: '#FAFCFB',
    fontWeight: '600',
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: Colors.surface,
    fontSize: 17,
    fontWeight: '700',
  },
  loader: {
    marginVertical: 12,
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: -10,
    marginBottom: 16,
  },
});
