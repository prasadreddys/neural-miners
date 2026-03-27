const API_BASE = location.origin + '/api';
const socket = io();

socket.on('leaderboard-update', (payload) => {
  if (elements?.leaderboardList && !elements.leaderboard.hidden) {
    elements.leaderboardList.innerHTML = (payload.top || []).map((entry, idx) => `<li>#${idx + 1} ${entry.player || entry.walletAddress} - ${entry.score}</li>`).join('');
  }
});

socket.on('market-update', (payload) => {
  elements.assistantText.textContent = `Marketplace event: ${payload.orderId} is ${payload.status}`;
  fetchMarketplace();
});

const state = {
  energy: 100,
  tokens: 0,
  streak: 0,
  walletAddress: null,
  connected: false,
  missions: []
};

const elements = {
  energyMeter: document.getElementById('energyValue'),
  tokenMeter: document.getElementById('tokenValue'),
  streakMeter: document.getElementById('streakValue'),
  tapButton: document.getElementById('tapMineBtn'),
  claimIdle: document.getElementById('offlineBtn'),
  showLeaderboard: document.getElementById('leaderboardBtn'),
  missionButton: document.getElementById('missionsBtn'),
  missionList: document.getElementById('mission-list'),
  assistantText: document.getElementById('assistant-text'),
  leaderboard: document.getElementById('leaderboard'),
  leaderboardList: document.getElementById('leaderboard-list'),
  actionMessage: document.getElementById('assistant-text'),
  connectWallet: document.getElementById('connectBtn'),
  tokenBalance: document.getElementById('balanceBtn'),
  marketplace: document.getElementById('marketplace'),
  marketList: document.getElementById('market-list'),
  status: document.getElementById('connectionStatus'),
  transferAmount: null,
  recipientAddress: null
};

// Enhanced updateHUD with typing effect
async function updateHUD() {
  elements.energyMeter.textContent = `Energy: ${Math.floor(state.energy)}`;
  elements.tokenMeter.textContent = `Tokens: ${Math.floor(state.tokens)}`;
  elements.streakMeter.textContent = `Streak: ${state.streak}`;
  elements.status.textContent = state.connected ? `Connected ${state.walletAddress || ''}` : 'Disconnected';
}

// Enhanced assistant text with typing effect
async function setAssistantText(text) {
  if (!elements.assistantText) return;

  if (window.animationSystem && typeof window.animationSystem.typeText === 'function') {
    await window.animationSystem.typeText(elements.assistantText, text, 30);
  } else {
    elements.assistantText.textContent = text;
  }
}

async function callAPI(path, body = null, method = 'GET') {
  const options = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) options.body = JSON.stringify(body);

  try {
    const res = await fetch(`${API_BASE}${path}`, options);
    if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
    return res.json();
  } catch (err) {
    console.error('API request failed:', err);
    await setAssistantText('Network error, retrying soon...');
    return null;
  }
}
  const options = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json();
}

async function loadAIMissions() {
  try {
    const res = await callAPI(`/ai/missions?walletAddress=${state.walletAddress || 'guest'}`);
    state.missions = (res && res.missions) ? res.missions : [];
    if (elements.missionList) {
      elements.missionList.innerHTML = state.missions
        .map((m) => `<li><strong>${m.title}</strong> <small>(${m.difficulty})</small> • +${m.reward} energy <button onclick='acceptMission("${m.id}")'>Accept</button></li>`)
        .join('');
    }
  } catch (e) {
    await setAssistantText('AI missions unavailable. Reconnecting...');
  }
}

function spendEnergy(cost) {
  if (state.energy < cost) {
    elements.actionMessage?.setAttribute('style', 'color:var(--danger)');
    return false;
  }
  state.energy -= cost;
  return true;
}

globalThis.acceptMission = async (missionId) => {
  const mission = state.missions.find((m) => m.id === missionId);
  if (!mission) return;
  if (spendEnergy(mission.reward / 3)) {
    state.tokens += mission.reward * 0.25;
    state.streak += 1;
    await setAssistantText(`Mission '${mission.title}' complete. Reward granted.`);

    // Add success animation
    if (window.animationSystem) {
      window.animationSystem.createNotification(`Mission Complete! +${(mission.reward * 0.25).toFixed(1)} Tokens`, 'success');
    }

    await reportMissionProgress();
    updateHUD();
  }
};

async function reportMissionProgress() {
  callAPI('/ai/report', { walletAddress: state.walletAddress, energy: state.energy, tokens: state.tokens, streak: state.streak }, 'POST');
}

async function claimOffline() {
  const offlineSeconds = Math.min(86400, Math.round(Math.random() * 3600));
  const signature = 'dummy-signature';
  const res = await callAPI('/game/claim-energy', { walletAddress: state.walletAddress || 'guest', offlineSeconds, signature }, 'POST');
  if (res?.success) {
    state.energy = res.user.energy;
    state.tokens = res.user.tokens;
    elements.assistantText.textContent = `Offline energy claimed: ${res.reward}`;
    updateHUD();
  }
}

