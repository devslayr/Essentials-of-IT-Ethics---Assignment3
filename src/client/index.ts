import { ChessEngine } from './engine/ChessEngine';
import { ChessBoard } from './components/ChessBoard';
import { NotationTable } from './components/NotationTable';
import { GamePanel } from './components/GamePanel';
import { SettingsModal } from './components/SettingsModal';
import { AppearanceModal } from './components/AppearanceModal';
import { CapturedPieces } from './components/CapturedPieces';
import { GameSettings, Move, Square, PieceType } from '../shared/types';
import './styles/main.scss';

class ChessApp {
  private engine: ChessEngine;
  private board!: ChessBoard;
  private notationTable!: NotationTable;
  private gamePanel!: GamePanel;
  private settingsModal!: SettingsModal;
  private appearanceModal!: AppearanceModal;
  private capturedPieces!: CapturedPieces;
  private settings: GameSettings;

  constructor() {
    this.settings = this.loadSettings();
    this.engine = new ChessEngine();
    this.initializeComponents();
    this.setupEventListeners();
    this.applyTheme();
  }

  private loadSettings(): GameSettings {
    const savedSettings = localStorage.getItem('chess-settings');
    return savedSettings ? JSON.parse(savedSettings) : {
      allowPreMoves: true,
      showCoordinates: true,
      highlightLegalMoves: true,
      animationSpeed: 1,
      soundEffects: true,
      theme: 'system' as const,
      boardTheme: 'brown',
      pieceSet: 'classic'
    };
  }

  private saveSettings(): void {
    localStorage.setItem('chess-settings', JSON.stringify(this.settings));
  }

  private initializeComponents(): void {
    const appElement = document.getElementById('app')!;

    // Create main layout
    appElement.innerHTML = `
      <div class="chess-app" data-theme="${this.settings.theme}">
        <header class="app-header">
          <h1 class="app-title">Chess Platform</h1>
          <nav class="app-nav">
            <button class="nav-btn" data-action="stream">Stream</button>
            <button class="nav-btn" data-action="appearance">Appearance</button>
            <button class="nav-btn" data-action="settings">Settings</button>
            <button class="nav-btn" data-action="about">About</button>
          </nav>
        </header>
        
        <main class="app-main">
          <div class="game-container">
            <div class="left-panel">
              <div id="chess-board"></div>
              
              <div class="board-controls">
                <button class="control-btn" data-action="flip-board">⟲</button>
                <button class="control-btn" data-action="new-game">+ New Game</button>
              </div>
            </div>
            
            <div class="right-panel">
              <div id="notation-table"></div>
              <div id="game-panel"></div>
            </div>
          </div>
        </main>
        
        <div id="settings-modal" class="modal hidden"></div>
        <div id="appearance-modal" class="modal hidden"></div>
      </div>
    `;

    // Initialize components
    this.board = new ChessBoard(
      document.getElementById('chess-board')!,
      this.engine,
      this.settings,
      (move: Move) => this.handleMove(move)
    );

    this.notationTable = new NotationTable(
      document.getElementById('notation-table')!,
      this.engine
    );

    // Setup callback for position changes during move history navigation
    this.notationTable.setPositionChangeCallback(() => {
      this.board.updatePosition();
    });

    this.gamePanel = new GamePanel(
      document.getElementById('game-panel')!,
      this.engine,
      (action: string) => this.handleAction(action)
    );

        // Initialize captured pieces component
    const capturedContainer = document.createElement('div');
    capturedContainer.id = 'captured-pieces';
    
    const rightPanel = document.querySelector('.right-panel');
    if (rightPanel) {
      rightPanel.appendChild(capturedContainer);
    } else {
      // Fallback to game container if right panel doesn't exist
      document.querySelector('.game-container')!.appendChild(capturedContainer);
    }
    this.capturedPieces = new CapturedPieces(capturedContainer, this.settings);

    this.settingsModal = new SettingsModal(
      document.getElementById('settings-modal')!,
      this.settings,
      (newSettings: Partial<GameSettings>) => {
        this.settings = { ...this.settings, ...newSettings };
        this.saveSettings();
        this.applySettings();
      }
    );

    this.appearanceModal = new AppearanceModal(
      document.getElementById('appearance-modal')!,
      this.settings,
      (newSettings: Partial<GameSettings>) => {
        this.settings = { ...this.settings, ...newSettings };
        this.saveSettings();
        this.applyAppearance();
      }
    );
  }

  private setupEventListeners(): void {
    // Navigation buttons
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const action = target.dataset.action;

      if (action) {
        this.handleAction(action);
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (event) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'z':
            event.preventDefault();
            this.undoMove();
            break;
          case 'f':
            event.preventDefault();
            this.board.flipBoard();
            break;
          case 'n':
            event.preventDefault();
            this.newGame();
            break;
        }
      }

