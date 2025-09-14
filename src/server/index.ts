import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { GameRoom } from './GameRoom';
import { GameManager } from './GameManager';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:3000'],
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3001;
const gameManager = new GameManager();

// Serve static files
app.use(express.static(path.join(__dirname, '../client')));

// API routes
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/rooms', (req, res) => {
  const rooms = gameManager.getPublicRooms();
  res.json(rooms);
});

app.post('/api/rooms', (req, res) => {
  const { playerName, timeControl, isPrivate } = req.body;

  if (!playerName) {
    return res.status(400).json({ error: 'Player name is required' });
  }

  const room = gameManager.createRoom({
    hostName: playerName,
    timeControl,
    isPrivate: isPrivate || false
  });

  return res.json({ roomId: room.id });
});

// Catch-all handler: send back React's index.html file for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('join-room', (data) => {
    const { roomId, playerName } = data;

    try {
      const result = gameManager.joinRoom(roomId, {
        id: socket.id,
        name: playerName,
        socket
      });

      if (result.success) {
        socket.join(roomId);
        socket.emit('room-joined', {
          roomId,
          playerId: socket.id,
          playerColor: result.playerColor,
          gameState: result.gameState
        });

        // Notify other players in the room
        socket.to(roomId).emit('player-joined', {
          playerId: socket.id,
          playerName,
          playerColor: result.playerColor
        });

        console.log(`Player ${playerName} (${socket.id}) joined room ${roomId} as ${result.playerColor}`);
      } else {
        socket.emit('join-error', { message: result.message });
      }
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('join-error', { message: 'Failed to join room' });
    }
  });

  socket.on('make-move', (data) => {
    const { roomId, move } = data;

    try {
      const result = gameManager.makeMove(roomId, socket.id, move);

      if (result.success) {
        // Broadcast move to all players in the room
        io.to(roomId).emit('move-made', {
          move: result.move,
          gameState: result.gameState,
          playerId: socket.id
        });

        // Check for game over
        if (result.gameState.isCheckmate || result.gameState.isDraw) {
          io.to(roomId).emit('game-over', {
            result: result.gameResult,
            gameState: result.gameState
          });
        }
      } else {
        socket.emit('move-error', { message: result.message });
      }
    } catch (error) {
      console.error('Error making move:', error);
      socket.emit('move-error', { message: 'Failed to make move' });
    }
  });

  socket.on('offer-draw', (data) => {
    const { roomId } = data;

    try {
      const result = gameManager.offerDraw(roomId, socket.id);

      if (result.success) {
        socket.to(roomId).emit('draw-offered', {
          from: socket.id,
          fromName: result.playerName
        });
      } else {
        socket.emit('offer-error', { message: result.message });
      }
    } catch (error) {
      console.error('Error offering draw:', error);
      socket.emit('offer-error', { message: 'Failed to offer draw' });
    }
  });

  socket.on('respond-draw', (data) => {
    const { roomId, accept } = data;

    try {
      const result = gameManager.respondToDrawOffer(roomId, socket.id, accept);

      if (result.success) {
        if (accept) {
          io.to(roomId).emit('game-over', {
            result: 'draw',
            reason: 'Draw accepted'
          });
        } else {
          socket.to(roomId).emit('draw-declined', {
            from: socket.id
          });
        }
      } else {
        socket.emit('offer-error', { message: result.message });
      }
    } catch (error) {
      console.error('Error responding to draw:', error);
      socket.emit('offer-error', { message: 'Failed to respond to draw offer' });
    }
  });

  socket.on('resign', (data) => {
    const { roomId } = data;

    try {
      const result = gameManager.resign(roomId, socket.id);

      if (result.success) {
        io.to(roomId).emit('game-over', {
          result: result.gameResult,
          reason: 'Resignation',
          resignedPlayer: socket.id
        });
      } else {
        socket.emit('resign-error', { message: result.message });
      }
    } catch (error) {
      console.error('Error resigning:', error);
      socket.emit('resign-error', { message: 'Failed to resign' });
    }
  });

  socket.on('chat-message', (data) => {
    const { roomId, message } = data;

    try {
      const room = gameManager.getRoom(roomId);
      const player = room?.getPlayer(socket.id);

      if (room && player) {
        const chatMessage = {
          from: socket.id,
          fromName: player.name,
          message,
          timestamp: Date.now()
        };

        io.to(roomId).emit('chat-message', chatMessage);
      }
    } catch (error) {
      console.error('Error sending chat message:', error);
    }
  });

  socket.on('request-undo', (data) => {
    const { roomId } = data;

    try {
      const result = gameManager.requestUndo(roomId, socket.id);

      if (result.success) {
        socket.to(roomId).emit('undo-requested', {
          from: socket.id,
          fromName: result.playerName
        });
      } else {
        socket.emit('undo-error', { message: result.message });
      }
    } catch (error) {
      console.error('Error requesting undo:', error);
      socket.emit('undo-error', { message: 'Failed to request undo' });
    }
  });

  socket.on('respond-undo', (data) => {
    const { roomId, accept } = data;

    try {
      const result = gameManager.respondToUndoRequest(roomId, socket.id, accept);

      if (result.success) {
        if (accept) {
          io.to(roomId).emit('move-undone', {
            gameState: result.gameState
          });
        } else {
          socket.to(roomId).emit('undo-declined', {
            from: socket.id
          });
        }
      } else {
        socket.emit('undo-error', { message: result.message });
      }
    } catch (error) {
      console.error('Error responding to undo:', error);
      socket.emit('undo-error', { message: 'Failed to respond to undo request' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);

    try {
      const result = gameManager.handleDisconnection(socket.id);

      if (result.roomId) {
        socket.to(result.roomId).emit('player-disconnected', {
          playerId: socket.id,
          playerName: result.playerName
        });

        // Clean up empty rooms after a delay
        setTimeout(() => {
          gameManager.cleanupEmptyRooms();
        }, 30000); // 30 seconds
      }
    } catch (error) {
      console.error('Error handling disconnection:', error);
    }
  });

  socket.on('reconnect-to-room', (data) => {
    const { roomId, playerId } = data;

    try {
      const result = gameManager.reconnectPlayer(roomId, playerId, socket);

      if (result.success) {
        socket.join(roomId);
        socket.emit('reconnected', {
          roomId,
          gameState: result.gameState,
          playerColor: result.playerColor
        });

        socket.to(roomId).emit('player-reconnected', {
          playerId: socket.id,
          playerName: result.playerName
        });

        console.log(`Player reconnected to room ${roomId}`);
      } else {
        socket.emit('reconnect-error', { message: result.message });
      }
    } catch (error) {
      console.error('Error reconnecting:', error);
      socket.emit('reconnect-error', { message: 'Failed to reconnect' });
    }
  });
});

server.listen(PORT, () => {
  console.log(`Chess Platform server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
