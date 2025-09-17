import { ChessEngine } from './engine/ChessEngine';
import { ChessBoard } from './components/ChessBoard';
import { NotationTable } from './components/NotationTable';
import { GamePanel } from './components/GamePanel';
import { SettingsModal } from './components/SettingsModal';
import { AppearanceModal } from './components/AppearanceModal';
import { CapturedPieces } from './components/CapturedPieces';
import { HomePage } from './components/HomePage';
import { GameSettings, Move, Square, PieceType, Piece } from '../shared/types';
import './styles/main.scss';

class ChessApp {
  private engine: ChessEngine;
  private board!: ChessBoard;
  private notationTable!: NotationTable;
  private gamePanel!: GamePanel;
  private settingsModal!: SettingsModal;
  private appearanceModal!: AppearanceModal;
  private capturedPieces!: CapturedPieces;
  private homePage!: HomePage;
  private currentView: 'home' | 'game' = 'home';
  private settings: GameSettings;

  constructor() {
    this.settings = this.loadSettings();
    this.engine = new ChessEngine();
    this.initializeComponents();
    this.setupEventListeners();
    this.applyTheme();
    this.updateAutoSwitchButton();
  }

  private loadSettings(): GameSettings {
    const savedSettings = localStorage.getItem('chess-settings');
    const defaultSettings = {
      showCoordinates: true,
      highlightLegalMoves: true,
      animationSpeed: 1,
      soundEffects: true,
      theme: 'system' as const,
      boardTheme: 'brown',
      pieceSet: 'classic',
      autoSwitchInFriendMode: false
    };
    
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      // Merge with defaults to ensure all properties exist
      return { ...defaultSettings, ...parsed };
    }
    
    return defaultSettings;
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
          <button class="app-title" data-action="home">
            Chess Platform
          </button>
          <nav class="app-nav">
            <button class="nav-btn" data-action="home">Home</button>
            <button class="nav-btn" data-action="appearance">Appearance</button>
            <button class="nav-btn" data-action="settings">Settings</button>
            <button class="nav-btn" data-action="about">About</button>
          </nav>
        </header>
        
        <main class="app-main">
          <div id="home-container" class="view-container"></div>
          
          <div id="game-container" class="game-container" style="display: none;">
            <div class="left-panel">
              <div id="chess-board"></div>
              
              <div class="board-controls">
                <button class="control-btn" data-action="flip-board">⟲</button>
                <button class="control-btn" data-action="new-game">+ New Game</button>
                <button class="control-btn auto-switch-btn" data-action="toggle-auto-switch">
                  <span class="auto-switch-icon">🔄</span>
                  <span class="auto-switch-text">Auto Switch: OFF</span>
                </button>
              </div>
              
