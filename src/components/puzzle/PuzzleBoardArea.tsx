import { Chessboard } from 'react-chessboard';
import { type Chess } from 'chess.js';

interface PuzzleBoardAreaProps {
  game?: Chess | null;
  orientation?: 'white' | 'black';
  puzzleState?: 'idle' | 'playing' | 'failed' | 'solved';
  hintSquare?: string | null;
  lastMove?: { from: string; to: string; status: 'correct' | 'wrong' } | null;
  onPieceDrop?: (sourceSquare: string, targetSquare: string) => boolean;
  onStartClick?: () => void;
}

export default function PuzzleBoardArea({
  game,
  orientation = 'white',
  puzzleState = 'idle',
  hintSquare = null,
  lastMove = null,
  onPieceDrop,
  onStartClick
}: PuzzleBoardAreaProps) {

  const getStatusColor = () => {
    if (puzzleState === 'solved') return 'text-green-400 bg-green-400/10 border-green-400/20';
    if (puzzleState === 'failed') return 'text-red-400 bg-red-400/10 border-red-400/20';
    return 'text-slate-200 bg-slate-800 border-slate-700';
  };

  const handlePieceDropWrapper = (args1: any, args2?: string) => {
    if (!onPieceDrop) return false;
    // Tương thích với format trả về của react-chessboard v5
    if (typeof args1 === 'object' && args1 !== null && 'sourceSquare' in args1) {
      return onPieceDrop(args1.sourceSquare, args1.targetSquare);
    }
    if (typeof args1 === 'string' && typeof args2 === 'string') {
      return onPieceDrop(args1, args2);
    }
    return false;
  };

  // SỬA LỖI Ở ĐÂY: Lấy chính xác chuỗi tên quân cờ từ Object
  const canDragPiece = ({ piece }: any) => {
    if (puzzleState !== 'playing') return false;

    // Tùy phiên bản, piece có thể là chuỗi 'wP' hoặc Object { pieceType: 'wP' }
    const pieceName = typeof piece === 'string' ? piece : piece?.pieceType;
    if (!pieceName) return false;

    // So sánh màu của quân cờ (kí tự đầu tiên) với hướng của bàn cờ
    return pieceName[0] === (orientation === 'white' ? 'w' : 'b');
  };

  const getSquareCoords = (square: string) => {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const fileIndex = files.indexOf(square[0]);
    const rankIndex = parseInt(square[1], 10) - 1;

    if (fileIndex === -1 || isNaN(rankIndex)) return null;

    const x = orientation === 'white' ? fileIndex : 7 - fileIndex;
    const y = orientation === 'white' ? 7 - rankIndex : rankIndex;

    return { left: `${x * 12.5}%`, top: `${y * 12.5}%` };
  };

  const renderMoveBadge = () => {
    if (!lastMove) return null;
    const coords = getSquareCoords(lastMove.to);
    if (!coords) return null;

    const isCorrect = lastMove.status === 'correct';
    const bgClass = isCorrect ? 'bg-green-500' : 'bg-red-600';
    const iconContent = isCorrect ? '★' : '✖';

    return (
      <div
        className="absolute w-[12.5%] h-[12.5%] pointer-events-none z-30"
        style={{ left: coords.left, top: coords.top }}
      >
        <div className={`absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full ${bgClass} border-2 border-slate-900 flex items-center justify-center text-white text-[11px] font-bold shadow-sm animate-in zoom-in duration-200`}>
          {iconContent}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center w-full h-full max-w-[calc(100vh-16rem)] mx-auto px-2">
      <div className={`w-full flex items-center justify-center mb-4 px-4 py-3 rounded-lg border transition-colors ${getStatusColor()}`}>
        <div className="font-bold text-sm uppercase tracking-wider">
          {puzzleState === 'idle' && 'Sẵn sàng'}
          {puzzleState === 'playing' && `Lượt của quân ${orientation === 'white' ? 'Trắng' : 'Đen'} - Tìm nước đi tốt nhất`}
          {puzzleState === 'failed' && 'Sai rồi! Hãy thử lại'}
          {puzzleState === 'solved' && 'Tuyệt vời! Bạn đã giải xong'}
        </div>
      </div>

      <div className="w-full aspect-square relative z-10">
        {renderMoveBadge()}

        <div className="w-full h-full rounded-xl overflow-hidden shadow-2xl border border-slate-800 relative z-0">
          {puzzleState === 'idle' && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-20 flex items-center justify-center">
              <button
                onClick={onStartClick}
                className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                Bắt đầu giải đố
              </button>
            </div>
          )}

          <Chessboard
            options={{
              position: game ? game.fen() : 'start',
              boardOrientation: orientation,
              darkSquareStyle: { backgroundColor: '#334155' },
              lightSquareStyle: { backgroundColor: '#cbd5e1' },
              animationDurationInMs: 200,
              onPieceDrop: handlePieceDropWrapper,
              canDragPiece: canDragPiece,
              squareStyles: {
                ...(hintSquare ? { [hintSquare]: { backgroundColor: 'rgba(234, 179, 8, 0.6)' } } : {}),
                ...(lastMove ? {
                  [lastMove.from]: { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
                  [lastMove.to]: { backgroundColor: lastMove.status === 'correct' ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)' }
                } : {})
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}