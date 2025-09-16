import { GameSettings } from '../../shared/types';
export declare class SettingsModal {
    private container;
    private settings;
    private onSettingsChange;
    constructor(container: HTMLElement, settings: GameSettings, onSettingsChange: (settings: Partial<GameSettings>) => void);
    private createModal;
    private setupEventListeners;
    private handleAction;
    private handleSettingChange;
    private saveSettings;
    private resetSettings;
    private exportSettings;
    private importSettings;
    private validateSettings;
    private updateModal;
    show(): void;
    hide(): void;
}
