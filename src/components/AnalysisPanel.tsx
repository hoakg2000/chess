import { ChevronLeft, ChevronRight, FastForward, Rewind, Play, Loader2 } from 'lucide-react';
import { ResponsiveContainer, YAxis, ReferenceLine, Tooltip, AreaChart, Area } from 'recharts';


export interface GameMove {
  san: string;
  fen: string;
  evaluation?: number;
}

interface AnalysisPanelProps {
  moveHistory: GameMove[];
  currentMoveIndex: number;
  onJumpToMove: (index: number) => void;
  onAnalyzeGame: () => void;
  isAnalyzing: boolean;
  analyzeProgress: number;
  isEngineReady: boolean;
  orientation: 'white' | 'black'; // THÊM MỚI
}

export type MoveClassification =
  | 'brilliant'
  | 'best'
  | 'excellent'
  | 'good'
  | 'inaccuracy'
  | 'mistake'
  | 'blunder'
  | 'book';

export interface GameMove {
  san: string;
  fen: string;
  from?: string; // Tọa độ ô đi (vd: e2)
  to?: string;   // Tọa độ ô đến (vd: e4)
  evaluation?: number;
  classification?: MoveClassification;
}

export default function AnalysisPanel({
  moveHistory, currentMoveIndex, onJumpToMove, onAnalyzeGame, isAnalyzing, analyzeProgress, isEngineReady, orientation
}: AnalysisPanelProps) {

  const movePairs = [];
  for (let i = 0; i < moveHistory.length; i += 2) {
    movePairs.push({
      w: moveHistory[i],
      b: moveHistory[i + 1],
      wIndex: i,
      bIndex: i + 1
    });
  }

  const formatEval = (cp?: number) => {
    if (cp === undefined) return '';
    if (cp > 9000) return `M${10000 - cp}`;
    if (cp < -9000) return `-M${10000 + cp}`;
    const val = (cp / 100).toFixed(1);
    return cp > 0 ? `+${val}` : val;
  };

  // 1. Chuẩn bị Data cho Biểu đồ dựa trên Orientation
  const chartData = moveHistory.map((move, index) => {
    let rawScore = move.evaluation ?? 0;

    // Nếu là quân Đen, đảo dấu điểm số để biểu đồ hướng lên khi Đen ưu thế
    let displayScore = orientation === 'black' ? -rawScore : rawScore;

    // Giới hạn hiển thị trên biểu đồ (trần/sàn 10 tốt)
    if (displayScore > 1000) displayScore = 1000;
    if (displayScore < -1000) displayScore = -1000;

    return {
      index,
      score: displayScore / 100,
      realEval: rawScore, // Dùng để hiển thị Tooltip đúng giá trị thực
      moveName: move.san
    };
  });

  // 2. Cập nhật Tooltip để luôn hiển thị đúng text (VD: +1.5 hay -1.5)
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-2 rounded shadow-lg text-xs font-mono z-50">
          <p className="text-slate-400 mb-1">Nước: <span className="text-slate-200">{data.moveName}</span></p>
          <p className={`font-bold ${data.realEval > 0 ? 'text-blue-400' : 'text-red-400'}`}>
            Eval: {formatEval(data.realEval)}
          </p>
        </div>
      );
    }
    return null;
  };

  const getBadgeStyles = (cls?: MoveClassification) => {
    switch (cls) {
      case 'brilliant': return 'bg-cyan-500 text-white';
      case 'best': return 'bg-green-500 text-white';
      case 'excellent': return 'bg-green-600/50 text-green-200';
      case 'inaccuracy': return 'bg-yellow-500 text-slate-900';
      case 'mistake': return 'bg-orange-500 text-white';
      case 'blunder': return 'bg-red-600 text-white';
      default: return 'bg-slate-700 text-slate-300';
    }
  };

  const getInfix = (cls?: MoveClassification) => {
    switch (cls) {
      case 'brilliant': return '!!';
      case 'blunder': return '??';
      case 'mistake': return '?';
      case 'inaccuracy': return '?!';
      case 'best': return '★';
      default: return '';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl shadow-sm overflow-hidden">

      {/* Control & Progress Header */}
      <div className="p-3 border-b border-slate-800 bg-slate-900 shrink-0 flex flex-col gap-2">
        <button
          onClick={onAnalyzeGame}
          disabled={!isEngineReady || isAnalyzing || moveHistory.length === 0}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-500 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          {isAnalyzing ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Đang phân tích ({analyzeProgress}%)...</>
          ) : (
            <><Play className="w-4 h-4 fill-current" /> Phân tích ván cờ</>
          )}
        </button>

        {isAnalyzing && (
          <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${analyzeProgress}%` }}></div>
          </div>
        )}
      </div>

      {/* Move History */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 bg-slate-950/30">
        {moveHistory.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-600 text-sm">Chưa có dữ liệu ván đấu</div>
        ) : (
          <div className="flex flex-col text-sm">
            {movePairs.map((pair, index) => (
              <div key={index} className="flex px-2 py-1 hover:bg-slate-800/50 rounded group">
                <div className="w-8 text-slate-500 font-mono text-right pr-3 select-none pt-0.5">{index + 1}.</div>

                <div className="flex-1 flex items-center gap-2">
                  <div
                    className={`cursor-pointer font-mono px-2 py-0.5 rounded transition-colors ${currentMoveIndex === pair.wIndex ? 'bg-blue-600 text-white font-medium' : 'text-slate-300 hover:bg-slate-800'}`}
                    onClick={() => onJumpToMove(pair.wIndex)}
                  >
                    {pair.w.san}
                  </div>
                  {pair.w.classification && (
                    <span className={`text-[9px] font-bold px-1 rounded-sm ${getBadgeStyles(pair.w.classification)}`}>
                      {getInfix(pair.w.classification)}
                    </span>
                  )}
                  {pair.w.evaluation !== undefined && (
                    <span className={`text-[10px] px-1.5 py-[1px] rounded font-mono ${pair.w.evaluation > 0 ? 'bg-slate-200 text-slate-900' : 'bg-slate-800 text-slate-300'}`}>
                      {formatEval(pair.w.evaluation)}
                    </span>
                  )}
                </div>

                <div className="flex-1 flex items-center gap-2">
                  {pair.b && (
                    <>
                      <div
                        className={`cursor-pointer font-mono px-2 py-0.5 rounded transition-colors ${currentMoveIndex === pair.bIndex ? 'bg-blue-600 text-white font-medium' : 'text-slate-300 hover:bg-slate-800'}`}
                        onClick={() => onJumpToMove(pair.bIndex)}
                      >
                        {pair.b.san}
                      </div>
                      {pair.b.evaluation !== undefined && (
                        <span className={`text-[10px] px-1.5 py-[1px] rounded font-mono ${pair.b.evaluation < 0 ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-900'}`}>
                          {formatEval(pair.b.evaluation)}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BIỂU ĐỒ EVALUATION (Thêm mới vào giữa History và Control) */}
      {moveHistory.length > 0 && (
        <div className="h-28 border-t border-slate-800 bg-slate-950/80 p-0 shrink-0 relative cursor-pointer">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 5, right: 0, left: 0, bottom: 0 }}
              onClick={(e) => {
                if (e && e.activeTooltipIndex !== undefined) {
                  onJumpToMove(e.activeTooltipIndex as number);
                }
              }}
            >
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <YAxis domain={[-10, 10]} hide />
              <ReferenceLine y={0} stroke="#475569" strokeDasharray="3 3" />
              {currentMoveIndex >= 0 && (
                <ReferenceLine x={currentMoveIndex} stroke="#3b82f6" strokeWidth={2} />
              )}
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3b82f6', strokeWidth: 1 }} isAnimationActive={false} />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorScore)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Control Buttons */}
      <div className="p-3 border-t border-slate-800 bg-slate-900 shrink-0 flex justify-center gap-1.5">
        <button onClick={() => onJumpToMove(-1)} disabled={currentMoveIndex === -1} className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg text-slate-400 hover:text-slate-200"><Rewind className="w-4 h-4" /></button>
        <button onClick={() => onJumpToMove(currentMoveIndex - 1)} disabled={currentMoveIndex === -1} className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg text-slate-400 hover:text-slate-200"><ChevronLeft className="w-5 h-5" /></button>
        <button onClick={() => onJumpToMove(currentMoveIndex + 1)} disabled={currentMoveIndex >= moveHistory.length - 1} className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg text-slate-400 hover:text-slate-200"><ChevronRight className="w-5 h-5" /></button>
        <button onClick={() => onJumpToMove(moveHistory.length - 1)} disabled={currentMoveIndex >= moveHistory.length - 1} className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg text-slate-400 hover:text-slate-200"><FastForward className="w-4 h-4" /></button>
      </div>
    </div>
  );
}