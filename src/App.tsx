import { useState, useMemo, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import debounce from 'lodash/debounce';
import Header from './components/Header';
import BoardArea from './components/BoardArea';
import GameSearchPanel from './components/GameSearchPanel';
import AnalysisPanel, { type GameMove } from './components/AnalysisPanel';
import { type ChessGame } from './services/chessApi';
import { useStockfish } from './hooks/useStockfish'; // Import Hook

const moveSound = new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/move-self.mp3');
const captureSound = new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/capture.mp3');
const checkSound = new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/move-check.mp3');
const gameEndSound = new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/game-end.mp3'); // Dùng cho checkmate

export default function App() {
  const [game, setGame] = useState(new Chess());
  const [moveHistory, setMoveHistory] = useState<GameMove[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState<number>(-1);
  const [gameMetadata, setGameMetadata] = useState<{ white: string, black: string } | null>(null);
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');
  const [isLoadingBoard, setIsLoadingBoard] = useState<boolean>(false);

  // States cho quá trình phân tích
  const { isReady, evaluateFen } = useStockfish();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);

  // Lấy điểm số hiện tại để truyền xuống BoardArea (nếu index -1 thì cho điểm 0.0)
  const currentEvalScore = currentMoveIndex >= 0 ? moveHistory[currentMoveIndex]?.evaluation : 0;

  // Xử lý phân tích toàn bộ ván đấu
  const handleAnalyzeGame = async () => {
    if (!isReady || isAnalyzing || moveHistory.length === 0) return;
    setIsAnalyzing(true);
    setAnalyzeProgress(0);

    const historyCopy = [...moveHistory];

    // Chạy vòng lặp đồng bộ qua từng nước đi
    for (let i = 0; i < historyCopy.length; i++) {
      const fen = historyCopy[i].fen;
      let score = await evaluateFen(fen, 10); // Phân tích ở Depth 10
      
      // Stockfish trả điểm theo góc nhìn của người chuẩn bị đi.
      // Nếu FEN có chữ ' b ' -> chuẩn bị đến lượt Đen. Nghĩa là Trắng vừa đi xong.
      // Nếu lúc này Đen đang ưu thế (điểm dương), tức là đối với Trắng, điểm phải là Âm.
      const isBlackToMove = fen.includes(' b ');
      if (isBlackToMove) {
         score = -score; // Đảo dấu để chuẩn hóa toàn bộ về góc nhìn của TRẮNG
      }
      
      historyCopy[i].evaluation = score;
      
      // Cập nhật UI theo từng nước để tạo hiệu ứng Progress mượt mà
      setMoveHistory([...historyCopy]); 
      setAnalyzeProgress(Math.round(((i + 1) / historyCopy.length) * 100));
    }
    
    setIsAnalyzing(false);
  };

  const processGameData = useMemo(
    () => 
      debounce((selectedGame: ChessGame, searchedUsername: string) => {
        try {
          const tempGame = new Chess();
          tempGame.loadPgn(selectedGame.pgn);
          const rawHistory = tempGame.history({ verbose: true });
          
          const replayGame = new Chess();
          const historyWithFen: GameMove[] = rawHistory.map(move => {
            replayGame.move(move);
            return { san: move.san, fen: replayGame.fen() }; // Khởi tạo mảng chưa có evaluation
          });

          setMoveHistory(historyWithFen);
          
          const isBlack = selectedGame.black.username.toLowerCase() === searchedUsername.toLowerCase();
          setBoardOrientation(isBlack ? 'black' : 'white');

          setGameMetadata({
            white: selectedGame.white.username,
            black: selectedGame.black.username
          });

          const lastIndex = historyWithFen.length - 1;
          setCurrentMoveIndex(lastIndex);
          
          const newGame = new Chess();
          if (lastIndex >= 0) {
            newGame.load(historyWithFen[lastIndex].fen);
          }
          setGame(newGame);

        } catch (error) {
          console.error("Lỗi parse PGN:", error);
        } finally {
          setIsLoadingBoard(false);
        }
      }, 500),
    []
  );

  useEffect(() => { return () => processGameData.cancel(); }, [processGameData]);

  const handleSelectGame = (selectedGame: ChessGame, searchedUsername: string) => {
    setIsLoadingBoard(true); 
    // Reset trạng thái phân tích của ván cũ
    setIsAnalyzing(false);
    setAnalyzeProgress(0);
    processGameData(selectedGame, searchedUsername); 
  };

  const handleJumpToMove = useCallback((index: number) => {
    if (index < -1 || index >= moveHistory.length || index === currentMoveIndex) return;
    
    // Phân tích chuỗi SAN để phát đúng âm thanh khi đi tới
    if (index > currentMoveIndex && index >= 0) {
      const moveSan = moveHistory[index].san;
      
      // Ưu tiên kiểm tra Checkmate trước, sau đó tới Check, Capture và cuối cùng là Move thường
      if (moveSan.includes('#')) {
        gameEndSound.currentTime = 0;
        gameEndSound.play().catch(() => {});
      } else if (moveSan.includes('+')) {
        checkSound.currentTime = 0;
        checkSound.play().catch(() => {});
      } else if (moveSan.includes('x')) {
        captureSound.currentTime = 0;
        captureSound.play().catch(() => {});
      } else {
        moveSound.currentTime = 0;
        moveSound.play().catch(() => {});
      }
    } else {
      // Đang lùi lại (Tua ngược): Chỉ phát âm thanh di chuyển cơ bản
      moveSound.currentTime = 0;
      moveSound.play().catch(() => {});
    }

    setCurrentMoveIndex(index);
    const newGame = new Chess();
    if (index >= 0) newGame.load(moveHistory[index].fen);
    setGame(newGame);
  }, [moveHistory, currentMoveIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Chặn sự kiện nếu người dùng đang gõ chữ vào ô tìm kiếm
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // 2. Chặn nếu chưa có dữ liệu ván đấu
      if (moveHistory.length === 0) return;

      // 3. Xử lý 4 phím mũi tên
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault(); // Ngăn trình duyệt cuộn ngang nếu có
          handleJumpToMove(currentMoveIndex - 1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleJumpToMove(currentMoveIndex + 1);
          break;
        case 'ArrowUp':
          e.preventDefault(); // Ngăn trình duyệt cuộn lên
          handleJumpToMove(-1); // Nhảy về đầu trận
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleJumpToMove(moveHistory.length - 1); // Nhảy đến cuối trận
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentMoveIndex, moveHistory, handleJumpToMove]);
  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-300 font-sans selection:bg-blue-500/30 overflow-hidden">
      <Header />
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
          
          <div className="lg:col-span-3 h-full overflow-hidden hidden lg:block">
            <GameSearchPanel onSelectGame={handleSelectGame} />
          </div>

          <div className="lg:col-span-6 h-full flex items-center justify-center overflow-hidden">
            <BoardArea 
              game={game} 
              whitePlayer={gameMetadata?.white} 
              blackPlayer={gameMetadata?.black}
              orientation={boardOrientation} 
              isLoading={isLoadingBoard}
              currentEval={currentEvalScore} // Truyền điểm số hiện tại
            />
          </div>

          <div className="lg:col-span-3 h-full overflow-hidden">
            <AnalysisPanel 
              moveHistory={moveHistory} 
              currentMoveIndex={currentMoveIndex}
              onJumpToMove={handleJumpToMove}
              onAnalyzeGame={handleAnalyzeGame} // Truyền hàm xử lý
              isAnalyzing={isAnalyzing}
              analyzeProgress={analyzeProgress}
              isEngineReady={isReady}
              orientation={boardOrientation} // TRUYỀN THÊM DÒNG NÀY
            />
          </div>

        </div>
      </main>
    </div>
  );
}