async function showTopLeaderboards() {
  const res = await callAPI('/leaderboard', null, 'GET');
  if (!elements.leaderboard || !elements.leaderboardList || !res || !Array.isArray(res.leaderboard)) return;
  elements.leaderboard.hidden = false;
  elements.leaderboardList.innerHTML = res.leaderboard.map((entry, idx) => `<li>#${idx + 1} ${entry.player || entry.walletAddress} - ${entry.score || entry.tokens}</li>`).join('');
}

async function fetchMarketplace() {
  const res = await callAPI('/marketplace', null, 'GET');
  if (!elements.marketplace || !elements.marketList) return;

  const items = (res && Array.isArray(res.marketplace)) ? res.marketplace : [];
  elements.marketplace.hidden = false;
  elements.marketList.innerHTML = items
    .map((o) => `<li>${o.assetType} #${o.tokenId} • ${o.price} tokens <button data-id="${o._id}" class="buy-btn">Buy</button></li>`)
    .join('');

  [...document.querySelectorAll('.buy-btn')].forEach((btn) => {
    btn.addEventListener('click', async () => {
      const orderId = btn.dataset.id;
      const result = await callAPI('/marketplace/buy', { buyer: state.walletAddress || 'guest', orderId }, 'POST');
      if (result && result.success) {
        elements.assistantText.textContent = 'Purchase successful!';
        await loadAIMissions();
        await fetchMarketplace();
      }
    });
  });
}

async function shareReferral() {
  const referrer = state.walletAddress || 'guest-miner';
  const referralURL = `${location.origin}?r=${encodeURIComponent(referrer)}`;
  if (navigator.share) {
    await navigator.share({ title: 'Join Neural Miners', text: 'Start tapping to earn crypto in the cyberpunk metaverse', url: referralURL });
  } else {
    prompt('Copy your referral link:', referralURL);
  }
}

async function connectWallet() {
  if (!globalThis.ethereum) {
    alert('MetaMask not installed');
    return;
  }
  const provider = new ethers.BrowserProvider(globalThis.ethereum);
  const accounts = await provider.send('eth_requestAccounts', []);
  state.walletAddress = accounts[0];
  state.connected = true;
  const nonce = Math.random().toString(36).substring(2, 10);
  const signer = await provider.getSigner();
  const signature = await signer.signMessage(`Neural Miner sign in: ${nonce}`);
  await callAPI('/auth/wallet', { walletAddress: state.walletAddress, signature, nonce }, 'POST');
  elements.assistantText.textContent = 'Wallet connected. AI assistant is online.';
  updateHUD();
  loadAIMissions();
}

if (elements.tapButton) {
  elements.tapButton.addEventListener('click', async () => {
    const earned = 8 + Math.random() * 12;
    state.energy += earned;
    state.tokens += earned * 0.23;
    state.streak += 1;
    await setAssistantText('Neural tap success! Energy harvested.');

    // Add animation feedback
    if (window.animationSystem) {
      window.animationSystem.showSuccess(elements.tapButton);
      window.animationSystem.createNotification(`+${earned.toFixed(1)} Energy!`, 'success');
    }

    updateHUD();
  });
}

if (elements.claimIdle) elements.claimIdle.addEventListener('click', claimOffline);
if (elements.showLeaderboard) elements.showLeaderboard.addEventListener('click', async () => {
  await showTopLeaderboards();
  const panel = document.getElementById('leaderboard');
  if (panel) panel.style.display = 'block';
});
if (elements.missionButton) elements.missionButton.addEventListener('click', async () => {
  await loadAIMissions();
  const panel = document.getElementById('mission-panel');
  if (panel) panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
});
if (elements.connectWallet) elements.connectWallet.addEventListener('click', connectWallet);

if (elements.tokenBalance) {
  elements.tokenBalance.addEventListener('click', async () => {
    const address = state.walletAddress || prompt('Enter wallet address for token balance:');
    if (!address) return;
    const res = await callAPI(`/token/balance?walletAddress=${encodeURIComponent(address)}`, null, 'GET');
    if (res.balance !== undefined) {
      elements.assistantText.textContent = `Token balance for ${address}: ${res.balance} NMT`;
    }
  });
}

setInterval(() => {
  state.energy = Math.max(0, state.energy - 0.04);
  if (state.energy < 20) {
    setAssistantText('Energy low. Tap more or accept missions.');
  }
  updateHUD();
}, 2000);

updateHUD();
loadAIMissions();

// Initialize with typing effect
setTimeout(async () => {
  await setAssistantText('Welcome, miner. Connect wallet or tap to begin.');
}, 1000);

// Initialize Cyberpunk Theme Animations
if (window.animationSystem) {
  window.animationSystem.initCyberpunkTheme();
}