      // Arrow keys for move navigation
      if (!event.ctrlKey && !event.metaKey) {
        switch (event.key) {
          case 'ArrowLeft':
            event.preventDefault();
            this.notationTable.goToPreviousMove();
            break;
          case 'ArrowRight':
            event.preventDefault();
            this.notationTable.goToNextMove();
            break;
          case 'Home':
            event.preventDefault();
            this.notationTable.goToStart();
            break;
          case 'End':
            event.preventDefault();
            this.notationTable.goToEnd();
            break;
        }
      }
    });

    // TODO: Add event system for engine events
    // For now, we'll handle updates manually

    // Example of how to handle move updates:
    // When a move is made, call:
    // this.notationTable.addMove(move);
    // this.gamePanel.updateGameStatus();
    // this.playMoveSound(move);
  }

  private handleAction(action: string): void {
    switch (action) {
      case 'stream':
        // TODO: Implement streaming functionality
        break;
      case 'appearance':
        this.appearanceModal.show();
        break;
      case 'settings':
        this.settingsModal.show();
        break;
      case 'about':
        this.showAbout();
        break;
      case 'flip-board':
        this.board.flipBoard();
        break;
      case 'new-game':
        this.newGame();
        break;
      case 'undo':
        this.undoMove();
        break;
    }
  }

  private applyTheme(): void {
    const appElement = document.querySelector('.chess-app')!;
    appElement.setAttribute('data-theme', this.settings.theme);

    if (this.settings.theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      appElement.setAttribute('data-actual-theme', prefersDark ? 'dark' : 'light');
    } else {
      appElement.setAttribute('data-actual-theme', this.settings.theme);
    }
  }

  private applySettings(): void {
    this.board.updateSettings(this.settings);
    this.applyTheme();
  }

  private applyAppearance(): void {
    this.board.updateAppearance(this.settings);
    this.capturedPieces.updateSettings(this.settings);
    this.applyTheme();
  }

  private handleMove(move: Move): void {
    // Update notation table
    this.notationTable.addMove(move);

    // Update captured pieces if there was a capture
    if (move.capturedPiece) {
      this.capturedPieces.addCapturedPiece(move.capturedPiece);
    }

    // Switch timer to next player
    this.gamePanel.switchPlayer();

    // Update game panel
    this.gamePanel.updateGameStatus();

    // Play move sound
    this.playMoveSound(move);

    // Handle bot move if in bot mode
    this.handleBotMove();
  }

  private handleBotMove(): void {
    const gameMode = this.gamePanel.getGameMode();
    if (gameMode === 'bot' && this.engine.getCurrentPlayer() === 'black') {
      // Add a reasonable delay for bot move to feel more natural
      setTimeout(() => {
        this.makeIntelligentBotMove();
      }, 800); // Single timeout with reasonable delay
    }
  }

  private makeIntelligentBotMove(): void {
    const legalMoves = this.engine.getAllLegalMoves();
    if (legalMoves.length === 0) return;

    let selectedMove = legalMoves[0];
    const difficulty = this.gamePanel.getBotDifficulty();

    if (difficulty <= 5) {
      // Easy: Random move
      selectedMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
    } else if (difficulty <= 10) {
      // Medium: Prefer captures and checks
      const capturesMoves = legalMoves.filter(move => {
        const targetPiece = this.engine.getPiece(move.to);
        return targetPiece && targetPiece.color !== this.engine.getCurrentPlayer();
      });
      
      if (capturesMoves.length > 0) {
        selectedMove = capturesMoves[Math.floor(Math.random() * capturesMoves.length)];
      } else {
        selectedMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
      }
    } else {
      // Hard: More strategic (still simplified)
      // Prefer center squares, captures, and avoid hanging pieces
      let bestMoves = legalMoves;
      
      // Prefer captures
      const captures = legalMoves.filter(move => {
        const targetPiece = this.engine.getPiece(move.to);
        return targetPiece && targetPiece.color !== this.engine.getCurrentPlayer();
      });
      
      if (captures.length > 0) {
        bestMoves = captures;
      }
      
      selectedMove = bestMoves[Math.floor(Math.random() * bestMoves.length)];
    }

    const move = this.engine.makeMove(selectedMove.from, selectedMove.to, selectedMove.promotion);
    if (move) {
      // First update the board position
      this.board.updatePosition();
      
      // Animate the bot move
      this.board.animateMove(move);
      
      // Use the same handleMove method to ensure consistency
      // This will update notation table, captured pieces, game panel, etc.
      this.handleMove(move);
    }
  }

  private undoMove(): void {
    const undoneMove = this.engine.undoMove();
    if (undoneMove) {
      // Cancel any ongoing animations to prevent conflicts
      this.board.cancelAnimations();
      this.board.updatePosition();
      this.notationTable.removeLastMove();
      this.gamePanel.updateGameStatus();
      
      // If the undone move captured a piece, remove it from captured pieces
      if (undoneMove.capturedPiece) {
        this.capturedPieces.removeCapturedPiece(undoneMove.capturedPiece);
      }
    }
  }

  private newGame(): void {
    this.engine = new ChessEngine();
    this.board.reset(this.engine);
    this.notationTable.reset();
    this.gamePanel.reset();
    this.capturedPieces.reset();
  }

  private playMoveSound(move: any): void {
    if (!this.settings.soundEffects) return;

    // TODO: Implement sound system
    console.log('Playing move sound for:', move);
  }

  private showAbout(): void {
    alert(`Chess Platform v1.0.0

A comprehensive chess game platform with multiple play modes and full chess rule implementation.

Features:
- Standard chess mechanics with all rules
- Multiple game modes (solo, friend, bot)
- Pre-moves and extended features
- Responsive design with themes
- Time controls and game analysis

Built with TypeScript and modern web technologies.`);
  }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new ChessApp();
});
