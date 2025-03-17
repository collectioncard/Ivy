import { ElevenLabsClient } from 'elevenlabs';
import { TextToSpeech } from 'elevenlabs/api/resources/textToSpeech/client/Client';

const client = new ElevenLabsClient({
  apiKey: process.env.LABS_KEY!, // Assert that LABS_KEY is defined
});

export interface TTSResponse {
  audioData: string;
  timestamps: Array<{
    start: number;
    end: number;
    text: string;
  }>;
}

interface NormalizedAlignment {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

export async function getTTS(text: string): Promise<TTSResponse> {
  // First cast to unknown, then to TextToSpeech
  const temp = (await client.textToSpeech.convertWithTimestamps('JBFqnCBsd6RMkjVDRZzb', {
    output_format: 'mp3_44100_128',
    text: text,
    model_id: 'eleven_multilingual_v2',
  })) as unknown as TextToSpeech;

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const ttsWav: string = temp.audio_base64;

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const data = temp.normalized_alignment as NormalizedAlignment;

  const timestamps = data.characters.map((char, index) => ({
    start: data.character_start_times_seconds[index],
    end: data.character_end_times_seconds[index],
    text: char,
  }));

  return {
    audioData: ttsWav,
    timestamps,
  };
}
