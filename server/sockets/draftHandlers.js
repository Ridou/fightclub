const pickOrder = [1, 2, 2, 1, 2, 1, 2, 1]; // Correct pick order
const banOrder = [1, 2, 1, 2, 1, 2]; // Ban order for 3 bans each

let draftRooms = {}; // Store draft rooms state here
const EXPIRATION_TIME = 60 * 60 * 1000; // 1 hour

// Helper function to get the next turn
const getNextTurn = (currentTurnIndex, phase) => {
  if (phase === 'ban') {
    return currentTurnIndex + 1 < banOrder.length ? banOrder[currentTurnIndex + 1] : null;
  } else if (phase === 'pick') {
    return currentTurnIndex + 1 < pickOrder.length ? pickOrder[currentTurnIndex + 1] : null;
  }
  return null;
};

// Helper function to broadcast the full game state
const broadcastRoomState = (io, draftRoomId, room) => {
  io.to(draftRoomId).emit('updateDraft', room);
};

// Handle when a player makes a move (ban/pick)
// After handling a move, emit the update to both clients
const handleMove = (io, socket, data) => {
  const { draftRoomId, userId, character, phase } = data;
  const room = draftRooms[draftRoomId];

  if (!room) {
    return socket.emit('error', 'Room not found');
  }

  const isPlayer1 = room.players.player1 === userId;

  // Handle banning and picking
  if (phase === 'ban') {
    if (isPlayer1) {
      room.bannedCharacters.player1.push(character);
    } else {
      room.bannedCharacters.player2.push(character);
    }
  } else if (phase === 'pick') {
    if (isPlayer1) {
      room.player1Picks.push(character);
    } else {
      room.player2Picks.push(character);
    }
  }

  // Move to the next turn
  room.currentTurnIndex += 1;
  const nextTurn = getNextTurn(room.currentTurnIndex, room.banPhase ? 'ban' : 'pick');

  if (nextTurn) {
    room.currentTurn = nextTurn;
  } else if (room.banPhase && room.currentTurnIndex >= banOrder.length) {
    // Transition from Ban Phase to Pick Phase
    room.banPhase = false;
    room.currentTurnIndex = 0; // Reset for pick order
    room.currentTurn = pickOrder[0]; // Start with the first pick
  } else if (!room.banPhase && room.currentTurnIndex >= pickOrder.length) {
    // Draft is complete
    io.to(draftRoomId).emit('draftComplete', {
      player1Picks: room.player1Picks,
      player2Picks: room.player2Picks,
    });
    delete draftRooms[draftRoomId]; // Clean up the room
    return;
  }

  room.lastActivity = Date.now();
  io.to(draftRoomId).emit('updateDraft', room);  // Broadcast updated turn and state
};

const handleDraftEvents = (io, socket) => {
  // Player joins the draft room
  socket.on('joinRoom', ({ draftRoomId, userId, player1, player2 }) => {
    socket.join(draftRoomId);
  
    // Validate that both player1 and player2 have a UID
    if (!player1 || !player2 || !player1.uid || !player2.uid) {
      console.error("Error: player1 or player2 is undefined or missing UID.");
      return socket.emit('error', 'Invalid player data.');
    }
  
    if (!draftRooms[draftRoomId]) {
      draftRooms[draftRoomId] = {
        currentTurnIndex: 0,
        currentTurn: banOrder[0], 
        banPhase: true,
        player1Picks: [],
        player2Picks: [],
        bannedCharacters: { player1: [], player2: [] },
        players: { player1: player1.uid, player2: player2.uid },
        lastActivity: Date.now(),
        timer: 60,
      };
    }
  
    const room = draftRooms[draftRoomId];
    console.log("Emitting room state:", JSON.stringify(room, null, 2));
  
    broadcastRoomState(io, draftRoomId, room);
  });

  // Handle a player's move (ban or pick)
  socket.on('makeMove', (data) => {
    handleMove(io, socket, data);
  });

  // Clean up after the room expires
  setInterval(() => {
    Object.keys(draftRooms).forEach((roomId) => {
      const room = draftRooms[roomId];
      if (Date.now() - room.lastActivity > EXPIRATION_TIME) {
        delete draftRooms[roomId]; // Delete expired rooms
      }
    });
  }, 60 * 1000); // Run cleanup every minute
};

module.exports = handleDraftEvents;
