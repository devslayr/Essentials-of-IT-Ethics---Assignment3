import { Socket } from 'socket.io';
import { GameRoom, Player, RoomSettings } from './GameRoom';
import { v4 as uuidv4 } from 'uuid';

export interface CreateRoomOptions {
  hostName: string;
  timeControl?: {
    initialTime: number;
    increment: number;
  };
  isPrivate?: boolean;
  allowSpectators?: boolean;
}

export class GameManager {
  private rooms: Map<string, GameRoom> = new Map();
  private playerRooms: Map<string, string> = new Map(); // playerId -> roomId

  public createRoom(options: CreateRoomOptions): GameRoom {
    const roomId = this.generateRoomId();
    const settings: RoomSettings = {
      timeControl: options.timeControl,
      isPrivate: options.isPrivate || false,
      allowSpectators: options.allowSpectators || true
    };

    // Create a temporary socket placeholder - will be replaced when player actually joins
    const hostPlayer: Player = {
      id: '', // Will be set when they join
      name: options.hostName,
      color: 'white',
      socket: {} as Socket, // Placeholder
      isConnected: false
    };

    const room = new GameRoom(roomId, hostPlayer, settings);
    this.rooms.set(roomId, room);

    console.log(`Created room ${roomId} for host ${options.hostName}`);
    return room;
  }

  public joinRoom(roomId: string, player: { id: string; name: string; socket: Socket }): { success: boolean; message?: string; playerColor?: string; gameState?: any } {

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

    const newPlayer: Player = {
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

  public leaveRoom(playerId: string): { success: boolean; roomId?: string } {
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

  public makeMove(roomId: string, playerId: string, move: { from: string; to: string; promotion?: string }): any {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, message: 'Room not found' };
    }

    return room.makeMove(playerId, move);
  }

  public offerDraw(roomId: string, playerId: string): any {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, message: 'Room not found' };
    }

    return room.offerDraw(playerId);
  }

  public respondToDrawOffer(roomId: string, playerId: string, accept: boolean): any {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, message: 'Room not found' };
    }

    return room.respondToDrawOffer(playerId, accept);
  }

  public resign(roomId: string, playerId: string): any {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, message: 'Room not found' };
    }

    return room.resign(playerId);
  }

  public requestUndo(roomId: string, playerId: string): any {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, message: 'Room not found' };
    }

    return room.requestUndo(playerId);
  }

  public respondToUndoRequest(roomId: string, playerId: string, accept: boolean): any {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, message: 'Room not found' };
    }

    return room.respondToUndoRequest(playerId, accept);
  }

  public handleDisconnection(playerId: string): { roomId?: string; playerName?: string } {
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

  public reconnectPlayer(roomId: string, playerId: string, socket: Socket): any {
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

  public getRoom(roomId: string): GameRoom | undefined {
    return this.rooms.get(roomId);
  }

  public getPublicRooms(): any[] {
    return Array.from(this.rooms.values())
      .filter(room => !room.getSettings().isPrivate)
      .map(room => room.getRoomInfo());
  }

  public cleanupEmptyRooms(): void {
    const roomsToDelete: string[] = [];

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

  public getRoomCount(): number {
    return this.rooms.size;
  }

  public getActiveGames(): number {
    return Array.from(this.rooms.values())
      .filter(room => room.getStatus() === 'active')
      .length;
  }

  public getStats(): any {
    return {
      totalRooms: this.rooms.size,
      activeGames: this.getActiveGames(),
      totalPlayers: this.playerRooms.size,
      publicRooms: this.getPublicRooms().length
    };
  }

  private generateRoomId(): string {
    let roomId: string;
    do {
      roomId = this.generateShortId();
    } while (this.rooms.has(roomId));

    return roomId;
  }

  private generateShortId(): string {
    // Generate a short, readable room ID (6 characters)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
