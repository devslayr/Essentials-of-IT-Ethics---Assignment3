import { Piece, PieceColor } from '../../shared/types';

export class CapturedPieces {
    private container: HTMLElement;
    private capturedWhite: Piece[] = [];
    private capturedBlack: Piece[] = [];

    constructor(container: HTMLElement) {
        this.container = container;
        this.createDisplay();
    }

    private createDisplay(): void {
        this.container.innerHTML = `
      <div class="captured-pieces">
        <div class="captured-section white-captured">
          <div class="captured-label">Captured by Black</div>
          <div class="captured-list white-pieces"></div>
        </div>
        <div class="captured-section black-captured">
          <div class="captured-label">Captured by White</div>
          <div class="captured-list black-pieces"></div>
        </div>
      </div>
    `;
    }

    public addCapturedPiece(piece: Piece): void {
        if (piece.color === 'white') {
            this.capturedWhite.push(piece);
        } else {
            this.capturedBlack.push(piece);
        }
        this.updateDisplay();
    }

    public removeCapturedPiece(piece: Piece): void {
        if (piece.color === 'white') {
            const index = this.capturedWhite.findIndex(p => p.type === piece.type && p.color === piece.color);
            if (index !== -1) {
                this.capturedWhite.splice(index, 1);
            }
        } else {
            const index = this.capturedBlack.findIndex(p => p.type === piece.type && p.color === piece.color);
            if (index !== -1) {
                this.capturedBlack.splice(index, 1);
            }
        }
        this.updateDisplay();
    }

    private updateDisplay(): void {
        const whiteContainer = this.container.querySelector('.white-pieces')!;
        const blackContainer = this.container.querySelector('.black-pieces')!;

        // Sort pieces by value (highest first)
        const pieceValues = { queen: 9, rook: 5, bishop: 3, knight: 3, pawn: 1, king: 0 };

        const sortedWhite = [...this.capturedWhite].sort((a, b) => pieceValues[b.type] - pieceValues[a.type]);
        const sortedBlack = [...this.capturedBlack].sort((a, b) => pieceValues[b.type] - pieceValues[a.type]);

        whiteContainer.innerHTML = sortedWhite.map(piece =>
            `<span class="captured-piece" data-piece="${piece.type}" data-color="${piece.color}">
        ${this.getPieceSymbol(piece.type, piece.color)}
      </span>`
        ).join('');

        blackContainer.innerHTML = sortedBlack.map(piece =>
            `<span class="captured-piece" data-piece="${piece.type}" data-color="${piece.color}">
        ${this.getPieceSymbol(piece.type, piece.color)}
      </span>`
        ).join('');

        // Update material advantage
        this.updateMaterialAdvantage();
    }

    private updateMaterialAdvantage(): void {
        const pieceValues = { queen: 9, rook: 5, bishop: 3, knight: 3, pawn: 1, king: 0 };

        const whiteValue = this.capturedWhite.reduce((sum, piece) => sum + pieceValues[piece.type], 0);
        const blackValue = this.capturedBlack.reduce((sum, piece) => sum + pieceValues[piece.type], 0);

        const advantage = blackValue - whiteValue;

        // Clear previous advantage indicators
        this.container.querySelectorAll('.material-advantage').forEach(el => el.remove());

        if (advantage > 0) {
            // White has advantage (captured more valuable black pieces)
            const whiteSection = this.container.querySelector('.white-captured')!;
            const advantageElement = document.createElement('div');
            advantageElement.className = 'material-advantage';
            advantageElement.textContent = `+${advantage}`;
            whiteSection.appendChild(advantageElement);
        } else if (advantage < 0) {
            // Black has advantage (captured more valuable white pieces)
            const blackSection = this.container.querySelector('.black-captured')!;
            const advantageElement = document.createElement('div');
            advantageElement.className = 'material-advantage';
            advantageElement.textContent = `+${Math.abs(advantage)}`;
            blackSection.appendChild(advantageElement);
        }
    }

    private getPieceSymbol(type: string, color: PieceColor): string {
        const pieces: Record<string, Record<PieceColor, string>> = {
            king: { white: '♔', black: '♚' },
            queen: { white: '♕', black: '♛' },
            rook: { white: '♖', black: '♜' },
            bishop: { white: '♗', black: '♝' },
            knight: { white: '♘', black: '♞' },
            pawn: { white: '♙', black: '♟' }
        };

        return pieces[type]?.[color] || '';
    }

    public reset(): void {
        this.capturedWhite = [];
        this.capturedBlack = [];
        this.updateDisplay();
    }

    public getCapturedPieces(): { white: Piece[], black: Piece[] } {
        return {
            white: [...this.capturedWhite],
            black: [...this.capturedBlack]
        };
    }
}
