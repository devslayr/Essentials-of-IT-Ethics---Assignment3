import { Piece, PieceColor, GameSettings } from '../../shared/types';

export class CapturedPieces {
    private container: HTMLElement;
    private capturedWhite: Piece[] = [];
    private capturedBlack: Piece[] = [];
    private settings: GameSettings;

    constructor(container: HTMLElement, settings: GameSettings) {
        this.container = container;
        this.settings = settings;
        this.createDisplay();
    }

    private createDisplay(): void {
        this.container.innerHTML = `
      <div class="captured-pieces-section">
        <div class="captured-pieces-container">
          <div class="captured-section white-captured">
            <div class="captured-label" data-color="♛">Captured by Black</div>
            <div class="captured-list white-pieces"></div>
            <div class="material-advantage white-advantage"></div>
          </div>
          <div class="captured-section black-captured">
            <div class="captured-label" data-color="♕">Captured by White</div>
            <div class="captured-list black-pieces"></div>
            <div class="material-advantage black-advantage"></div>
          </div>
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

        // capturedWhite = white pieces captured by black (black gets these points)
        // capturedBlack = black pieces captured by white (white gets these points)
        const blackScore = this.capturedWhite.reduce((sum, piece) => sum + pieceValues[piece.type], 0);
        const whiteScore = this.capturedBlack.reduce((sum, piece) => sum + pieceValues[piece.type], 0);

        const whiteAdvantage = whiteScore - blackScore;

        const whiteAdvantageEl = this.container.querySelector('.white-advantage')! as HTMLElement;
        const blackAdvantageEl = this.container.querySelector('.black-advantage')! as HTMLElement;

        // Clear both advantage displays
        whiteAdvantageEl.textContent = '';
        whiteAdvantageEl.className = 'material-advantage white-advantage';
        blackAdvantageEl.textContent = '';
        blackAdvantageEl.className = 'material-advantage black-advantage';

        if (whiteAdvantage > 0) {
            // White has advantage (captured more valuable black pieces)
            blackAdvantageEl.textContent = `+${whiteAdvantage}`;
            blackAdvantageEl.classList.add('positive');
        } else if (whiteAdvantage < 0) {
            // Black has advantage (captured more valuable white pieces)
            whiteAdvantageEl.textContent = `+${Math.abs(whiteAdvantage)}`;
            whiteAdvantageEl.classList.add('positive');
        }
    }

    private getPieceSymbol(type: string, color: PieceColor): string {
        const pieceSet = this.settings.pieceSet || 'classic';
        
        const pieceSets: { [key: string]: { [key: string]: { white: string; black: string } } } = {
          classic: {
            king: { white: '♔', black: '♚' },
            queen: { white: '♕', black: '♛' },
            rook: { white: '♖', black: '♜' },
            bishop: { white: '♗', black: '♝' },
            knight: { white: '♘', black: '♞' },
            pawn: { white: '♙', black: '♟' }
          },
          modern: {
            king: { white: '🤴', black: '👑' },
            queen: { white: '👸', black: '💂‍♀️' },
            rook: { white: '🏰', black: '🏯' },
            bishop: { white: '⛪', black: '🕌' },
            knight: { white: '🐎', black: '🏇' },
            pawn: { white: '⚪', black: '⚫' }
          },
          medieval: {
            king: { white: '♔', black: '♚' },
            queen: { white: '♕', black: '♛' },
            rook: { white: '🏭', black: '🏰' },
            bishop: { white: '⛪', black: '🕌' },
            knight: { white: '🛡️', black: '⚔️' },
            pawn: { white: '🔰', black: '⚫' }
          }
        };

        const symbols = pieceSets[pieceSet] || pieceSets.classic;
        return symbols[type]?.[color] || '';
    }

    public updateSettings(settings: GameSettings): void {
        this.settings = settings;
        this.updateDisplay();
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
