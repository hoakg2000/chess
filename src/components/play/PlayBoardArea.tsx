import { Chessboard } from 'react-chessboard';
import { type Chess } from 'chess.js';

interface PlayBoardAreaProps {
  game: Chess;
  userColor: 'white' | 'black';
  isStarted: boolean;
  gameResult: string | null;
  isComputerThinking: boolean;
  onPieceDrop: (args: any) => boolean;
  onStartClick: () => void; // Prop để bắt đầu game từ bàn cờ
  lastMove?: { from: string; to: string } | null;
}

export default function PlayBoardArea({
  game,
  userColor,
  isStarted,
  gameResult,
  isComputerThinking,
  onPieceDrop,
  onStartClick,
  lastMove
}: PlayBoardAreaProps) {
  
  const getStatusText = () => {
    if (gameResult) return gameResult;
    if (!isStarted) return 'Sẵn sàng thi đấu';
    
    const turn = game.turn() === 'w' ? 'Trắng' : 'Đen';
    const isUserTurn = game.turn() === userColor[0];
    
    if (isComputerThinking) return 'Máy đang suy nghĩ...';
    return isUserTurn ? `Lượt của bạn (${turn})` : `Lượt của Máy (${turn})`;
  };

  const canDragPiece = ({ piece }: any) => {
    if (!isStarted || gameResult || isComputerThinking) return false;
    const pieceName = typeof piece === 'string' ? piece : piece?.pieceType;
    return pieceName[0] === userColor[0];
  };

  return (
    <div className="flex flex-col items-center w-full h-full max-w-[calc(100vh-16rem)] mx-auto px-2">
      {/* Thanh trạng thái */}
      <div className={`w-full flex items-center justify-center mb-4 px-4 py-3 rounded-lg border transition-all ${
        gameResult ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-slate-800 border-slate-700 text-slate-200'
      }`}>
        <div className="font-bold text-sm uppercase tracking-wider">
          {getStatusText()}
        </div>
      </div>

      {/* Khu vực bàn cờ */}
      <div className="w-full aspect-square relative z-10 rounded-xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-900">
        
        {/* Lớp phủ Idle khi chưa bắt đầu */}
        {!isStarted && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-20 flex items-center justify-center">
            <button 
              onClick={onStartClick}
              className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold shadow-[0_0_30px_rgba(37,99,235,0.4)] transition-all hover:scale-105 active:scale-95 flex items-center gap-3 cursor-pointer"
            >
              <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
              Bắt đầu thi đấu
            </button>
          </div>
        )}

        <Chessboard 
          options={{
            position: game.fen(),
            boardOrientation: userColor,
            onPieceDrop: onPieceDrop,
            canDragPiece: canDragPiece,
            darkSquareStyle: { backgroundColor: '#334155' },
            lightSquareStyle: { backgroundColor: '#cbd5e1' },
            animationDurationInMs: 200,
            squareStyles: {
              // Highlight nước đi cuối
              ...(lastMove ? {
                [lastMove.from]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' },
                [lastMove.to]: { backgroundColor: 'rgba(255, 255, 0, 0.6)' }
              } : {})
            }
          }}
        />
      </div>
    </div>
  );
}