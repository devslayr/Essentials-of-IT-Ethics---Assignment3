import { ChessEngine } from '../engine/ChessEngine';
import { GameResult } from '../../shared/types';

export class GamePanel {
  private container: HTMLElement;
  private engine: ChessEngine;
  private whiteTime: number = 0; // time in seconds
  private blackTime: number = 0;
  private currentPlayer: 'white' | 'black' = 'white';
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private gameMode: 'friend' | 'bot' = 'friend';
  private botDifficulty: number = 10;
  private actionCallback?: (action: string) => void;
  private timeoutCallback?: (playerColor: 'white' | 'black') => void;
  private gameOverCallback?: (type: 'victory' | 'defeat' | 'draw', title: string, description: string) => void;
  private isPaused: boolean = false;

  constructor(
    container: HTMLElement, 
    engine: ChessEngine, 
    actionCallback?: (action: string) => void,
    timeoutCallback?: (playerColor: 'white' | 'black') => void,
    gameOverCallback?: (type: 'victory' | 'defeat' | 'draw', title: string, description: string) => void
  ) {
    this.container = container;
    this.engine = engine;
    this.actionCallback = actionCallback;
    this.timeoutCallback = timeoutCallback;
    this.gameOverCallback = gameOverCallback;
    this.createPanel();
  }

