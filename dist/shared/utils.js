"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChessUtils = void 0;
class ChessUtils {
    static squareToPosition(square) {
        const file = square[0];
        const rank = parseInt(square[1]);
        return { file, rank };
    }
    static positionToSquare(position) {
        return `${position.file}${position.rank}`;
    }
    static positionToIndex(position) {
        const col = this.files.indexOf(position.file);
        const row = 8 - position.rank;
        return { row, col };
    }
    static indexToPosition(row, col) {
        const file = this.files[col];
        const rank = (8 - row);
        return { file, rank };
    }
    static squareToIndex(square) {
        return this.positionToIndex(this.squareToPosition(square));
    }
    static indexToSquare(row, col) {
        return this.positionToSquare(this.indexToPosition(row, col));
    }
    static isValidSquare(square) {
        if (square.length !== 2)
            return false;
        const file = square[0];
        const rank = square[1];
        return this.files.includes(file) &&
            this.ranks.includes(parseInt(rank));
    }
    static isValidPosition(position) {
        return this.files.includes(position.file) &&
            this.ranks.includes(position.rank);
    }
    static getDistance(from, to) {
        const dx = this.files.indexOf(to.file) - this.files.indexOf(from.file);
        const dy = to.rank - from.rank;
        return { dx, dy };
    }
    static isOnSameDiagonal(from, to) {
        const { dx, dy } = this.getDistance(from, to);
        return Math.abs(dx) === Math.abs(dy);
    }
    static isOnSameRankOrFile(from, to) {
        return from.file === to.file || from.rank === to.rank;
    }
    static getSquaresBetween(from, to) {
        const fromPos = this.squareToPosition(from);
        const toPos = this.squareToPosition(to);
        const { dx, dy } = this.getDistance(fromPos, toPos);
        const squares = [];
        const steps = Math.max(Math.abs(dx), Math.abs(dy));
        if (steps === 0)
            return squares;
        const stepX = dx === 0 ? 0 : dx / Math.abs(dx);
        const stepY = dy === 0 ? 0 : dy / Math.abs(dy);
        for (let i = 1; i < steps; i++) {
            const newFile = this.files[this.files.indexOf(fromPos.file) + i * stepX];
            const newRank = (fromPos.rank + i * stepY);
            if (newFile && this.ranks.includes(newRank)) {
                squares.push(this.positionToSquare({ file: newFile, rank: newRank }));
            }
        }
        return squares;
    }
    static flipSquare(square) {
        const position = this.squareToPosition(square);
        const flippedRank = (9 - position.rank);
        return this.positionToSquare({ file: position.file, rank: flippedRank });
    }
    static getSquareColor(square) {
        const position = this.squareToPosition(square);
        const fileIndex = this.files.indexOf(position.file);
        const isEven = (fileIndex + position.rank) % 2 === 0;
        return isEven ? 'dark' : 'light';
    }
}
exports.ChessUtils = ChessUtils;
ChessUtils.files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
ChessUtils.ranks = [1, 2, 3, 4, 5, 6, 7, 8];
//# sourceMappingURL=utils.js.map