const { ethers } = require('ethers');
require('dotenv').config();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'https://polygon-rpc.com');
// Only create signer if PRIVATE_KEY is provided
const signer = process.env.PRIVATE_KEY ? new ethers.Wallet(process.env.PRIVATE_KEY, provider) : null;

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

const contract = contractAddress && signer ? new ethers.Contract(contractAddress, contractABI, signer) : null;
const tokenContract = tokenAddress && signer ? new ethers.Contract(tokenAddress, tokenABI, signer) : null;

async function mintNFT(walletAddress, tokenId, assetType) {
  if (!contract) {
    console.log('Contract not configured, returning mock NFT mint');
    return `mock-tx-${Date.now()}`;
  }
  const metadata = JSON.stringify({ assetType, createdAt: Date.now() });
  const tx = await contract.mint(walletAddress, tokenId, metadata);
  await tx.wait();
  return tx.hash;
}

async function fetchOnchainAchievements(walletAddress) {
  // Return mock achievements for testing
  return [
    { achievementId: 'genesis-miner', unlockedAt: Date.now() },
    { achievementId: 'first-tap', unlockedAt: Date.now() - 86400000 }
  ];
}

async function tokenBalance(walletAddress) {
  if (!tokenContract) {
    console.log('Token contract not configured, returning mock balance');
    return Math.floor(Math.random() * 1000);
  }
  const raw = await tokenContract.balanceOf(walletAddress);
  return Number(ethers.formatUnits(raw, 18));
}

async function tokenTransfer(to, amount) {
  if (!tokenContract) {
    console.log('Token contract not configured, returning mock transfer');
    return `mock-tx-${Date.now()}`;
  }
  const scaled = ethers.parseUnits(amount.toString(), 18);
  const tx = await tokenContract.transfer(to, scaled);
  await tx.wait();
  return tx.hash;
}

module.exports = { mintNFT, fetchOnchainAchievements, tokenBalance, tokenTransfer };
