import { Chessboard } from 'react-chessboard';
import { type Chess } from 'chess.js';
import type { GameMove, MoveClassification } from './AnalysisPanel';
import { Loader2, CheckCircle2, AlertTriangle, XCircle, Star, Zap } from 'lucide-react';

interface BoardAreaProps {
  game: Chess;
  whitePlayer?: string;
  blackPlayer?: string;
  orientation: 'white' | 'black';
  isLoading?: boolean;
  currentEval?: number;
  lastMove?: GameMove;
}

export default function BoardArea({ game, whitePlayer, blackPlayer, orientation, isLoading = false, currentEval = 0, lastMove }: BoardAreaProps) {

  const displayWhite = whitePlayer || "White Player";
  const displayBlack = blackPlayer || "Black Player";

  const topPlayer = orientation === 'white' ? displayBlack : displayWhite;
  const topColor = orientation === 'white' ? 'B' : 'W';

  const bottomPlayer = orientation === 'white' ? displayWhite : displayBlack;
  const bottomColor = orientation === 'white' ? 'W' : 'B';

  const topIconClass = topColor === 'B' ? "bg-slate-800 text-slate-200" : "bg-slate-200 text-slate-900";
  const bottomIconClass = bottomColor === 'W' ? "bg-slate-200 text-slate-900" : "bg-slate-800 text-slate-200";

  let evalPercentage = 50;
  if (currentEval > 9000) evalPercentage = 100;
  else if (currentEval < -9000) evalPercentage = 0;
  else {
    evalPercentage = 50 + (currentEval / 20);
    evalPercentage = Math.max(5, Math.min(95, evalPercentage));
  }

  const evalText = currentEval > 9000 ? `M${10000 - currentEval}`
    : currentEval < -9000 ? `-M${10000 + currentEval}`
      : (currentEval > 0 ? '+' : '') + (currentEval / 100).toFixed(1);

  // --- LOGIC TÍNH TỌA ĐỘ 8x8 ---
  const getSquareCoords = (square: string) => {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const fileIndex = files.indexOf(square[0]);
    const rankIndex = parseInt(square[1], 10) - 1;

    if (fileIndex === -1 || isNaN(rankIndex)) return null;

    // Tính toán theo hướng bàn cờ (Trắng thì a1 ở góc trái dưới, Đen thì a1 ở góc phải trên)
    const x = orientation === 'white' ? fileIndex : 7 - fileIndex;
    const y = orientation === 'white' ? 7 - rankIndex : rankIndex;

    return { left: `${x * 12.5}%`, top: `${y * 12.5}%` };
  };

  // Mapping màu sắc theo phân loại
  const getClassificationStyle = (cls?: MoveClassification) => {
    switch (cls) {
      case 'brilliant': return { backgroundColor: 'rgba(2, 132, 199, 0.4)' }; // Blue
      case 'best': return { backgroundColor: 'rgba(34, 197, 94, 0.4)' };     // Green
      case 'blunder': return { backgroundColor: 'rgba(239, 68, 68, 0.4)' };    // Red
      case 'mistake': return { backgroundColor: 'rgba(249, 115, 22, 0.4)' };   // Orange
      case 'inaccuracy': return { backgroundColor: 'rgba(234, 179, 8, 0.4)' }; // Yellow
      default: return {};
    }
  };

  // Render Icon overlay
  const renderMoveBadge = () => {
    if (!lastMove?.to || !lastMove?.classification) return null;
    const coords = getSquareCoords(lastMove.to);
    if (!coords) return null;

    let bgClass = '';
    let iconContent = '';

    // Thiết kế huy hiệu theo chuẩn
    switch (lastMove.classification) {
      case 'brilliant': bgClass = 'bg-cyan-500'; iconContent = '!!'; break;
      case 'best': bgClass = 'bg-green-500'; iconContent = '★'; break;
      case 'excellent': bgClass = 'bg-green-600'; iconContent = '!'; break;
      case 'good': bgClass = 'bg-slate-500'; iconContent = '✓'; break;
      case 'inaccuracy': bgClass = 'bg-yellow-500 text-slate-900'; iconContent = '?!'; break;
      case 'mistake': bgClass = 'bg-orange-500'; iconContent = '?'; break;
      case 'blunder': bgClass = 'bg-red-600'; iconContent = '??'; break;
      default: return null;
    }

    return (
      <div
        className="absolute w-[12.5%] h-[12.5%] pointer-events-none z-30"
        style={{ left: coords.left, top: coords.top }}
      >
        {/* Đặt ở góc trên cùng bên phải của ô cờ, lấn ra ngoài một chút (-top-2, -right-2) */}
        <div className={`absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full ${bgClass} border-2 border-slate-900 flex items-center justify-center text-white text-[11px] font-bold shadow-sm animate-in zoom-in duration-200`}>
          {iconContent}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full max-w-[calc(100vh-16rem)] mx-auto px-2">

      <div className="w-full flex items-center gap-3 mb-3">
        <div className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold shrink-0 uppercase transition-colors ${topIconClass}`}>
          {topPlayer.charAt(0)}
        </div>
        <span className="font-medium text-slate-200">{topPlayer}</span>
      </div>

      <div className="flex w-full gap-2 lg:gap-4">
        {/* THANH EVALUATION */}
        <div className={`w-4 lg:w-5 bg-slate-900 rounded-sm overflow-hidden flex flex-col relative border border-slate-800 shrink-0 ${orientation === 'black' ? 'justify-start' : 'justify-end'}`}>
          <div
            className="w-full bg-slate-200 transition-all duration-300 ease-out"
            style={{ height: `${evalPercentage}%` }}
          ></div>
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-slate-500 z-10 mix-blend-difference pointer-events-none">
            {evalText}
          </span>
        </div>

       {/* 1. Container Cha ngoài cùng: Relative để định vị, nhưng KHÔNG có overflow-hidden */}
        <div className="flex-1 aspect-square relative z-10">
          
          {/* Icon Badge: Nằm ở đây sẽ không bị cắt */}
          {renderMoveBadge()}

          {/* Loading Overlay: Cũng đưa ra đây */}
          {isLoading && (
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] z-30 rounded-xl flex flex-col items-center justify-center">
               <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
               <span className="text-xs font-medium text-slate-300 bg-slate-900/80 px-2 py-1 rounded">Đang tải ván đấu...</span>
            </div>
          )}

          {/* 2. Container Con bên trong: Chịu trách nhiệm bo góc và chứa bàn cờ */}
          <div className="w-full h-full rounded-xl overflow-hidden shadow-2xl shadow-black/50 border border-slate-800 relative z-0">
              <Chessboard 
                options={{
                  position: game.fen(),
                  boardOrientation: orientation,
                  darkSquareStyle: { backgroundColor: '#334155' },
                  lightSquareStyle: { backgroundColor: '#cbd5e1' },
                  animationDurationInMs: 200,
                  squareStyles: (lastMove?.from && lastMove?.to) ? {
                    [lastMove.from]: { backgroundColor: 'rgba(234, 179, 8, 0.3)' },
                    [lastMove.to]: { backgroundColor: 'rgba(234, 179, 8, 0.4)' }
                  } : {}
                }}
              />
          </div>
        </div>
      </div>

      <div className="w-full flex items-center gap-3 mt-3">
        <div className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold shrink-0 uppercase transition-colors ${bottomIconClass}`}>
          {bottomPlayer.charAt(0)}
        </div>
        <span className="font-medium text-slate-200">{bottomPlayer}</span>
      </div>
    </div>
  );
}