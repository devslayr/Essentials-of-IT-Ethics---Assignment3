import { ChessEngine } from '../engine/ChessEngine';
import { GameResult } from '../../shared/types';

export class GamePanel {
  private container: HTMLElement;
  private engine: ChessEngine;

  constructor(container: HTMLElement, engine: ChessEngine) {
    this.container = container;
    this.engine = engine;
    this.createPanel();
  }

  private createPanel(): void {
    this.container.innerHTML = `
      <div class="game-panel">
        <div class="game-status">
          <div class="status-text">White to move</div>
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
            <button class="action-btn" data-action="abort" title="Abort Game">
              <span class="btn-icon">⏹️</span>
              <span class="btn-text">Abort</span>
            </button>
          </div>
        </div>
        
        <div class="game-features">
          <div class="feature-group">
            <h4>Game Mode</h4>
            <select class="game-mode-select">
              <option value="solo">Play by Yourself</option>
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
        this.undoMove();
        break;
      case 'abort':
        this.abortGame();
        break;
    }
  }

  private handleGameModeChange(mode: string): void {
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

    this.addLogEntry(`Time control set to: ${timeControl}`);
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

      this.addLogEntry(`${currentPlayer} resigned. ${winner} wins!`);
      this.showGameOver(winner === 'white' ? 'white-wins' : 'black-wins');
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

  private abortGame(): void {
    if (confirm('Are you sure you want to abort the game?')) {
      this.addLogEntry('Game aborted');
      // TODO: Implement game abort logic
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
    // Re-enable action buttons
    const actionButtons = this.container.querySelectorAll('.action-btn');
    actionButtons.forEach(button => {
      (button as HTMLButtonElement).disabled = false;
    });

    // Clear log
    const logContent = this.container.querySelector('.log-content')!;
    logContent.innerHTML = '<div class="log-entry">Game started</div>';

    // Reset status
    this.updateGameStatus();
  }

  public getSelectedGameMode(): string {
    const gameModeSelect = this.container.querySelector('.game-mode-select') as HTMLSelectElement;
    return gameModeSelect?.value || 'solo';
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
}
