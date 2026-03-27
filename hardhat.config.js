require('@nomiclabs/hardhat-ethers');
require('@nomiclabs/hardhat-etherscan');
require('dotenv').config();

const INFURA_RPC = process.env.RPC_URL || 'https://polygon-rpc.com';

module.exports = {
  solidity: '0.8.19',
  networks: {
    hardhat: {},
    localhost: { url: 'http://127.0.0.1:8545' },
    polygon: { url: INFURA_RPC, accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [] },
    base: { url: process.env.BASE_RPC_URL || 'https://base-rpc.url', accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [] }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || ''
  }
};
