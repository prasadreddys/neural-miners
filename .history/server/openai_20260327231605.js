const fetch = require('node-fetch');
require('dotenv').config();

const OPENAI_KEY = process.env.OPENAI_API_KEY;

async function generateAIMissions(walletAddress, playerStats) {
  if (!OPENAI_KEY) {
    return [
      { id: 'o1', title: 'Augment your rig', reward: 110, difficulty: 'easy', description: 'Train an AI rig with 3 data shards.' },
      { id: 'o2', title: 'Dive into the new zone', reward: 215, difficulty: 'medium', description: 'Extract 4 energy nodes from restricted net.' }
    ];
  }

  const prompt = `Generate 3 cyberpunk gaming missions for user ${walletAddress} given stats ${JSON.stringify(playerStats)}.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 220
    })
  });

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content || '';

  // parse the output into mission objects in a robust implementation
  return [{ id: 'o1', title: 'AI Backup mission', reward: 100, difficulty: 'easy', description: text }];
}

module.exports = { generateAIMissions };
