const API_BASE = location.origin + '/api';

const state = {
  energy: 100,
  tokens: 0,
  streak: 0,
  walletAddress: null,
  connected: false,
  missions: []
};

const elements = {
  energyMeter: document.getElementById('energy-meter'),
  tokenMeter: document.getElementById('token-meter'),
  streakMeter: document.getElementById('streak-meter'),
  tapButton: document.getElementById('tap-button'),
  claimIdle: document.getElementById('claim-idle'),
  showLeaderboard: document.getElementById('show-leaderboard'),
  missionList: document.getElementById('mission-list'),
  assistantText: document.getElementById('assistant-text'),
  leaderboard: document.getElementById('leaderboard'),
  leaderboardList: document.getElementById('leaderboard-list'),
  connectWallet: document.getElementById('connect-wallet'),
  status: document.getElementById('connected-status')
};

function updateHUD() {
  elements.energyMeter.textContent = `Energy: ${Math.floor(state.energy)}`;
  elements.tokenMeter.textContent = `Tokens: ${Math.floor(state.tokens)}`;
  elements.streakMeter.textContent = `Streak: ${state.streak}`;
  elements.status.textContent = state.connected ? `Connected ${state.walletAddress || ''}` : 'Disconnected';
}

async function callAPI(path, method = 'GET', body) {
  const options = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE}${path}`, options);
  return res.json();
}

async function loadAIMissions() {
  try {
    const res = await callAPI(`/ai/missions?walletAddress=${state.walletAddress || 'guest'}`);
    state.missions = res.missions;
    elements.missionList.innerHTML = state.missions
      .map((m) => `<li><strong>${m.title}</strong> <small>(${m.difficulty})</small> • +${m.reward} energy <button onclick='acceptMission("${m.id}")'>Accept</button></li>`)
      .join('');
  } catch (e) {
    elements.assistantText.textContent = 'AI missions unavailable. Reconnecting...';
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

window.acceptMission = async (missionId) => {
  const mission = state.missions.find((m) => m.id === missionId);
  if (!mission) return;
  if (spendEnergy(mission.reward / 3)) {
    state.tokens += mission.reward * 0.25;
    state.streak += 1;
    elements.assistantText.textContent = `Mission '${mission.title}' complete. Reward granted.`;
    await reportMissionProgress();
    updateHUD();
  }
};

async function reportMissionProgress() {
  callAPI('/ai/report', 'POST', { walletAddress: state.walletAddress, energy: state.energy, tokens: state.tokens, streak: state.streak });
}

async function claimOffline() {
  const offlineSeconds = Math.min(86400, Math.round(Math.random() * 3600));
  const signature = 'dummy-signature';
  const res = await callAPI('/game/claim-energy', 'POST', { walletAddress: state.walletAddress || 'guest', offlineSeconds, signature });
  if (res?.success) {
    state.energy = res.user.energy;
    state.tokens = res.user.tokens;
    elements.assistantText.textContent = `Offline energy claimed: ${res.reward}`;
    updateHUD();
  }
}

async function showTopLeaderboards() {
  const res = await callAPI('/leaderboard');
  elements.leaderboard.hidden = false;
  elements.leaderboardList.innerHTML = res.leaderboard.map((entry, idx) => `<li>#${idx + 1} ${entry.player} - ${entry.score}</li>`).join('');
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
  await callAPI('/auth/wallet', 'POST', { walletAddress: state.walletAddress, signature, nonce });
  elements.assistantText.textContent = 'Wallet connected. AI assistant is online.';
  updateHUD();
  loadAIMissions();
}

elements.tapButton.addEventListener('click', () => {
  const earned = 8 + Math.random() * 12;
  state.energy += earned;
  state.tokens += earned * 0.23;
  state.streak += 1;
  elements.assistantText.textContent = 'Neural tap success! Energy harvested.';
  updateHUD();
});

elements.claimIdle.addEventListener('click', claimOffline);

elements.showLeaderboard.addEventListener('click', showTopLeaderboards);

elements.connectWallet.addEventListener('click', connectWallet);

setInterval(() => {
  state.energy = Math.max(0, state.energy - 0.04);
  if (state.energy < 20) {
    elements.assistantText.textContent = 'Energy low. Tap more or accept missions.';
  }
  updateHUD();
}, 2000);

updateHUD();
loadAIMissions();
