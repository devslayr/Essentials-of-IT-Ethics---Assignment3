import { GameSettings } from '../../shared/types';

export class SettingsModal {
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
        <div class="modal-content">
          <div class="modal-header">
            <h2>Settings</h2>
            <button class="close-btn" data-action="close">&times;</button>
          </div>
          
          <div class="modal-body">
            <div class="settings-section">
              <h3>Gameplay</h3>
              
              <div class="setting-item">
                <label class="setting-label">
                  <input type="checkbox" class="setting-checkbox" data-setting="highlightLegalMoves" ${this.settings.highlightLegalMoves ? 'checked' : ''}>
                  <span class="setting-text">Highlight Legal Moves</span>
                </label>
                <p class="setting-description">Show possible moves when a piece is selected</p>
              </div>
              
              <div class="setting-item">
                <label class="setting-label">
                  <input type="checkbox" class="setting-checkbox" data-setting="showCoordinates" ${this.settings.showCoordinates ? 'checked' : ''}>
                  <span class="setting-text">Show Board Coordinates</span>
                </label>
                <p class="setting-description">Display file and rank labels around the board</p>
              </div>
            </div>
            
            <div class="settings-section">
              <h3>Animation & Sound</h3>
              
              <div class="setting-item">
                <label class="setting-label">
                  <span class="setting-text">Animation Speed</span>
                </label>
                <div class="setting-slider">
                  <input type="range" min="0" max="2" step="0.1" value="${this.settings.animationSpeed}" class="setting-range" data-setting="animationSpeed">
                  <div class="slider-labels">
                    <span>Off</span>
                    <span>Normal</span>
                    <span>Fast</span>
                  </div>
                </div>
              </div>
              
              <div class="setting-item">
                <label class="setting-label">
                  <input type="checkbox" class="setting-checkbox" data-setting="soundEffects" ${this.settings.soundEffects ? 'checked' : ''}>
                  <span class="setting-text">Sound Effects</span>
                </label>
                <p class="setting-description">Play sounds for moves and game events</p>
              </div>
            </div>
            
            <div class="settings-section">
              <h3>Display</h3>
              
              <div class="setting-item">
                <label class="setting-label">
                  <span class="setting-text">Theme</span>
                </label>
                <select class="setting-select" data-setting="theme">
                  <option value="light" ${this.settings.theme === 'light' ? 'selected' : ''}>Light</option>
                  <option value="dark" ${this.settings.theme === 'dark' ? 'selected' : ''}>Dark</option>
                  <option value="system" ${this.settings.theme === 'system' ? 'selected' : ''}>System</option>
                </select>
              </div>
            </div>
            
            <div class="settings-section">
              <h3>Advanced</h3>
              
              <div class="setting-item">
                <button class="setting-button" data-action="reset-settings">
                  Reset to Defaults
                </button>
                <p class="setting-description">Restore all settings to their default values</p>
              </div>
              
              <div class="setting-item">
                <button class="setting-button" data-action="export-settings">
                  Export Settings
                </button>
                <p class="setting-description">Download your settings as a file</p>
              </div>
            </div>
          </div>
          
          <div class="modal-footer">
            <button class="btn btn-secondary" data-action="cancel">Cancel</button>
            <button class="btn btn-primary" data-action="save">Save Changes</button>
          </div>
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.container.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const action = target.dataset.action;

      if (action) {
        this.handleAction(action);
      }
    });

    // Handle setting changes
    this.container.addEventListener('change', (event) => {
      const target = event.target as HTMLInputElement | HTMLSelectElement;
      const setting = target.dataset.setting;

      if (setting) {
        this.handleSettingChange(setting, target);
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
      case 'reset-settings':
        this.resetSettings();
        break;
      case 'export-settings':
        this.exportSettings();
        break;
    }
  }

  private handleSettingChange(setting: string, target: HTMLInputElement | HTMLSelectElement): void {
    let value: any;

    if (target.type === 'checkbox') {
      value = (target as HTMLInputElement).checked;
    } else if (target.type === 'range') {
      value = parseFloat((target as HTMLInputElement).value);
    } else {
      value = target.value;
    }

    this.settings = { ...this.settings, [setting]: value };
  }

  private saveSettings(): void {
    this.onSettingsChange(this.settings);
    this.hide();
  }

  private resetSettings(): void {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      const defaultSettings: GameSettings = {
        showCoordinates: true,
        highlightLegalMoves: true,
        animationSpeed: 1,
        soundEffects: true,
        theme: 'system',
        boardTheme: 'brown',
        pieceSet: 'classic',
        autoSwitchInFriendMode: false
      };

      this.settings = defaultSettings;
      this.updateModal();
    }
  }

  private exportSettings(): void {
    const dataStr = JSON.stringify(this.settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'chess-platform-settings.json';
    link.click();

    URL.revokeObjectURL(link.href);
  }

  private updateModal(): void {
    // Update checkbox states
    this.container.querySelectorAll('.setting-checkbox').forEach(checkbox => {
      const input = checkbox as HTMLInputElement;
      const setting = input.dataset.setting;
      if (setting && setting in this.settings) {
        input.checked = (this.settings as any)[setting];
      }
    });

    // Update range inputs
    this.container.querySelectorAll('.setting-range').forEach(range => {
      const input = range as HTMLInputElement;
      const setting = input.dataset.setting;
      if (setting && setting in this.settings) {
        input.value = (this.settings as any)[setting].toString();
      }
    });

    // Update select inputs
    this.container.querySelectorAll('.setting-select').forEach(select => {
      const input = select as HTMLSelectElement;
      const setting = input.dataset.setting;
      if (setting && setting in this.settings) {
        input.value = (this.settings as any)[setting];
      }
    });
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
