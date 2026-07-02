import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AdBanner() {
  return (
    <View style={styles.container}>
      <View style={styles.fallbackBox}>
        <Text style={styles.fallbackText}>الإعلان غير متوفر حالياً</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginTop: 16,
  },
  fallbackBox: {
    width: '100%',
    paddingVertical: 18,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    alignItems: 'center',
  },
  fallbackText: {
    color: '#555',
    fontSize: 14,
  },
});
