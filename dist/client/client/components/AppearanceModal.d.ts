import { GameSettings } from '../../shared/types';
export declare class AppearanceModal {
    private container;
    private settings;
    private onSettingsChange;
    constructor(container: HTMLElement, settings: GameSettings, onSettingsChange: (settings: Partial<GameSettings>) => void);
    private createModal;
    private createBoardThemes;
    private createPieceSets;
    private createBoardPreview;
    private createPreviewSquares;
    private getPieceSymbol;
    private setupEventListeners;
    private handleAction;
    private selectTheme;
    private selectPieceSet;
    private updatePreview;
    private saveSettings;
    show(): void;
    hide(): void;
}