  private createPanel(): void {
    this.container.innerHTML = `
      <div class="game-panel">
        <div class="game-status">
          <div class="status-text">White to move</div>
          <div class="game-timers">
            <div class="timer white-timer">
              <span class="timer-label">White</span>
              <span class="timer-display">∞</span>
            </div>
            <div class="timer black-timer">
              <span class="timer-label">Black</span>
              <span class="timer-display">∞</span>
            </div>
          </div>
          <div class="game-info-details">
            <div class="turn-indicator">
              <span class="turn-white active"></span>
              <span class="turn-black"></span>
            </div>
          </div>
        </div>
        
        <div class="game-actions">
          <div class="action-group">
            <button class="action-btn" data-action="offer-draw" title="Offer Draw">
              <span class="btn-icon">🤝</span>
              <span class="btn-text">Draw</span>
            </button>
            <button class="action-btn" data-action="resign" title="Resign">
              <span class="btn-icon">🏳️</span>
              <span class="btn-text">Resign</span>
            </button>
          </div>
          
          <div class="action-group">
            <button class="action-btn" data-action="undo" title="Undo Move">
              <span class="btn-icon">↶</span>
              <span class="btn-text">Undo</span>
            </button>
            <button class="action-btn pause-resume-btn" data-action="pause" title="Pause Game">
              <span class="btn-icon">⏸️</span>
              <span class="btn-text">Pause</span>
            </button>
          </div>
        </div>
        
        <div class="game-features">
          <div class="feature-group">
            <h4>Game Mode</h4>
            <select class="game-mode-select">
              <option value="friend">Play against Friend</option>
              <option value="bot">Play against Bot</option>
            </select>
          </div>
          
          <div class="feature-group bot-settings hidden">
            <h4>Bot Difficulty</h4>
            <div class="difficulty-slider">
              <input type="range" min="1" max="20" value="10" class="difficulty-range">
              <span class="difficulty-value">10</span>
            </div>
          </div>
          
          <div class="feature-group">
            <h4>Time Control</h4>
            <select class="time-control-select">
              <option value="unlimited">Unlimited</option>
              <option value="blitz">Blitz (5+0)</option>
              <option value="rapid">Rapid (10+0)</option>
              <option value="classical">Classical (30+0)</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          
          <div class="feature-group custom-time hidden">
            <div class="time-inputs">
              <div class="time-input">
                <label>Minutes</label>
                <input type="number" min="1" max="180" value="10" class="initial-time">
              </div>
              <div class="time-input">
                <label>Increment</label>
                <input type="number" min="0" max="30" value="0" class="increment-time">
              </div>
            </div>
          </div>
        </div>
        
        <div class="log-console">
          <h4>Game Log</h4>
          <div class="log-content">
            <div class="log-entry">Game started</div>
          </div>
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.container.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const button = target.closest('.action-btn') as HTMLElement;

      if (button) {
        const action = button.dataset.action;
        if (action) {
          this.handleAction(action);
        }
      }
    });

    // Game mode selection
    const gameModeSelect = this.container.querySelector('.game-mode-select') as HTMLSelectElement;
    gameModeSelect?.addEventListener('change', (event) => {
      const target = event.target as HTMLSelectElement;
      this.handleGameModeChange(target.value);
    });

    // Time control selection
    const timeControlSelect = this.container.querySelector('.time-control-select') as HTMLSelectElement;
    timeControlSelect?.addEventListener('change', (event) => {
      const target = event.target as HTMLSelectElement;
      this.handleTimeControlChange(target.value);
    });

    // Difficulty slider
    const difficultyRange = this.container.querySelector('.difficulty-range') as HTMLInputElement;
    const difficultyValue = this.container.querySelector('.difficulty-value');

    difficultyRange?.addEventListener('input', (event) => {
      const target = event.target as HTMLInputElement;
      this.botDifficulty = parseInt(target.value);
      if (difficultyValue) {
        difficultyValue.textContent = target.value;
      }
    });
  }

  private handleAction(action: string): void {
    switch (action) {
      case 'offer-draw':
        this.offerDraw();
        break;
      case 'resign':
        this.resign();
        break;
      case 'undo':
        // Use the main app's undo callback if available, otherwise fall back to local method
        if (this.actionCallback) {
          this.actionCallback('undo');
        } else {
          this.undoMove();
        }
        break;
      case 'pause':
        this.togglePause();
        break;
    }
  }

  private handleGameModeChange(mode: string): void {
    this.gameMode = mode as 'friend' | 'bot';
    const botSettings = this.container.querySelector('.bot-settings');

    if (mode === 'bot') {
      botSettings?.classList.remove('hidden');
    } else {
      botSettings?.classList.add('hidden');
    }

    this.addLogEntry(`Game mode changed to: ${mode}`);
  }

  private handleTimeControlChange(timeControl: string): void {
    const customTimeGroup = this.container.querySelector('.custom-time');

    if (timeControl === 'custom') {
      customTimeGroup?.classList.remove('hidden');
    } else {
      customTimeGroup?.classList.add('hidden');
    }

    // Initialize timers based on time control
    this.initializeTimers(timeControl);
    this.addLogEntry(`Time control set to: ${timeControl}`);
  }

  private initializeTimers(timeControl: string): void {
    // Stop any existing timer
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    let minutes = 0;
    let increment = 0;

    switch (timeControl) {
      case 'unlimited':
        this.whiteTime = 0;
        this.blackTime = 0;
        this.updateTimerDisplay();
        return; // No timer for unlimited
      case 'blitz':
        minutes = 5;
        break;
      case 'rapid':
        minutes = 10;
        break;
      case 'classical':
        minutes = 30;
        break;
      case 'custom':
        const initialTimeInput = this.container.querySelector('.initial-time') as HTMLInputElement;
        const incrementInput = this.container.querySelector('.increment-time') as HTMLInputElement;
        minutes = parseInt(initialTimeInput?.value || '10');
        increment = parseInt(incrementInput?.value || '0');
        break;
    }

    // Convert minutes to seconds
    this.whiteTime = minutes * 60;
    this.blackTime = minutes * 60;
    this.updateTimerDisplay();

    // Don't start the timer automatically - it should start when the first move is made
  }

  private startTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    this.timerInterval = setInterval(() => {
      // Don't decrement time if game is paused
      if (this.isPaused) {
        return;
      }
      
      if (this.currentPlayer === 'white' && this.whiteTime > 0) {
        this.whiteTime--;
      } else if (this.currentPlayer === 'black' && this.blackTime > 0) {
        this.blackTime--;
      }

      this.updateTimerDisplay();

      // Check for time expiration
      if (this.whiteTime <= 0 || this.blackTime <= 0) {
        this.handleTimeExpired();
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private updateTimerDisplay(): void {
    const whiteTimerDisplay = this.container.querySelector('.white-timer .timer-display');
    const blackTimerDisplay = this.container.querySelector('.black-timer .timer-display');

    if (whiteTimerDisplay) {
      whiteTimerDisplay.textContent = this.whiteTime === 0 ? '∞' : this.formatTime(this.whiteTime);
    }
    if (blackTimerDisplay) {
      blackTimerDisplay.textContent = this.blackTime === 0 ? '∞' : this.formatTime(this.blackTime);
    }

    // Update timer styles to show active player
    const whiteTimer = this.container.querySelector('.white-timer');
    const blackTimer = this.container.querySelector('.black-timer');
    
    whiteTimer?.classList.toggle('active', this.currentPlayer === 'white');
    blackTimer?.classList.toggle('active', this.currentPlayer === 'black');
  }

  private formatTime(seconds: number): string {
    if (seconds <= 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  private handleTimeExpired(): void {
    this.stopTimer();
    const winnerColor = this.whiteTime <= 0 ? 'black' : 'white';
    const loserColor = this.whiteTime <= 0 ? 'white' : 'black';
    const winner = this.whiteTime <= 0 ? 'Black' : 'White';
    
    this.addLogEntry(`Time expired! ${winner} wins!`);
    
    // Update status
    const statusText = this.container.querySelector('.status-text');
    if (statusText) {
      statusText.textContent = `${winner} wins on time!`;
    }

    // Notify ChessBoard about the timeout
    if (this.timeoutCallback) {
      this.timeoutCallback(loserColor);
    }
  }

  public switchPlayer(): void {
    this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
    
    // Start timer on first move if we have timed control
    if (!this.timerInterval && (this.whiteTime > 0 || this.blackTime > 0)) {
      this.startTimer();
    }
    
    this.updateTimerDisplay();
    
    // Update turn indicator
    const whiteIndicator = this.container.querySelector('.turn-white');
    const blackIndicator = this.container.querySelector('.turn-black');
    
    whiteIndicator?.classList.toggle('active', this.currentPlayer === 'white');
    blackIndicator?.classList.toggle('active', this.currentPlayer === 'black');
  }

  private offerDraw(): void {
    if (confirm('Are you sure you want to offer a draw?')) {
      this.addLogEntry('Draw offered');
      // TODO: Implement draw offer logic
    }
  }

  private resign(): void {
    if (confirm('Are you sure you want to resign?')) {
      const gameState = this.engine.getGameState();
      const currentPlayer = gameState.currentPlayer;
      const winner = currentPlayer === 'white' ? 'black' : 'white';
      const winnerText = winner === 'white' ? 'White' : 'Black';

      this.addLogEntry(`${currentPlayer} resigned. ${winner} wins!`);
      this.showGameOver(winner === 'white' ? 'white-wins' : 'black-wins');

      // Trigger visual notification via callback
      if (this.gameOverCallback) {
        this.gameOverCallback(
          winner === 'white' ? 'victory' : 'defeat',
          `${winnerText} Wins!`,
          'By Resignation'
        );
      }
    }
  }

  private undoMove(): void {
    const undoneMove = this.engine.undoMove();
    if (undoneMove) {
      this.addLogEntry(`Move undone: ${undoneMove.san}`);
      this.updateGameStatus();
    } else {
      this.addLogEntry('No move to undo');
    }
  }

  private togglePause(): void {
    const pauseBtn = this.container.querySelector('.pause-resume-btn');
    const btnIcon = pauseBtn?.querySelector('.btn-icon');
    const btnText = pauseBtn?.querySelector('.btn-text');
    const gameContainer = document.querySelector('.game-container');
    
    if (this.isPaused) {
      // Resume game
      this.isPaused = false;
      this.startTimer();
      if (btnIcon) btnIcon.textContent = '⏸️';
      if (btnText) btnText.textContent = 'Pause';
      (pauseBtn as HTMLElement)?.setAttribute('data-action', 'pause');
      (pauseBtn as HTMLElement)?.setAttribute('title', 'Pause Game');
      pauseBtn?.classList.remove('paused');
      gameContainer?.classList.remove('game-paused');
      this.addLogEntry('Game resumed');
    } else {
      // Pause game  
      this.isPaused = true;
      this.stopTimer();
      if (btnIcon) btnIcon.textContent = '▶️';
      if (btnText) btnText.textContent = 'Resume';
      (pauseBtn as HTMLElement)?.setAttribute('data-action', 'pause');
      (pauseBtn as HTMLElement)?.setAttribute('title', 'Resume Game');
      pauseBtn?.classList.add('paused');
      gameContainer?.classList.add('game-paused');
      this.addLogEntry('Game paused');
    }
  }

  public updateGameStatus(): void {
    const gameState = this.engine.getGameState();
    const statusText = this.container.querySelector('.status-text')!;
    const turnWhite = this.container.querySelector('.turn-white')!;
    const turnBlack = this.container.querySelector('.turn-black')!;

    // Update turn indicator
    turnWhite.classList.toggle('active', gameState.currentPlayer === 'white');
    turnBlack.classList.toggle('active', gameState.currentPlayer === 'black');

    // Update status text
    if (gameState.isCheckmate) {
      const winner = gameState.currentPlayer === 'white' ? 'Black' : 'White';
      statusText.textContent = `Checkmate! ${winner} wins`;
      this.addLogEntry(`Checkmate! ${winner} wins`);
    } else if (gameState.isStalemate) {
      statusText.textContent = 'Stalemate - Draw';
      this.addLogEntry('Stalemate - Draw');
    } else if (gameState.isDraw) {
      statusText.textContent = 'Draw';
      this.addLogEntry('Game drawn');
    } else if (gameState.isCheck) {
      const player = gameState.currentPlayer === 'white' ? 'White' : 'Black';
      statusText.textContent = `${player} in check`;
      this.addLogEntry(`${player} in check`);
    } else {
      const player = gameState.currentPlayer === 'white' ? 'White' : 'Black';
      statusText.textContent = `${player} to move`;
    }
  }

  public showGameOver(result: GameResult): void {
    const statusText = this.container.querySelector('.status-text')!;

    switch (result) {
      case 'white-wins':
        statusText.textContent = 'White wins!';
        break;
      case 'black-wins':
        statusText.textContent = 'Black wins!';
        break;
      case 'draw':
        statusText.textContent = 'Draw!';
        break;
    }

    // Disable game actions
    const actionButtons = this.container.querySelectorAll('.action-btn');
    actionButtons.forEach(button => {
      (button as HTMLButtonElement).disabled = true;
    });

    // Show rematch option
    setTimeout(() => {
      if (confirm('Game over! Would you like to play again?')) {
        this.reset();
        // TODO: Start new game
      }
    }, 1000);
  }

  public addLogEntry(message: string): void {
    const logContent = this.container.querySelector('.log-content')!;
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.textContent = `${new Date().toLocaleTimeString()}: ${message}`;

    logContent.appendChild(logEntry);
    logContent.scrollTop = logContent.scrollHeight;

    // Limit log entries to prevent memory issues
    const entries = logContent.querySelectorAll('.log-entry');
    if (entries.length > 100) {
      entries[0].remove();
    }
  }

  public reset(): void {
    // Stop the timer
    this.stopTimer();
    
    // Reset player to white
    this.currentPlayer = 'white';
    
    // Re-enable action buttons
    const actionButtons = this.container.querySelectorAll('.action-btn');
    actionButtons.forEach(button => {
      (button as HTMLButtonElement).disabled = false;
    });

    // Clear log
    const logContent = this.container.querySelector('.log-content')!;
    logContent.innerHTML = '<div class="log-entry">Game started</div>';

    // Reset timers based on current time control
    const timeControlSelect = this.container.querySelector('.time-control-select') as HTMLSelectElement;
    const currentTimeControl = timeControlSelect?.value || 'unlimited';
    this.initializeTimers(currentTimeControl);

    // Reset status
    this.updateGameStatus();
  }

  public getSelectedGameMode(): string {
    const gameModeSelect = this.container.querySelector('.game-mode-select') as HTMLSelectElement;
    return gameModeSelect?.value || 'friend';
  }

  public getSelectedDifficulty(): number {
    const difficultyRange = this.container.querySelector('.difficulty-range') as HTMLInputElement;
    return parseInt(difficultyRange?.value || '10');
  }

  public getTimeControl(): { initialTime: number; increment: number } | null {
    const timeControlSelect = this.container.querySelector('.time-control-select') as HTMLSelectElement;
    const selectedValue = timeControlSelect?.value;

    switch (selectedValue) {
      case 'unlimited':
        return null;
      case 'blitz':
        return { initialTime: 300, increment: 0 }; // 5 minutes
      case 'rapid':
        return { initialTime: 600, increment: 0 }; // 10 minutes
      case 'classical':
        return { initialTime: 1800, increment: 0 }; // 30 minutes
      case 'custom':
        const initialTimeInput = this.container.querySelector('.initial-time') as HTMLInputElement;
        const incrementInput = this.container.querySelector('.increment-time') as HTMLInputElement;
        return {
          initialTime: (parseInt(initialTimeInput?.value || '10')) * 60,
          increment: parseInt(incrementInput?.value || '0')
        };
      default:
        return null;
    }
  }

  public getGameMode(): 'friend' | 'bot' {
    return this.gameMode;
  }

  public getBotDifficulty(): number {
    return this.botDifficulty;
  }

  public isPausedState(): boolean {
    return this.isPaused;
  }
}
