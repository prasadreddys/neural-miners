const { Telegraf } = require('telegraf');
require('dotenv').config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || '');

bot.start((ctx) => {
  ctx.reply(
    `👋 Welcome Neural Miner! Use /play to open the mini game, /earn to claim your energy, /wallet to link your wallet.`,
    { disable_notification: true }
  );
});

bot.command('play', (ctx) => {
  const url = process.env.MINI_APP_URL || 'https://your-host/app/index.html';
  ctx.reply(`🚀 Launch your Neural Miners game here: ${url}`);
});

bot.command('earn', (ctx) => {
  ctx.reply('⛏️ Claim energy unlocked! Visit the game and tap to mine.');
});

bot.command('wallet', (ctx) => {
  ctx.reply('🔗 Connect your wallet via the mini app flow: Base or Polygon.');
});

bot.on('message', (ctx) => {
  if (/invite/i.test(ctx.message.text || '')) {
    ctx.reply('🔁 Send your referral link to a friend to earn bonus tokens.');
  } else {
    ctx.reply('🧠 Neural Assistant: Ask for missions, upgrades, leaderboards via /play.');
  }
});

(async () => {
  try {
    await bot.launch();
    console.log('Telegram bot started');
  } catch (err) {
    console.error('Telegram bot failed to start', err);
    process.exit(1);
  }
})();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
