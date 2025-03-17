export interface effectResponse {
  chatComp: string;
  ttsAudio?: string;
  soundEffects?: Array<{
    effectName: string;
    time?: number;
    word?: string;
  }>;
}

export interface effectRequest {
  input: string;
  withTTS: boolean;
}
