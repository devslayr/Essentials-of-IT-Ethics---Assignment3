"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameRoom = void 0;
const ChessEngine_js_1 = require("../client/engine/ChessEngine.js");
class GameRoom {
    constructor(id, hostPlayer, settings) {
        this.players = new Map();
        this.spectators = new Map();
        this.status = 'waiting';
        this.chatHistory = [];
        this.id = id;
        this.settings = settings;
        this.engine = new ChessEngine_js_1.ChessEngine();
        this.createdAt = new Date();
        this.lastActivity = new Date();
        // Host gets white pieces
        hostPlayer.color = 'white';
        this.players.set(hostPlayer.id, hostPlayer);
    }
    addPlayer(player) {
        if (this.players.size >= 2) {
            return { success: false, message: 'Room is full' };
        }
        if (this.players.has(player.id)) {
            return { success: false, message: 'Player already in room' };
        }
        // Second player gets black pieces
        player.color = 'black';
        this.players.set(player.id, player);
        // Start the game if we have 2 players
        if (this.players.size === 2) {
            this.status = 'active';
        }
        this.updateActivity();
        return {
            success: true,
            playerColor: player.color
        };
    }
    removePlayer(playerId) {
        const player = this.players.get(playerId);
        if (!player) {
            return { success: false, wasInGame: false };
        }
        this.players.delete(playerId);
        this.updateActivity();
        // If a player leaves during an active game, end it
        if (this.status === 'active') {
            this.status = 'finished';
            return { success: true, wasInGame: true };
        }
        return { success: true, wasInGame: false };
    }
    getPlayer(playerId) {
        return this.players.get(playerId);
    }
    getPlayers() {
        return Array.from(this.players.values());
    }
    makeMove(playerId, move) {
        const player = this.players.get(playerId);
        if (!player) {
            return { success: false, message: 'Player not found' };
        }
        if (this.status !== 'active') {
            return { success: false, message: 'Game is not active' };
        }
        const gameState = this.engine.getGameState();
        if (gameState.currentPlayer !== player.color) {
            return { success: false, message: 'Not your turn' };
        }
        const executedMove = this.engine.makeMove(move.from, move.to, move.promotion);
        if (!executedMove) {
            return { success: false, message: 'Invalid move' };
        }
        // Clear any pending offers after a move
        this.drawOffer = undefined;
        this.undoRequest = undefined;
        const updatedGameState = this.engine.getGameState();
        this.updateActivity();
        // Check for game over
        if (this.engine.isGameOver()) {
            this.status = 'finished';
            const gameResult = this.engine.getGameResult();
            return {
                success: true,
                move: executedMove,
                gameState: updatedGameState,
                gameResult
            };
        }
        return {
            success: true,
            move: executedMove,
            gameState: updatedGameState
        };
    }
    offerDraw(playerId) {
        const player = this.players.get(playerId);
        if (!player) {
            return { success: false, message: 'Player not found' };
        }
        if (this.status !== 'active') {
            return { success: false, message: 'Game is not active' };
        }
        if (this.drawOffer && this.drawOffer.from === playerId) {
            return { success: false, message: 'Draw already offered' };
        }
        this.drawOffer = { from: playerId, timestamp: Date.now() };
        this.updateActivity();
        return { success: true, playerName: player.name };
    }
    respondToDrawOffer(playerId, accept) {
        if (!this.drawOffer) {
            return { success: false, message: 'No draw offer pending' };
        }
        if (this.drawOffer.from === playerId) {
            return { success: false, message: 'Cannot respond to your own offer' };
        }
        if (accept) {
            this.status = 'finished';
            this.drawOffer = undefined;
            this.updateActivity();
            return { success: true, gameResult: 'draw' };
        }
        else {
            this.drawOffer = undefined;
            this.updateActivity();
            return { success: true };
        }
    }
    resign(playerId) {
        const player = this.players.get(playerId);
        if (!player) {
            return { success: false, message: 'Player not found' };
        }
        if (this.status !== 'active') {
            return { success: false, message: 'Game is not active' };
        }
        this.status = 'finished';
        this.updateActivity();
        const gameResult = player.color === 'white' ? 'black-wins' : 'white-wins';
        return { success: true, gameResult };
    }
    requestUndo(playerId) {
        const player = this.players.get(playerId);
        if (!player) {
            return { success: false, message: 'Player not found' };
        }
        if (this.status !== 'active') {
            return { success: false, message: 'Game is not active' };
        }
        const gameState = this.engine.getGameState();
        if (gameState.moves.length === 0) {
            return { success: false, message: 'No moves to undo' };
        }
        if (this.undoRequest && this.undoRequest.from === playerId) {
            return { success: false, message: 'Undo already requested' };
        }
        this.undoRequest = { from: playerId, timestamp: Date.now() };
        this.updateActivity();
        return { success: true, playerName: player.name };
    }
    respondToUndoRequest(playerId, accept) {
        if (!this.undoRequest) {
            return { success: false, message: 'No undo request pending' };
        }
        if (this.undoRequest.from === playerId) {
            return { success: false, message: 'Cannot respond to your own request' };
        }
        if (accept) {
            const undoneMove = this.engine.undoMove();
            if (undoneMove) {
                this.undoRequest = undefined;
                this.updateActivity();
                return { success: true, gameState: this.engine.getGameState() };
            }
            else {
                return { success: false, message: 'Failed to undo move' };
            }
        }
        else {
            this.undoRequest = undefined;
            this.updateActivity();
            return { success: true };
        }
    }
    disconnectPlayer(playerId) {
        const player = this.players.get(playerId);
        if (player) {
            player.isConnected = false;
            this.updateActivity();
        }
    }
    reconnectPlayer(playerId, socket) {
        const player = this.players.get(playerId);
        if (!player) {
            return { success: false, message: 'Player not found in room' };
        }
        player.socket = socket;
        player.isConnected = true;
        this.updateActivity();
        return {
            success: true,
            playerColor: player.color,
            playerName: player.name
        };
    }
    addSpectator(spectatorId, socket) {
        if (!this.settings.allowSpectators) {
            return false;
        }
        this.spectators.set(spectatorId, socket);
        this.updateActivity();
        return true;
    }
    removeSpectator(spectatorId) {
        this.spectators.delete(spectatorId);
        this.updateActivity();
    }
    getGameState() {
        return this.engine.getGameState();
    }
    getStatus() {
        return this.status;
    }
    getSettings() {
        return this.settings;
    }
    isEmpty() {
        return this.players.size === 0;
    }
    isInactive(timeoutMinutes = 30) {
        const now = new Date();
        const diffMinutes = (now.getTime() - this.lastActivity.getTime()) / (1000 * 60);
        return diffMinutes > timeoutMinutes;
    }
    getPlayerCount() {
        return this.players.size;
    }
    getRoomInfo() {
        return {
            id: this.id,
            status: this.status,
            playerCount: this.players.size,
            maxPlayers: 2,
            isPrivate: this.settings.isPrivate,
            allowSpectators: this.settings.allowSpectators,
            timeControl: this.settings.timeControl,
            createdAt: this.createdAt,
            lastActivity: this.lastActivity,
            players: this.getPlayers().map(p => ({
                id: p.id,
                name: p.name,
                color: p.color,
                isConnected: p.isConnected
            }))
        };
    }
    updateActivity() {
        this.lastActivity = new Date();
    }
}
exports.GameRoom = GameRoom;
//# sourceMappingURL=GameRoom.js.map