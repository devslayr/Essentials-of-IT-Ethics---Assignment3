import { Position, Square, File, Rank } from './types';
export declare class ChessUtils {
    static files: File[];
    static ranks: Rank[];
    static squareToPosition(square: Square): Position;
    static positionToSquare(position: Position): Square;
    static positionToIndex(position: Position): {
        row: number;
        col: number;
    };
    static indexToPosition(row: number, col: number): Position;
    static squareToIndex(square: Square): {
        row: number;
        col: number;
    };
    static indexToSquare(row: number, col: number): Square;
    static isValidSquare(square: string): boolean;
    static isValidPosition(position: Position): boolean;
    static getDistance(from: Position, to: Position): {
        dx: number;
        dy: number;
    };
    static isOnSameDiagonal(from: Position, to: Position): boolean;
    static isOnSameRankOrFile(from: Position, to: Position): boolean;
    static getSquaresBetween(from: Square, to: Square): Square[];
    static flipSquare(square: Square): Square;
    static getSquareColor(square: Square): 'light' | 'dark';
}
