import { Piece, PieceType, PieceColor, Square, Position, Move, GameState } from '../../shared/types';
import { ChessUtils } from '../../shared/utils';

export class ChessEngine {
  private gameState: GameState;

  constructor(fen?: string) {
    this.gameState = this.initializeGame(fen);
  }

  private initializeGame(fen?: string): GameState {
    const standardFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const fenToUse = fen || standardFen;

    return {
      board: this.fenToBoard(fenToUse),
      currentPlayer: this.fenToCurrentPlayer(fenToUse),
      castlingRights: this.fenToCastlingRights(fenToUse),
      enPassantTarget: this.fenToEnPassantTarget(fenToUse),
      halfmoveClock: this.fenToHalfmoveClock(fenToUse),
      fullmoveNumber: this.fenToFullmoveNumber(fenToUse),
      moves: [],
      isCheck: false,
      isCheckmate: false,
      isStalemate: false,
      isDraw: false,
      fen: fenToUse
    };
  }

  private fenToBoard(fen: string): (Piece | null)[][] {
    const board: (Piece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));
    const rows = fen.split(' ')[0].split('/');

    for (let row = 0; row < 8; row++) {
      let col = 0;
      for (const char of rows[row]) {
        if (char >= '1' && char <= '8') {
          col += parseInt(char);
        } else {
          board[row][col] = this.charToPiece(char);
          col++;
        }
      }
    }

