import { 
  CheckCircle2, 
  XCircle, 
  Lightbulb, 
  SkipForward, 
  ArrowRight, 
  RotateCcw, 
  Target, 
  Trash2 
} from 'lucide-react';

export interface PuzzleHistoryItem {
  id: string;
  elo: number;
  themes: string[]; 
  result: 'solved' | 'failed';
}

interface PuzzleHistoryPanelProps {
  history: PuzzleHistoryItem[];
  puzzleState: 'idle' | 'playing' | 'failed' | 'solved';
  currentPuzzle: { id: string; elo: number; themes: string[] } | null; 
  onSkipOrNext: () => void;
  onHint: () => void;
  onRetry: () => void;
  onClearHistory: () => void; // Thêm prop xóa
  onSelectHistory: (id: string) => void; // Thêm prop load lại
}

export default function PuzzleHistoryPanel({ 
  history, 
  puzzleState, 
  currentPuzzle,
  onSkipOrNext, 
  onHint, 
  onRetry,
  onClearHistory,
  onSelectHistory
}: PuzzleHistoryPanelProps) {
  
  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl shadow-sm overflow-hidden">
      
      {/* 1. THÔNG TIN CÂU ĐỐ HIỆN TẠI */}
      <div className="p-4 border-b border-slate-800 bg-slate-900 shrink-0 min-h-[116px]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-blue-400">
            <Target className="w-5 h-5" />
            <h3 className="font-bold text-slate-200">Câu đố hiện tại</h3>
          </div>
          
          {/* Nút Xóa lịch sử: Chỉ hiện khi có history */}
          {history.length > 0 && (
            <button 
              onClick={onClearHistory}
              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all group"
              title="Xóa lịch sử"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {currentPuzzle ? (
          <div className="animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-400">Độ khó (Elo):</span>
              <span className="font-bold text-slate-200">{currentPuzzle.elo}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {currentPuzzle.themes.map(theme => (
                <span key={theme} className="px-2 py-1 bg-slate-800 text-slate-300 text-[10px] font-medium rounded-md border border-slate-700 capitalize">
                  {theme.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center opacity-40 py-2">
            <span className="text-sm text-slate-500 font-medium border border-dashed border-slate-600 px-4 py-1.5 rounded-lg">
              Chưa có dữ liệu
            </span>
          </div>
        )}
      </div>

      {/* 2. DANH SÁCH LỊCH SỬ */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 bg-slate-950/30">
        {history.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-600 text-sm text-center px-4 italic">
            Lịch sử giải đố của bạn sẽ hiển thị ở đây
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {history.map((item, idx) => (
              <button 
                key={`${item.id}-${idx}`} 
                onClick={() => onSelectHistory(item.id)}
                className="flex flex-col gap-2 bg-slate-900 border border-slate-800 p-3 rounded-lg text-sm text-left hover:border-blue-500/50 hover:bg-slate-800/50 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {item.result === 'solved' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                    )}
                    <div className="font-bold text-slate-300 group-hover:text-blue-400">Elo {item.elo}</div>
                  </div>
                  <span className="text-[10px] text-slate-600 group-hover:text-slate-400 uppercase font-bold">Xem lại</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {item?.themes?.map(t => (
                    <span key={t} className="px-1.5 py-0.5 bg-slate-950 text-slate-500 text-[9px] rounded border border-slate-800 capitalize">
                      {t}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. CÁC NÚT ĐIỀU KHIỂN */}
      <div className="p-3 border-t border-slate-800 bg-slate-900 shrink-0 grid grid-cols-2 gap-2">
        {puzzleState === 'failed' ? (
          <button 
            onClick={onRetry}
            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" /> Thử lại
          </button>
        ) : (
          <button 
            onClick={onHint}
            disabled={puzzleState !== 'playing'}
            className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-yellow-500 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
          >
            <Lightbulb className="w-4 h-4" /> Gợi ý
          </button>
        )}
        
        <button 
          onClick={onSkipOrNext}
          disabled={!currentPuzzle && history.length === 0}
          className="bg-slate-200 hover:bg-white disabled:opacity-50 text-slate-900 py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-1.5"
        >
          {puzzleState === 'solved' ? <><ArrowRight className="w-4 h-4" /> Tiếp</> : <><SkipForward className="w-4 h-4" /> Bỏ qua</>}
        </button>
      </div>
    </div>
  );
}