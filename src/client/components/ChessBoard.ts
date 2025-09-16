import { ChessEngine } from '../engine/ChessEngine';
import { GameSettings, Square, Piece, Move, PieceColor } from '../../shared/types';
import { ChessUtils } from '../../shared/utils';

export class ChessBoard {
  private container: HTMLElement;
  private engine: ChessEngine;
  private settings: GameSettings;
  private boardElement!: HTMLElement;
  private isFlipped: boolean = false;
  private selectedSquare: Square | null = null;
  private draggedPiece: { piece: Piece; square: Square } | null = null;
  private legalMoves: Array<{ to: Square, promotion?: string }> = [];
  private promotionCallback: ((pieceType: string) => void) | null = null;
  private moveCallback?: (move: Move) => void;
  private boundMouseMove: (event: MouseEvent) => void;
  private boundMouseUp: (event: MouseEvent) => void;
  private isDragging: boolean = false;
  private dragStartTime: number = 0;
  private dragStartPosition: { x: number; y: number } = { x: 0, y: 0 };
  private animationTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(container: HTMLElement, engine: ChessEngine, settings: GameSettings, moveCallback?: (move: Move) => void) {
    this.container = container;
    this.engine = engine;
    this.settings = settings;
    this.moveCallback = moveCallback;
    
    // Bind event handlers to avoid memory leaks
    this.boundMouseMove = this.handleMouseMove.bind(this);
    this.boundMouseUp = this.handleMouseUp.bind(this);
    
    this.createBoard();
    this.setupEventListeners();
    this.updatePosition();
  }

  private createBoard(): void {
    this.container.innerHTML = `
      <div class="chess-board-container">
        <div class="chess-board ${this.isFlipped ? 'flipped' : ''}" data-theme="${this.settings.boardTheme}">
          ${this.createSquares()}
        </div>
        ${this.settings.showCoordinates ? this.createCoordinates() : ''}
      </div>
    `;

    this.boardElement = this.container.querySelector('.chess-board')!;
  }

