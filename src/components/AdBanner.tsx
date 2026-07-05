import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { AdMobConfig } from '../config/ads';

export default function AdBanner() {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return null;
  }

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={AdMobConfig.bannerAdUnitID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdFailedToLoad={(error) => {
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
});
