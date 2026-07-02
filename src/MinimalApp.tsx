import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MinimalApp() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>بطل مسلم</Text>
      <Text style={styles.subtitle}>النسخة الأساسية تعمل</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: '#666',
  },
});
