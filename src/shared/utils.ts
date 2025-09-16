import { Position, Square, File, Rank } from './types';

export class ChessUtils {
  static files: File[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  static ranks: Rank[] = [1, 2, 3, 4, 5, 6, 7, 8];

  static squareToPosition(square: Square): Position {
    const file = square[0] as File;
    const rank = parseInt(square[1]) as Rank;
    return { file, rank };
  }

  static positionToSquare(position: Position): Square {
    return `${position.file}${position.rank}`;
  }

  static positionToIndex(position: Position): { row: number; col: number } {
    const col = this.files.indexOf(position.file);
    const row = 8 - position.rank;
    return { row, col };
  }

  static indexToPosition(row: number, col: number): Position {
    const file = this.files[col];
    const rank = (8 - row) as Rank;
    return { file, rank };
  }

  static squareToIndex(square: Square): { row: number; col: number } {
    return this.positionToIndex(this.squareToPosition(square));
  }

  static indexToSquare(row: number, col: number): Square {
    return this.positionToSquare(this.indexToPosition(row, col));
  }

  static isValidSquare(square: string): boolean {
    if (square.length !== 2) return false;
    const file = square[0];
    const rank = square[1];
    return this.files.includes(file as File) &&
      this.ranks.includes(parseInt(rank) as Rank);
  }

  static isValidPosition(position: Position): boolean {
    return this.files.includes(position.file) &&
      this.ranks.includes(position.rank);
  }

  static getDistance(from: Position, to: Position): { dx: number; dy: number } {
    const dx = this.files.indexOf(to.file) - this.files.indexOf(from.file);
    const dy = to.rank - from.rank;
    return { dx, dy };
  }

  static isOnSameDiagonal(from: Position, to: Position): boolean {
    const { dx, dy } = this.getDistance(from, to);
    return Math.abs(dx) === Math.abs(dy);
  }

  static isOnSameRankOrFile(from: Position, to: Position): boolean {
    return from.file === to.file || from.rank === to.rank;
  }

  static getSquaresBetween(from: Square, to: Square): Square[] {
    const fromPos = this.squareToPosition(from);
    const toPos = this.squareToPosition(to);
    const { dx, dy } = this.getDistance(fromPos, toPos);

    const squares: Square[] = [];
    const steps = Math.max(Math.abs(dx), Math.abs(dy));

    if (steps === 0) return squares;

    const stepX = dx === 0 ? 0 : dx / Math.abs(dx);
    const stepY = dy === 0 ? 0 : dy / Math.abs(dy);

    for (let i = 1; i < steps; i++) {
      const newFile = this.files[this.files.indexOf(fromPos.file) + i * stepX];
      const newRank = (fromPos.rank + i * stepY) as Rank;

      if (newFile && this.ranks.includes(newRank)) {
        squares.push(this.positionToSquare({ file: newFile, rank: newRank }));
      }
    }

    return squares;
  }

  static flipSquare(square: Square): Square {
    const position = this.squareToPosition(square);
    const flippedRank = (9 - position.rank) as Rank;
    return this.positionToSquare({ file: position.file, rank: flippedRank });
  }

  static getSquareColor(square: Square): 'light' | 'dark' {
    const position = this.squareToPosition(square);
    const fileIndex = this.files.indexOf(position.file);
    const isEven = (fileIndex + position.rank) % 2 === 0;
    return isEven ? 'dark' : 'light';
  }
}
