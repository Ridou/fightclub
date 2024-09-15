const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// Middleware to set headers for Cross-Origin-Opener-Policy and Cross-Origin-Embedder-Policy
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});

let draftRooms = {}; // Store draft rooms state here

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('joinRoom', ({ draftRoomId, userId }) => {
    socket.join(draftRoomId);

    // If it's a new room, initialize it
    if (!draftRooms[draftRoomId]) {
      draftRooms[draftRoomId] = {
        currentTurn: Math.random() < 0.5 ? 1 : 2, // Randomly assign starting player
        player1Picks: [],
        player2Picks: [],
        bannedCharacters: { player1: null, player2: null },
        banPhase: true,
        players: { player1: null, player2: null },
      };
    }

    // Assign player roles in the room
    if (!draftRooms[draftRoomId].players.player1) {
      draftRooms[draftRoomId].players.player1 = userId;
      console.log(`Player 1 assigned: ${userId}`);
    } else if (!draftRooms[draftRoomId].players.player2) {
      draftRooms[draftRoomId].players.player2 = userId;
      console.log(`Player 2 assigned: ${userId}`);
    }

    console.log(`User ${userId} joined room ${draftRoomId}`);
    io.to(draftRoomId).emit('updateDraft', draftRooms[draftRoomId]); // Broadcast the state
  });

  socket.on('makeMove', ({ draftRoomId, userId, character, phase }) => {
    const room = draftRooms[draftRoomId];
    if (!room) return;

    const currentTurnPlayerId = room.currentTurn === 1 ? room.players.player1 : room.players.player2;
    console.log(`It's Player ${room.currentTurn}'s turn: ${currentTurnPlayerId}`);

    if (userId !== currentTurnPlayerId) {
      console.log(`Invalid move: It's not ${userId}'s turn`);
      return;
    }

    if (phase === 'ban') {
      if (room.currentTurn === 1) {
        room.bannedCharacters.player1 = character;
        console.log(`Player 1 banned: ${character.name}`);
      } else {
        room.bannedCharacters.player2 = character;
        console.log(`Player 2 banned: ${character.name}`);
      }
    } else {
      if (room.currentTurn === 1) {
        room.player1Picks.push(character);
        console.log(`Player 1 picked: ${character.name}`);
      } else {
        room.player2Picks.push(character);
        console.log(`Player 2 picked: ${character.name}`);
      }
    }

    // Switch turn after a move
    room.currentTurn = room.currentTurn === 1 ? 2 : 1;
    if (room.player1Picks.length >= 5 && room.player2Picks.length >= 5) {
      room.banPhase = false; // End the ban phase after 5 picks
      console.log(`Ban phase ended.`);
    }

    io.to(draftRoomId).emit('updateDraft', room); // Broadcast updated state to all clients
  });

  socket.on('leaveRoom', ({ draftRoomId, userId }) => {
    socket.leave(draftRoomId);
    console.log(`User ${userId} left room ${draftRoomId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
