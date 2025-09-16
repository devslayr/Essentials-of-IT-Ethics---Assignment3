"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChessEngine = void 0;
const utils_1 = require("../../shared/utils");
class ChessEngine {
    constructor(fen) {
        this.gameState = this.initializeGame(fen);
    }
    initializeGame(fen) {
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
    fenToBoard(fen) {
        const board = Array(8).fill(null).map(() => Array(8).fill(null));
        const rows = fen.split(' ')[0].split('/');
        for (let row = 0; row < 8; row++) {
            let col = 0;
            for (const char of rows[row]) {
                if (char >= '1' && char <= '8') {
                    col += parseInt(char);
                }
                else {
                    board[row][col] = this.charToPiece(char);
                    col++;
                }
            }
        }
        return board;
    }
    charToPiece(char) {
        const color = char === char.toLowerCase() ? 'black' : 'white';
        const type = this.charToPieceType(char.toLowerCase());
        return { type, color };
    }
    charToPieceType(char) {
        const mapping = {
            'k': 'king', 'q': 'queen', 'r': 'rook',
            'b': 'bishop', 'n': 'knight', 'p': 'pawn'
        };
        return mapping[char];
    }
    pieceToChar(piece) {
        const mapping = {
            'king': 'k', 'queen': 'q', 'rook': 'r',
            'bishop': 'b', 'knight': 'n', 'pawn': 'p'
        };
        const char = mapping[piece.type];
        return piece.color === 'white' ? char.toUpperCase() : char;
    }
    fenToCurrentPlayer(fen) {
        return fen.split(' ')[1] === 'w' ? 'white' : 'black';
    }
    fenToCastlingRights(fen) {
        const castling = fen.split(' ')[2];
        return {
            whiteKingside: castling.includes('K'),
            whiteQueenside: castling.includes('Q'),
            blackKingside: castling.includes('k'),
            blackQueenside: castling.includes('q')
        };
    }
    fenToEnPassantTarget(fen) {
        const enPassant = fen.split(' ')[3];
        return enPassant === '-' ? null : enPassant;
    }
    fenToHalfmoveClock(fen) {
        return parseInt(fen.split(' ')[4]);
    }
    fenToFullmoveNumber(fen) {
        return parseInt(fen.split(' ')[5]);
    }
    getGameState() {
        return { ...this.gameState };
    }
    getPiece(square) {
        const { row, col } = utils_1.ChessUtils.squareToIndex(square);
        return this.gameState.board[row][col];
    }
    makeMove(from, to, promotion) {
        if (!this.isValidMove(from, to, promotion)) {
            return null;
        }
        const piece = this.getPiece(from);
        const capturedPiece = this.getPiece(to);
        // Create move object
        const move = {
            from,
            to,
            piece,
            capturedPiece: capturedPiece || undefined,
            promotion,
            timestamp: Date.now(),
            san: '', // Will be calculated
            fen: '' // Will be calculated
        };
        // Execute the move
        this.executeMove(move);
        // Calculate SAN and FEN
        move.san = this.calculateSAN(move);
        move.fen = this.calculateFEN();
        // Update game state
        this.gameState.moves.push(move);
        this.gameState.fen = move.fen;
        this.gameState.currentPlayer = this.gameState.currentPlayer === 'white' ? 'black' : 'white';
        // Update game status
        this.updateGameStatus();
        return move;
    }
    executeMove(move) {
        const { from, to, piece, promotion } = move;
        const { row: fromRow, col: fromCol } = utils_1.ChessUtils.squareToIndex(from);
        const { row: toRow, col: toCol } = utils_1.ChessUtils.squareToIndex(to);
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
    executeCastling(move) {
        const { from, to, piece } = move;
        const { row: fromRow, col: fromCol } = utils_1.ChessUtils.squareToIndex(from);
        const { row: toRow, col: toCol } = utils_1.ChessUtils.squareToIndex(to);
        // Move king
        this.gameState.board[fromRow][fromCol] = null;
        this.gameState.board[toRow][toCol] = piece;
        // Move rook
        if (toCol > fromCol) { // Kingside
            this.gameState.board[toRow][7] = null;
            this.gameState.board[toRow][5] = { type: 'rook', color: piece.color };
            move.castling = 'kingside';
        }
        else { // Queenside
            this.gameState.board[toRow][0] = null;
            this.gameState.board[toRow][3] = { type: 'rook', color: piece.color };
            move.castling = 'queenside';
        }
        // Remove castling rights
        if (piece.color === 'white') {
            this.gameState.castlingRights.whiteKingside = false;
            this.gameState.castlingRights.whiteQueenside = false;
        }
        else {
            this.gameState.castlingRights.blackKingside = false;
            this.gameState.castlingRights.blackQueenside = false;
        }
    }
    executeEnPassant(move) {
        const { from, to, piece } = move;
        const { row: fromRow, col: fromCol } = utils_1.ChessUtils.squareToIndex(from);
        const { row: toRow, col: toCol } = utils_1.ChessUtils.squareToIndex(to);
        // Move pawn
        this.gameState.board[fromRow][fromCol] = null;
        this.gameState.board[toRow][toCol] = piece;
        // Remove captured pawn
        const capturedRow = piece.color === 'white' ? toRow + 1 : toRow - 1;
        this.gameState.board[capturedRow][toCol] = null;
        move.enPassant = true;
    }
    updateCastlingRights(move) {
        const { from, piece } = move;
        // King moves
        if (piece.type === 'king') {
            if (piece.color === 'white') {
                this.gameState.castlingRights.whiteKingside = false;
                this.gameState.castlingRights.whiteQueenside = false;
            }
            else {
                this.gameState.castlingRights.blackKingside = false;
                this.gameState.castlingRights.blackQueenside = false;
            }
        }
        // Rook moves
        if (piece.type === 'rook') {
            if (from === 'a1')
                this.gameState.castlingRights.whiteQueenside = false;
            if (from === 'h1')
                this.gameState.castlingRights.whiteKingside = false;
            if (from === 'a8')
                this.gameState.castlingRights.blackQueenside = false;
            if (from === 'h8')
                this.gameState.castlingRights.blackKingside = false;
        }
    }
    updateEnPassantTarget(move) {
        const { from, to, piece } = move;
        if (piece.type === 'pawn') {
            const fromPos = utils_1.ChessUtils.squareToPosition(from);
            const toPos = utils_1.ChessUtils.squareToPosition(to);
            if (Math.abs(toPos.rank - fromPos.rank) === 2) {
                const enPassantRank = (fromPos.rank + toPos.rank) / 2;
                this.gameState.enPassantTarget = utils_1.ChessUtils.positionToSquare({
                    file: fromPos.file,
                    rank: enPassantRank
                });
                return;
            }
        }
        this.gameState.enPassantTarget = null;
    }
    updateClocks(move) {
        if (move.piece.type === 'pawn' || move.capturedPiece) {
            this.gameState.halfmoveClock = 0;
        }
        else {
            this.gameState.halfmoveClock++;
        }
        if (this.gameState.currentPlayer === 'black') {
            this.gameState.fullmoveNumber++;
        }
    }
    isValidMove(from, to, promotion) {
        const piece = this.getPiece(from);
        if (!piece)
            return false;
        if (piece.color !== this.gameState.currentPlayer)
            return false;
        const legalMoves = this.getLegalMoves(from);
        return legalMoves.some(move => move.to === to && move.promotion === promotion);
    }
    getLegalMoves(square) {
        const piece = this.getPiece(square);
        if (!piece || piece.color !== this.gameState.currentPlayer) {
            return [];
        }
        const pseudoLegalMoves = this.getPseudoLegalMoves(square);
        return pseudoLegalMoves.filter(move => !this.wouldBeInCheck(square, move.to, move.promotion));
    }
    getPseudoLegalMoves(square) {
        const piece = this.getPiece(square);
        if (!piece)
            return [];
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
    getPawnMoves(square) {
        const moves = [];
        const piece = this.getPiece(square);
        const position = utils_1.ChessUtils.squareToPosition(square);
        const direction = piece.color === 'white' ? 1 : -1;
        const startRank = piece.color === 'white' ? 2 : 7;
        const promotionRank = piece.color === 'white' ? 8 : 1;
        // Forward moves
        const oneSquareForward = utils_1.ChessUtils.positionToSquare({
            file: position.file,
            rank: (position.rank + direction)
        });
        if (utils_1.ChessUtils.isValidSquare(oneSquareForward) && !this.getPiece(oneSquareForward)) {
            if (position.rank + direction === promotionRank) {
                // Promotion
                ['queen', 'rook', 'bishop', 'knight'].forEach(promotion => {
                    moves.push({ to: oneSquareForward, promotion: promotion });
                });
            }
            else {
                moves.push({ to: oneSquareForward });
            }
            // Two squares forward from start position
            if (position.rank === startRank) {
                const twoSquaresForward = utils_1.ChessUtils.positionToSquare({
                    file: position.file,
                    rank: (position.rank + 2 * direction)
                });
                if (!this.getPiece(twoSquaresForward)) {
                    moves.push({ to: twoSquaresForward });
                }
            }
        }
        // Captures
        const files = utils_1.ChessUtils.files;
        const fileIndex = files.indexOf(position.file);
        [-1, 1].forEach(fileOffset => {
            const targetFileIndex = fileIndex + fileOffset;
            if (targetFileIndex >= 0 && targetFileIndex < 8) {
                const targetSquare = utils_1.ChessUtils.positionToSquare({
                    file: files[targetFileIndex],
                    rank: (position.rank + direction)
                });
                if (utils_1.ChessUtils.isValidSquare(targetSquare)) {
                    const targetPiece = this.getPiece(targetSquare);
                    // Regular capture
                    if (targetPiece && targetPiece.color !== piece.color) {
                        if (position.rank + direction === promotionRank) {
                            ['queen', 'rook', 'bishop', 'knight'].forEach(promotion => {
                                moves.push({ to: targetSquare, promotion: promotion });
                            });
                        }
                        else {
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
    getRookMoves(square) {
        return this.getSlidingMoves(square, [
            [0, 1], [0, -1], [1, 0], [-1, 0]
        ]);
    }
    getBishopMoves(square) {
        return this.getSlidingMoves(square, [
            [1, 1], [1, -1], [-1, 1], [-1, -1]
        ]);
    }
    getQueenMoves(square) {
        return this.getSlidingMoves(square, [
            [0, 1], [0, -1], [1, 0], [-1, 0],
            [1, 1], [1, -1], [-1, 1], [-1, -1]
        ]);
    }
    getSlidingMoves(square, directions) {
        const moves = [];
        const piece = this.getPiece(square);
        const { row, col } = utils_1.ChessUtils.squareToIndex(square);
        directions.forEach(([deltaRow, deltaCol]) => {
            for (let i = 1; i < 8; i++) {
                const newRow = row + i * deltaRow;
                const newCol = col + i * deltaCol;
                if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8)
                    break;
                const targetSquare = utils_1.ChessUtils.indexToSquare(newRow, newCol);
                const targetPiece = this.getPiece(targetSquare);
                if (!targetPiece) {
                    moves.push({ to: targetSquare });
                }
                else {
                    if (targetPiece.color !== piece.color) {
                        moves.push({ to: targetSquare });
                    }
                    break;
                }
            }
        });
        return moves;
    }
    getKnightMoves(square) {
        const moves = [];
        const piece = this.getPiece(square);
        const { row, col } = utils_1.ChessUtils.squareToIndex(square);
        const knightMoves = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        knightMoves.forEach(([deltaRow, deltaCol]) => {
            const newRow = row + deltaRow;
            const newCol = col + deltaCol;
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                const targetSquare = utils_1.ChessUtils.indexToSquare(newRow, newCol);
                const targetPiece = this.getPiece(targetSquare);
                if (!targetPiece || targetPiece.color !== piece.color) {
                    moves.push({ to: targetSquare });
                }
            }
        });
        return moves;
    }
    getKingMoves(square) {
        const moves = [];
        const piece = this.getPiece(square);
        const { row, col } = utils_1.ChessUtils.squareToIndex(square);
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
                const targetSquare = utils_1.ChessUtils.indexToSquare(newRow, newCol);
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
    canCastleKingside(color) {
        const rights = this.gameState.castlingRights;
        const canCastle = color === 'white' ? rights.whiteKingside : rights.blackKingside;
        if (!canCastle)
            return false;
        const rank = color === 'white' ? '1' : '8';
        const squares = [`f${rank}`, `g${rank}`];
        // Check if squares are empty
        if (squares.some(square => this.getPiece(square)))
            return false;
        // Check if king would pass through or end up in check
        return !squares.some(square => this.isSquareAttacked(square, color === 'white' ? 'black' : 'white'));
    }
    canCastleQueenside(color) {
        const rights = this.gameState.castlingRights;
        const canCastle = color === 'white' ? rights.whiteQueenside : rights.blackQueenside;
        if (!canCastle)
            return false;
        const rank = color === 'white' ? '1' : '8';
        const squares = [`b${rank}`, `c${rank}`, `d${rank}`];
        // Check if squares are empty
        if (squares.some(square => this.getPiece(square)))
            return false;
        // Check if king would pass through or end up in check (only c and d matter for check)
        const checkSquares = [`c${rank}`, `d${rank}`];
        return !checkSquares.some(square => this.isSquareAttacked(square, color === 'white' ? 'black' : 'white'));
    }
    wouldBeInCheck(from, to, promotion) {
        // Make a temporary move and check if it results in check
        const originalPiece = this.getPiece(from);
        const originalTarget = this.getPiece(to);
        const originalEnPassant = this.gameState.enPassantTarget;
        if (!originalPiece)
            return true;
        // Make the move temporarily
        const { row: fromRow, col: fromCol } = utils_1.ChessUtils.squareToIndex(from);
        const { row: toRow, col: toCol } = utils_1.ChessUtils.squareToIndex(to);
        this.gameState.board[fromRow][fromCol] = null;
        this.gameState.board[toRow][toCol] = promotion
            ? { type: promotion, color: originalPiece.color }
            : originalPiece;
        // Handle en passant capture
        let enPassantCaptured = null;
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
    isInCheck(color) {
        const kingSquare = this.findKing(color);
        if (!kingSquare)
            return false;
        return this.isSquareAttacked(kingSquare, color === 'white' ? 'black' : 'white');
    }
    findKing(color) {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.gameState.board[row][col];
                if (piece && piece.type === 'king' && piece.color === color) {
                    return utils_1.ChessUtils.indexToSquare(row, col);
                }
            }
        }
        return null;
    }
    isSquareAttacked(square, byColor) {
        // Check if any piece of the given color can attack the square
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.gameState.board[row][col];
                if (piece && piece.color === byColor) {
                    const fromSquare = utils_1.ChessUtils.indexToSquare(row, col);
                    if (this.canPieceAttackSquare(fromSquare, square)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    canPieceAttackSquare(from, to) {
        const piece = this.getPiece(from);
        if (!piece)
            return false;
        const fromPos = utils_1.ChessUtils.squareToPosition(from);
        const toPos = utils_1.ChessUtils.squareToPosition(to);
        const { dx, dy } = utils_1.ChessUtils.getDistance(fromPos, toPos);
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
    isPathClear(from, to) {
        const squaresBetween = utils_1.ChessUtils.getSquaresBetween(from, to);
        return squaresBetween.every((square) => !this.getPiece(square));
    }
    updateGameStatus() {
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
    hasLegalMoves(color) {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.gameState.board[row][col];
                if (piece && piece.color === color) {
                    const square = utils_1.ChessUtils.indexToSquare(row, col);
                    if (this.getLegalMoves(square).length > 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    isDrawByFiftyMoveRule() {
        return this.gameState.halfmoveClock >= 100;
    }
    isDrawByInsufficientMaterial() {
        const pieces = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.gameState.board[row][col];
                if (piece)
                    pieces.push(piece);
            }
        }
        // King vs King
        if (pieces.length === 2)
            return true;
        // King and Bishop vs King or King and Knight vs King
        if (pieces.length === 3) {
            const nonKings = pieces.filter(p => p.type !== 'king');
            return nonKings.length === 1 && (nonKings[0].type === 'bishop' || nonKings[0].type === 'knight');
        }
        // More complex insufficient material rules can be added here
        return false;
    }
    isDrawByThreefoldRepetition() {
        const currentFen = this.calculateFEN();
        const positions = this.gameState.moves.map((move) => move.fen);
        positions.push(currentFen);
        const fenCounts = positions.reduce((counts, fen) => {
            counts[fen] = (counts[fen] || 0) + 1;
            return counts;
        }, {});
        return Object.values(fenCounts).some((count) => count >= 3);
    }
    calculateSAN(move) {
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
    calculateFEN() {
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
                }
                else {
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
        if (this.gameState.castlingRights.whiteKingside)
            castling += 'K';
        if (this.gameState.castlingRights.whiteQueenside)
            castling += 'Q';
        if (this.gameState.castlingRights.blackKingside)
            castling += 'k';
        if (this.gameState.castlingRights.blackQueenside)
            castling += 'q';
        fen += ` ${castling || '-'}`;
        // En passant target
        fen += ` ${this.gameState.enPassantTarget || '-'}`;
        // Halfmove clock
        fen += ` ${this.gameState.halfmoveClock}`;
        // Fullmove number
        fen += ` ${this.gameState.fullmoveNumber}`;
        return fen;
    }
    getAllLegalMoves() {
        const moves = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.gameState.board[row][col];
                if (piece && piece.color === this.gameState.currentPlayer) {
                    const from = utils_1.ChessUtils.indexToSquare(row, col);
                    const legalMoves = this.getLegalMoves(from);
                    legalMoves.forEach(move => {
                        moves.push({ from, ...move });
                    });
                }
            }
        }
        return moves;
    }
    undoMove() {
        if (this.gameState.moves.length === 0)
            return null;
        const lastMove = this.gameState.moves.pop();
        // Restore position from FEN of previous move or initial position
        const previousFen = this.gameState.moves.length > 0
            ? this.gameState.moves[this.gameState.moves.length - 1].fen
            : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        this.gameState = this.initializeGame(previousFen);
        // Replay all moves except the last one
        const movesToReplay = [...this.gameState.moves];
        this.gameState.moves = [];
        movesToReplay.forEach(move => {
            this.makeMove(move.from, move.to, move.promotion);
        });
        return lastMove;
    }
    isGameOver() {
        return this.gameState.isCheckmate || this.gameState.isDraw;
    }
    getGameResult() {
        if (this.gameState.isCheckmate) {
            return this.gameState.currentPlayer === 'white' ? 'black-wins' : 'white-wins';
        }
        if (this.gameState.isDraw) {
            return 'draw';
        }
        return '*';
    }
}
exports.ChessEngine = ChessEngine;
//# sourceMappingURL=ChessEngine.js.map