class ChessGame {
    constructor() {
        this.board = this.initializeBoard();
        this.currentPlayer = 'white';
        this.selectedSquare = null;
        this.validMoves = [];
        this.gameBoard = document.getElementById('chess-board');
        this.currentPlayerElement = document.getElementById('current-player');
        this.gameStatusElement = document.getElementById('game-status');
        this.resetBtn = document.getElementById('reset-btn');
        this.resignBtn = document.getElementById('resign-btn');
        this.drawBtn = document.getElementById('draw-btn');
        this.startTimerBtn = document.getElementById('start-timer-btn');
        
        // Timer elements
        this.timerSelect = document.getElementById('timer-select');
        this.customTimerInput = document.getElementById('custom-timer');
        this.whiteTimerElement = document.getElementById('white-timer');
        this.blackTimerElement = document.getElementById('black-timer');
        
        // Modal elements
        this.promotionModal = document.getElementById('promotion-modal');
        this.resultModal = document.getElementById('result-modal');
        this.resultTitle = document.getElementById('result-title');
        this.resultMessage = document.getElementById('result-message');
        this.newGameBtn = document.getElementById('new-game-btn');
        this.closeResultBtn = document.getElementById('close-result-btn');
        
        // Game state tracking
        this.gameState = 'setup'; // 'setup', 'playing', 'check', 'checkmate', 'stalemate', 'draw', 'resigned'
        this.moveHistory = [];
        this.castlingRights = {
            white: { kingside: true, queenside: true },
            black: { kingside: true, queenside: true }
        };
        this.enPassantTarget = null;
        this.halfMoveClock = 0;
        this.fullMoveNumber = 1;
        this.drawOffered = false;
        
        // Timer state
        this.timers = {
            white: 0,
            black: 0
        };
        this.timerInterval = null;
        this.timerEnabled = false;
        this.gameStartTime = null;
        
        // Promotion state
        this.pendingPromotion = null;
        
        this.initializeGame();
    }

    initializeBoard() {
        // Initialize 8x8 board with pieces in starting positions
        const board = Array(8).fill(null).map(() => Array(8).fill(null));
        
        // White pieces (bottom rows)
        board[7] = ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖']; // White back row
        board[6] = Array(8).fill('♙'); // White pawns
        
        // Black pieces (top rows)
        board[0] = ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜']; // Black back row
        board[1] = Array(8).fill('♟'); // Black pawns
        
        return board;
    }

    initializeGame() {
        this.renderBoard();
        this.setupEventListeners();
        this.updateGameStatus();
        this.updateTimerDisplay();
    }

