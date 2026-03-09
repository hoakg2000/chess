import { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import PuzzleSettingsPanel from '../components/puzzle/PuzzleSettingsPanel';
import PuzzleBoardArea from '../components/puzzle/PuzzleBoardArea';
import PuzzleHistoryPanel, { type PuzzleHistoryItem } from '../components/puzzle/PuzzleHistoryPanel';
import PUZZLES_DATA from '../components/puzzle/puzzles.json';

// --- KHAI BÁO ÂM THANH (Giống App.tsx) ---
const moveSound = new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/move-self.mp3');
const captureSound = new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/capture.mp3');
const checkSound = new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/move-check.mp3');
const gameEndSound = new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/game-end.mp3');

export interface FormattedPuzzle {
  id: string;
  elo: number;
  themes: string[];
  initialFen: string;
  blunderMove: string;
  moves: string[];
}

export default function PuzzlePage() {
  const [isLoadingPuzzle, setIsLoadingPuzzle] = useState(false);
  const [currentPuzzle, setCurrentPuzzle] = useState<FormattedPuzzle | null>(null);

  const [game, setGame] = useState(new Chess());
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');
  const [puzzleState, setPuzzleState] = useState<'idle' | 'playing' | 'failed' | 'solved'>('idle');
  const [activeTheme, setActiveTheme] = useState<string>('all');
  const [moveIndex, setMoveIndex] = useState(-1);
  const [hintSquare, setHintSquare] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string, to: string, status: 'correct' | 'wrong' } | null>(null);

  const blunderTimeoutRef = useRef<number | null>(null);

  const [history, setHistory] = useState<PuzzleHistoryItem[]>(() => {
    const saved = localStorage.getItem('puzzle_history');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('puzzle_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    return () => {
      if (blunderTimeoutRef.current !== null) window.clearTimeout(blunderTimeoutRef.current);
    };
  }, []);

  // --- HÀM PHÁT ÂM THANH ---
  const playSound = (san: string) => {
    if (san.includes('#')) {
      gameEndSound.currentTime = 0;
      gameEndSound.play().catch(() => { });
    } else if (san.includes('+')) {
      checkSound.currentTime = 0;
      checkSound.play().catch(() => { });
    } else if (san.includes('x')) {
      captureSound.currentTime = 0;
      captureSound.play().catch(() => { });
    } else {
      moveSound.currentTime = 0;
      moveSound.play().catch(() => { });
    }
  };

  // --- HÀM ĐI QUÂN (Có tích hợp âm thanh) ---
  const playUciMove = (chessInstance: Chess, uciMove: string) => {
    const from = uciMove.substring(0, 2);
    const to = uciMove.substring(2, 4);
    const promotion = uciMove.length === 5 ? uciMove[4] : undefined;

    const moveObj = chessInstance.move({ from, to, promotion });
    if (moveObj) {
      playSound(moveObj.san); // Phát âm thanh khi có nước đi hợp lệ
    }
    return moveObj;
  };

  const handleStartPuzzle = async (theme: string) => {
    setActiveTheme(theme);

    let availableIds: string[] = [];
    if (theme === 'all') {
      Object.values(PUZZLES_DATA).forEach(ids => { availableIds = availableIds.concat(ids); });
    } else {
      availableIds = PUZZLES_DATA[theme as keyof typeof PUZZLES_DATA];
    }

    if (!availableIds || availableIds.length === 0) return;

    const randomId = availableIds[Math.floor(Math.random() * availableIds.length)];
    setIsLoadingPuzzle(true);
    setPuzzleState('idle');

    try {
      const res = await fetch(`https://lichess.org/api/puzzle/${randomId}`);
      if (!res.ok) throw new Error('Fetch API thất bại');
      const data = await res.json();

      const tempGame = new Chess();
      tempGame.loadPgn(data.game.pgn);
      const historyMoves = tempGame.history();

      const blunderMove = historyMoves[historyMoves.length - 1];

      const preBlunderGame = new Chess();
      for (let i = 0; i < historyMoves.length - 1; i++) {
        preBlunderGame.move(historyMoves[i]);
      }

      const formattedPuzzle: FormattedPuzzle = {
        id: data.puzzle.id,
        elo: data.puzzle.rating,
        themes: data.puzzle.themes,
        initialFen: preBlunderGame.fen(),
        blunderMove: blunderMove,
        moves: data.puzzle.solution
      };

      loadPuzzle(formattedPuzzle);
    } catch (error) {
      console.error('Lỗi khi fetch puzzle:', error);
      alert('Không thể tải câu đố từ Lichess. Vui lòng thử lại!');
    } finally {
      setIsLoadingPuzzle(false);
    }
  };

  const loadPuzzle = (puzzle: FormattedPuzzle) => {
    if (blunderTimeoutRef.current !== null) window.clearTimeout(blunderTimeoutRef.current);

    setCurrentPuzzle(puzzle);
    const newGame = new Chess(puzzle.initialFen);

    const isOpponentWhite = newGame.turn() === 'w';
    setOrientation(isOpponentWhite ? 'black' : 'white');

    setGame(newGame);
    setMoveIndex(-1);
    setPuzzleState('playing');
    setHintSquare(null);
    setLastMove(null);

    blunderTimeoutRef.current = window.setTimeout(() => {
      const gameAfterBlunder = new Chess(newGame.fen());
      const moveObj = gameAfterBlunder.move(puzzle.blunderMove);

      setGame(gameAfterBlunder);
      setMoveIndex(0);
      if (moveObj) {
        playSound(moveObj.san); // Phát âm thanh nước đi sai lầm của đối thủ
        setLastMove({ from: moveObj.from, to: moveObj.to, status: 'wrong' });
      }
    }, 1000);
  };

  const handlePieceDrop = (sourceSquare: string, targetSquare: string) => {
    if (puzzleState !== 'playing' && puzzleState !== 'failed') return false;
    if (moveIndex < 0 || !currentPuzzle) return false;

    const uciMove = sourceSquare + targetSquare;
    const expectedMove = currentPuzzle.moves[moveIndex];

    if (uciMove === expectedMove.substring(0, 4)) {
      const newGame = new Chess(game.fen());
      playUciMove(newGame, expectedMove); // Âm thanh tự động kích hoạt trong hàm này
      setGame(newGame);
      setHintSquare(null);
      setLastMove({ from: sourceSquare, to: targetSquare, status: 'correct' });

      if (moveIndex + 1 >= currentPuzzle.moves.length) {
        setPuzzleState('solved');
        setHistory(prev => [{
          id: currentPuzzle.id, elo: currentPuzzle.elo, themes: currentPuzzle.themes, result: 'solved'
        }, ...prev]);
      } else {
        setTimeout(() => {
          const cpuGame = new Chess(newGame.fen());
          playUciMove(cpuGame, currentPuzzle.moves[moveIndex + 1]); // Âm thanh tự động kích hoạt
          setGame(cpuGame);

          setMoveIndex(moveIndex + 2);
          setLastMove(null);

          if (moveIndex + 2 >= currentPuzzle.moves.length) {
            setPuzzleState('solved');
          }
        }, 500);
      }
      return true;
    } else {
      const newGame = new Chess(game.fen());
      try {
        const moveObj = playUciMove(newGame, uciMove); // Vẫn phát âm thanh bình thường để user biết đã kéo xong
        if (!moveObj) return false;
      } catch (e) {
        return false;
      }

      setGame(newGame);
      setPuzzleState('failed');
      setHintSquare(null);
      setLastMove({ from: sourceSquare, to: targetSquare, status: 'wrong' });

      if (puzzleState === 'playing') {
        setHistory(prev => [{
          id: currentPuzzle.id, elo: currentPuzzle.elo, themes: currentPuzzle.themes, result: 'failed'
        }, ...prev]);
      }
      return true;
    }
  };

  const handleRetry = () => {
    if (!currentPuzzle) return;

    const resetGame = new Chess(currentPuzzle.initialFen);
    const moveObj = resetGame.move(currentPuzzle.blunderMove);

    setGame(resetGame);
    setMoveIndex(0);
    setPuzzleState('playing');
    setHintSquare(null);

    if (moveObj) {
      playSound(moveObj.san); // Phát lại âm thanh khi retry
      setLastMove({ from: moveObj.from, to: moveObj.to, status: 'wrong' });
    } else {
      setLastMove(null);
    }
  };

  const handleHint = () => {
    if (!currentPuzzle || moveIndex < 0 || moveIndex >= currentPuzzle.moves.length) return;
    const expectedMove = currentPuzzle.moves[moveIndex];
    setHintSquare(expectedMove.substring(0, 2));
  };

  const handleSkipOrNext = () => {
    handleStartPuzzle(activeTheme);
  };

  const handleSelectHistory = async (puzzleId: string) => {
    setIsLoadingPuzzle(true);
    try {
      const res = await fetch(`https://lichess.org/api/puzzle/${puzzleId}`);
      if (!res.ok) throw new Error('Không thể tải câu đố này');
      const data = await res.json();

      // Logic parse PGN y hệt như hàm handleStartPuzzle của bạn
      const tempGame = new Chess();
      tempGame.loadPgn(data.game.pgn);
      const historyMoves = tempGame.history();
      const blunderMove = historyMoves[historyMoves.length - 1];

      const preBlunderGame = new Chess();
      for (let i = 0; i < historyMoves.length - 1; i++) {
        preBlunderGame.move(historyMoves[i]);
      }

      const formattedPuzzle: FormattedPuzzle = {
        id: data.puzzle.id,
        elo: data.puzzle.rating,
        themes: data.puzzle.themes,
        initialFen: preBlunderGame.fen(),
        blunderMove: blunderMove,
        moves: data.puzzle.solution
      };

      loadPuzzle(formattedPuzzle);
    } catch (error) {
      alert("Lỗi khi tải lại câu đố cũ.");
    } finally {
      setIsLoadingPuzzle(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử giải đố?")) {
      setHistory([]);
      localStorage.removeItem('puzzle_history');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full relative">
      <div className="lg:col-span-3 h-full overflow-hidden hidden lg:block">
        <PuzzleSettingsPanel
          onStart={handleStartPuzzle}
          isPlaying={isLoadingPuzzle || (puzzleState === 'playing' && moveIndex < 0)}
        />
      </div>

      <div className="lg:col-span-6 h-full flex items-center justify-center overflow-hidden relative">
        {isLoadingPuzzle && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-xl">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <span className="text-white font-medium text-sm bg-slate-900/80 px-4 py-2 rounded-lg">Đang kết nối Lichess...</span>
          </div>
        )}

        <PuzzleBoardArea
          game={game}
          orientation={orientation}
          puzzleState={puzzleState}
          hintSquare={hintSquare}
          lastMove={lastMove}
          onPieceDrop={handlePieceDrop}
          onStartClick={handleSkipOrNext}
        />
      </div>

      <div className="lg:col-span-3 h-full overflow-hidden">
        <PuzzleHistoryPanel
          history={history}
          puzzleState={puzzleState}
          currentPuzzle={currentPuzzle}
          onSkipOrNext={handleSkipOrNext}
          onHint={handleHint}
          onRetry={handleRetry}
          onClearHistory={handleClearHistory}
          onSelectHistory={handleSelectHistory}
        />
      </div>
    </div>
  );
}