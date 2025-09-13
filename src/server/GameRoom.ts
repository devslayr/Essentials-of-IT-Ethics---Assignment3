import { Socket } from 'socket.io';
import { ChessEngine } from '../client/engine/ChessEngine.js';
import { GameSettings, PieceColor, Move, GameResult } from '../shared/types.js';

export interface Player {
  id: string;
  name: string;
  color: PieceColor;
  socket: Socket;
  isConnected: boolean;
  timeRemaining?: number;
}

export interface RoomSettings {
  timeControl?: {
    initialTime: number;
    increment: number;
  };
  isPrivate: boolean;
  allowSpectators: boolean;
}

export class GameRoom {
  public id: string;
  private players: Map<string, Player> = new Map();
  private spectators: Map<string, Socket> = new Map();
  private engine: ChessEngine;
  private settings: RoomSettings;
  private status: 'waiting' | 'active' | 'finished' = 'waiting';
  private createdAt: Date;
  private lastActivity: Date;
  private drawOffer?: { from: string; timestamp: number };
  private undoRequest?: { from: string; timestamp: number };
  private chatHistory: Array<{ from: string; message: string; timestamp: number }> = [];

  constructor(id: string, hostPlayer: Player, settings: RoomSettings) {
    this.id = id;
    this.settings = settings;
    this.engine = new ChessEngine();
    this.createdAt = new Date();
    this.lastActivity = new Date();

    // Host gets white pieces
    hostPlayer.color = 'white';
    this.players.set(hostPlayer.id, hostPlayer);
  }

  public addPlayer(player: Player): { success: boolean; message?: string; playerColor?: PieceColor } {
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

  public removePlayer(playerId: string): { success: boolean; wasInGame: boolean } {
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

  public getPlayer(playerId: string): Player | undefined {
    return this.players.get(playerId);
  }

  public getPlayers(): Player[] {
    return Array.from(this.players.values());
  }

  public makeMove(playerId: string, move: { from: string; to: string; promotion?: string }): { success: boolean; message?: string; move?: Move; gameState?: any; gameResult?: GameResult } {

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

    const executedMove = this.engine.makeMove(move.from, move.to, move.promotion as any);
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

  public offerDraw(playerId: string): { success: boolean; message?: string; playerName?: string } {
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

  public respondToDrawOffer(playerId: string, accept: boolean): { success: boolean; message?: string; gameResult?: GameResult } {

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
    } else {
      this.drawOffer = undefined;
      this.updateActivity();
      return { success: true };
    }
  }

  public resign(playerId: string): { success: boolean; message?: string; gameResult?: GameResult } {
    const player = this.players.get(playerId);
    if (!player) {
      return { success: false, message: 'Player not found' };
    }

    if (this.status !== 'active') {
      return { success: false, message: 'Game is not active' };
    }

    this.status = 'finished';
    this.updateActivity();

    const gameResult: GameResult = player.color === 'white' ? 'black-wins' : 'white-wins';
    return { success: true, gameResult };
  }

  public requestUndo(playerId: string): { success: boolean; message?: string; playerName?: string } {
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

  public respondToUndoRequest(playerId: string, accept: boolean): { success: boolean; message?: string; gameState?: any } {

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
      } else {
        return { success: false, message: 'Failed to undo move' };
      }
    } else {
      this.undoRequest = undefined;
      this.updateActivity();
      return { success: true };
    }
  }

  public disconnectPlayer(playerId: string): void {
    const player = this.players.get(playerId);
    if (player) {
      player.isConnected = false;
      this.updateActivity();
    }
  }

  public reconnectPlayer(playerId: string, socket: Socket): { success: boolean; message?: string; playerColor?: PieceColor; playerName?: string } {

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

  public addSpectator(spectatorId: string, socket: Socket): boolean {
    if (!this.settings.allowSpectators) {
      return false;
    }

    this.spectators.set(spectatorId, socket);
    this.updateActivity();
    return true;
  }

  public removeSpectator(spectatorId: string): void {
    this.spectators.delete(spectatorId);
    this.updateActivity();
  }

  public getGameState(): any {
    return this.engine.getGameState();
  }

  public getStatus(): string {
    return this.status;
  }

  public getSettings(): RoomSettings {
    return this.settings;
  }

  public isEmpty(): boolean {
    return this.players.size === 0;
  }

  public isInactive(timeoutMinutes: number = 30): boolean {
    const now = new Date();
    const diffMinutes = (now.getTime() - this.lastActivity.getTime()) / (1000 * 60);
    return diffMinutes > timeoutMinutes;
  }

  public getPlayerCount(): number {
    return this.players.size;
  }

  public getRoomInfo(): any {
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

  private updateActivity(): void {
    this.lastActivity = new Date();
  }
}
