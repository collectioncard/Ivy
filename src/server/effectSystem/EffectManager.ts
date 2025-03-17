import { effectRequest, effectResponse } from '../../shared/SharedTypes';
import { getEffectTool } from './EffectDecider';
import { getTTS } from '../tts/TTSProvider';

interface chosenEffect {
  sound_effect: string;
  trigger_word: string;
}

export async function getEffectFromString(input: effectRequest): Promise<effectResponse> {
  //Get the bot response
  const botResponse = await getEffectTool(input.input);

  const resultResponse: effectResponse = {
    chatComp: botResponse.completion,
  };

  //Parse the tool calls
  if (botResponse.toolCalls) {
    const soundEffects = [];
    for (const toolCall of botResponse.toolCalls) {
      const temp: chosenEffect = JSON.parse(toolCall.function.arguments);
      soundEffects.push({
        effectName: temp.sound_effect,
        word: temp.trigger_word,
      });
    }
    resultResponse.soundEffects = soundEffects;
  }

  //if we need to do TTS, we can grab it
  if (input.withTTS) {
    const ttsResponse = await getTTS(input.input);
    resultResponse.ttsAudio = ttsResponse.audioData;

    //Now we need to figure out where to put the sound effects. Find the word in the message that triggers the sound effect.
    if (botResponse.toolCalls) {
      const soundEffectts = [];
      for (const toolCall of botResponse.toolCalls) {
        const temp: chosenEffect = JSON.parse(toolCall.function.arguments);
        const triggerWord = temp.trigger_word;
        const soundEffect = temp.sound_effect;

        const ttsCharArr = ttsResponse.timestamps;

        //combine ttsCharArr into a string
        let ttsString = '';
        for (const char of ttsCharArr) {
          ttsString += char.text;
        }
        //find the index of the trigger word
        const triggerIndex = ttsString.indexOf(triggerWord);
        //add that to the soundEffectts array
        soundEffectts.push({
          effectName: soundEffect,
          time: ttsCharArr[triggerIndex].start,
          word: triggerWord,
        });
      }
      resultResponse.soundEffects = soundEffectts;
    }
  }

  //Parse the response into the effectResponse shape
  return resultResponse;
}
