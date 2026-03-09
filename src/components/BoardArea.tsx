import { Chessboard } from 'react-chessboard';
import { type Chess } from 'chess.js';
import { Loader2 } from 'lucide-react';

interface BoardAreaProps {
  game: Chess;
  whitePlayer?: string;
  blackPlayer?: string;
  orientation: 'white' | 'black';
  isLoading?: boolean;
  currentEval?: number;
}

export default function BoardArea({ game, whitePlayer, blackPlayer, orientation, isLoading = false, currentEval = 0 }: BoardAreaProps) {
  
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
        
        <div className="flex-1 rounded-xl overflow-hidden shadow-2xl shadow-black/50 border border-slate-800 aspect-square relative">
          {isLoading && (
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center">
               <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
               <span className="text-xs font-medium text-slate-300 bg-slate-900/80 px-2 py-1 rounded">Đang tải ván đấu...</span>
            </div>
          )}
          
          {/* Component Bàn cờ tuân thủ nghiêm ngặt prop options */}
          <Chessboard 
            options={{
              position: game.fen(),
              boardOrientation: orientation,
              darkSquareStyle: { backgroundColor: '#334155' },
              lightSquareStyle: { backgroundColor: '#cbd5e1' },
              animationDurationInMs: 200 // Đã cập nhật đúng tên key từ list API của bạn
            }}
          />
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