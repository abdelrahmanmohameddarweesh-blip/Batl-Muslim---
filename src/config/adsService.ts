import { useState, useEffect } from 'react';

let BannerAd: any = null;
let BannerAdSize: any = null;
let useInterstitialAd: any = null;
let TestIds: any = { BANNER: 'test_banner', INTERSTITIAL: 'test_interstitial', REWARDED: 'test_rewarded' };
let hasAdMob = false;

try {
  // Try to load the native module
  const Ads = require('react-native-google-mobile-ads');
  BannerAd = Ads.BannerAd;
  BannerAdSize = Ads.BannerAdSize;
  useInterstitialAd = Ads.useInterstitialAd;
  TestIds = Ads.TestIds;
  hasAdMob = true;
} catch (error) {
  console.log('react-native-google-mobile-ads native module not found. Falling back to mockup ads.');
}

// Custom mock hook for useInterstitialAd when running inside Expo Go
const useMockInterstitialAd = (unitId: string, options?: any) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isClosed, setIsClosed] = useState(false);

  // Simulate loading in a mock environment
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const load = () => {
    setIsClosed(false);
    setIsLoaded(false);
    setTimeout(() => {
      setIsLoaded(true);
    }, 1000);
  };

  const show = () => {
    console.log('[AdMob Mock] Showing Interstitial Ad...');
    setIsClosed(true);
  };

  return {
    isLoaded,
    isClosed,
    load,
    show,
  };
};

const safeUseInterstitialAd = hasAdMob && useInterstitialAd ? useInterstitialAd : useMockInterstitialAd;

export {
  BannerAd,
  BannerAdSize,
  safeUseInterstitialAd as useInterstitialAd,
  TestIds,
  hasAdMob,
};
