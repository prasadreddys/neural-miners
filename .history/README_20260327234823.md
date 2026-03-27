# Neural Miners (Telegram Mini App)

Futuristic tap-to-earn + strategy game built as a Telegram Mini App with Web3 and AI enhancement.

## Goals
- Tap-to-earn energy mining loop
- Idle offline rewards, daily missions, streaks
- Leaderboard (global + friends)
- Upgrade system + in-game token + NFTs
- AI-generated evolving missions and helper assistant
- Wallet connectivity (Base and Polygon), on-chain achievements
- Telegram bot and inline commands (/play /earn /wallet)

## Architecture
- `app/`: frontend UI (HTML/CSS/JS) responsive + neon
- `server/`: Node.js + Express + MongoDB + Socket.io (leaderboard, sync, anti-cheat)
- `contracts/`: Solidity metadata and NFT minting contract
- `bot/`: Telegram bot service (Telegraf)

## Quick start
1. `npm install`
2. create `.env` with DB, PORT, TELEGRAM_BOT_TOKEN, AI_API_KEY, ETHERSCAN_API_KEY etc.
3. `npm run dev`
4. `npm run bot`
5. open `app/index.html` in browser or serve with static route

## Deployment
- Backend: Vercel/Heroku/Cloud Run
- NFT contract: OpenZeppelin + Hardhat + Etherscan verification
- Bot: Docker or serverless (Fly.io)

### Vercel Deployment
1. Push code to GitHub repo
2. Connect repo to Vercel
3. Set environment variables in Vercel dashboard (from .env)
4. Deploy
5. Frontend served at root, API at /api/*

Bot runs separately (e.g., on Railway or local).

