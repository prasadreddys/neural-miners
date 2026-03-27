const express = require('express');
const http = require('node:http');
const cors = require('cors');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
const { connectDB } = require('./db');
const createRoutes = require('./routes');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: 'Too many requests, slow down.'
});

app.use(limiter);

app.use('/api', createRoutes(io));

app.use(express.static('app'));

io.on('connection', (socket) => {
  console.log('New socket connected', socket.id);

  socket.on('join-leaderboard', async () => {
    const db = await connectDB();
    const top = await db.collection('leaderboard').find({}).sort({ score: -1 }).limit(20).toArray();
    socket.emit('leaderboard-update', { top });
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected', socket.id);
  });
});

connectDB().then(() => {
  if (require.main === module) {
    server.listen(PORT, () => {
      console.log(`Neural Miners server running at http://localhost:${PORT}`);
    });
  }
});

module.exports = app;
