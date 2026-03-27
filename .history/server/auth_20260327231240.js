const jwt = require('jsonwebtoken');
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
  return jwt.sign(payload, secret, { expiresIn: '12h' });
}

module.exports = { verifySignature, generateToken };
