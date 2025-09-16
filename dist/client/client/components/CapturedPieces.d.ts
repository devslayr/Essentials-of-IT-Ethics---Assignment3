import { Piece } from '../../shared/types';
export declare class CapturedPieces {
    private container;
    private capturedWhite;
    private capturedBlack;
    constructor(container: HTMLElement);
    private createDisplay;
    addCapturedPiece(piece: Piece): void;
    removeCapturedPiece(piece: Piece): void;
    private updateDisplay;
    private updateMaterialAdvantage;
    private getPieceSymbol;
    reset(): void;
    getCapturedPieces(): {
        white: Piece[];
        black: Piece[];
    };
}
