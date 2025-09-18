import { ChessEngine } from '../engine/ChessEngine';
import { Move, NotationEntry } from '../../shared/types';

export class NotationTable {
  private container: HTMLElement;
  private engine: ChessEngine;
  private moves: NotationEntry[] = [];
  private currentMoveIndex: number = -1;
  private tableElement!: HTMLElement;
  private onPositionChangeCallback?: (moveIndex: number) => void;

  constructor(container: HTMLElement, engine: ChessEngine) {
    this.container = container;
    this.engine = engine;
    this.createTable();
  }

  public setPositionChangeCallback(callback: (moveIndex: number) => void): void {
    this.onPositionChangeCallback = callback;
  }

  private createTable(): void {
    this.container.innerHTML = `
      <div class="notation-table">
        <div class="notation-header">
          <span class="header-title">Moves</span>
          <div class="notation-controls">
            <button class="notation-btn" data-action="start" title="Go to start">⟲</button>
            <button class="notation-btn" data-action="prev" title="Previous move">←</button>
            <button class="notation-btn" data-action="next" title="Next move">→</button>
            <button class="notation-btn" data-action="end" title="Go to end">⟳</button>
          </div>
        </div>
        <div class="notation-body">
          <div class="moves-list"></div>
        </div>
      </div>
    `;

    this.tableElement = this.container.querySelector('.moves-list')!;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.container.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const action = target.dataset.action;

      if (action) {
        this.handleNavigation(action);
      }

      // Handle move click
      const moveElement = target.closest('.move-item') as HTMLElement;
      if (moveElement) {
        const moveIndex = parseInt(moveElement.dataset.index!);
        this.goToMove(moveIndex);
      }
    });
  }

  private handleNavigation(action: string): void {
    switch (action) {
      case 'start':
        this.goToStart();
        break;
      case 'prev':
        this.goToPreviousMove();
        break;
      case 'next':
        this.goToNextMove();
        break;
      case 'end':
        this.goToEnd();
        break;
    }
  }

  public addMove(move: Move): void {
    const gameState = this.engine.getGameState();
    const moveNumber = Math.ceil(gameState.moves.length / 2);
    const isWhiteMove = move.piece.color === 'white';

    // Find or create the notation entry for this move number
    let notationEntry = this.moves.find(entry => entry.moveNumber === moveNumber);
    if (!notationEntry) {
      notationEntry = { moveNumber };
      this.moves.push(notationEntry);
    }

    // Add the move to the appropriate color
    if (isWhiteMove) {
      notationEntry.white = move;
    } else {
      notationEntry.black = move;
    }

    // Update to the latest move index (current position)
    this.currentMoveIndex = gameState.moves.length - 1;
    this.renderMoves();
  }

  public removeLastMove(): void {
    const gameState = this.engine.getGameState();

    if (this.moves.length === 0) return;

    const lastEntry = this.moves[this.moves.length - 1];

    // Remove the last move
    if (lastEntry.black) {
      delete lastEntry.black;
    } else if (lastEntry.white) {
      delete lastEntry.white;
      this.moves.pop();
    }

    this.currentMoveIndex = gameState.moves.length - 1;
    this.renderMoves();
  }

  private renderMoves(): void {
    this.tableElement.innerHTML = '';

    this.moves.forEach((entry, entryIndex) => {
      const moveRow = document.createElement('div');
      moveRow.className = 'move-row';

      // Move number
      const moveNumber = document.createElement('div');
      moveNumber.className = 'move-number';
      moveNumber.textContent = `${entry.moveNumber}.`;
      moveRow.appendChild(moveNumber);

      // White move
      const whiteMove = document.createElement('div');
      whiteMove.className = 'move-item white-move';
      if (entry.white) {
        const whiteIndex = (entry.moveNumber - 1) * 2;
        whiteMove.textContent = entry.white.san;
        whiteMove.dataset.index = whiteIndex.toString();
        whiteMove.title = `${entry.white.from}-${entry.white.to}`;

        if (whiteIndex === this.currentMoveIndex) {
          whiteMove.classList.add('current-move');
        }
      }
      moveRow.appendChild(whiteMove);

      // Black move
      const blackMove = document.createElement('div');
      blackMove.className = 'move-item black-move';
      if (entry.black) {
        const blackIndex = (entry.moveNumber - 1) * 2 + 1;
        blackMove.textContent = entry.black.san;
        blackMove.dataset.index = blackIndex.toString();
        blackMove.title = `${entry.black.from}-${entry.black.to}`;

        if (blackIndex === this.currentMoveIndex) {
          blackMove.classList.add('current-move');
        }
      }
      moveRow.appendChild(blackMove);

      this.tableElement.appendChild(moveRow);
    });

    // Update navigation button states
    this.updateNavigationButtons();

    // Scroll to current move
    this.scrollToCurrentMove();
  }

  private updateNavigationButtons(): void {
    const gameState = this.engine.getGameState();
    const totalMoves = gameState.moves.length;
    
    const startBtn = this.container.querySelector('[data-action="start"]') as HTMLButtonElement;
    const prevBtn = this.container.querySelector('[data-action="prev"]') as HTMLButtonElement;
    const nextBtn = this.container.querySelector('[data-action="next"]') as HTMLButtonElement;
    const endBtn = this.container.querySelector('[data-action="end"]') as HTMLButtonElement;

    if (startBtn) startBtn.disabled = this.currentMoveIndex <= -1;
    if (prevBtn) prevBtn.disabled = this.currentMoveIndex <= -1;
    if (nextBtn) nextBtn.disabled = this.currentMoveIndex >= totalMoves - 1;
    if (endBtn) endBtn.disabled = this.currentMoveIndex >= totalMoves - 1;
  }

  private scrollToCurrentMove(): void {
    const currentMoveElement = this.tableElement.querySelector('.current-move');
    if (currentMoveElement) {
      currentMoveElement.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }

  public goToMove(moveIndex: number): void {
    const gameState = this.engine.getGameState();
    const totalMoves = gameState.moves.length;

    if (moveIndex < -1 || moveIndex >= totalMoves) return;

    this.currentMoveIndex = moveIndex;

    // Don't change the actual engine state - just update display
    // The main app will handle updating the display engine
    
    // Trigger board update callback with the move index
    if (this.onPositionChangeCallback) {
      this.onPositionChangeCallback(moveIndex);
    }

    this.renderMoves();
  }

  public goToStart(): void {
    this.goToMove(-1);
  }

  public goToEnd(): void {
    const gameState = this.engine.getGameState();
    const lastMoveIndex = gameState.moves.length - 1;
    this.goToMove(lastMoveIndex);
  }

  public goToPreviousMove(): void {
    this.goToMove(this.currentMoveIndex - 1);
  }

  public goToNextMove(): void {
    this.goToMove(this.currentMoveIndex + 1);
  }

  public syncWithCurrentPosition(): void {
    // Sync notation table with the actual game state
    const gameState = this.engine.getGameState();
    this.currentMoveIndex = gameState.moves.length - 1;
    this.renderMoves();
  }

  public getCurrentMoveIndex(): number {
    return this.currentMoveIndex;
  }

  public isAtCurrentPosition(): boolean {
    const gameState = this.engine.getGameState();
    return this.currentMoveIndex === gameState.moves.length - 1;
  }

  public reset(): void {
    this.moves = [];
    this.currentMoveIndex = -1;
    this.renderMoves();
  }

  public exportPGN(): string {
    let pgn = '';

    // Add headers
    pgn += '[Event "Chess Platform Game"]\n';
    pgn += '[Site "Chess Platform"]\n';
    pgn += `[Date "${new Date().toISOString().split('T')[0]}"]\n`;
    pgn += '[Round "1"]\n';
    pgn += '[White "White Player"]\n';
    pgn += '[Black "Black Player"]\n';

    const gameState = this.engine.getGameState();
    const result = this.engine.getGameResult();
    pgn += `[Result "${result === '*' ? '*' : result}"]\n\n`;

    // Add moves
    this.moves.forEach(entry => {
      pgn += `${entry.moveNumber}.`;

      if (entry.white) {
        pgn += ` ${entry.white.san}`;
      }

      if (entry.black) {
        pgn += ` ${entry.black.san}`;
      }

      pgn += ' ';
    });

    // Add result
    pgn += result === '*' ? '*' : result;

    return pgn.trim();
  }

  public importPGN(pgn: string): boolean {
    try {
      // This is a simplified PGN parser
      // A full implementation would need a proper PGN parser

      const lines = pgn.split('\n');
      const movesLine = lines.find(line => !line.startsWith('[') && line.trim());

      if (!movesLine) return false;

      // Extract moves using regex
      const moveRegex = /\d+\.\s*([^\s]+)(?:\s+([^\s]+))?/g;
      let match;

      this.reset();

      while ((match = moveRegex.exec(movesLine)) !== null) {
        const whiteMove = match[1];
        const blackMove = match[2];

        // This would need to convert SAN to actual moves and play them
        // For now, just indicate success
      }

      return true;
    } catch (error) {
      console.error('Failed to import PGN:', error);
      return false;
    }
  }
}
