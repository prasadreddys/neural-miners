const express = require('express');
const { getDB } = require('./db');
const { verifySignature, generateToken } = require('./auth');
const { mintNFT, fetchOnchainAchievements } = require('./web3');
const { generateAIMissions } = require('./openai');

const router = express.Router();

router.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: Date.now() }));

router.post('/auth/wallet', async (req, res) => {
  const { walletAddress, signature, nonce } = req.body;
  if (!walletAddress || !signature || !nonce) return res.status(400).json({ error: 'invalid payload' });

  const valid = verifySignature(walletAddress, signature, nonce);
  if (!valid) return res.status(401).json({ error: 'invalid signature' });

  const db = getDB();
  const user = await db.collection('users').findOneAndUpdate(
    { walletAddress },
    { $setOnInsert: { walletAddress, createdAt: new Date(), energy: 100, tokens: 0, level: 1, streak: 0 } },
    { upsert: true, returnDocument: 'after' }
  );

  const token = generateToken(user.value || user);
  res.json({ token, user: user.value || user });
});

router.post('/game/claim-energy', async (req, res) => {
  const { walletAddress, offlineSeconds, signature } = req.body;
  if (!walletAddress || !offlineSeconds || !signature) return res.status(400).json({ error: 'invalid payload' });

  const verified = verifySignature(walletAddress, signature, `${walletAddress}:${offlineSeconds}`);
  if (!verified) return res.status(401).json({ error: 'invalid signature' });

  const db = getDB();
  const reward = Math.min(offlineSeconds * 0.1, 1000);
  const updated = await db.collection('users').findOneAndUpdate(
    { walletAddress },
    { $inc: { energy: reward, tokens: reward * 0.2 }, $set: { updatedAt: new Date() } },
    { returnDocument: 'after' }
  );

  res.json({ success: true, reward, user: updated.value });
});

router.post('/nft/mint', async (req, res) => {
  const { walletAddress, tokenId, assetType } = req.body;
  if (!walletAddress || !tokenId || !assetType) return res.status(400).json({ error: 'missing fields' });

  try {
    const tx = await mintNFT(walletAddress, tokenId, assetType);
    res.json({ tx, minted: true, tokenId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'mint failed' });
  }
});

router.get('/leaderboard', async (_req, res) => {
  const db = getDB();
  const list = await db.collection('leaderboard').find({}).sort({ score: -1 }).limit(50).toArray();
  res.json({ leaderboard: list });
});

router.get('/achievements', async (req, res) => {
  const { walletAddress } = req.query;
  if (!walletAddress) return res.status(400).json({ error: 'wallet required' });

  try {
    const achievements = await fetchOnchainAchievements(walletAddress);
    res.json({ achievements });
  } catch (err) {
    res.status(500).json({ error: 'unable to fetch achievements' });
  }
});

router.get('/ai/missions', async (req, res) => {
  const { walletAddress } = req.query;
  if (!walletAddress) return res.status(400).json({ error: 'wallet required' });

  const db = getDB();
  const user = await db.collection('users').findOne({ walletAddress }) || { streak: 0, tokens: 0 };

  const missions = await generateAIMissions(walletAddress, { streak: user.streak, tokens: user.tokens });

  res.json({ missions, user, updatedAt: Date.now() });
});

router.post('/ai/report', async (req, res) => {
  // adaptive difficulty signal collector
  const report = req.body;
  console.log('AI behavior report', report?.walletAddress);
  res.json({ ok: true });
});

module.exports = router;
