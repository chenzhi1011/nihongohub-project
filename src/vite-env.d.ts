/// <reference types="vite/client" />

interface UmamiTrack {
  (eventName: string, data?: Record<string, string>): void;
}

interface Window {
  umami?: {
    track: UmamiTrack;
  };
}
