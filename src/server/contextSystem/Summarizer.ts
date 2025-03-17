import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  baseURL: process.env.LLM_URL,
  apiKey: process.env.LLM_KEY,
});

const MODEL = process.env.MODEL_NAME!;

const SYS_PROMPT = `
You are in charge of summarizing a play into a short description of evertyhing that has happened so far. You will be fed lines as they are said, so don't be surprised if you dont have the full story.
Do your best to shorten the information as much as possible while still keeping the main points of the story.

The user will give the full context of the play so far.
`.trim();

export async function getSummary(input: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: SYS_PROMPT },
        { role: 'user', content: input },
      ],
      stream: false,
    });

    return completion.choices[0].message.content ?? 'ERROR';
  } catch (error) {
    console.error('Error:', error);
    return 'ERROR';
  }
}