    return board;
  }

  private charToPiece(char: string): Piece {
    const color: PieceColor = char === char.toLowerCase() ? 'black' : 'white';
    const type = this.charToPieceType(char.toLowerCase());
    return { type, color };
  }

  private charToPieceType(char: string): PieceType {
    const mapping: { [key: string]: PieceType } = {
      'k': 'king', 'q': 'queen', 'r': 'rook',
      'b': 'bishop', 'n': 'knight', 'p': 'pawn'
    };
    return mapping[char];
  }

  private pieceToChar(piece: Piece): string {
    const mapping: { [key in PieceType]: string } = {
      'king': 'k', 'queen': 'q', 'rook': 'r',
      'bishop': 'b', 'knight': 'n', 'pawn': 'p'
    };
    const char = mapping[piece.type];
    return piece.color === 'white' ? char.toUpperCase() : char;
  }

  private fenToCurrentPlayer(fen: string): PieceColor {
    return fen.split(' ')[1] === 'w' ? 'white' : 'black';
  }

  private fenToCastlingRights(fen: string) {
    const castling = fen.split(' ')[2];
    return {
      whiteKingside: castling.includes('K'),
      whiteQueenside: castling.includes('Q'),
      blackKingside: castling.includes('k'),
      blackQueenside: castling.includes('q')
    };
  }

  private fenToEnPassantTarget(fen: string): Square | null {
    const enPassant = fen.split(' ')[3];
    return enPassant === '-' ? null : enPassant;
  }

  private fenToHalfmoveClock(fen: string): number {
    return parseInt(fen.split(' ')[4]);
  }

  private fenToFullmoveNumber(fen: string): number {
    return parseInt(fen.split(' ')[5]);
  }

  public getGameState(): GameState {
    return { ...this.gameState };
  }

  public getPiece(square: Square): Piece | null {
    const { row, col } = ChessUtils.squareToIndex(square);
    return this.gameState.board[row][col];
  }

  public makeMove(from: Square, to: Square, promotion?: PieceType): Move | null {
    if (!this.isValidMove(from, to, promotion)) {
      return null;
    }

    const piece = this.getPiece(from)!;
    const capturedPiece = this.getPiece(to);

    // Store the FEN BEFORE making the move for undo purposes
    const fenBeforeMove = this.calculateFEN();

    // Create move object
    const move: Move = {
      from,
      to,
      piece,
      capturedPiece: capturedPiece || undefined,
      promotion,
      timestamp: Date.now(),
      san: '', // Will be calculated
      fen: fenBeforeMove // Store position BEFORE the move
    };

    // Execute the move
    this.executeMove(move);

    // Calculate SAN
    move.san = this.calculateSAN(move);

    // Update game state
    this.gameState.moves.push(move);
    this.gameState.fen = this.calculateFEN(); // Update current game FEN
    this.gameState.currentPlayer = this.gameState.currentPlayer === 'white' ? 'black' : 'white';

    // Update game status
    this.updateGameStatus();

    return move;
  }

  private executeMove(move: Move): void {
    const { from, to, piece, promotion } = move;
    const { row: fromRow, col: fromCol } = ChessUtils.squareToIndex(from);
    const { row: toRow, col: toCol } = ChessUtils.squareToIndex(to);

    // Handle special moves
    if (piece.type === 'king' && Math.abs(fromCol - toCol) === 2) {
      // Castling
      this.executeCastling(move);
      return;
    }

    if (piece.type === 'pawn' && to === this.gameState.enPassantTarget) {
      // En passant
      this.executeEnPassant(move);
      return;
    }

    // Regular move
    this.gameState.board[fromRow][fromCol] = null;
    this.gameState.board[toRow][toCol] = promotion
      ? { type: promotion, color: piece.color }
      : piece;

    // Update castling rights
    this.updateCastlingRights(move);

    // Update en passant target
    this.updateEnPassantTarget(move);

    // Update clocks
    this.updateClocks(move);
  }

  private executeCastling(move: Move): void {
    const { from, to, piece } = move;
    const { row: fromRow, col: fromCol } = ChessUtils.squareToIndex(from);
    const { row: toRow, col: toCol } = ChessUtils.squareToIndex(to);

    // Move king
    this.gameState.board[fromRow][fromCol] = null;
    this.gameState.board[toRow][toCol] = piece;

    // Move rook
    if (toCol > fromCol) { // Kingside
      this.gameState.board[toRow][7] = null;
      this.gameState.board[toRow][5] = { type: 'rook', color: piece.color };
      move.castling = 'kingside';
    } else { // Queenside
      this.gameState.board[toRow][0] = null;
      this.gameState.board[toRow][3] = { type: 'rook', color: piece.color };
      move.castling = 'queenside';
    }

    // Remove castling rights
    if (piece.color === 'white') {
      this.gameState.castlingRights.whiteKingside = false;
      this.gameState.castlingRights.whiteQueenside = false;
    } else {
      this.gameState.castlingRights.blackKingside = false;
      this.gameState.castlingRights.blackQueenside = false;
    }
  }

  private executeEnPassant(move: Move): void {
    const { from, to, piece } = move;
    const { row: fromRow, col: fromCol } = ChessUtils.squareToIndex(from);
    const { row: toRow, col: toCol } = ChessUtils.squareToIndex(to);

    // Move pawn
    this.gameState.board[fromRow][fromCol] = null;
    this.gameState.board[toRow][toCol] = piece;

    // Remove captured pawn
    const capturedRow = piece.color === 'white' ? toRow + 1 : toRow - 1;
    this.gameState.board[capturedRow][toCol] = null;

    move.enPassant = true;
  }

  private updateCastlingRights(move: Move): void {
    const { from, piece } = move;

    // King moves
    if (piece.type === 'king') {
      if (piece.color === 'white') {
        this.gameState.castlingRights.whiteKingside = false;
        this.gameState.castlingRights.whiteQueenside = false;
      } else {
        this.gameState.castlingRights.blackKingside = false;
        this.gameState.castlingRights.blackQueenside = false;
      }
    }

    // Rook moves
    if (piece.type === 'rook') {
      if (from === 'a1') this.gameState.castlingRights.whiteQueenside = false;
      if (from === 'h1') this.gameState.castlingRights.whiteKingside = false;
      if (from === 'a8') this.gameState.castlingRights.blackQueenside = false;
      if (from === 'h8') this.gameState.castlingRights.blackKingside = false;
    }
  }

  private updateEnPassantTarget(move: Move): void {
    const { from, to, piece } = move;

    if (piece.type === 'pawn') {
      const fromPos = ChessUtils.squareToPosition(from);
      const toPos = ChessUtils.squareToPosition(to);

      if (Math.abs(toPos.rank - fromPos.rank) === 2) {
        const enPassantRank = (fromPos.rank + toPos.rank) / 2 as any;
        this.gameState.enPassantTarget = ChessUtils.positionToSquare({
          file: fromPos.file,
          rank: enPassantRank
        });
        return;
      }
    }

    this.gameState.enPassantTarget = null;
  }

  private updateClocks(move: Move): void {
    if (move.piece.type === 'pawn' || move.capturedPiece) {
      this.gameState.halfmoveClock = 0;
    } else {
      this.gameState.halfmoveClock++;
    }

    if (this.gameState.currentPlayer === 'black') {
      this.gameState.fullmoveNumber++;
    }
  }

  public isValidMove(from: Square, to: Square, promotion?: PieceType): boolean {
    const piece = this.getPiece(from);
    if (!piece) return false;
    if (piece.color !== this.gameState.currentPlayer) return false;

    const legalMoves = this.getLegalMoves(from);
    return legalMoves.some(move => move.to === to && move.promotion === promotion);
  }

  public getLegalMoves(square: Square): Array<{ to: Square, promotion?: PieceType }> {
    const piece = this.getPiece(square);
    if (!piece || piece.color !== this.gameState.currentPlayer) {
      return [];
    }

    const pseudoLegalMoves = this.getPseudoLegalMoves(square);
    return pseudoLegalMoves.filter(move => !this.wouldBeInCheck(square, move.to, move.promotion));
  }

  public getCurrentPlayer(): PieceColor {
    return this.gameState.currentPlayer;
  }

  public getFen(): string {
    // Convert board to FEN notation
    let fen = '';
    
    // Board position
    for (let row = 0; row < 8; row++) {
      let emptyCount = 0;
      for (let col = 0; col < 8; col++) {
        const piece = this.gameState.board[row][col];
        if (piece) {
          if (emptyCount > 0) {
            fen += emptyCount;
            emptyCount = 0;
          }
          fen += this.pieceToChar(piece);
        } else {
          emptyCount++;
        }
      }
      if (emptyCount > 0) {
        fen += emptyCount;
      }
      if (row < 7) {
        fen += '/';
      }
    }
    
    // Active color
    fen += ` ${this.gameState.currentPlayer === 'white' ? 'w' : 'b'}`;
    
    // Castling availability
    let castling = '';
    if (this.gameState.castlingRights.whiteKingside) castling += 'K';
    if (this.gameState.castlingRights.whiteQueenside) castling += 'Q';
    if (this.gameState.castlingRights.blackKingside) castling += 'k';
    if (this.gameState.castlingRights.blackQueenside) castling += 'q';
    fen += ` ${castling || '-'}`;
    
    // En passant target square
    fen += ` ${this.gameState.enPassantTarget || '-'}`;
    
    // Halfmove clock and fullmove number
    fen += ` ${this.gameState.halfmoveClock} ${this.gameState.fullmoveNumber}`;
    
    return fen;
  }

  private getPseudoLegalMoves(square: Square): Array<{ to: Square, promotion?: PieceType }> {
    const piece = this.getPiece(square);
    if (!piece) return [];

    switch (piece.type) {
      case 'pawn': return this.getPawnMoves(square);
      case 'rook': return this.getRookMoves(square);
      case 'bishop': return this.getBishopMoves(square);
      case 'queen': return this.getQueenMoves(square);
      case 'knight': return this.getKnightMoves(square);
      case 'king': return this.getKingMoves(square);
      default: return [];
    }
  }

  private getPawnMoves(square: Square): Array<{ to: Square, promotion?: PieceType }> {
    const moves: Array<{ to: Square, promotion?: PieceType }> = [];
    const piece = this.getPiece(square)!;
    const position = ChessUtils.squareToPosition(square);
    const direction = piece.color === 'white' ? 1 : -1;
    const startRank = piece.color === 'white' ? 2 : 7;
    const promotionRank = piece.color === 'white' ? 8 : 1;

    // Forward moves
    const oneSquareForward = ChessUtils.positionToSquare({
      file: position.file,
      rank: (position.rank + direction) as any
    });

    if (ChessUtils.isValidSquare(oneSquareForward) && !this.getPiece(oneSquareForward)) {
      if (position.rank + direction === promotionRank) {
        // Promotion
        ['queen', 'rook', 'bishop', 'knight'].forEach(promotion => {
          moves.push({ to: oneSquareForward, promotion: promotion as PieceType });
        });
      } else {
        moves.push({ to: oneSquareForward });
      }

      // Two squares forward from start position
      if (position.rank === startRank) {
        const twoSquaresForward = ChessUtils.positionToSquare({
          file: position.file,
          rank: (position.rank + 2 * direction) as any
        });

        if (!this.getPiece(twoSquaresForward)) {
          moves.push({ to: twoSquaresForward });
        }
      }
    }

    // Captures
    const files = ChessUtils.files;
    const fileIndex = files.indexOf(position.file);

    [-1, 1].forEach(fileOffset => {
      const targetFileIndex = fileIndex + fileOffset;
      if (targetFileIndex >= 0 && targetFileIndex < 8) {
        const targetSquare = ChessUtils.positionToSquare({
          file: files[targetFileIndex],
          rank: (position.rank + direction) as any
        });

        if (ChessUtils.isValidSquare(targetSquare)) {
          const targetPiece = this.getPiece(targetSquare);

          // Regular capture
          if (targetPiece && targetPiece.color !== piece.color) {
            if (position.rank + direction === promotionRank) {
              ['queen', 'rook', 'bishop', 'knight'].forEach(promotion => {
                moves.push({ to: targetSquare, promotion: promotion as PieceType });
              });
            } else {
              moves.push({ to: targetSquare });
            }
          }

          // En passant
          if (targetSquare === this.gameState.enPassantTarget) {
            moves.push({ to: targetSquare });
          }
        }
      }
    });

    return moves;
  }

  private getRookMoves(square: Square): Array<{ to: Square }> {
    return this.getSlidingMoves(square, [
      [0, 1], [0, -1], [1, 0], [-1, 0]
    ]);
  }

  private getBishopMoves(square: Square): Array<{ to: Square }> {
    return this.getSlidingMoves(square, [
      [1, 1], [1, -1], [-1, 1], [-1, -1]
    ]);
  }

  private getQueenMoves(square: Square): Array<{ to: Square }> {
    return this.getSlidingMoves(square, [
      [0, 1], [0, -1], [1, 0], [-1, 0],
      [1, 1], [1, -1], [-1, 1], [-1, -1]
    ]);
  }

  private getSlidingMoves(square: Square, directions: number[][]): Array<{ to: Square }> {
    const moves: Array<{ to: Square }> = [];
    const piece = this.getPiece(square)!;
    const { row, col } = ChessUtils.squareToIndex(square);

    directions.forEach(([deltaRow, deltaCol]) => {
      for (let i = 1; i < 8; i++) {
        const newRow = row + i * deltaRow;
        const newCol = col + i * deltaCol;

        if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8) break;

        const targetSquare = ChessUtils.indexToSquare(newRow, newCol);
        const targetPiece = this.getPiece(targetSquare);

        if (!targetPiece) {
          moves.push({ to: targetSquare });
        } else {
          if (targetPiece.color !== piece.color) {
            moves.push({ to: targetSquare });
          }
          break;
        }
      }
    });

    return moves;
  }

  private getKnightMoves(square: Square): Array<{ to: Square }> {
    const moves: Array<{ to: Square }> = [];
    const piece = this.getPiece(square)!;
    const { row, col } = ChessUtils.squareToIndex(square);

    const knightMoves = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1]
    ];

    knightMoves.forEach(([deltaRow, deltaCol]) => {
      const newRow = row + deltaRow;
      const newCol = col + deltaCol;

      if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        const targetSquare = ChessUtils.indexToSquare(newRow, newCol);
        const targetPiece = this.getPiece(targetSquare);

        if (!targetPiece || targetPiece.color !== piece.color) {
          moves.push({ to: targetSquare });
        }
      }
    });

    return moves;
  }

  private getKingMoves(square: Square): Array<{ to: Square }> {
    const moves: Array<{ to: Square }> = [];
    const piece = this.getPiece(square)!;
    const { row, col } = ChessUtils.squareToIndex(square);

    // Regular king moves
    const kingMoves = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1], [0, 1],
      [1, -1], [1, 0], [1, 1]
    ];

    kingMoves.forEach(([deltaRow, deltaCol]) => {
      const newRow = row + deltaRow;
      const newCol = col + deltaCol;

      if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        const targetSquare = ChessUtils.indexToSquare(newRow, newCol);
        const targetPiece = this.getPiece(targetSquare);

        if (!targetPiece || targetPiece.color !== piece.color) {
          moves.push({ to: targetSquare });
        }
      }
    });

    // Castling
    if (!this.isInCheck(piece.color)) {
      // Kingside castling
      if (this.canCastleKingside(piece.color)) {
        const targetSquare = piece.color === 'white' ? 'g1' : 'g8';
        moves.push({ to: targetSquare });
      }

      // Queenside castling
      if (this.canCastleQueenside(piece.color)) {
        const targetSquare = piece.color === 'white' ? 'c1' : 'c8';
        moves.push({ to: targetSquare });
      }
    }

    return moves;
  }

  private canCastleKingside(color: PieceColor): boolean {
    const rights = this.gameState.castlingRights;
    const canCastle = color === 'white' ? rights.whiteKingside : rights.blackKingside;

    if (!canCastle) return false;

    const rank = color === 'white' ? '1' : '8';
    const squares = [`f${rank}`, `g${rank}`];

    // Check if squares are empty
    if (squares.some(square => this.getPiece(square))) return false;

    // Check if king would pass through or end up in check
    return !squares.some(square => this.isSquareAttacked(square, color === 'white' ? 'black' : 'white'));
  }

  private canCastleQueenside(color: PieceColor): boolean {
    const rights = this.gameState.castlingRights;
    const canCastle = color === 'white' ? rights.whiteQueenside : rights.blackQueenside;

    if (!canCastle) return false;

    const rank = color === 'white' ? '1' : '8';
    const squares = [`b${rank}`, `c${rank}`, `d${rank}`];

    // Check if squares are empty
    if (squares.some(square => this.getPiece(square))) return false;

    // Check if king would pass through or end up in check (only c and d matter for check)
    const checkSquares = [`c${rank}`, `d${rank}`];
    return !checkSquares.some(square => this.isSquareAttacked(square, color === 'white' ? 'black' : 'white'));
  }

  private wouldBeInCheck(from: Square, to: Square, promotion?: PieceType): boolean {
    // Make a temporary move and check if it results in check
    const originalPiece = this.getPiece(from);
    const originalTarget = this.getPiece(to);
    const originalEnPassant = this.gameState.enPassantTarget;

    if (!originalPiece) return true;

    // Make the move temporarily
    const { row: fromRow, col: fromCol } = ChessUtils.squareToIndex(from);
    const { row: toRow, col: toCol } = ChessUtils.squareToIndex(to);

    this.gameState.board[fromRow][fromCol] = null;
    this.gameState.board[toRow][toCol] = promotion
      ? { type: promotion, color: originalPiece.color }
      : originalPiece;

    // Handle en passant capture
    let enPassantCaptured: Piece | null = null;
    if (originalPiece.type === 'pawn' && to === originalEnPassant) {
      const captureRow = originalPiece.color === 'white' ? toRow + 1 : toRow - 1;
      enPassantCaptured = this.gameState.board[captureRow][toCol];
      this.gameState.board[captureRow][toCol] = null;
    }

    const inCheck = this.isInCheck(originalPiece.color);

    // Restore the position
    this.gameState.board[fromRow][fromCol] = originalPiece;
    this.gameState.board[toRow][toCol] = originalTarget;

    if (enPassantCaptured) {
      const captureRow = originalPiece.color === 'white' ? toRow + 1 : toRow - 1;
      this.gameState.board[captureRow][toCol] = enPassantCaptured;
    }

    return inCheck;
  }

  public isInCheck(color: PieceColor): boolean {
    const kingSquare = this.findKing(color);
    if (!kingSquare) return false;

    return this.isSquareAttacked(kingSquare, color === 'white' ? 'black' : 'white');
  }

  private findKing(color: PieceColor): Square | null {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.gameState.board[row][col];
        if (piece && piece.type === 'king' && piece.color === color) {
          return ChessUtils.indexToSquare(row, col);
        }
      }
    }
    return null;
  }

  private isSquareAttacked(square: Square, byColor: PieceColor): boolean {
    // Check if any piece of the given color can attack the square
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.gameState.board[row][col];
        if (piece && piece.color === byColor) {
          const fromSquare = ChessUtils.indexToSquare(row, col);
          if (this.canPieceAttackSquare(fromSquare, square)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  private canPieceAttackSquare(from: Square, to: Square): boolean {
    const piece = this.getPiece(from);
    if (!piece) return false;

    const fromPos = ChessUtils.squareToPosition(from);
    const toPos = ChessUtils.squareToPosition(to);
    const { dx, dy } = ChessUtils.getDistance(fromPos, toPos);

    switch (piece.type) {
      case 'pawn':
        const direction = piece.color === 'white' ? 1 : -1;
        return dy === direction && Math.abs(dx) === 1;

      case 'rook':
        return (dx === 0 || dy === 0) && this.isPathClear(from, to);

      case 'bishop':
        return Math.abs(dx) === Math.abs(dy) && this.isPathClear(from, to);

      case 'queen':
        return (dx === 0 || dy === 0 || Math.abs(dx) === Math.abs(dy)) && this.isPathClear(from, to);

      case 'knight':
        return (Math.abs(dx) === 2 && Math.abs(dy) === 1) || (Math.abs(dx) === 1 && Math.abs(dy) === 2);

      case 'king':
        return Math.abs(dx) <= 1 && Math.abs(dy) <= 1;

      default:
        return false;
    }
  }

  private isPathClear(from: Square, to: Square): boolean {
    const squaresBetween = ChessUtils.getSquaresBetween(from, to);
    return squaresBetween.every((square: Square) => !this.getPiece(square));
  }

  private updateGameStatus(): void {
    const currentColor = this.gameState.currentPlayer;
    const inCheck = this.isInCheck(currentColor);
    const hasLegalMoves = this.hasLegalMoves(currentColor);

    this.gameState.isCheck = inCheck;
    this.gameState.isCheckmate = inCheck && !hasLegalMoves;
    this.gameState.isStalemate = !inCheck && !hasLegalMoves;
    this.gameState.isDraw = this.gameState.isStalemate ||
      this.isDrawByFiftyMoveRule() ||
      this.isDrawByInsufficientMaterial() ||
      this.isDrawByThreefoldRepetition();
  }

  private hasLegalMoves(color: PieceColor): boolean {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.gameState.board[row][col];
        if (piece && piece.color === color) {
          const square = ChessUtils.indexToSquare(row, col);
          if (this.getLegalMoves(square).length > 0) {
            return true;
          }
        }
      }
    }
    return false;
  }

  private isDrawByFiftyMoveRule(): boolean {
    return this.gameState.halfmoveClock >= 100;
  }

  private isDrawByInsufficientMaterial(): boolean {
    const pieces: Piece[] = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.gameState.board[row][col];
        if (piece) pieces.push(piece);
      }
    }

    // King vs King
    if (pieces.length === 2) return true;

    // King and Bishop vs King or King and Knight vs King
    if (pieces.length === 3) {
      const nonKings = pieces.filter(p => p.type !== 'king');
      return nonKings.length === 1 && (nonKings[0].type === 'bishop' || nonKings[0].type === 'knight');
    }

    // More complex insufficient material rules can be added here

    return false;
  }

  private isDrawByThreefoldRepetition(): boolean {
    const currentFen = this.calculateFEN();
    const positions = this.gameState.moves.map((move: Move) => move.fen);
    positions.push(currentFen);

    const fenCounts = positions.reduce((counts: { [fen: string]: number }, fen: string) => {
      counts[fen] = (counts[fen] || 0) + 1;
      return counts;
    }, {} as { [fen: string]: number });

    return Object.values(fenCounts).some((count: number) => count >= 3);
  }

  private calculateSAN(move: Move): string {
    // This is a simplified SAN calculation
    // A full implementation would need to handle disambiguation
    const { piece, to, capturedPiece, promotion, castling } = move;

    if (castling) {
      return castling === 'kingside' ? 'O-O' : 'O-O-O';
    }

    let san = '';

    if (piece.type !== 'pawn') {
      san += piece.type.charAt(0).toUpperCase();
    }

    if (capturedPiece) {
      if (piece.type === 'pawn') {
        san += move.from.charAt(0);
      }
      san += 'x';
    }

    san += to;

    if (promotion) {
      san += '=' + promotion.charAt(0).toUpperCase();
    }

    // Check for check/checkmate after the move
    const oppositeColor = piece.color === 'white' ? 'black' : 'white';
    if (this.isInCheck(oppositeColor)) {
      san += this.gameState.isCheckmate ? '#' : '+';
    }

    return san;
  }

  private calculateFEN(): string {
    let fen = '';

    // Board position
    for (let row = 0; row < 8; row++) {
      let emptyCount = 0;
      for (let col = 0; col < 8; col++) {
        const piece = this.gameState.board[row][col];
        if (piece) {
          if (emptyCount > 0) {
            fen += emptyCount;
            emptyCount = 0;
          }
          fen += this.pieceToChar(piece);
        } else {
          emptyCount++;
        }
      }
      if (emptyCount > 0) {
        fen += emptyCount;
      }
      if (row < 7) {
        fen += '/';
      }
    }

    // Current player
    fen += ` ${this.gameState.currentPlayer === 'white' ? 'w' : 'b'}`;

    // Castling rights
    let castling = '';
    if (this.gameState.castlingRights.whiteKingside) castling += 'K';
    if (this.gameState.castlingRights.whiteQueenside) castling += 'Q';
    if (this.gameState.castlingRights.blackKingside) castling += 'k';
    if (this.gameState.castlingRights.blackQueenside) castling += 'q';
    fen += ` ${castling || '-'}`;

    // En passant target
    fen += ` ${this.gameState.enPassantTarget || '-'}`;

    // Halfmove clock
    fen += ` ${this.gameState.halfmoveClock}`;

    // Fullmove number
    fen += ` ${this.gameState.fullmoveNumber}`;

    return fen;
  }

  public getAllLegalMoves(): Array<{ from: Square, to: Square, promotion?: PieceType }> {
    const moves: Array<{ from: Square, to: Square, promotion?: PieceType }> = [];

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.gameState.board[row][col];
        if (piece && piece.color === this.gameState.currentPlayer) {
          const from = ChessUtils.indexToSquare(row, col);
          const legalMoves = this.getLegalMoves(from);
          legalMoves.forEach(move => {
            moves.push({ from, ...move });
          });
        }
      }
    }

    return moves;
  }

  public undoMove(): Move | null {
    if (this.gameState.moves.length === 0) return null;

    const lastMove = this.gameState.moves.pop()!;
    
    // Use the FEN stored in the move (position before the move was made)
    const movesHistory = [...this.gameState.moves]; // Save remaining moves
    
    // Initialize from the FEN stored in the undone move
    this.gameState = this.initializeGame(lastMove.fen);
    
    // Restore the remaining moves history without replaying them
    this.gameState.moves = movesHistory;

    // After undo, it should be the turn of the player who made the undone move
    this.gameState.currentPlayer = lastMove.piece.color;

    return lastMove;
  }

  public isGameOver(): boolean {
    return this.gameState.isCheckmate || this.gameState.isDraw;
  }

  public getGameResult(): 'white-wins' | 'black-wins' | 'draw' | '*' {
    if (this.gameState.isCheckmate) {
      return this.gameState.currentPlayer === 'white' ? 'black-wins' : 'white-wins';
    }
    if (this.gameState.isDraw) {
      return 'draw';
    }
    return '*';
  }

  public goToMoveIndex(moveIndex: number): void {
    const totalMoves = this.gameState.moves.length;
    
    if (moveIndex < -1 || moveIndex >= totalMoves) return;
    
    if (moveIndex === -1) {
      // Go to starting position
      this.resetToInitialPosition();
    } else {
      // Always rebuild the position from the beginning to ensure accuracy
      this.resetToInitialPosition();
      for (let i = 0; i <= moveIndex; i++) {
        const move = this.gameState.moves[i];
        this.replayMove(move);
      }
    }
  }

  private resetToInitialPosition(): void {
    // Store current moves for replay
    const moves = [...this.gameState.moves];
    
    // Reset to initial position using starting FEN
    this.gameState = this.initializeGame();
    
    // Restore moves history but clear current position
    this.gameState.moves = moves;
  }

  private replayMove(move: Move): void {
    // Replay a move without adding it to history again
    const piece = this.getPiece(move.from);
    if (!piece) return;

    // Execute the move mechanics without updating moves array
    const fromIndex = ChessUtils.squareToIndex(move.from);
    const toIndex = ChessUtils.squareToIndex(move.to);
    
    // Handle castling
    if (move.castling) {
      if (move.castling === 'kingside') {
        // Move king
        this.gameState.board[fromIndex.row][fromIndex.col] = null;
        this.gameState.board[toIndex.row][toIndex.col] = piece;
        // Move rook
        this.gameState.board[fromIndex.row][7] = null;
        this.gameState.board[fromIndex.row][5] = { type: 'rook', color: piece.color };
      } else if (move.castling === 'queenside') {
        // Move king
        this.gameState.board[fromIndex.row][fromIndex.col] = null;
        this.gameState.board[toIndex.row][toIndex.col] = piece;
        // Move rook
        this.gameState.board[fromIndex.row][0] = null;
        this.gameState.board[fromIndex.row][3] = { type: 'rook', color: piece.color };
      }
    } else if (move.enPassant) {
      // Handle en passant
      this.gameState.board[fromIndex.row][fromIndex.col] = null;
      this.gameState.board[toIndex.row][toIndex.col] = piece;
      // Remove captured pawn
      const capturedPawnRow = piece.color === 'white' ? toIndex.row + 1 : toIndex.row - 1;
      this.gameState.board[capturedPawnRow][toIndex.col] = null;
    } else {
      // Normal move
      this.gameState.board[fromIndex.row][fromIndex.col] = null;
      this.gameState.board[toIndex.row][toIndex.col] = piece;
    }

    // Handle promotion
    if (move.promotion) {
      this.gameState.board[toIndex.row][toIndex.col] = {
        type: move.promotion,
        color: piece.color
      };
    }

    // Update game state from the move's FEN
    if (move.fen) {
      const fenParts = move.fen.split(' ');
      if (fenParts.length >= 4) {
        this.gameState.currentPlayer = fenParts[1] as 'white' | 'black';
        this.gameState.enPassantTarget = fenParts[3] === '-' ? null : fenParts[3];
        
        // Update castling rights
        const castlingRights = fenParts[2];
        this.gameState.castlingRights = {
          whiteKingside: castlingRights.includes('K'),
          whiteQueenside: castlingRights.includes('Q'),
          blackKingside: castlingRights.includes('k'),
          blackQueenside: castlingRights.includes('q')
        };
      }
    } else {
      // Fallback: just switch players
      this.gameState.currentPlayer = this.gameState.currentPlayer === 'white' ? 'black' : 'white';
    }
  }
}
