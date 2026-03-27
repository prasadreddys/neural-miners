const { getDB } = require('./db');

async function checkForFraudActivity(walletAddress, telemetry) {
  if (telemetry.eventsPerMinute > 1200) {
    return { fraud: true, reason: 'high event rate' };
  }

  if (telemetry.energyGain > 5000) {
    return { fraud: true, reason: 'abnormally high reward' };
  }

  // extend with IP reputation, session fingerprint, signature reuse, and machine learning model
  const db = getDB();
  await db.collection('anticheat').insertOne({ walletAddress, telemetry, detectedAt: new Date() });

  return { fraud: false };
}

module.exports = { checkForFraudActivity };
