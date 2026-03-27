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

## Animation Design System

The app features a comprehensive animation system for enhanced user experience:

### CSS Variables
- `--anim-duration-*`: Fast (0.15s), normal (0.3s), slow (0.6s), slower (1.2s)
- `--anim-easing-*`: Standard, decelerate, accelerate, bounce, elastic
- `--anim-scale-*`: Hover (1.02), active (0.98)
- `--anim-glow-*`: Glow intensities for interactive elements

### Utility Classes
- `.anim-fade-in`, `.anim-slide-up/down/left/right`
- `.anim-scale-in`, `.anim-bounce-in`
- `.anim-glow-pulse`, `.anim-shimmer`
- `.anim-rotate`, `.anim-float`
- `.hover-lift`, `.click-scale`, `.focus-glow`

### JavaScript API
```javascript
// Initialize system (auto-initialized)
const anim = window.animationSystem;

// Animate elements
anim.animate(element, 'fadeIn', { duration: '0.5s' });

// Create sequences
anim.animateSequence([
  { element: btn1, animation: 'slideUp', delay: 100 },
  { element: btn2, animation: 'slideUp', delay: 200 }
]);

// Show notifications
anim.createNotification('Success!', 'success');

// Enhance buttons
anim.enhanceButton(myButton);
```

### Features
- Particle background system
- Entrance animations for panels
- Interactive button feedback
- Success/error notifications
- Loading spinners
- Staggered animation sequences

