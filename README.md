# Chess Platform

A comprehensive chess game platform built with TypeScript that allows you to play chess against yourself, friends, or the Stockfish engine with adjustable difficulty levels. The platform implements all standard chess rules and includes extended features for a complete chess experience.

![Chess Platform](https://via.placeholder.com/800x400/1a1a1a/ffffff?text=Chess+Platform)

## Features

### Standard Chess Mechanics
- **Move Calculation & Validation**: Complete implementation of all chess piece movements
- **Special Moves**: Castling, En Passant, Pawn Promotion
- **Game Rules**: Check, Checkmate, Stalemate detection
- **Draw Conditions**: Threefold Repetition, Fifty-move Rule, Insufficient Material
- **Notation**: FEN (Forsyth-Edwards Notation) and SAN (Standard Algebraic Notation)
- **Time Control**: Configurable time limits with increment support

### Extended Features
- **Pre-moves**: Queue moves for all types including castling, en passant, and promotion
- **Multiple Pre-moves**: Support for chaining multiple pre-moves
- **Game Offers**: Abort, Resign, Draw, Undo, and Rematch functionality
- **Move History Navigation**: Step through games move by move
- **Sound Effects**: Audio feedback for moves and game events
- **Animations**: Smooth piece movement animations

### Game Modes
- **Solo Play**: Practice against yourself or analyze positions
- **Friend Mode**: Play against friends on the same device or online
- **Bot Play**: Challenge the Stockfish engine with 20 difficulty levels
- **Online Multiplayer**: Real-time games with lobby system

### User Interface
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Multiple Themes**: Light, Dark, and System theme support
- **Board Customization**: 6 different board themes and piece sets
- **Notation Table**: Complete move history with navigation
- **Board Editor**: Create and edit custom positions
- **Settings Panel**: Comprehensive configuration options
- **Log Console**: Detailed game event logging

## Technology Stack

- **Frontend**: TypeScript, Webpack, SCSS
- **Backend**: Node.js, Express, Socket.IO
- **Chess Engine**: Custom implementation with full rule validation
- **Real-time Communication**: WebSockets for multiplayer
- **Build Tools**: TypeScript, Webpack, Jest for testing

## Project Structure

```
chess/
├── src/
│   ├── client/           # Frontend application
│   │   ├── components/   # UI components
│   │   ├── engine/       # Chess game logic
│   │   ├── styles/       # SCSS stylesheets
│   │   └── index.ts      # Main application entry
│   ├── server/           # Backend server
│   │   ├── GameRoom.ts   # Game room management
│   │   ├── GameManager.ts # Game session handling
│   │   └── index.ts      # Server entry point
│   └── shared/           # Shared types and utilities
│       ├── types.ts      # TypeScript interfaces
│       └── utils.ts      # Utility functions
├── dist/                 # Compiled output
├── .github/              # GitHub configuration
└── configuration files
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd chess
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Development Mode**
   ```bash
   npm run dev
   ```
   This starts both the client (http://localhost:3000) and server (http://localhost:3001) in development mode.

4. **Build for Production**
   ```bash
   npm run build
   npm start
   ```

### Development Commands

- `npm run dev` - Start development servers
- `npm run build` - Build for production
- `npm run test` - Run test suite
- `npm run lint` - Run ESLint
- `npm run dev:client` - Start only client development server
- `npm run dev:server` - Start only server development server

## Usage

### Playing Solo
1. Select "Play by Yourself" mode
2. Make moves for both sides or practice positions
3. Use the board flip button to change perspective

### Playing with Friends
1. Choose "Play against Friend" for local play or create an online room
2. Share the room ID with your friend for online games
3. Use the chat feature and game offers during play

### Playing against Bot
1. Select "Play against Bot" mode
2. Choose difficulty level (1-20, where 20 is strongest)
3. The Stockfish engine will respond to your moves

### Customization
- Access **Settings** for gameplay preferences
- Use **Appearance** to customize board and pieces
- Enable/disable sounds, animations, and visual aids
- Choose from multiple color themes

## Game Features

### Chess Rules Implementation
- All standard piece movements with collision detection
- Castling with proper validation (king and rook haven't moved, no check)
- En passant captures with timing validation
- Pawn promotion with piece selection dialog
- Check and checkmate detection
- Stalemate and draw conditions

### Extended Mechanics
- **Pre-moves**: Plan your next move while opponent is thinking
- **Undo System**: Request move takebacks in casual games
- **Time Controls**: Blitz, Rapid, Classical, or custom time limits
- **Move Navigation**: Review games move by move
- **Export/Import**: PGN format support for game analysis

### Multiplayer Features
- Real-time synchronization via WebSockets
- Reconnection handling for network interruptions
- Spectator mode for watching games
- Chat system for communication
- Room management with public/private options

## Configuration

### Time Controls
- **Unlimited**: No time pressure
- **Blitz**: 5 minutes per player
- **Rapid**: 10 minutes per player  
- **Classical**: 30 minutes per player
- **Custom**: Set your own time and increment

### Display Options
- Board themes: Brown, Blue, Green, Purple, Red, Gray
- Piece sets: Classic, Modern, Medieval, Minimalist
- Coordinate display toggle
- Legal move highlighting
- Animation speed control

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Use meaningful commit messages
- Update documentation for user-facing changes

## Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Generate coverage report:
```bash
npm run test:coverage
```

## Architecture

### Frontend Architecture
- **Component-based**: Modular UI components for maintainability
- **Event-driven**: Reactive updates for game state changes
- **Responsive**: Mobile-first design with desktop enhancements

### Backend Architecture
- **RESTful API**: HTTP endpoints for game management
- **WebSocket Events**: Real-time game communication
- **Room System**: Isolated game sessions with state management

### Chess Engine
- **Rule Validation**: Comprehensive move legality checking
- **State Management**: Immutable game state with history
- **Performance**: Optimized for real-time gameplay

## Browser Support

- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Chess piece symbols from Unicode standard
- Stockfish engine for bot functionality
- Socket.IO for real-time communication
- TypeScript for type safety and developer experience

## Roadmap

- [ ] Chess engine analysis integration
- [ ] Tournament mode with brackets
- [ ] Advanced statistics and game analysis
- [ ] Mobile app development
- [ ] AI training data collection
- [ ] Puzzle solving mode
- [ ] Opening book integration

---

Built with ♟️ by the Chess Platform Team
