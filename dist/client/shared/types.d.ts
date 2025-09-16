export type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
export type PieceColor = 'white' | 'black';
export type Square = string;
export type File = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h';
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export interface Piece {
    type: PieceType;
    color: PieceColor;
}
export interface Position {
    file: File;
    rank: Rank;
}
export interface Move {
    from: Square;
    to: Square;
    piece: Piece;
    capturedPiece?: Piece;
    promotion?: PieceType;
    castling?: 'kingside' | 'queenside';
    enPassant?: boolean;
    san: string;
    fen: string;
    timestamp: number;
}
export interface PreMove {
    from: Square;
    to: Square;
    promotion?: PieceType;
}
export interface GameState {
    board: (Piece | null)[][];
    currentPlayer: PieceColor;
    castlingRights: {
        whiteKingside: boolean;
        whiteQueenside: boolean;
        blackKingside: boolean;
        blackQueenside: boolean;
    };
    enPassantTarget: Square | null;
    halfmoveClock: number;
    fullmoveNumber: number;
    moves: Move[];
    isCheck: boolean;
    isCheckmate: boolean;
    isStalemate: boolean;
    isDraw: boolean;
    fen: string;
}
export interface GameSettings {
    timeControl?: {
        initialTime: number;
        increment: number;
    };
    allowPreMoves: boolean;
    showCoordinates: boolean;
    highlightLegalMoves: boolean;
    animationSpeed: number;
    soundEffects: boolean;
    theme: 'light' | 'dark' | 'system';
    boardTheme: string;
    pieceSet: string;
}
export interface Player {
    id: string;
    name: string;
    color: PieceColor;
    timeRemaining?: number;
    rating?: number;
    isBot?: boolean;
    difficulty?: number;
}
export interface GameInfo {
    id: string;
    players: {
        white: Player;
        black: Player;
    };
    gameMode: 'solo' | 'friend' | 'bot' | 'online';
    status: 'waiting' | 'active' | 'paused' | 'finished';
    result?: 'white-wins' | 'black-wins' | 'draw';
    startTime: number;
    endTime?: number;
    settings: GameSettings;
}
export interface GameOffer {
    type: 'draw' | 'resign' | 'abort' | 'undo' | 'rematch';
    from: string;
    to: string;
    timestamp: number;
}
export interface NotationEntry {
    moveNumber: number;
    white?: Move;
    black?: Move;
}
export type GameResult = 'white-wins' | 'black-wins' | 'draw' | '*';
export interface PGNHeader {
    Event?: string;
    Site?: string;
    Date?: string;
    Round?: string;
    White?: string;
    Black?: string;
    Result?: GameResult;
    WhiteElo?: string;
    BlackElo?: string;
    TimeControl?: string;
    ECO?: string;
    Opening?: string;
}
