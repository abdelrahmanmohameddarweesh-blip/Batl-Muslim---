import { Platform } from 'react-native';

let AVModule: any = null;
try {
  // Safely attempt to require expo-av without crashing at app initialization
  AVModule = require('expo-av');
} catch (error) {
  console.warn('[SafeAudio] expo-av native module (ExponentAV) is not available in this environment.');
}

export const SafeAudio = {
  get isAvailable(): boolean {
    return !!(AVModule && AVModule.Audio);
  },

  async requestPermissionsAsync() {
    try {
      if (AVModule?.Audio?.requestPermissionsAsync) {
        return await AVModule.Audio.requestPermissionsAsync();
      }
    } catch (e) {
      console.warn('[SafeAudio] requestPermissionsAsync failed:', e);
    }
    return { status: 'granted', granted: true, expires: 'never', canAskAgain: true };
  },

  async setAudioModeAsync(options: any) {
    try {
      if (AVModule?.Audio?.setAudioModeAsync) {
        return await AVModule.Audio.setAudioModeAsync(options);
      }
    } catch (e) {
      console.warn('[SafeAudio] setAudioModeAsync failed:', e);
    }
  },

  Sound: {
    async createAsync(source: any, initialStatus: any = {}, onPlaybackStatusUpdate: any = null, downloadFirst: boolean = true) {
      try {
        if (AVModule?.Audio?.Sound?.createAsync) {
          return await AVModule.Audio.Sound.createAsync(source, initialStatus, onPlaybackStatusUpdate, downloadFirst);
        }
      } catch (e) {
        console.warn('[SafeAudio] Sound.createAsync failed:', e);
      }
      return {
        sound: {
          playAsync: async () => ({ isLoaded: true }),
          stopAsync: async () => ({ isLoaded: true }),
          unloadAsync: async () => ({ isLoaded: false }),
          setOnPlaybackStatusUpdate: () => {},
        },
        status: { isLoaded: true },
      };
    },
  },

  Recording: class SafeRecording {
    private instance: any = null;
    constructor() {
      if (AVModule?.Audio?.Recording) {
        try {
          this.instance = new AVModule.Audio.Recording();
        } catch (e) {
          console.warn('[SafeAudio] Recording instance creation failed:', e);
        }
      }
    }

    async prepareToRecordAsync(options?: any) {
      if (this.instance?.prepareToRecordAsync) {
        return await this.instance.prepareToRecordAsync(options);
      }
    }

    async startAsync() {
      if (this.instance?.startAsync) {
        return await this.instance.startAsync();
      }
    }

    async stopAndUnloadAsync() {
      if (this.instance?.stopAndUnloadAsync) {
        return await this.instance.stopAndUnloadAsync();
      }
    }

    getURI(): string | null {
      if (this.instance?.getURI) {
        return this.instance.getURI();
      }
      return null;
    }

    setProgressUpdateInterval(interval: number) {
      if (this.instance?.setProgressUpdateInterval) {
        this.instance.setProgressUpdateInterval(interval);
      }
    }

    setOnRecordingStatusUpdate(callback: (status: any) => void) {
      if (this.instance?.setOnRecordingStatusUpdate) {
        this.instance.setOnRecordingStatusUpdate(callback);
      }
    }
  },

  AndroidOutputFormat: AVModule?.Audio?.AndroidOutputFormat || { MPEG_4: 2 },
  AndroidAudioEncoder: AVModule?.Audio?.AndroidAudioEncoder || { AAC: 3 },
  IOSOutputFormat: AVModule?.Audio?.IOSOutputFormat || { MPEG4AAC: 'aac ' },
  IOSAudioQuality: AVModule?.Audio?.IOSAudioQuality || { HIGH: 0x7f },
};

export default SafeAudio;
