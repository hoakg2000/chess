import { useState, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import { useStockfish } from '../hooks/useStockfish';
import PlayStatusPanel from '../components/play/PlayStatusPanel';
import PlayBoardArea from '../components/play/PlayBoardArea';
import PlaySettingsPanel from '../components/play/PlaySettingsPanel';

const moveSound = new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/move-self.mp3');
const captureSound = new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/capture.mp3');
const checkSound = new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/move-check.mp3');
const gameEndSound = new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/game-end.mp3');

export default function PlayPage() {
  const [game, setGame] = useState(new Chess());
  const [level, setLevel] = useState(1);
  const [userColor, setUserColor] = useState<'white' | 'black'>('white');
  const [isStarted, setIsStarted] = useState(false);
  const [gameResult, setGameResult] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [reviewGame, setReviewGame] = useState<Chess | null>(null); // Game state for review mode

  const { isReady, sendMessage, getBestMove } = useStockfish();

  const playSound = (san: string) => {
    if (san.includes('+') || san.includes('#')) checkSound.play().catch(() => { });
    else if (san.includes('x')) captureSound.play().catch(() => { });
    else moveSound.play().catch(() => { });
  };

  // Logic máy đi quân
  const computerMove = useCallback(async (currentFen: string) => {
    if (!isReady || isThinking) return;
    setIsThinking(true);

    // Thiết lập độ khó (Skill Level 0-20)
    const skill = Math.floor((level - 1) * 2.8);
    sendMessage(`setoption name Skill Level value ${skill}`);

    const bestMove = await getBestMove(currentFen, 800);
    if (bestMove) {
      const move = game.move({
        from: bestMove.substring(0, 2),
        to: bestMove.substring(2, 4),
        promotion: 'q'
      });
      if (move) {
        // Lưu PGN trước khi tạo instance mới
        const pgnString = game.pgn();
        const newGame = new Chess();
        if (pgnString) {
          newGame.loadPgn(pgnString);
        }
        setGame(newGame);
        playSound(move.san);
        setLastMove({ from: bestMove.substring(0, 2), to: bestMove.substring(2, 4) });
      }
    }
    setIsThinking(false);
  }, [isReady, isThinking, level, sendMessage, getBestMove, game]);

  // Hàm bắt đầu ván đấu
  const handleStart = useCallback(() => {
    if (!isReady) return;
    
    const newGame = new Chess();
    setGame(newGame);
    setGameResult(null);
    setIsStarted(true);
    setIsThinking(false);
    setLastMove(null);

    // Nếu user chọn đen thì máy đi trước
    if (userColor === 'black') {
      setTimeout(() => computerMove(newGame.fen()), 500);
    }
  }, [isReady, userColor, computerMove]);

  // Kiểm tra lượt máy và trạng thái game
  useEffect(() => {
    if (!isStarted || gameResult) return;
    
    // Kiểm tra game over trước
    if (game.isGameOver()) {
      let result = '';
      if (game.isCheckmate()) {
        const winner = game.turn() === 'w' ? 'Đen' : 'Trắng';
        result = `Chiếu bí! ${winner} thắng`;
      } else if (game.isStalemate()) {
        result = 'Hòa cờ - Pat';
      } else if (game.isThreefoldRepetition()) {
        result = 'Hòa cờ - Lặp 3 lần';
      } else if (game.isInsufficientMaterial()) {
        result = 'Hòa cờ - Không đủ quân';
      } else if (game.isDraw()) {
        result = 'Hòa cờ';
      }
      setGameResult(result);
      gameEndSound.play().catch(() => {});
      return;
    }

    // Lượt máy đi
    const isComputerTurn = game.turn() !== userColor[0];
    if (isComputerTurn && !isThinking) {
      const timer = setTimeout(() => computerMove(game.fen()), 500);
      return () => clearTimeout(timer);
    }
  }, [game, isStarted, userColor, gameResult, computerMove, isThinking]);

  // Hàm reset game
  const handleNewGame = useCallback(() => {
    setIsStarted(false);
    setGame(new Chess());
    setGameResult(null);
    setIsThinking(false);
    setLastMove(null);
    setReviewGame(null);
  }, []);

  // Hàm xử lý navigation trong review mode
  const handlePositionChange = useCallback((moveIndex: number) => {
    if (moveIndex === -1) {
      // Back to current position
      setReviewGame(null);
      return;
    }

    // Create a new game and replay moves up to the selected index
    const tempGame = new Chess();
    const moves = game.history({ verbose: true });
    
    for (let i = 0; i <= moveIndex && i < moves.length; i++) {
      tempGame.move(moves[i]);
    }
    
    setReviewGame(tempGame);
  }, [game]);
  const onPieceDrop = useCallback((args: any) => {
    if (!isStarted || gameResult || isThinking) return false;
    
    // Kiểm tra có phải lượt của người chơi không
    const isUserTurn = game.turn() === userColor[0];
    if (!isUserTurn) return false;

    const source = typeof args === 'object' ? args.sourceSquare : args;
    const target = typeof args === 'object' ? args.targetSquare : arguments[1];

    try {
      const move = game.move({ 
        from: source, 
        to: target, 
        promotion: 'q'
      });
      
      if (move) {
        // Lưu PGN trước khi tạo instance mới
        const pgnString = game.pgn();
        const newGame = new Chess();
        if (pgnString) {
          newGame.loadPgn(pgnString);
        }
        setGame(newGame);
        playSound(move.san);
        setLastMove({ from: source, to: target });
        return true;
      }
    } catch (e) {
      return false;
    }
    return false;
  }, [isStarted, gameResult, isThinking, game, userColor, playSound]);

 return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full relative">
      {/* Review Mode Banner */}
      {/* {reviewGame && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-amber-600 text-white px-4 py-2 text-sm font-medium text-center">
          <span>Đang xem lại - Ấn "End" hoặc nước cuối để quay về trận đấu</span>
        </div>
      )} */}

      <div className="lg:col-span-3 h-full overflow-hidden hidden lg:block" >
        <PlaySettingsPanel 
          onStart={handleStart}
          isLoading={!isReady}
          isStarted={isStarted}
          level={level}
          setLevel={setLevel}
          userColor={userColor}
          setUserColor={setUserColor}
        />
      </div>

      <div className="lg:col-span-6 h-full flex items-center justify-center overflow-hidden" >
        <PlayBoardArea 
          game={reviewGame || game}
          userColor={userColor}
          isStarted={isStarted}
          gameResult={gameResult}
          isComputerThinking={isThinking}
          onPieceDrop={reviewGame ? () => false : onPieceDrop} // Disable drag in review mode
          onStartClick={handleStart}
          lastMove={reviewGame ? null : lastMove} // Hide last move in review mode
        />
      </div>

      <div className="lg:col-span-3 h-full overflow-hidden">
        <PlayStatusPanel 
          game={game}
          gameResult={gameResult}
          isThinking={isThinking}
          onNewGame={handleNewGame}
          onPositionChange={handlePositionChange}
        />
      </div>
    </div>
  );
}