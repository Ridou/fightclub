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

app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});

let draftRooms = {}; // Store draft rooms state here

// Define the pick order
const pickOrder = [1, 2, 2, 1, 2, 1, 2, 1];

// Define the turn logic
const getNextTurn = (currentTurnIndex, room) => {
  const nextTurnIndex = currentTurnIndex + 1;
  if (nextTurnIndex >= pickOrder.length) return null;
  return pickOrder[nextTurnIndex];
};

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('joinRoom', ({ draftRoomId, userId }) => {
    socket.join(draftRoomId);

    // Initialize the draft room if not existing
    if (!draftRooms[draftRoomId]) {
      draftRooms[draftRoomId] = {
        currentTurnIndex: 0, // Start at the first index of pickOrder
        currentTurn: pickOrder[0], // Player 1 starts
        banPhase: true,
        player1Picks: [],
        player2Picks: [],
        bannedCharacters: { player1: null, player2: null },
        players: { player1: null, player2: null },
      };
    }

    // Assign players
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

    const currentPlayerId = room.currentTurn === 1 ? room.players.player1 : room.players.player2;
    console.log(`It's Player ${room.currentTurn}'s turn: ${currentPlayerId}`);

    if (userId !== currentPlayerId) {
      console.log(`Invalid move: It's not ${userId}'s turn`);
      return;
    }

// Handle ban phase
if (phase === 'ban') {
  if (room.banPhase) {
    if (room.currentTurn === 1) {
      room.bannedCharacters.player1 = character;
      console.log(`Player 1 banned: ${character.name}`);
    } else {
      room.bannedCharacters.player2 = character;
      console.log(`Player 2 banned: ${character.name}`);
    }

    // Switch turn after a ban
    room.currentTurn = room.currentTurn === 1 ? 2 : 1;

    // Check if both players have banned a character
    if (room.bannedCharacters.player1 && room.bannedCharacters.player2) {
      room.banPhase = false; // End the ban phase
      room.currentTurnIndex = 0; // Reset to first pick
      room.currentTurn = pickOrder[0]; // Start with Player 1 for picking
      console.log('Ban phase ended. Starting pick phase.');
    }
  }
} 
// Handle pick phase
else if (phase === 'pick') {
  if (!room.banPhase) {  // Ensure we are out of ban phase
    if (room.currentTurn === 1 && room.player1Picks.length < 5) {
      room.player1Picks.push(character);
      console.log(`Player 1 picked: ${character.name}`);
    } else if (room.currentTurn === 2 && room.player2Picks.length < 5) {
      room.player2Picks.push(character);
      console.log(`Player 2 picked: ${character.name}`);
    }

    // Switch to next turn based on pick order
    const nextTurnIndex = room.currentTurnIndex + 1;
    if (nextTurnIndex < pickOrder.length) {
      room.currentTurnIndex = nextTurnIndex;
      room.currentTurn = pickOrder[nextTurnIndex];
    } else {
      room.currentTurn = null; // End draft when all picks are made
    }
  }
}

    // Broadcast the updated state to all clients
    io.to(draftRoomId).emit('updateDraft', room);
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