    setupEventListeners() {
        this.resetBtn.addEventListener('click', () => this.resetGame());
        this.resignBtn.addEventListener('click', () => this.resignGame());
        this.drawBtn.addEventListener('click', () => this.offerDraw());
        this.startTimerBtn.addEventListener('click', () => this.startGame());
        
        this.timerSelect.addEventListener('change', () => this.handleTimerChange());
        this.customTimerInput.addEventListener('input', () => this.handleCustomTimer());
        
        // Promotion modal listeners
        document.querySelectorAll('.promotion-piece').forEach(button => {
            button.addEventListener('click', (e) => this.handlePromotion(e.target.dataset.piece));
        });
        
        // Result modal listeners
        this.newGameBtn.addEventListener('click', () => this.startNewGame());
        this.closeResultBtn.addEventListener('click', () => this.closeResultModal());
        
        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === this.resultModal) {
                this.closeResultModal();
            }
        });
    }

    handleTimerChange() {
        const value = this.timerSelect.value;
        if (value === 'custom') {
            this.customTimerInput.style.display = 'inline-block';
            this.customTimerInput.focus();
        } else {
            this.customTimerInput.style.display = 'none';
            this.setupTimer(parseInt(value));
        }
    }

    handleCustomTimer() {
        const minutes = parseInt(this.customTimerInput.value);
        if (minutes > 0) {
            this.setupTimer(minutes * 60);
        }
    }

    setupTimer(seconds) {
        this.timerEnabled = seconds > 0;
        this.timers.white = seconds;
        this.timers.black = seconds;
        
        if (this.timerEnabled) {
            this.startTimerBtn.style.display = 'inline-block';
            this.gameState = 'setup';
        } else {
            this.startTimerBtn.style.display = 'none';
            this.gameState = 'playing';
        }
        
        this.updateTimerDisplay();
        this.updateGameStatus();
    }

    startGame() {
        if (this.timerEnabled) {
            this.gameState = 'playing';
            this.gameStartTime = Date.now();
            this.startTimer();
            this.startTimerBtn.style.display = 'none';
        }
        this.updateGameStatus();
    }

    startTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.timerInterval = setInterval(() => {
            if (this.gameState === 'playing' || this.gameState === 'check') {
                this.timers[this.currentPlayer]--;
                
                if (this.timers[this.currentPlayer] <= 0) {
                    this.endGameByTime();
                    return;
                }
                
                this.updateTimerDisplay();
            }
        }, 1000);
    }

    endGameByTime() {
        const winner = this.currentPlayer === 'white' ? 'Black' : 'White';
        this.gameState = 'timeout';
        this.stopTimer();
        this.showGameResult(`Time's Up!`, `${winner} wins by timeout!`);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimerDisplay() {
        this.whiteTimerElement.textContent = this.formatTime(this.timers.white);
        this.blackTimerElement.textContent = this.formatTime(this.timers.black);
        
        // Update timer highlighting
        document.querySelector('.white-timer').classList.toggle('active', 
            this.currentPlayer === 'white' && (this.gameState === 'playing' || this.gameState === 'check'));
        document.querySelector('.black-timer').classList.toggle('active', 
            this.currentPlayer === 'black' && (this.gameState === 'playing' || this.gameState === 'check'));
        
        // Add warning for low time (under 30 seconds)
        document.querySelector('.white-timer').classList.toggle('warning', this.timers.white <= 30 && this.timers.white > 0);
        document.querySelector('.black-timer').classList.toggle('warning', this.timers.black <= 30 && this.timers.black > 0);
    }

    formatTime(seconds) {
        if (seconds < 0) return '00:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    renderBoard() {
        this.gameBoard.innerHTML = '';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = 'square';
                square.dataset.row = row;
                square.dataset.col = col;
                
                // Alternate colors for checkerboard pattern
                if ((row + col) % 2 === 0) {
                    square.classList.add('light');
                } else {
                    square.classList.add('dark');
                }
                
                // Add piece if exists
                const piece = this.board[row][col];
                if (piece) {
                    const pieceElement = document.createElement('span');
                    pieceElement.className = 'piece';
                    pieceElement.textContent = piece;
                    square.appendChild(pieceElement);
                }
                
                square.addEventListener('click', () => this.handleSquareClick(row, col));
                this.gameBoard.appendChild(square);
            }
        }
        
        this.updateCurrentPlayer();
    }

    handleSquareClick(row, col) {
        if (this.gameState !== 'playing' && this.gameState !== 'check') {
            return; // Game is not active
        }
        
        const piece = this.board[row][col];
        
        // If a square is already selected
        if (this.selectedSquare) {
            const [selectedRow, selectedCol] = this.selectedSquare;
            
            // If clicking the same square, deselect
            if (selectedRow === row && selectedCol === col) {
                this.clearSelection();
                return;
            }
            
            // If clicking a valid move, make the move
            if (this.isValidMove(selectedRow, selectedCol, row, col)) {
                const move = {
                    from: [selectedRow, selectedCol],
                    to: [row, col],
                    piece: this.board[selectedRow][selectedCol],
                    captured: this.board[row][col],
                    isEnPassant: this.isEnPassantCapture(selectedRow, selectedCol, row, col),
                    isCastling: this.isCastlingMove(selectedRow, selectedCol, row, col),
                    isPromotion: this.isPawnPromotion(selectedRow, selectedCol, row, col)
                };
                
                if (move.isPromotion) {
                    this.pendingPromotion = move;
                    this.showPromotionModal();
                } else {
                    this.executeMove(move);
                }
                return;
            }
            
            // If clicking another piece of the same color, select it instead
            if (piece && this.isPieceOwnedByCurrentPlayer(piece)) {
                this.selectSquare(row, col);
                return;
            }
            
            // Otherwise, clear selection
            this.clearSelection();
        } else {
            // If no square is selected and clicking on own piece, select it
            if (piece && this.isPieceOwnedByCurrentPlayer(piece)) {
                this.selectSquare(row, col);
            }
        }
    }

    executeMove(move) {
        this.makeMove(move);
        this.clearSelection();
        this.drawOffered = false; // Reset draw offer after any move
        this.switchPlayer();
        this.updateGameStatus();
        this.renderBoard();
    }

    showPromotionModal() {
        // Update promotion pieces for current player
        const pieces = document.querySelectorAll('.promotion-piece');
        if (this.currentPlayer === 'white') {
            pieces[0].textContent = '♕'; // Queen
            pieces[1].textContent = '♖'; // Rook  
            pieces[2].textContent = '♗'; // Bishop
            pieces[3].textContent = '♘'; // Knight
        } else {
            pieces[0].textContent = '♛'; // Queen
            pieces[1].textContent = '♜'; // Rook
            pieces[2].textContent = '♝'; // Bishop
            pieces[3].textContent = '♞'; // Knight
        }
        
        this.promotionModal.style.display = 'block';
    }

    handlePromotion(pieceType) {
        if (!this.pendingPromotion) return;
        
        // Map piece type to actual piece
        const pieceMap = {
            white: { queen: '♕', rook: '♖', bishop: '♗', knight: '♘' },
            black: { queen: '♛', rook: '♜', bishop: '♝', knight: '♞' }
        };
        
        this.pendingPromotion.promotionPiece = pieceMap[this.currentPlayer][pieceType];
        this.promotionModal.style.display = 'none';
        
        this.executeMove(this.pendingPromotion);
        this.pendingPromotion = null;
    }

    selectSquare(row, col) {
        this.selectedSquare = [row, col];
        this.validMoves = this.getValidMoves(row, col);
        this.highlightSquares();
    }

    clearSelection() {
        this.selectedSquare = null;
        this.validMoves = [];
        this.highlightSquares();
    }

    highlightSquares() {
        // Remove all highlights
        document.querySelectorAll('.square').forEach(square => {
            square.classList.remove('selected', 'valid-move');
        });
        
        // Highlight selected square
        if (this.selectedSquare) {
            const [row, col] = this.selectedSquare;
            const square = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            square.classList.add('selected');
        }
        
        // Highlight valid moves
        this.validMoves.forEach(([row, col]) => {
            const square = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            square.classList.add('valid-move');
        });
    }

    isPieceOwnedByCurrentPlayer(piece) {
        const whitePieces = ['♔', '♕', '♖', '♗', '♘', '♙'];
        const blackPieces = ['♚', '♛', '♜', '♝', '♞', '♟'];
        
        if (this.currentPlayer === 'white') {
            return whitePieces.includes(piece);
        } else {
            return blackPieces.includes(piece);
        }
    }

    getValidMoves(row, col) {
        const piece = this.board[row][col];
        let moves = [];
        
        // Basic movement patterns (simplified chess rules)
        switch (piece) {
            case '♙': // White pawn
                moves = this.getPawnMoves(row, col, 'white');
                break;
                
            case '♟': // Black pawn
                moves = this.getPawnMoves(row, col, 'black');
                break;
                
            case '♖': case '♜': // Rooks
                moves.push(...this.getRookMoves(row, col));
                break;
                
            case '♗': case '♝': // Bishops
                moves.push(...this.getBishopMoves(row, col));
                break;
                
            case '♕': case '♛': // Queens
                moves.push(...this.getRookMoves(row, col));
                moves.push(...this.getBishopMoves(row, col));
                break;
                
            case '♔': case '♚': // Kings
                moves.push(...this.getKingMoves(row, col));
                break;
                
            case '♘': case '♞': // Knights
                moves.push(...this.getKnightMoves(row, col));
                break;
        }
        
        // Filter out moves that would put own king in check
        return moves.filter(([toRow, toCol]) => {
            return !this.wouldMoveExposeKing(row, col, toRow, toCol);
        });
    }

    getPawnMoves(row, col, color) {
        const moves = [];
        const direction = color === 'white' ? -1 : 1;
        const startingRow = color === 'white' ? 6 : 1;
        
        // Forward move
        if (this.isValidSquare(row + direction, col) && !this.board[row + direction][col]) {
            moves.push([row + direction, col]);
            
            // Initial two-square move
            if (row === startingRow && !this.board[row + 2 * direction][col]) {
                moves.push([row + 2 * direction, col]);
            }
        }
        
        // Captures
        for (const dc of [-1, 1]) {
            const newRow = row + direction;
            const newCol = col + dc;
            
            if (this.isValidSquare(newRow, newCol)) {
                const targetPiece = this.board[newRow][newCol];
                if (targetPiece && !this.isPieceOwnedByCurrentPlayer(targetPiece)) {
                    moves.push([newRow, newCol]);
                } else if (this.enPassantTarget && 
                          this.enPassantTarget[0] === newRow && 
                          this.enPassantTarget[1] === newCol) {
                    moves.push([newRow, newCol]);
                }
            }
        }
        
        return moves;
    }

    isValidSquare(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }

    getRookMoves(row, col) {
        const moves = [];
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        
        for (const [dr, dc] of directions) {
            for (let i = 1; i < 8; i++) {
                const newRow = row + dr * i;
                const newCol = col + dc * i;
                
                if (!this.isValidSquare(newRow, newCol)) break;
                
                const targetPiece = this.board[newRow][newCol];
                if (!targetPiece) {
                    moves.push([newRow, newCol]);
                } else {
                    if (!this.isPieceOwnedByCurrentPlayer(targetPiece)) {
                        moves.push([newRow, newCol]);
                    }
                    break;
                }
            }
        }
        
        return moves;
    }

    getBishopMoves(row, col) {
        const moves = [];
        const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
        
        for (const [dr, dc] of directions) {
            for (let i = 1; i < 8; i++) {
                const newRow = row + dr * i;
                const newCol = col + dc * i;
                
                if (!this.isValidSquare(newRow, newCol)) break;
                
                const targetPiece = this.board[newRow][newCol];
                if (!targetPiece) {
                    moves.push([newRow, newCol]);
                } else {
                    if (!this.isPieceOwnedByCurrentPlayer(targetPiece)) {
                        moves.push([newRow, newCol]);
                    }
                    break;
                }
            }
        }
        
        return moves;
    }

    getKingMoves(row, col) {
        const moves = [];
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
        
        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            
            if (this.isValidSquare(newRow, newCol)) {
                const targetPiece = this.board[newRow][newCol];
                if (!targetPiece || !this.isPieceOwnedByCurrentPlayer(targetPiece)) {
                    moves.push([newRow, newCol]);
                }
            }
        }
        
        // Castling
        const color = this.currentPlayer;
        const kingRow = color === 'white' ? 7 : 0;
        
        if (row === kingRow && col === 4) { // King in starting position
            // Kingside castling
            if (this.castlingRights[color].kingside && 
                !this.board[kingRow][5] && !this.board[kingRow][6] &&
                !this.isSquareUnderAttack(kingRow, 4, color) &&
                !this.isSquareUnderAttack(kingRow, 5, color) &&
                !this.isSquareUnderAttack(kingRow, 6, color)) {
                moves.push([kingRow, 6]);
            }
            
            // Queenside castling
            if (this.castlingRights[color].queenside && 
                !this.board[kingRow][1] && !this.board[kingRow][2] && !this.board[kingRow][3] &&
                !this.isSquareUnderAttack(kingRow, 4, color) &&
                !this.isSquareUnderAttack(kingRow, 3, color) &&
                !this.isSquareUnderAttack(kingRow, 2, color)) {
                moves.push([kingRow, 2]);
            }
        }
        
        return moves;
    }

    getKnightMoves(row, col) {
        const moves = [];
        const knightMoves = [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]];
        
        for (const [dr, dc] of knightMoves) {
            const newRow = row + dr;
            const newCol = col + dc;
            
            if (this.isValidSquare(newRow, newCol)) {
                const targetPiece = this.board[newRow][newCol];
                if (!targetPiece || !this.isPieceOwnedByCurrentPlayer(targetPiece)) {
                    moves.push([newRow, newCol]);
                }
            }
        }
        
        return moves;
    }

    isValidMove(fromRow, fromCol, toRow, toCol) {
        return this.validMoves.some(([row, col]) => row === toRow && col === toCol);
    }

    makeMove(move) {
        const { from, to, piece, isEnPassant, isCastling, isPromotion, promotionPiece } = move;
        const [fromRow, fromCol] = from;
        const [toRow, toCol] = to;
        
        // Record the move
        this.moveHistory.push(move);
        
        // Handle en passant capture
        if (isEnPassant) {
            const capturedPawnRow = this.currentPlayer === 'white' ? toRow + 1 : toRow - 1;
            this.board[capturedPawnRow][toCol] = null;
        }
        
        // Handle castling
        if (isCastling) {
            const rookFromCol = toCol === 6 ? 7 : 0; // Kingside or queenside
            const rookToCol = toCol === 6 ? 5 : 3;
            const rookRow = fromRow;
            
            // Move the rook
            this.board[rookRow][rookToCol] = this.board[rookRow][rookFromCol];
            this.board[rookRow][rookFromCol] = null;
        }
        
        // Make the main move
        this.board[toRow][toCol] = this.board[fromRow][fromCol];
        this.board[fromRow][fromCol] = null;
        
        // Handle pawn promotion
        if (isPromotion && promotionPiece) {
            this.board[toRow][toCol] = promotionPiece;
        }
        
        // Update castling rights
        this.updateCastlingRights(fromRow, fromCol, toRow, toCol, piece);
        
        // Update en passant target
        this.updateEnPassantTarget(fromRow, fromCol, toRow, toCol, piece);
        
        // Update move counters
        if (piece === '♙' || piece === '♟' || move.captured) {
            this.halfMoveClock = 0;
        } else {
            this.halfMoveClock++;
        }
        
        if (this.currentPlayer === 'black') {
            this.fullMoveNumber++;
        }
    }

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
    }

    updateCurrentPlayer() {
        this.currentPlayerElement.textContent = this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1);
    }

    // Check if a move would expose the king to check
    wouldMoveExposeKing(fromRow, fromCol, toRow, toCol) {
        // Make a temporary move
        const originalPiece = this.board[toRow][toCol];
        const movingPiece = this.board[fromRow][fromCol];
        
        this.board[toRow][toCol] = movingPiece;
        this.board[fromRow][fromCol] = null;
        
        // Find the king position
        const kingPosition = this.findKing(this.currentPlayer);
        let wouldExposeKing = false;
        
        if (kingPosition) {
            // If moving the king, check the new position
            const checkRow = (movingPiece === '♔' || movingPiece === '♚') ? toRow : kingPosition[0];
            const checkCol = (movingPiece === '♔' || movingPiece === '♚') ? toCol : kingPosition[1];
            
            wouldExposeKing = this.isSquareUnderAttack(checkRow, checkCol, this.currentPlayer);
        }
        
        // Restore the board
        this.board[fromRow][fromCol] = movingPiece;
        this.board[toRow][toCol] = originalPiece;
        
        return wouldExposeKing;
    }

    // Find the king of the specified color
    findKing(color) {
        const kingPiece = color === 'white' ? '♔' : '♚';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.board[row][col] === kingPiece) {
                    return [row, col];
                }
            }
        }
        return null;
    }

    // Check if a square is under attack by the opponent
    isSquareUnderAttack(row, col, defendingColor) {
        const attackingColor = defendingColor === 'white' ? 'black' : 'white';
        
        // Temporarily switch to attacking color to check their moves
        const originalPlayer = this.currentPlayer;
        this.currentPlayer = attackingColor;
        
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.board[r][c];
                if (piece && this.isPieceOwnedByCurrentPlayer(piece)) {
                    const moves = this.getValidMovesWithoutCheckTest(r, c);
                    if (moves.some(([moveRow, moveCol]) => moveRow === row && moveCol === col)) {
                        this.currentPlayer = originalPlayer;
                        return true;
                    }
                }
            }
        }
        
        this.currentPlayer = originalPlayer;
        return false;
    }

    // Get valid moves without testing for check (to avoid infinite recursion)
    getValidMovesWithoutCheckTest(row, col) {
        const piece = this.board[row][col];
        let moves = [];
        
        switch (piece) {
            case '♙': // White pawn
                moves = this.getPawnMovesWithoutCheck(row, col, 'white');
                break;
            case '♟': // Black pawn
                moves = this.getPawnMovesWithoutCheck(row, col, 'black');
                break;
            case '♖': case '♜': // Rooks
                moves.push(...this.getRookMoves(row, col));
                break;
            case '♗': case '♝': // Bishops
                moves.push(...this.getBishopMoves(row, col));
                break;
            case '♕': case '♛': // Queens
                moves.push(...this.getRookMoves(row, col));
                moves.push(...this.getBishopMoves(row, col));
                break;
            case '♔': case '♚': // Kings
                moves.push(...this.getKingMovesWithoutCastling(row, col));
                break;
            case '♘': case '♞': // Knights
                moves.push(...this.getKnightMoves(row, col));
                break;
        }
        
        return moves;
    }

    getPawnMovesWithoutCheck(row, col, color) {
        const moves = [];
        const direction = color === 'white' ? -1 : 1;
        const startingRow = color === 'white' ? 6 : 1;
        
        // Forward move
        if (this.isValidSquare(row + direction, col) && !this.board[row + direction][col]) {
            moves.push([row + direction, col]);
            
            // Initial two-square move
            if (row === startingRow && !this.board[row + 2 * direction][col]) {
                moves.push([row + 2 * direction, col]);
            }
        }
        
        // Captures (including en passant)
        for (const dc of [-1, 1]) {
            const newRow = row + direction;
            const newCol = col + dc;
            
            if (this.isValidSquare(newRow, newCol)) {
                const targetPiece = this.board[newRow][newCol];
                if (targetPiece && !this.isPieceOwnedByCurrentPlayer(targetPiece)) {
                    moves.push([newRow, newCol]);
                }
            }
        }
        
        return moves;
    }

    getKingMovesWithoutCastling(row, col) {
        const moves = [];
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
        
        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            
            if (this.isValidSquare(newRow, newCol)) {
                const targetPiece = this.board[newRow][newCol];
                if (!targetPiece || !this.isPieceOwnedByCurrentPlayer(targetPiece)) {
                    moves.push([newRow, newCol]);
                }
            }
        }
        
        return moves;
    }

    // Check for special moves
    isEnPassantCapture(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        if (piece !== '♙' && piece !== '♟') return false;
        
        return this.enPassantTarget && 
               this.enPassantTarget[0] === toRow && 
               this.enPassantTarget[1] === toCol;
    }

    isCastlingMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        if (piece !== '♔' && piece !== '♚') return false;
        
        return fromRow === toRow && Math.abs(fromCol - toCol) === 2;
    }

    isPawnPromotion(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        if (piece !== '♙' && piece !== '♟') return false;
        
        return (piece === '♙' && toRow === 0) || (piece === '♟' && toRow === 7);
    }

    updateCastlingRights(fromRow, fromCol, toRow, toCol, piece) {
        const color = this.currentPlayer;
        
        // King moves
        if (piece === '♔' || piece === '♚') {
            this.castlingRights[color].kingside = false;
            this.castlingRights[color].queenside = false;
        }
        
        // Rook moves or is captured
        if (piece === '♖' || piece === '♜' || 
            (fromRow === 7 && fromCol === 0) || (fromRow === 7 && fromCol === 7) ||
            (fromRow === 0 && fromCol === 0) || (fromRow === 0 && fromCol === 7)) {
            
            if ((fromRow === 7 && fromCol === 0) || (toRow === 7 && toCol === 0)) {
                this.castlingRights.white.queenside = false;
            }
            if ((fromRow === 7 && fromCol === 7) || (toRow === 7 && toCol === 7)) {
                this.castlingRights.white.kingside = false;
            }
            if ((fromRow === 0 && fromCol === 0) || (toRow === 0 && toCol === 0)) {
                this.castlingRights.black.queenside = false;
            }
            if ((fromRow === 0 && fromCol === 7) || (toRow === 0 && toCol === 7)) {
                this.castlingRights.black.kingside = false;
            }
        }
    }

    updateEnPassantTarget(fromRow, fromCol, toRow, toCol, piece) {
        this.enPassantTarget = null;
        
        // Check for pawn two-square move
        if ((piece === '♙' || piece === '♟') && Math.abs(fromRow - toRow) === 2) {
            this.enPassantTarget = [(fromRow + toRow) / 2, fromCol];
        }
    }

    updateGameStatus() {
        if (this.gameState === 'setup') {
            this.currentPlayerElement.textContent = 'Set up game timer and click Start Game';
            return;
        }
        
        const kingPosition = this.findKing(this.currentPlayer);
        const inCheck = kingPosition ? this.isSquareUnderAttack(kingPosition[0], kingPosition[1], this.currentPlayer) : false;
        
        // Reset all status classes
        this.gameStatusElement.className = 'current-player';
        
        // Check for checkmate or stalemate
        const hasValidMoves = this.hasValidMoves();
        
        if (!hasValidMoves) {
            if (inCheck) {
                this.gameState = 'checkmate';
                this.gameStatusElement.classList.add('checkmate');
                const winner = this.currentPlayer === 'white' ? 'Black' : 'White';
                this.currentPlayerElement.textContent = `Checkmate!`;
                this.showGameResult('Checkmate!', `${winner} wins the game!`);
                this.stopTimer();
                return;
            } else {
                this.gameState = 'stalemate';
                this.gameStatusElement.classList.add('stalemate');
                this.currentPlayerElement.textContent = 'Stalemate!';
                this.showGameResult('Stalemate!', 'The game is a draw!');
                this.stopTimer();
                return;
            }
        }
        
        if (inCheck) {
            this.gameState = 'check';
            this.gameStatusElement.classList.add('check');
            this.currentPlayerElement.textContent = `${this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1)} (Check!)`;
        } else {
            this.gameState = 'playing';
            this.updateCurrentPlayer();
        }
        
        // Check for 50-move rule
        if (this.halfMoveClock >= 100) { // 50 moves for each player
            this.gameState = 'draw';
            this.gameStatusElement.classList.add('draw');
            this.currentPlayerElement.textContent = 'Draw by 50-move rule!';
            this.showGameResult('Draw!', 'Game ended by 50-move rule!');
            this.stopTimer();
        }
        
        // Show draw offer message
        if (this.drawOffered) {
            this.currentPlayerElement.textContent += ' (Draw offered)';
        }
        
        this.updateTimerDisplay();
    }

    showGameResult(title, message) {
        this.resultTitle.textContent = title;
        this.resultMessage.textContent = message;
        this.resultModal.style.display = 'block';
    }

    closeResultModal() {
        this.resultModal.style.display = 'none';
    }

    startNewGame() {
        this.closeResultModal();
        this.resetGame();
    }

    resignGame() {
        if (this.gameState !== 'playing' && this.gameState !== 'check') return;
        
        const winner = this.currentPlayer === 'white' ? 'Black' : 'White';
        this.gameState = 'resigned';
        this.stopTimer();
        this.showGameResult('Game Resigned', `${this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1)} resigned. ${winner} wins!`);
    }

    offerDraw() {
        if (this.gameState !== 'playing' && this.gameState !== 'check') return;
        
        if (this.drawOffered) {
            // Accept the draw offer
            this.gameState = 'draw';
            this.stopTimer();
            this.showGameResult('Draw Accepted', 'Both players agreed to a draw!');
        } else {
            // Offer a draw
            this.drawOffered = true;
            this.updateGameStatus();
        }
    }

    hasValidMoves() {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && this.isPieceOwnedByCurrentPlayer(piece)) {
                    const validMoves = this.getValidMoves(row, col);
                    if (validMoves.length > 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    resetGame() {
        this.board = this.initializeBoard();
        this.currentPlayer = 'white';
        this.selectedSquare = null;
        this.validMoves = [];
        this.gameState = this.timerEnabled ? 'setup' : 'playing';
        this.moveHistory = [];
        this.castlingRights = {
            white: { kingside: true, queenside: true },
            black: { kingside: true, queenside: true }
        };
        this.enPassantTarget = null;
        this.halfMoveClock = 0;
        this.fullMoveNumber = 1;
        this.drawOffered = false;
        this.pendingPromotion = null;
        
        // Reset timers
        this.stopTimer();
        const timerValue = parseInt(this.timerSelect.value) || 0;
        if (this.timerSelect.value === 'custom') {
            const customMinutes = parseInt(this.customTimerInput.value) || 0;
            this.timers.white = customMinutes * 60;
            this.timers.black = customMinutes * 60;
        } else {
            this.timers.white = timerValue;
            this.timers.black = timerValue;
        }
        
        // Show/hide start button
        this.startTimerBtn.style.display = this.timerEnabled ? 'inline-block' : 'none';
        
        // Close any open modals
        this.promotionModal.style.display = 'none';
        this.resultModal.style.display = 'none';
        
        this.renderBoard();
        this.updateGameStatus();
        this.updateTimerDisplay();
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ChessGame();
});