              <div id="captured-pieces-below-board"></div>
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
      (move: Move) => this.handleMove(move),
      (type: 'checkmate' | 'stalemate' | 'draw') => this.playGameEndSound(type)
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
      (action: string) => this.handleAction(action),
      (playerColor: 'white' | 'black') => this.board.handleTimeout(playerColor),
      (type: 'victory' | 'defeat' | 'draw', title: string, description: string) => 
        this.board.showGameResult(type, title, description)
    );

    // Initialize captured pieces component below chess board
    const capturedContainer = document.getElementById('captured-pieces-below-board')!;
    this.capturedPieces = new CapturedPieces(capturedContainer, this.settings);

    // Initialize HomePage
    this.homePage = new HomePage(
      document.getElementById('home-container')!,
      () => this.showGameView()
    );

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

    // Setup system theme listener for automatic theme switching
    this.setupSystemThemeListener();

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
      case 'home':
        this.showHomeView();
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
      case 'toggle-auto-switch':
        this.toggleAutoSwitch();
        break;
      case 'undo':
        this.undoMove();
        break;
      case 'bot-move':
        this.handleBotMove();
        break;
    }
  }

  private showHomeView(): void {
    this.currentView = 'home';
    document.getElementById('home-container')!.style.display = 'block';
    document.getElementById('game-container')!.style.display = 'none';
  }

  private showGameView(): void {
    this.currentView = 'game';
    document.getElementById('home-container')!.style.display = 'none';
    document.getElementById('game-container')!.style.display = 'block';
  }

  private applyTheme(): void {
    const appElement = document.querySelector('.chess-app')!;
    
    if (this.settings.theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const actualTheme = prefersDark ? 'dark' : 'light';
      appElement.setAttribute('data-theme', actualTheme);
      appElement.setAttribute('data-actual-theme', actualTheme);
    } else {
      appElement.setAttribute('data-theme', this.settings.theme);
      appElement.setAttribute('data-actual-theme', this.settings.theme);
    }
  }

  private setupSystemThemeListener(): void {
    // Listen for system theme changes when in system mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
      if (this.settings.theme === 'system') {
        this.applyTheme();
      }
    });
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
    // Ensure notation table is at current position before adding new move
    if (!this.notationTable.isAtCurrentPosition()) {
      this.notationTable.syncWithCurrentPosition();
    }
    
    // Update notation table
    this.notationTable.addMove(move);

    // Update captured pieces if there was a capture
    if (move.capturedPiece) {
      this.capturedPieces.addCapturedPiece(move.capturedPiece);
    } else if (move.enPassant) {
      // En passant capture - create the captured pawn piece
      const capturedPawnColor = move.piece.color === 'white' ? 'black' : 'white';
      const capturedPawn: Piece = {
        type: 'pawn',
        color: capturedPawnColor
      };
      this.capturedPieces.addCapturedPiece(capturedPawn);
    }

    // Switch timer to next player
    this.gamePanel.switchPlayer();

    // Update game panel
    this.gamePanel.updateGameStatus();

    // Play move sound
    this.playMoveSound(move);

    // Handle auto-switch after move in friend mode
    this.handleAutoSwitchAfterMove();

    // Handle bot move if in bot mode
    this.handleBotMove();
  }

  private handleBotMove(): void {
    const gameMode = this.gamePanel.getGameMode();
    const humanColor = this.gamePanel.getHumanColor();
    const currentPlayer = this.engine.getCurrentPlayer();
    
    // Bot should move when it's not the human player's turn
    if (gameMode === 'bot' && currentPlayer !== humanColor) {
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
      } else if (undoneMove.enPassant) {
        // En passant undo - remove the captured pawn
        const capturedPawnColor = undoneMove.piece.color === 'white' ? 'black' : 'white';
        const capturedPawn: Piece = {
          type: 'pawn',
          color: capturedPawnColor
        };
        this.capturedPieces.removeCapturedPiece(capturedPawn);
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

  private toggleAutoSwitch(): void {
    this.settings.autoSwitchInFriendMode = !this.settings.autoSwitchInFriendMode;
    this.saveSettings();
    this.updateAutoSwitchButton();
  }

  private updateAutoSwitchButton(): void {
    const autoSwitchBtn = document.querySelector('.auto-switch-btn') as HTMLButtonElement;
    const autoSwitchText = autoSwitchBtn?.querySelector('.auto-switch-text') as HTMLSpanElement;
    
    if (autoSwitchBtn && autoSwitchText) {
      const isOn = this.settings.autoSwitchInFriendMode;
      autoSwitchText.textContent = `Auto Switch: ${isOn ? 'ON' : 'OFF'}`;
      autoSwitchBtn.classList.toggle('active', isOn);
      autoSwitchBtn.title = isOn 
        ? 'Auto-flip board after each move in friend mode (ON)' 
        : 'Auto-flip board after each move in friend mode (OFF)';
    }
  }

  private handleAutoSwitchAfterMove(): void {
    // Only auto-switch in friend mode, not bot mode
    const gameMode = this.gamePanel.getGameMode();
    if (gameMode === 'friend' && this.settings.autoSwitchInFriendMode) {
      // Add a small delay so players can see their move before the board flips
      setTimeout(() => {
        this.board.flipBoard();
      }, 500);
    }
  }

  private playMoveSound(move: any): void {
    if (!this.settings.soundEffects) return;

    try {
      // Create audio context for different types of moves
      const isCapture = move.captured;
      const isCastling = move.type === 'castling';
      const isCheck = this.engine.isInCheck(this.engine.getCurrentPlayer() === 'white' ? 'black' : 'white');
      
      let frequency = 800; // Default move sound
      let duration = 0.1;
      
      if (isCastling) {
        // Castling sound - lower, longer tone
        frequency = 600;
        duration = 0.15;
      } else if (isCapture) {
        // Capture sound - higher, sharper tone
        frequency = 1000;
        duration = 0.12;
      } else if (isCheck) {
        // Check sound - warning tone
        frequency = 1200;
        duration = 0.2;
      }
      
      this.playTone(frequency, duration);
    } catch (error) {
      console.log('Sound unavailable:', error);
    }
  }

  private playGameEndSound(type: 'checkmate' | 'stalemate' | 'draw'): void {
    if (!this.settings.soundEffects) return;

    try {
      if (type === 'checkmate') {
        // Checkmate - dramatic descending tones
        this.playTone(800, 0.3);
        setTimeout(() => this.playTone(600, 0.3), 150);
        setTimeout(() => this.playTone(400, 0.4), 300);
      } else if (type === 'stalemate') {
        // Stalemate - neutral ascending and descending tone
        this.playTone(600, 0.2);
        setTimeout(() => this.playTone(700, 0.2), 100);
        setTimeout(() => this.playTone(600, 0.3), 200);
      } else {
        // Draw - balanced tone
        this.playTone(650, 0.3);
      }
    } catch (error) {
      console.log('Sound unavailable:', error);
    }
  }

  private playTone(frequency: number, duration: number): void {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  }

  private showAbout(): void {
    alert(`Chess Platform v1.0.0

A comprehensive chess game platform with multiple play modes and full chess rule implementation.

Features:
- Standard chess mechanics with all rules
- Multiple game modes (solo, friend, bot)
- Advanced features and gameplay options
- Responsive design with themes
- Time controls and game analysis

Built with TypeScript and modern web technologies.`);
  }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new ChessApp();
});
