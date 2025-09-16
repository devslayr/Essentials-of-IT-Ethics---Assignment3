import { ChessEngine } from '../engine/ChessEngine';
import { Move } from '../../shared/types';
export declare class NotationTable {
    private container;
    private engine;
    private moves;
    private currentMoveIndex;
    private tableElement;
    constructor(container: HTMLElement, engine: ChessEngine);
    private createTable;
    private setupEventListeners;
    private handleNavigation;
    addMove(move: Move): void;
    removeLastMove(): void;
    private renderMoves;
    private scrollToCurrentMove;
    goToMove(moveIndex: number): void;
    goToStart(): void;
    goToEnd(): void;
    goToPreviousMove(): void;
    goToNextMove(): void;
    reset(): void;
    exportPGN(): string;
    importPGN(pgn: string): boolean;
}
