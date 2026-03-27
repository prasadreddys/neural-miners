const { ethers } = require('ethers');
require('dotenv').config();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'https://polygon-rpc.com');
const signer = new ethers.Wallet(process.env.PRIVATE_KEY || 'YOUR_PRIVATE_KEY', provider);

const contractAddress = process.env.NEURAL_MINER_CONTRACT || '';
const tokenAddress = process.env.NEURAL_MINER_TOKEN || '';

const contractABI = [
  'function mint(address to, uint256 tokenId, string metadata) public returns (bool)',
  'function rewardToken(address to, uint256 amount) public'
];

const tokenABI = [
  'function transfer(address to, uint256 amount) public returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function approve(address spender, uint256 amount) public returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)'
];

const contract = contractAddress ? new ethers.Contract(contractAddress, contractABI, signer) : null;
const tokenContract = tokenAddress ? new ethers.Contract(tokenAddress, tokenABI, signer) : null;

async function mintNFT(walletAddress, tokenId, assetType) {
  if (!contract) throw new Error('Contract not configured');
  const metadata = JSON.stringify({ assetType, createdAt: Date.now() });
  const tx = await contract.mint(walletAddress, tokenId, metadata);
  await tx.wait();
  return tx.hash;
}

async function fetchOnchainAchievements(walletAddress) {
  return [{ achievementId: 'genesis-miner', unlockedAt: Date.now() }];
}

async function tokenBalance(walletAddress) {
  if (!tokenContract) throw new Error('Token contract not configured');
  const raw = await tokenContract.balanceOf(walletAddress);
  return Number(ethers.formatUnits(raw, 18));
}

async function tokenTransfer(to, amount) {
  if (!tokenContract) throw new Error('Token contract not configured');
  const scaled = ethers.parseUnits(amount.toString(), 18);
  const tx = await tokenContract.transfer(to, scaled);
  await tx.wait();
  return tx.hash;
}

module.exports = { mintNFT, fetchOnchainAchievements, tokenBalance, tokenTransfer };

async function mintNFT(walletAddress, tokenId, assetType) {
  if (!contract) throw new Error('Contract not configured');
  const metadata = JSON.stringify({ assetType, createdAt: Date.now() });
  const tx = await contract.mint(walletAddress, tokenId, metadata);
  await tx.wait();
  return tx.hash;
}

async function fetchOnchainAchievements(walletAddress) {
  return [{ achievementId: 'genesis-miner', unlockedAt: Date.now() }];
}

module.exports = { mintNFT, fetchOnchainAchievements };
