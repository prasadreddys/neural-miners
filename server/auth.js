// const jwt = require('jsonwebtoken'); // Temporarily disabled for testing
const { utils } = require('ethers');
require('dotenv').config();

function verifySignature(walletAddress, signature, message) {
  try {
    const msgHash = utils.hashMessage(message);
    const recovered = utils.recoverAddress(msgHash, signature);
    return recovered.toLowerCase() === walletAddress.toLowerCase();
  } catch (error) {
    console.error('signature verification failed', error.message);
    return false;
  }
}

function generateToken(user) {
  const payload = { walletAddress: user.walletAddress };
  const secret = process.env.JWT_SECRET || 'neural-miners-secret';
  // Simple mock JWT implementation for testing
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64');
  const signature = Buffer.from(secret).toString('base64');
  return `${header}.${body}.${signature}`;
  // return jwt.sign(payload, secret, { expiresIn: '12h' });
}

module.exports = { verifySignature, generateToken };
