import { ChessEngine } from '../engine/ChessEngine';
import { GameResult } from '../../shared/types';
export declare class GamePanel {
    private container;
    private engine;
    constructor(container: HTMLElement, engine: ChessEngine);
    private createPanel;
    private setupEventListeners;
    private handleAction;
    private handleGameModeChange;
    private handleTimeControlChange;
    private offerDraw;
    private resign;
    private undoMove;
    private abortGame;
    updateGameStatus(): void;
    showGameOver(result: GameResult): void;
    addLogEntry(message: string): void;
    reset(): void;
    getSelectedGameMode(): string;
    getSelectedDifficulty(): number;
    getTimeControl(): {
        initialTime: number;
        increment: number;
    } | null;
}
