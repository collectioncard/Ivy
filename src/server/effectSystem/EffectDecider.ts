import OpenAI from 'openai';
import dotenv from 'dotenv';
import { ContextSystem } from '../contextSystem/ContextSystem';

dotenv.config();

const openai = new OpenAI({
  baseURL: process.env.LLM_URL,
  apiKey: process.env.LLM_KEY,
});

const MODEL = process.env.MODEL_NAME!;

const SYS_PROMPT = `
You are an expert special effects master in charge of ensuring that a local play has visual and audio effects that 
correspond to a story as it unfolds. It is important that only lines that seem as if the *really* need these special effects to have any. 
Most of the lines in the play should be normal and have no effect attached. Additionally, only one effect should ever be called at a time.
The user will additionally give you a summary of the play so far along with the last 3 lines that were said.

If no function is to be called, respond ONLY with "No effect chosen" or the system will break. NEVER respond to a line yourself via text.

The sound effects you have available are:
1. Thunder - A loud thunder sound effect
2. Gunshots - A loud gunshot sound
3. CoinsFalling - The sound of multiple coins falling on the floor
4. Laughter - A sound of a group of people laughing. Used when a joke is told or something funny happens.
5. knifeStab - The sound of a knife stabbing something
6. gtaWasted - The sound of the GTA wasted screen

Example 1: Line: “It was a dark and stormy night”
Response: Thunder sound effect

Example 2:
Line: “Good morning everyone! I hope you’re ready for a fantastic show!”
Response: No effect chosen

Remember to call for an effect ONLY if it should really be there and that most lines don’t have more than one effect of the same type at a time. Almost all of the lines should not have an effect.

If the user directly asks for an effect, you should play it.

The user will give you the next line.
If you mess this up, you will be fined $1000.
`.trim();

const DEV_PROMPT = `
You are to respond to the user's request by playing the sound effect that they request via a tool call. 
If no sound effect is requested or the sound effect is not available, respond with "No effect chosen" or "I don't have access to {sound name}".
`.trim();
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
const tools: never = [
  {
    type: 'function',
    function: {
      name: 'play_sound_effect',
      description:
        'Plays a sound effect that goes along with a specific word in the message. Should only be used to enhance the passed in sentence.',
      strict: true,
      parameters: {
        type: 'object',
        required: ['sound_effect', 'trigger_word'],
        properties: {
          sound_effect: {
            enum: ['thunder', 'gunshots', 'coinsFalling', 'laughter', 'knifeStab', 'gtaWasted'],
            type: 'string',
            description: 'The sound effect to be played.',
          },
          trigger_word: {
            type: 'string',
            description: 'The word in the message that should trigger the sound effect.',
          },
        },
        additionalProperties: false,
      },
    },
  },
];

let devMode: boolean = false;

interface botResponse {
  completion: string;
  toolCalls?: OpenAI.ChatCompletionMessageToolCall[];
}

export async function getEffectTool(input: string): Promise<botResponse> {
  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: !devMode ? SYS_PROMPT : DEV_PROMPT },
        {
          role: 'user',
          content: 'Summarized Context: ' + ContextSystem.getInstance().getSummarizedContext(),
        },
        { role: 'user', content: 'Last 3 Lines: ' + ContextSystem.getInstance().getFullContext(3) },
        { role: 'user', content: 'New Line: ' + input },
      ],
      tools: tools,
      stream: false,
      max_completion_tokens: 100,
    });

    return {
      completion: completion.choices[0].message.content ?? 'No message provided',
      toolCalls: completion.choices[0].message.tool_calls ?? undefined,
    };
  } catch (error) {
    console.error('Error:', error);
    return { completion: 'No effect chosen' };
  }
}

export function setDevMode(mode: boolean) {
  console.log('SET DEBUG MODE: ', mode);
  devMode = mode;
}
