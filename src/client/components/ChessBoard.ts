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

  constructor(container: HTMLElement, engine: ChessEngine, settings: GameSettings, moveCallback?: (move: Move) => void) {
    this.container = container;
    this.engine = engine;
    this.settings = settings;
    this.moveCallback = moveCallback;
    this.createBoard();
    this.setupEventListeners();
    this.updatePosition();
  }

  private createBoard(): void {
    this.container.innerHTML = `
      <div class="chess-board-container">
        <div class="chess-board" data-theme="${this.settings.boardTheme}">
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
    this.boardElement.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.boardElement.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.boardElement.addEventListener('click', this.handleClick.bind(this));

    // Touch events for mobile
    this.boardElement.addEventListener('touchstart', this.handleTouchStart.bind(this));
    this.boardElement.addEventListener('touchmove', this.handleTouchMove.bind(this));
    this.boardElement.addEventListener('touchend', this.handleTouchEnd.bind(this));

    // Prevent context menu on right click
    this.boardElement.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private handleMouseDown(event: MouseEvent): void {
    if (event.button !== 0) return; // Only left click

    const square = this.getSquareFromEvent(event);
    if (!square) return;

    const piece = this.engine.getPiece(square);
    if (piece && piece.color === this.engine.getGameState().currentPlayer) {
      this.startDrag(square, piece, event);
    }
  }

  private handleMouseMove(event: MouseEvent): void {
    if (this.draggedPiece) {
      this.updateDragPosition(event);
    }
  }

  private handleMouseUp(event: MouseEvent): void {
    if (this.draggedPiece) {
      const targetSquare = this.getSquareFromEvent(event);
      this.endDrag(targetSquare);
    }
  }

  private handleClick(event: MouseEvent): void {
    const square = this.getSquareFromEvent(event);
    if (!square) return;

    if (this.selectedSquare) {
      if (this.selectedSquare === square) {
        this.clearSelection();
      } else {
        this.attemptMove(this.selectedSquare, square);
      }
    } else {
      this.selectSquare(square);
    }
  }

  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault();
    const touch = event.touches[0];
    const square = this.getSquareFromTouch(touch);

    if (square) {
      const piece = this.engine.getPiece(square);
      if (piece && piece.color === this.engine.getGameState().currentPlayer) {
        this.startDrag(square, piece, touch);
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

  private startDrag(square: Square, piece: Piece, pointer: MouseEvent | Touch): void {
    this.draggedPiece = { piece, square };
    this.selectSquare(square);

    // Create dragged piece element
    const pieceElement = this.createPieceElement(piece);
    pieceElement.classList.add('dragged-piece');
    this.container.appendChild(pieceElement);

    this.updateDragPosition(pointer);
  }

  private updateDragPosition(pointer: MouseEvent | Touch): void {
    if (!this.draggedPiece) return;

    const draggedElement = this.container.querySelector('.dragged-piece') as HTMLElement;
    if (draggedElement) {
      const rect = this.container.getBoundingClientRect();
      draggedElement.style.left = `${pointer.clientX - rect.left - 30}px`;
      draggedElement.style.top = `${pointer.clientY - rect.top - 30}px`;
    }
  }

  private endDrag(targetSquare: Square | null): void {
    if (!this.draggedPiece) return;

    // Remove dragged piece element
    const draggedElement = this.container.querySelector('.dragged-piece');
    if (draggedElement) {
      draggedElement.remove();
    }

    if (targetSquare && targetSquare !== this.draggedPiece.square) {
      this.attemptMove(this.draggedPiece.square, targetSquare);
    } else {
      this.updatePosition();
    }

    this.draggedPiece = null;
  }

  private selectSquare(square: Square): void {
    this.clearSelection();
    this.selectedSquare = square;

    const squareElement = this.getSquareElement(square);
    squareElement?.classList.add('selected');

    const piece = this.engine.getPiece(square);
    if (piece && piece.color === this.engine.getGameState().currentPlayer) {
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

  private animateMove(move: Move): void {
    if (this.settings.animationSpeed === 0) return;

    const fromElement = this.getSquareElement(move.from);
    const toElement = this.getSquareElement(move.to);

    if (!fromElement || !toElement) return;

    // Animation logic would go here
    // For now, just update immediately
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
  }

  private createPieceElement(piece: Piece): HTMLElement {
    const element = document.createElement('div');
    element.className = `piece-element piece-${piece.color} piece-${piece.type}`;
    element.innerHTML = this.getPieceSymbol(piece.type, piece.color);
    element.style.position = 'absolute';
    element.style.pointerEvents = 'none';
    element.style.width = '60px';
    element.style.height = '60px';
    element.style.fontSize = '48px';
    element.style.textAlign = 'center';
    element.style.lineHeight = '60px';
    element.style.zIndex = '1000';
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
    this.boardElement.classList.toggle('flipped', this.isFlipped);

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
