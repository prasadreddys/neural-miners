const express = require('express');
const { getDB } = require('./db');
const { verifySignature, generateToken } = require('./auth');
const { mintNFT, fetchOnchainAchievements, tokenBalance, tokenTransfer } = require('./web3');
const { generateAIMissions } = require('./openai');

function createRouter(io) {
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

  const score = (updated.value.tokens || 0) + (updated.value.energy || 0);
  await db.collection('leaderboard').updateOne(
    { walletAddress },
    { $set: { walletAddress, player: walletAddress.slice(0, 8), score, lastUpdated: new Date() } },
    { upsert: true }
  );

  const top = await db.collection('leaderboard').find({}).sort({ score: -1 }).limit(20).toArray();
  io.emit('leaderboard-update', { top });

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

router.get('/token/balance', async (req, res) => {
  const { walletAddress } = req.query;
  if (!walletAddress) return res.status(400).json({ error: 'wallet required' });

  try {
    const balance = await tokenBalance(walletAddress);
    res.json({ walletAddress, balance });
  } catch (err) {
    res.status(500).json({ error: 'unable to fetch token balance', message: err.message });
  }
});

router.post('/token/transfer', async (req, res) => {
  const { walletAddress, to, amount } = req.body;
  if (!walletAddress || !to || !amount) return res.status(400).json({ error: 'missing fields' });

  try {
    const txHash = await tokenTransfer(to, amount);
    const db = getDB();
    await db.collection('token-transfers').insertOne({ from: walletAddress, to, amount, txHash, createdAt: new Date() });
    res.json({ success: true, txHash });
  } catch (err) {
    res.status(500).json({ error: 'transfer failed', message: err.message });
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

router.post('/rewards/referral', async (req, res) => {
  const { walletAddress, referrer } = req.body;
  if (!walletAddress || !referrer) return res.status(400).json({ error: 'walletAddress and referrer required' });

  const db = getDB();
  const now = new Date();
  await db.collection('referrals').insertOne({ walletAddress, referrer, createdAt: now });

  const bonus = 25;
  await Promise.all([
    db.collection('users').updateOne({ walletAddress }, { $inc: { tokens: bonus, energy: bonus } }, { upsert: true }),
    db.collection('users').updateOne({ walletAddress: referrer }, { $inc: { tokens: bonus, energy: bonus } }, { upsert: true })
  ]);

  res.json({ success: true, bonus, referrer });
});

router.post('/marketplace/list', async (req, res) => {
  const { walletAddress, assetType, price, tokenId } = req.body;
  if (!walletAddress || !assetType || !price || !tokenId) return res.status(400).json({ error: 'missing fields' });

  const db = getDB();
  const order = { walletAddress, assetType, price, tokenId, status: 'open', createdAt: new Date() };
  await db.collection('marketplace').insertOne(order);

  res.json({ success: true, order });
});

router.post('/marketplace/buy', async (req, res) => {
  const { buyer, orderId } = req.body;
  if (!buyer || !orderId) return res.status(400).json({ error: 'missing fields' });

  const db = getDB();
  const order = await db.collection('marketplace').findOne({ _id: orderId, status: 'open' });
  if (!order) return res.status(404).json({ error: 'order not found or closed' });

  const fee = Math.max(1, Math.round(order.price * 0.05));
  await Promise.all([
    db.collection('users').updateOne({ walletAddress: buyer }, { $inc: { tokens: -order.price } }, { upsert: true }),
    db.collection('users').updateOne({ walletAddress: order.walletAddress }, { $inc: { tokens: order.price - fee } }),
    db.collection('marketplace').updateOne({ _id: order._id }, { $set: { status: 'sold', buyer, soldAt: new Date() } })
  ]);

  io.emit('market-update', { orderId, status: 'sold' });
  res.json({ success: true, orderId, buyer });
});

router.get('/marketplace', async (_req, res) => {
  const db = getDB();
  const items = await db.collection('marketplace').find({ status: 'open' }).toArray();
  res.json({ marketplace: items });
});

return router;
}

module.exports = createRouter;
