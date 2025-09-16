"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameManager = void 0;
const GameRoom_js_1 = require("./GameRoom.js");
class GameManager {
    constructor() {
        this.rooms = new Map();
        this.playerRooms = new Map(); // playerId -> roomId
    }
    createRoom(options) {
        const roomId = this.generateRoomId();
        const settings = {
            timeControl: options.timeControl,
            isPrivate: options.isPrivate || false,
            allowSpectators: options.allowSpectators || true
        };
        // Create a temporary socket placeholder - will be replaced when player actually joins
        const hostPlayer = {
            id: '', // Will be set when they join
            name: options.hostName,
            color: 'white',
            socket: {}, // Placeholder
            isConnected: false
        };
        const room = new GameRoom_js_1.GameRoom(roomId, hostPlayer, settings);
        this.rooms.set(roomId, room);
        console.log(`Created room ${roomId} for host ${options.hostName}`);
        return room;
    }
    joinRoom(roomId, player) {
        const room = this.rooms.get(roomId);
        if (!room) {
            return { success: false, message: 'Room not found' };
        }
        // Check if this is the host joining for the first time
        const existingPlayers = room.getPlayers();
        if (existingPlayers.length === 1 && existingPlayers[0].id === '') {
            // Replace the placeholder host
            const hostPlayer = existingPlayers[0];
            hostPlayer.id = player.id;
            hostPlayer.socket = player.socket;
            hostPlayer.isConnected = true;
            this.playerRooms.set(player.id, roomId);
            return {
                success: true,
                playerColor: 'white',
                gameState: room.getGameState()
            };
        }
        const newPlayer = {
            id: player.id,
            name: player.name,
            color: 'black', // Will be set by room
            socket: player.socket,
            isConnected: true
        };
        const result = room.addPlayer(newPlayer);
        if (result.success) {
            this.playerRooms.set(player.id, roomId);
            return {
                success: true,
                playerColor: result.playerColor,
                gameState: room.getGameState()
            };
        }
        return result;
    }
    leaveRoom(playerId) {
        const roomId = this.playerRooms.get(playerId);
        if (!roomId) {
            return { success: false };
        }
        const room = this.rooms.get(roomId);
        if (room) {
            room.removePlayer(playerId);
            this.playerRooms.delete(playerId);
            // Remove room if empty
            if (room.isEmpty()) {
                this.rooms.delete(roomId);
            }
        }
        return { success: true, roomId };
    }
    makeMove(roomId, playerId, move) {
        const room = this.rooms.get(roomId);
        if (!room) {
            return { success: false, message: 'Room not found' };
        }
        return room.makeMove(playerId, move);
    }
    offerDraw(roomId, playerId) {
        const room = this.rooms.get(roomId);
        if (!room) {
            return { success: false, message: 'Room not found' };
        }
        return room.offerDraw(playerId);
    }
    respondToDrawOffer(roomId, playerId, accept) {
        const room = this.rooms.get(roomId);
        if (!room) {
            return { success: false, message: 'Room not found' };
        }
        return room.respondToDrawOffer(playerId, accept);
    }
    resign(roomId, playerId) {
        const room = this.rooms.get(roomId);
        if (!room) {
            return { success: false, message: 'Room not found' };
        }
        return room.resign(playerId);
    }
    requestUndo(roomId, playerId) {
        const room = this.rooms.get(roomId);
        if (!room) {
            return { success: false, message: 'Room not found' };
        }
        return room.requestUndo(playerId);
    }
    respondToUndoRequest(roomId, playerId, accept) {
        const room = this.rooms.get(roomId);
        if (!room) {
            return { success: false, message: 'Room not found' };
        }
        return room.respondToUndoRequest(playerId, accept);
    }
    handleDisconnection(playerId) {
        const roomId = this.playerRooms.get(playerId);
        if (!roomId) {
            return {};
        }
        const room = this.rooms.get(roomId);
        if (room) {
            const player = room.getPlayer(playerId);
            room.disconnectPlayer(playerId);
            return {
                roomId,
                playerName: player?.name
            };
        }
        return {};
    }
    reconnectPlayer(roomId, playerId, socket) {
        const room = this.rooms.get(roomId);
        if (!room) {
            return { success: false, message: 'Room not found' };
        }
        const result = room.reconnectPlayer(playerId, socket);
        if (result.success) {
            this.playerRooms.set(playerId, roomId);
            return {
                ...result,
                gameState: room.getGameState()
            };
        }
        return result;
    }
    getRoom(roomId) {
        return this.rooms.get(roomId);
    }
    getPublicRooms() {
        return Array.from(this.rooms.values())
            .filter(room => !room.getSettings().isPrivate)
            .map(room => room.getRoomInfo());
    }
    cleanupEmptyRooms() {
        const roomsToDelete = [];
        for (const [roomId, room] of this.rooms) {
            if (room.isEmpty() || room.isInactive()) {
                roomsToDelete.push(roomId);
                // Clean up player room mappings
                for (const [playerId, mappedRoomId] of this.playerRooms) {
                    if (mappedRoomId === roomId) {
                        this.playerRooms.delete(playerId);
                    }
                }
            }
        }
        roomsToDelete.forEach(roomId => {
            this.rooms.delete(roomId);
            console.log(`Cleaned up room ${roomId}`);
        });
    }
    getRoomCount() {
        return this.rooms.size;
    }
    getActiveGames() {
        return Array.from(this.rooms.values())
            .filter(room => room.getStatus() === 'active')
            .length;
    }
    getStats() {
        return {
            totalRooms: this.rooms.size,
            activeGames: this.getActiveGames(),
            totalPlayers: this.playerRooms.size,
            publicRooms: this.getPublicRooms().length
        };
    }
    generateRoomId() {
        let roomId;
        do {
            roomId = this.generateShortId();
        } while (this.rooms.has(roomId));
        return roomId;
    }
    generateShortId() {
        // Generate a short, readable room ID (6 characters)
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
}
exports.GameManager = GameManager;
//# sourceMappingURL=GameManager.js.map