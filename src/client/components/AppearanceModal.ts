import { GameSettings } from '../../shared/types';

export class AppearanceModal {
  private container: HTMLElement;
  private settings: GameSettings;
  private onSettingsChange: (settings: Partial<GameSettings>) => void;

  constructor(
    container: HTMLElement,
    settings: GameSettings,
    onSettingsChange: (settings: Partial<GameSettings>) => void
  ) {
    this.container = container;
    this.settings = settings;
    this.onSettingsChange = onSettingsChange;
    this.createModal();
  }

  private createModal(): void {
    this.container.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-content appearance-modal">
          <div class="modal-header">
            <h2>Appearance</h2>
            <button class="close-btn" data-action="close">&times;</button>
          </div>
          
          <div class="modal-body">
            <div class="appearance-section">
              <h3>Board Theme</h3>
              <div class="theme-grid">
                ${this.createBoardThemes()}
              </div>
            </div>
            
            <div class="appearance-section">
              <h3>Piece Set</h3>
              <div class="piece-grid">
                ${this.createPieceSets()}
              </div>
            </div>
            
            <div class="appearance-section">
              <h3>Preview</h3>
              <div class="board-preview">
                ${this.createBoardPreview()}
              </div>
            </div>
          </div>
          
          <div class="modal-footer">
            <button class="btn btn-secondary" data-action="cancel">Cancel</button>
            <button class="btn btn-primary" data-action="save">Apply Changes</button>
          </div>
        </div>
      </div>
    `;

    this.setupEventListeners();
    // Initialize preview properly
    this.updatePieceSetClasses();
  }

  private createBoardThemes(): string {
    const themes = [
      { name: 'brown', label: 'Classic Brown', light: '#f0d9b5', dark: '#b58863' },
      { name: 'blue', label: 'Ocean Blue', light: '#dee3e6', dark: '#8ca2ad' },
      { name: 'green', label: 'Forest Green', light: '#ffffdd', dark: '#86a666' },
      { name: 'purple', label: 'Royal Purple', light: '#e6e6fa', dark: '#9370db' },
      { name: 'red', label: 'Cherry Red', light: '#ffd1dc', dark: '#cd5c5c' },
      { name: 'gray', label: 'Modern Gray', light: '#f5f5f5', dark: '#696969' }
    ];

    return themes.map(theme => `
      <div class="theme-option ${this.settings.boardTheme === theme.name ? 'selected' : ''}" 
           data-theme="${theme.name}">
        <div class="theme-preview">
          <div class="preview-square light" style="background-color: ${theme.light}"></div>
          <div class="preview-square dark" style="background-color: ${theme.dark}"></div>
          <div class="preview-square dark" style="background-color: ${theme.dark}"></div>
          <div class="preview-square light" style="background-color: ${theme.light}"></div>
        </div>
        <span class="theme-label">${theme.label}</span>
      </div>
    `).join('');
  }

  private createPieceSets(): string {
    const pieceSets = [
      { 
        name: 'classic', 
        label: 'Classic', 
        preview: {
          white: '♔♕♖♗♘♙',
          black: '♚♛♜♝♞♟'
        }
      },
      { 
        name: 'modern', 
        label: 'Modern', 
        preview: {
          white: '🤴👸🏰⛪🐎⚪',
          black: '👑💂‍♀️🏯🕌🏇⚫'
        }
      },
      { 
        name: 'medieval', 
        label: 'Medieval', 
        preview: {
          white: '♔♕🏭⛪🛡️🔰',
          black: '♚♛🏰🕌⚔️⚫'
        }
      }
    ];

    return pieceSets.map(set => `
      <div class="piece-option ${this.settings.pieceSet === set.name ? 'selected' : ''}" 
           data-piece-set="${set.name}">
        <div class="piece-preview">
          <div class="piece-sample-row">
            <span class="piece-sample white-pieces">${set.preview.white}</span>
          </div>
          <div class="piece-sample-row">
            <span class="piece-sample black-pieces">${set.preview.black}</span>
          </div>
        </div>
        <span class="piece-label">${set.label}</span>
      </div>
    `).join('');
  }

  private createBoardPreview(): string {
    return `
      <div class="mini-board piece-${this.settings.pieceSet}" data-theme="${this.settings.boardTheme}">
        ${this.createPreviewSquares()}
      </div>
    `;
  }

  private createPreviewSquares(): string {
    const initialPosition = [
      ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
      ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
      ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
    ];

    let html = '';
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const isLight = (row + col) % 2 === 1;
        const piece = initialPosition[row][col];

        html += `
          <div class="preview-square ${isLight ? 'light' : 'dark'}">
            ${piece ? this.getPieceSymbol(piece) : ''}
          </div>
        `;
      }
    }

    return html;
  }

  private getPieceSymbol(piece: string): string {
    const pieceSet = this.settings.pieceSet || 'classic';
    
    const pieceSets: { [key: string]: { [key: string]: string } } = {
      classic: {
        'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
        'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
      },
      modern: {
        'K': '🤴', 'Q': '👸', 'R': '🏰', 'B': '⛪', 'N': '🐎', 'P': '⚪',
        'k': '👑', 'q': '💂‍♀️', 'r': '🏯', 'b': '🕌', 'n': '🏇', 'p': '⚫'
      },
      medieval: {
        'K': '♔', 'Q': '♕', 'R': '🏭', 'B': '⛪', 'N': '🛡️', 'P': '🔰',
        'k': '♚', 'q': '♛', 'r': '🏰', 'b': '🕌', 'n': '⚔️', 'p': '⚫'
      }
    };

    const symbols = pieceSets[pieceSet] || pieceSets.classic;
    return `<span class="piece piece-${pieceSet}">${symbols[piece] || ''}</span>`;
  }

  private setupEventListeners(): void {
    this.container.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const action = target.dataset.action;

      if (action) {
        this.handleAction(action);
        return;
      }

      // Handle theme selection
      const themeOption = target.closest('.theme-option') as HTMLElement;
      if (themeOption) {
        this.selectTheme(themeOption.dataset.theme!);
        return;
      }

      // Handle piece set selection
      const pieceOption = target.closest('.piece-option') as HTMLElement;
      if (pieceOption) {
        this.selectPieceSet(pieceOption.dataset.pieceSet!);
        return;
      }
    });

    // Close modal when clicking outside
    this.container.addEventListener('click', (event) => {
      if (event.target === this.container.querySelector('.modal-backdrop')) {
        this.hide();
      }
    });

    // Escape key to close modal
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !this.container.classList.contains('hidden')) {
        this.hide();
      }
    });
  }

  private handleAction(action: string): void {
    switch (action) {
      case 'close':
      case 'cancel':
        this.hide();
        break;
      case 'save':
        this.saveSettings();
        break;
    }
  }

  private selectTheme(themeName: string): void {
    // Update selection visual
    this.container.querySelectorAll('.theme-option').forEach(option => {
      option.classList.remove('selected');
    });

    const selectedOption = this.container.querySelector(`[data-theme="${themeName}"]`);
    selectedOption?.classList.add('selected');

    // Update settings
    this.settings.boardTheme = themeName;

    // Update preview
    this.updatePreview();
  }

  private selectPieceSet(pieceSetName: string): void {
    // Update selection visual
    this.container.querySelectorAll('.piece-option').forEach(option => {
      option.classList.remove('selected');
    });

    const selectedOption = this.container.querySelector(`[data-piece-set="${pieceSetName}"]`);
    selectedOption?.classList.add('selected');

    // Update settings
    this.settings.pieceSet = pieceSetName;

    // Update preview
    this.updatePreview();
  }

  private updatePreview(): void {
    const preview = this.container.querySelector('.board-preview');
    if (preview) {
      preview.innerHTML = this.createBoardPreview();
    }
    
    // Also update piece set classes if needed
    this.updatePieceSetClasses();
  }

  private updatePieceSetClasses(): void {
    const boardPreview = this.container.querySelector('.mini-board');
    if (boardPreview) {
      // Remove old piece set classes
      boardPreview.classList.remove('piece-classic', 'piece-modern', 'piece-medieval');
      // Add current piece set class
      boardPreview.classList.add(`piece-${this.settings.pieceSet}`);
    }
  }

  private saveSettings(): void {
    this.onSettingsChange({
      boardTheme: this.settings.boardTheme,
      pieceSet: this.settings.pieceSet
    });
    this.hide();
  }

  public show(): void {
    this.container.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  public hide(): void {
    this.container.classList.add('hidden');
    document.body.style.overflow = '';
  }
}
