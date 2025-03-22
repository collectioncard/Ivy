import './style.css';
import { effectRequest, effectResponse } from '../shared/SharedTypes';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<div>
  <h1 id="face-icon">${await getFace()}</h1>
  <div id="chat-box">
    <form id="chat-form">
      <input type="text" id="user-input" placeholder="Describe a scene" required />
      <button type="submit">Send</button>
      <button type="button" id="tts-toggle">Disable TTS</button>
      <button type="button" id="mic-toggle">Enable Mic</button>
    </form>
    <div id="messages"></div>
  </div>
</div>
`;

const chatForm = document.querySelector<HTMLFormElement>('#chat-form')!;
const userInput = document.querySelector<HTMLInputElement>('#user-input')!;
const messagesDiv = document.querySelector<HTMLDivElement>('#messages')!;
const ttsToggleButton = document.querySelector<HTMLButtonElement>('#tts-toggle')!;
const micToggleButton = document.querySelector<HTMLButtonElement>('#mic-toggle')!;

let ttsEnabled = true;
let micEnabled = false;

ttsToggleButton.addEventListener('click', (event) => {
  event.preventDefault();
  ttsEnabled = !ttsEnabled;
  ttsToggleButton.style.backgroundColor = ttsEnabled ? '#7faf79' : 'red';
  ttsToggleButton.innerHTML = ttsEnabled ? 'Disable TTS' : 'Enable TTS';
  console.log('TTS toggle button clicked');
});

micToggleButton.addEventListener('click', (event) => {
  event.preventDefault();
  micEnabled = !micEnabled;
  micToggleButton.style.backgroundColor = micEnabled ? 'red' : '#7faf79';
  micToggleButton.innerHTML = micEnabled ? 'Disable Mic' : 'Enable Mic';
  console.log('Mic toggle button clicked');

  if (micEnabled) {
    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.start();

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript;
      console.log('Mic transcript:', transcript);
      userInput.value = transcript;

      if (result.isFinal) {
        chatForm.dispatchEvent(new Event('submit'));
        micEnabled = !micEnabled;
        micToggleButton.style.backgroundColor = micEnabled ? 'red' : '#7faf79';
        micToggleButton.innerHTML = micEnabled ? 'Disable Mic' : 'Enable Mic';
      }
    };
  }
});

chatForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const effectResponse: effectResponse = await getEffect(userInput.value);
  console.log('Effect response:', effectResponse);

  addMessage('user', userInput.value);
  userInput.value = '';

  if (effectResponse.soundEffects) {
    addMessage('system', JSON.stringify(effectResponse.soundEffects));
  } else {
    addMessage('system', effectResponse.chatComp);
  }

  if (effectResponse.ttsAudio) {
    playBase64Audio(effectResponse.ttsAudio);
  }

  effectResponse.soundEffects?.forEach((soundEffect) => {
    setTimeout(() => playSoundEffect(soundEffect.effectName), (soundEffect.time ?? 0) * 1000);
  });
});

function addMessage(sender: 'user' | 'system', message: string) {
  if (sender === 'user') {
    messagesDiv.innerHTML = '';
  }

  const messageDiv = document.createElement('div');
  messageDiv.className = sender;
  messageDiv.textContent = sender + ': ' + message;
  messagesDiv.appendChild(messageDiv);
}

////**** Get/Post Requests to server ****////
async function getFace(): Promise<string> {
  const response = await fetch('/getFace');
  console.log('Server returned:', response);
  return response.text();
}

async function getEffect(input: string): Promise<effectResponse> {
  console.log('Sending message to server:', input);
  const response = await fetch('/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: input,
      withTTS: ttsEnabled,
    } as effectRequest),
  });

  const serverResponse: effectResponse = await response.json();

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  // This is hacky, but it's just for the sake of the demo. IT WILL BREAK with multiple users.
  if (serverResponse === 'debug mode on' || serverResponse === 'debug mode off') {
    const faceIcon = document.querySelector<HTMLDivElement>('#face-icon')!;
    faceIcon.style.color = serverResponse === 'debug mode on' ? 'red' : '#7faf79';
    return {
      chatComp: serverResponse,
      ttsAudio: '',
      soundEffects: [],
    };
  }

  return serverResponse;
}

function playBase64Audio(audioData: string) {
  const audio = new Audio(`data:audio/wav;base64,${audioData}`);
  audio.play();
}

function playSoundEffect(soundEffect: string) {
  const audio = new Audio(`soundEffects/${soundEffect}.mp3`);
  audio.play();
}
