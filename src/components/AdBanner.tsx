import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { BannerAd, BannerAdSize, hasAdMob } from '../config/adsService';
import { AdMobConfig } from '../config/ads';

export default function AdBanner() {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return null;
  }

  if (!hasAdMob || !BannerAd) {
    return (
      <View style={styles.container}>
        <View style={styles.demoBox}>
          <Text style={styles.demoText}>مساحة إعلانية (بنر تجريبي)</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={AdMobConfig.bannerAdUnitID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdFailedToLoad={(error: any) => {
          console.warn('Ad failed to load: ', error);
          setHasError(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  demoBox: {
    width: '90%',
    height: 50,
    backgroundColor: '#eaeaea',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderStyle: 'dashed',
  },
  demoText: {
    color: '#777',
    fontSize: 12,
    fontWeight: '700',
  },
});
