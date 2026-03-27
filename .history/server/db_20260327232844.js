const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME || 'neuralminers';

let client;
let db;

async function connectDB() {
  if (db) return db;
  client = new MongoClient(uri, { useUnifiedTopology: true });
  await client.connect();
  db = client.db(dbName);
  console.log('📦 MongoDB connected:', dbName);
  await db.collection('users').createIndex({ walletAddress: 1 }, { unique: true });
  await db.collection('leaderboard').createIndex({ score: -1 });
  return db;
}

function getDB() {
  if (!db) throw new Error('DB not initialized');
  return db;
}

module.exports = { connectDB, getDB };
