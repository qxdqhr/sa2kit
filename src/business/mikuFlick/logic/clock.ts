export interface MikuFlickClock {
  start(): void;
  pause(): void;
  resume(): void;
  stop(): void;
  getTimeMs(): number;
  isRunning(): boolean;
}

const nowMs = (): number => {
  return typeof window !== 'undefined' ? window.performance.now() : Date.now();
};

const createAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const Ctor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) {
    return null;
  }

  try {
    return new Ctor();
  } catch {
    return null;
  }
};

export const createMikuFlickClock = (): MikuFlickClock => {
  const audioContext = createAudioContext();

  let baseClockMs = 0;
  let startStampMs = 0;
  let running = false;

  const readRawMs = (): number => {
    if (audioContext) {
      return audioContext.currentTime * 1000;
    }
    return nowMs();
  };

  return {
    start() {
      baseClockMs = 0;
      startStampMs = readRawMs();
      running = true;
      if (audioContext && audioContext.state === 'suspended') {
        void audioContext.resume();
      }
    },
    pause() {
      if (!running) {
        return;
      }
      baseClockMs = this.getTimeMs();
      running = false;
    },
    resume() {
      if (running) {
        return;
      }
      startStampMs = readRawMs();
      running = true;
      if (audioContext && audioContext.state === 'suspended') {
        void audioContext.resume();
      }
    },
    stop() {
      baseClockMs = 0;
      startStampMs = 0;
      running = false;
    },
    getTimeMs() {
      if (!running) {
        return baseClockMs;
      }
      return baseClockMs + (readRawMs() - startStampMs);
    },
    isRunning() {
      return running;
    },
  };
};
