import express from 'express';
import ViteExpress from 'vite-express';
import { getEffectFromString } from './effectSystem/EffectManager';
import { setDevMode } from './effectSystem/EffectDecider';
import { ContextSystem } from './contextSystem/ContextSystem';
import { effectRequest } from '../shared/SharedTypes';

const app = express();

app.use(express.json());

app.get('/getFace', (_, res) => {
  const face = [':)', ':(', '>:(', ':D', '>:D', ':^D', ':(', ':D', 'O_O', 'O_o', '𓆉'];
  res.send(face[Math.floor(Math.random() * face.length)]);
});

app.post('/chat', async (req, res) => {
  const message: effectRequest = req.body || {};
  if (!message) {
    res.status(400).send({ error: 'A message must be provided to chat' });
    return;
  }
  console.log('Received Message:', message);

  if (
    message.input.toLowerCase() === 'debug mode on' ||
    message.input.toLowerCase() === 'debug mode off'
  ) {
    setDevMode(message.input.toLowerCase() === 'debug mode on');
    res.send(JSON.stringify(message.input.toLowerCase()));
    return;
  }

  res.send(await getEffectFromString(message));

  // Add the old message to the context system:
  ContextSystem.getInstance().addContext(message.input);
});

ViteExpress.listen(app, 3000, () => console.log('Server is listening on http://localhost:3000'));
