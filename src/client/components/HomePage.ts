export class HomePage {
  private container: HTMLElement;
  private onPlayClick: () => void;

  constructor(container: HTMLElement, onPlayClick: () => void) {
    this.container = container;
    this.onPlayClick = onPlayClick;
    this.createHomePage();
    this.bindEvents();
  }

  private createHomePage(): void {
    this.container.innerHTML = `
      <div class="home-page">
        <div class="home-hero">
          <div class="hero-content">
            <h1 class="hero-title">
              <span class="chess-piece">♚</span>
              Chess Platform
              <span class="chess-piece">♔</span>
            </h1>
            <p class="hero-subtitle">Master the ancient game of strategy and intellect</p>
            <button class="play-button" id="play-game-btn">
              <span class="play-icon">▶</span>
              Start Playing
            </button>
          </div>
        </div>

        <div class="home-content">
          <div class="features-section">
            <h2 class="section-title">Game Features</h2>
            <div class="features-grid">
              <div class="feature-card">
                <div class="feature-icon">🎯</div>
                <h3>Multiple Game Modes</h3>
                <p>Play against friends, challenge the computer, or practice with different difficulty levels</p>
              </div>
              <div class="feature-card">
                <div class="feature-icon">⏱️</div>
                <h3>Time Controls</h3>
                <p>Classic time controls with pause/resume functionality for serious games</p>
              </div>
              <div class="feature-card">
                <div class="feature-icon">📝</div>
                <h3>Move Notation</h3>
                <p>Complete move history with standard algebraic notation and game replay</p>
              </div>
              <div class="feature-card">
                <div class="feature-icon">🎨</div>
                <h3>Customizable</h3>
                <p>Multiple board themes, piece sets, and appearance options</p>
              </div>
              <div class="feature-card">
                <div class="feature-icon">🏆</div>
                <h3>Advanced Rules</h3>
                <p>Full chess rules including castling, en passant, promotion, and draw offers</p>
              </div>
              <div class="feature-card">
                <div class="feature-icon">♟️</div>
                <h3>Captured Pieces</h3>
                <p>Track captured pieces and material advantage in real-time</p>
              </div>
            </div>
          </div>

          <div class="how-to-play-section">
            <h2 class="section-title">How to Play Chess</h2>
            <div class="chess-rules">
              <div class="rule-category">
                <h3>🎯 Objective</h3>
                <p>The goal is to checkmate your opponent's king. This means the king is in check (under attack) and cannot escape capture.</p>
              </div>

              <div class="rule-category">
                <h3>♟️ Piece Movement</h3>
                <div class="pieces-grid">
                  <div class="piece-rule">
                    <span class="piece-symbol">♔</span>
                    <div>
                      <strong>King:</strong> Moves one square in any direction
                    </div>
                  </div>
                  <div class="piece-rule">
                    <span class="piece-symbol">♕</span>
                    <div>
                      <strong>Queen:</strong> Moves any distance in any direction
                    </div>
                  </div>
                  <div class="piece-rule">
                    <span class="piece-symbol">♖</span>
                    <div>
                      <strong>Rook:</strong> Moves any distance horizontally or vertically
                    </div>
                  </div>
                  <div class="piece-rule">
                    <span class="piece-symbol">♗</span>
                    <div>
                      <strong>Bishop:</strong> Moves any distance diagonally
                    </div>
                  </div>
                  <div class="piece-rule">
                    <span class="piece-symbol">♘</span>
                    <div>
                      <strong>Knight:</strong> Moves in an "L" shape: 2 squares in one direction, then 1 perpendicular
                    </div>
                  </div>
                  <div class="piece-rule">
                    <span class="piece-symbol">♙</span>
                    <div>
                      <strong>Pawn:</strong> Moves forward one square, captures diagonally. Can move two squares on first move
                    </div>
                  </div>
                </div>
              </div>

              <div class="rule-category">
                <h3>⚡ Special Moves</h3>
                <div class="special-moves">
                  <div class="special-move">
                    <strong>Castling:</strong> King and rook move together for protection. King moves 2 squares toward rook, rook moves to square king crossed.
                  </div>
                  <div class="special-move">
                    <strong>En Passant:</strong> Special pawn capture when opponent's pawn moves 2 squares forward next to your pawn.
                  </div>
                  <div class="special-move">
                    <strong>Promotion:</strong> When a pawn reaches the opposite end, it can become any piece (usually queen).
                  </div>
                </div>
              </div>

              <div class="rule-category">
                <h3>🏁 Game End Conditions</h3>
                <div class="end-conditions">
                  <div class="end-condition">
                    <strong>Checkmate:</strong> King is in check and cannot escape - game over!
                  </div>
                  <div class="end-condition">
                    <strong>Stalemate:</strong> No legal moves available but king is not in check - draw!
                  </div>
                  <div class="end-condition">
                    <strong>Draw:</strong> By agreement, insufficient material, or 50-move rule
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="game-controls-section">
            <h2 class="section-title">Game Controls</h2>
            <div class="controls-grid">
              <div class="control-item">
                <strong>Move Pieces:</strong> Click and drag pieces to move them
              </div>
              <div class="control-item">
                <strong>Game Panel:</strong> Use timer controls, pause/resume, and offer draws
              </div>
              <div class="control-item">
                <strong>Move History:</strong> Browse through moves using the notation table
              </div>
              <div class="control-item">
                <strong>Flip Board:</strong> Rotate the board to play from either perspective
              </div>
              <div class="control-item">
                <strong>New Game:</strong> Start fresh anytime with the new game button
              </div>
              <div class="control-item">
                <strong>Bot Modes:</strong> Switch sides when playing against computer
              </div>
            </div>
          </div>

          <div class="cta-section">
            <h2>Ready to Play?</h2>
            <p>Jump into a game and start improving your chess skills!</p>
            <button class="play-button secondary" id="play-game-btn-2">
              <span class="play-icon">▶</span>
              Start Your Game
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private bindEvents(): void {
    const playButton1 = this.container.querySelector('#play-game-btn');
    const playButton2 = this.container.querySelector('#play-game-btn-2');
    
    if (playButton1) {
      playButton1.addEventListener('click', this.onPlayClick);
    }
    
    if (playButton2) {
      playButton2.addEventListener('click', this.onPlayClick);
    }
  }

  public show(): void {
    this.container.style.display = 'block';
  }

  public hide(): void {
    this.container.style.display = 'none';
  }

  public destroy(): void {
    const playButton1 = this.container.querySelector('#play-game-btn');
    const playButton2 = this.container.querySelector('#play-game-btn-2');
    
    if (playButton1) {
      playButton1.removeEventListener('click', this.onPlayClick);
    }
    
    if (playButton2) {
      playButton2.removeEventListener('click', this.onPlayClick);
    }
  }
}