  private createSquares(): string {
    let html = '';

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = ChessUtils.indexToSquare(row, col);
        const isLight = (row + col) % 2 === 1;

        html += `
          <div 
            class="chess-square ${isLight ? 'light' : 'dark'}" 
            data-square="${square}"
            data-row="${row}"
            data-col="${col}"
          >
            <div class="piece-container"></div>
          </div>
        `;
      }
    }

    return html;
  }

  private createCoordinates(): string {
    const files = this.isFlipped ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'] : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = this.isFlipped ? ['1', '2', '3', '4', '5', '6', '7', '8'] : ['8', '7', '6', '5', '4', '3', '2', '1'];

    return `
      <div class="coordinates">
        <div class="files">
          ${files.map(file => `<div class="file-label">${file}</div>`).join('')}
        </div>
        <div class="ranks">
          ${ranks.map(rank => `<div class="rank-label">${rank}</div>`).join('')}
        </div>
      </div>
    `;
  }

  private setupEventListeners(): void {
    this.boardElement.addEventListener('mousedown', this.handleMouseDown.bind(this));
    // Note: mousemove and mouseup are added dynamically during drag to avoid conflicts

    // Touch events for mobile
    this.boardElement.addEventListener('touchstart', this.handleTouchStart.bind(this));
    this.boardElement.addEventListener('touchmove', this.handleTouchMove.bind(this));
    this.boardElement.addEventListener('touchend', this.handleTouchEnd.bind(this));

    // Prevent context menu on right click
    this.boardElement.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private handleMouseDown(event: MouseEvent): void {
    if (event.button !== 0) return; // Only left click
    
    // Prevent text selection
    event.preventDefault();

    const square = this.getSquareFromEvent(event);
    if (!square) return;

    const piece = this.engine.getPiece(square);
    
    // If there's already a drag in progress, ignore new mouse down
    if (this.draggedPiece) return;
    
    // Always handle as selection first, regardless of piece
    this.handleSquareSelection(square);
    
    // Only set up potential drag if there's a piece belonging to current player
    if (piece && piece.color === this.engine.getGameState().currentPlayer) {
      this.dragStartTime = Date.now();
      this.dragStartPosition = { x: event.clientX, y: event.clientY };
      this.isDragging = false; // Will be set to true if user actually drags
      this.draggedPiece = { piece, square };
      // Add global mouse events for dragging
      document.addEventListener('mousemove', this.boundMouseMove);
      document.addEventListener('mouseup', this.boundMouseUp);
    }
  }

  private handleMouseMove(event: MouseEvent): void {
    if (this.draggedPiece && !this.isDragging) {
      // Check if we've moved enough to consider this a drag
      const distance = Math.sqrt(
        Math.pow(event.clientX - this.dragStartPosition.x, 2) +
        Math.pow(event.clientY - this.dragStartPosition.y, 2)
      );
      
      // Start dragging if moved more than 5 pixels
      if (distance > 5) {
        this.isDragging = true;
      }
    }
    
    if (this.draggedPiece && this.isDragging) {
      this.updateDragPosition(event);
    }
  }

  private handleMouseUp(event: MouseEvent): void {
    // Remove global mouse events first to prevent multiple calls
    document.removeEventListener('mousemove', this.boundMouseMove);
    document.removeEventListener('mouseup', this.boundMouseUp);
    
    if (this.draggedPiece && this.isDragging) {
      // Was a real drag - attempt to move to target square
      const targetSquare = this.getSquareFromEvent(event);
      this.endDrag(targetSquare);
    } else if (this.draggedPiece) {
      // Was just a click - clean up drag state without doing anything
      // (selection was already handled in mousedown)
      this.endDrag(null, true); // preserve selection
    }
    
    // Reset drag state
    this.isDragging = false;
    this.dragStartTime = 0;
    this.dragStartPosition = { x: 0, y: 0 };
  }

  private handleSquareSelection(square: Square): void {
    const piece = this.engine.getPiece(square);
    const currentPlayer = this.engine.getGameState().currentPlayer;
    
    if (this.selectedSquare) {
      if (this.selectedSquare === square) {
        // Clicking the same square - deselect
        this.clearSelection();
      } else if (piece && piece.color === currentPlayer) {
        // Clicking another piece of same color - select it instead
        this.selectSquare(square);
      } else {
        // Clicking different square - attempt move
        this.attemptMove(this.selectedSquare, square);
      }
    } else {
      // No piece selected - select this square if it has a piece of current player
      if (piece && piece.color === currentPlayer) {
        this.selectSquare(square);
      }
    }
  }

  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault();
    const touch = event.touches[0];
    const square = this.getSquareFromTouch(touch);

    if (square) {
      const piece = this.engine.getPiece(square);
      
      // Always handle as selection first
      this.handleSquareSelection(square);
      
      // Set up drag if it's a draggable piece
      if (piece && piece.color === this.engine.getGameState().currentPlayer) {
        this.draggedPiece = { piece, square };
        this.isDragging = true; // Touch is always considered dragging
      }
    }
  }

  private handleTouchMove(event: TouchEvent): void {
    event.preventDefault();
    if (this.draggedPiece) {
      const touch = event.touches[0];
      this.updateDragPosition(touch);
    }
  }

  private handleTouchEnd(event: TouchEvent): void {
    event.preventDefault();
    if (this.draggedPiece) {
      const touch = event.changedTouches[0];
      const targetSquare = this.getSquareFromTouch(touch);
      this.endDrag(targetSquare);
    }
  }

  private getSquareFromEvent(event: MouseEvent): Square | null {
    const element = event.target as HTMLElement;
    const squareElement = element.closest('.chess-square') as HTMLElement;
    return squareElement?.dataset.square || null;
  }

  private getSquareFromTouch(touch: Touch): Square | null {
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const squareElement = element?.closest('.chess-square') as HTMLElement;
    return squareElement?.dataset.square || null;
  }

  private updateDragPosition(pointer: MouseEvent | Touch): void {
    if (!this.draggedPiece) return;

    let draggedElement = this.container.querySelector('.dragged-piece') as HTMLElement;
    
    // Create drag element if it doesn't exist yet (first drag movement)
    if (!draggedElement) {
      // Remove any existing dragged pieces first
      this.container.querySelectorAll('.dragged-piece').forEach(el => el.remove());
      
      const pieceElement = this.createPieceElement(this.draggedPiece.piece);
      pieceElement.classList.add('dragged-piece');
      this.container.appendChild(pieceElement);
      draggedElement = pieceElement;
      
      // Completely hide the original piece while dragging
      const originalSquareElement = this.getSquareElement(this.draggedPiece.square);
      const originalPieceContainer = originalSquareElement?.querySelector('.piece-container') as HTMLElement;
      if (originalPieceContainer) {
        originalPieceContainer.style.display = 'none';
      }
    }

    const containerRect = this.container.getBoundingClientRect();
    const squareSize = this.boardElement.getBoundingClientRect().width / 8;
    const halfSquare = squareSize / 2;
    
    // Position relative to the page, but make sure it stays within reasonable bounds
    draggedElement.style.left = `${pointer.clientX - containerRect.left - halfSquare}px`;
    draggedElement.style.top = `${pointer.clientY - containerRect.top - halfSquare}px`;
  }

  private endDrag(targetSquare: Square | null, preserveSelection: boolean = false): void {
    if (!this.draggedPiece) return;

    // Restore display of original piece
    const originalSquareElement = this.getSquareElement(this.draggedPiece.square);
    const originalPieceContainer = originalSquareElement?.querySelector('.piece-container') as HTMLElement;
    if (originalPieceContainer) {
      originalPieceContainer.style.display = '';
    }

    // Remove dragged piece element
    const draggedElement = this.container.querySelector('.dragged-piece');
    if (draggedElement) {
      draggedElement.remove();
    }

    if (targetSquare && targetSquare !== this.draggedPiece.square) {
      this.attemptMove(this.draggedPiece.square, targetSquare);
    } else if (!preserveSelection) {
      this.updatePosition();
    }

    this.draggedPiece = null;
  }

  private selectSquare(square: Square): void {
    this.clearSelection();
    
    const piece = this.engine.getPiece(square);
    // Only select squares with pieces that belong to the current player
    if (piece && piece.color === this.engine.getGameState().currentPlayer) {
      this.selectedSquare = square;
      
      const squareElement = this.getSquareElement(square);
      squareElement?.classList.add('selected');
      
      this.legalMoves = this.engine.getLegalMoves(square);
      this.highlightLegalMoves();
    }
  }

  private clearSelection(): void {
    // Remove selection highlight
    this.boardElement.querySelectorAll('.selected').forEach(el => {
      el.classList.remove('selected');
    });

    // Remove legal move highlights
    this.boardElement.querySelectorAll('.legal-move, .legal-capture').forEach(el => {
      el.classList.remove('legal-move', 'legal-capture');
    });

    this.selectedSquare = null;
    this.legalMoves = [];
  }

  private highlightLegalMoves(): void {
    if (!this.settings.highlightLegalMoves) return;

    this.legalMoves.forEach(move => {
      const squareElement = this.getSquareElement(move.to);
      if (squareElement) {
        const isCapture = this.engine.getPiece(move.to) !== null;
        squareElement.classList.add(isCapture ? 'legal-capture' : 'legal-move');
      }
    });
  }

  private attemptMove(from: Square, to: Square): void {
    // Check if it's a promotion move
    const piece = this.engine.getPiece(from);
    if (piece?.type === 'pawn') {
      const toRank = ChessUtils.squareToPosition(to).rank;
      const promotionRank = piece.color === 'white' ? 8 : 1;

      if (toRank === promotionRank && this.engine.isValidMove(from, to)) {
        this.showPromotionDialog(from, to);
        return;
      }
    }

    const move = this.engine.makeMove(from, to);
    if (move) {
      this.updatePosition();
      this.clearSelection();
      this.animateMove(move);

      // Notify the parent component about the move
      if (this.moveCallback) {
        this.moveCallback(move);
      }
    } else {
      this.clearSelection();
    }
  }

  private showPromotionDialog(from: Square, to: Square): void {
    const piece = this.engine.getPiece(from)!;
    const promotionPieces = ['queen', 'rook', 'bishop', 'knight'];

    const dialog = document.createElement('div');
    dialog.className = 'promotion-dialog';
    dialog.innerHTML = `
      <div class="promotion-pieces">
        ${promotionPieces.map(pieceType => `
          <div class="promotion-piece" data-piece="${pieceType}">
            ${this.getPieceSymbol(pieceType, piece.color)}
          </div>
        `).join('')}
      </div>
    `;

    this.container.appendChild(dialog);

    this.promotionCallback = (pieceType: string) => {
      const move = this.engine.makeMove(from, to, pieceType as any);
      if (move) {
        this.updatePosition();
        this.animateMove(move);

        // Notify the parent component about the move
        if (this.moveCallback) {
          this.moveCallback(move);
        }
      }
      this.clearSelection();
      dialog.remove();
      this.promotionCallback = null;
    };

    dialog.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const pieceElement = target.closest('.promotion-piece') as HTMLElement;
      if (pieceElement && this.promotionCallback) {
        this.promotionCallback(pieceElement.dataset.piece!);
      }
    });
  }

  public animateMove(move: Move): void {
    if (this.settings.animationSpeed === 0) return;

    // Cancel any existing animations first
    this.cancelAnimations();

    const fromElement = this.getSquareElement(move.from);
    const toElement = this.getSquareElement(move.to);

    if (!fromElement || !toElement) return;

    // Get the piece that moved
    const fromContainer = fromElement.querySelector('.piece-container') as HTMLElement;
    const toContainer = toElement.querySelector('.piece-container') as HTMLElement;
    
    if (!fromContainer || !toContainer) return;

    // Create a temporary animated piece
    const animatedPiece = fromContainer.cloneNode(true) as HTMLElement;
    animatedPiece.style.position = 'absolute';
    animatedPiece.style.zIndex = '999';
    animatedPiece.style.pointerEvents = 'none';
    animatedPiece.classList.add('animated-piece'); // Add class for easy cleanup
    
    // Position it at the starting square
    const fromRect = fromElement.getBoundingClientRect();
    const boardRect = this.boardElement.getBoundingClientRect();
    
    animatedPiece.style.left = `${fromRect.left - boardRect.left}px`;
    animatedPiece.style.top = `${fromRect.top - boardRect.top}px`;
    animatedPiece.style.width = `${fromRect.width}px`;
    animatedPiece.style.height = `${fromRect.height}px`;
    
    this.boardElement.appendChild(animatedPiece);
    
    // Hide the original piece temporarily
    fromContainer.style.opacity = '0';
    
    // Animate to the target square
    const toRect = toElement.getBoundingClientRect();
    const duration = 300 / this.settings.animationSpeed;
    
    animatedPiece.style.transition = `all ${duration}ms ease-in-out`;
    
    // Force a reflow to ensure the transition is applied
    animatedPiece.offsetHeight;
    
    animatedPiece.style.left = `${toRect.left - boardRect.left}px`;
    animatedPiece.style.top = `${toRect.top - boardRect.top}px`;
    
    // Clean up after animation
    this.animationTimeout = setTimeout(() => {
      if (animatedPiece.parentNode) {
        animatedPiece.remove();
      }
      fromContainer.style.opacity = '';
      // Ensure the final position is correct
      this.updatePosition();
      this.animationTimeout = null;
    }, duration);
  }

  public cancelAnimations(): void {
    // Cancel any pending animation timeout
    if (this.animationTimeout) {
      clearTimeout(this.animationTimeout);
      this.animationTimeout = null;
    }

    // Remove any animated pieces
    this.boardElement.querySelectorAll('.animated-piece').forEach(el => el.remove());
    
    // Remove any dragged pieces that might still be around
    this.container.querySelectorAll('.dragged-piece').forEach(el => el.remove());
    
    // Restore opacity, visibility, and display of all piece containers
    this.boardElement.querySelectorAll('.piece-container').forEach(el => {
      const container = el as HTMLElement;
      container.style.opacity = '';
      container.style.visibility = '';
      container.style.display = '';
    });
    
    // Clean up any drag state
    this.draggedPiece = null;
    this.isDragging = false;
  }

  public updatePosition(): void {
    const gameState = this.engine.getGameState();

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = ChessUtils.indexToSquare(row, col);
        const piece = this.engine.getPiece(square);
        const squareElement = this.getSquareElement(square);
        const pieceContainer = squareElement?.querySelector('.piece-container');

        if (pieceContainer) {
          if (piece) {
            pieceContainer.innerHTML = this.getPieceSymbol(piece.type, piece.color);
            pieceContainer.className = `piece-container piece-${piece.color} piece-${piece.type}`;
          } else {
            pieceContainer.innerHTML = '';
            pieceContainer.className = 'piece-container';
          }
        }
      }
    }
    
    // Force a repaint to ensure visual updates are applied
    this.boardElement.offsetHeight;
  }

  private createPieceElement(piece: Piece): HTMLElement {
    const element = document.createElement('div');
    element.className = `piece-element piece-${piece.color} piece-${piece.type}`;
    element.innerHTML = this.getPieceSymbol(piece.type, piece.color);
    element.style.position = 'absolute';
    element.style.pointerEvents = 'none';
    element.style.userSelect = 'none';
    element.style.zIndex = '1000';
    
    // Calculate dynamic size based on board size
    const rect = this.boardElement.getBoundingClientRect();
    const squareSize = Math.floor(rect.width / 8);
    
    element.style.width = `${squareSize}px`;
    element.style.height = `${squareSize}px`;
    element.style.fontSize = `${Math.floor(squareSize * 0.8)}px`;
    element.style.textAlign = 'center';
    element.style.lineHeight = `${squareSize}px`;
    element.style.display = 'flex';
    element.style.alignItems = 'center';
    element.style.justifyContent = 'center';
    
    return element;
  }

  private getPieceSymbol(type: string, color: PieceColor): string {
    const symbols: { [key: string]: { white: string; black: string } } = {
      king: { white: '♔', black: '♚' },
      queen: { white: '♕', black: '♛' },
      rook: { white: '♖', black: '♜' },
      bishop: { white: '♗', black: '♝' },
      knight: { white: '♘', black: '♞' },
      pawn: { white: '♙', black: '♟' }
    };

    return symbols[type]?.[color] || '';
  }

  private getSquareElement(square: Square): HTMLElement | null {
    return this.boardElement.querySelector(`[data-square="${square}"]`);
  }

  public flipBoard(): void {
    this.isFlipped = !this.isFlipped;
    
    // Clear any current selection
    this.clearSelection();
    
    // Toggle the flipped class instead of rebuilding
    this.boardElement.classList.toggle('flipped', this.isFlipped);
    
    // Update coordinates if they are shown
    if (this.settings.showCoordinates) {
      const coordinatesElement = this.container.querySelector('.coordinates');
      if (coordinatesElement) {
        coordinatesElement.innerHTML = this.createCoordinates().replace(/<div class="coordinates">|<\/div>$/g, '');
      }
    }
  }

  public updateSettings(settings: GameSettings): void {
    this.settings = settings;

    // Update coordinates visibility
    const coordinatesElement = this.container.querySelector('.coordinates');
    if (settings.showCoordinates && !coordinatesElement) {
      this.container.insertAdjacentHTML('beforeend', this.createCoordinates());
    } else if (!settings.showCoordinates && coordinatesElement) {
      coordinatesElement.remove();
    }

    // Update highlights if needed
    if (this.selectedSquare) {
      this.selectSquare(this.selectedSquare);
    }
  }

  public updateAppearance(settings: GameSettings): void {
    this.settings = settings;
    this.boardElement.setAttribute('data-theme', settings.boardTheme);
  }

  public reset(engine: ChessEngine): void {
    this.engine = engine;
    this.clearSelection();
    this.updatePosition();
  }
}
