import { ScrollText, Trophy, RotateCcw, Loader2, ChevronLeft, ChevronRight, SkipBack, SkipForward } from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';
import { type Chess } from 'chess.js';

interface PlayStatusPanelProps {
  game: Chess;
  gameResult: string | null;
  isThinking: boolean;
  onNewGame: () => void;
  onPositionChange?: (moveIndex: number) => void; // -1 = current position
}

export default function PlayStatusPanel({ 
  game,
  gameResult, 
  isThinking, 
  onNewGame,
  onPositionChange
}: PlayStatusPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedMoveIndex, setSelectedMoveIndex] = useState(-1);
  
  const history = game.history({ verbose: true });
  const pgn = game.history();

  // Reset về position hiện tại khi game thay đổi
  useEffect(() => {
    setSelectedMoveIndex(-1);
  }, [game.fen()]);

  // Tự động cuộn xuống dưới cùng khi có nước đi mới
  useEffect(() => {
    if (scrollRef.current && selectedMoveIndex === -1) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [pgn.length, selectedMoveIndex]);

  // Xử lý keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!history.length) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          handlePreviousMove();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleNextMove();
          break;
        case 'Home':
          e.preventDefault();
          handleFirstMove();
          break;
        case 'End':
          e.preventDefault();
          handleLastMove();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [history.length, selectedMoveIndex]);

  const handleMoveClick = useCallback((moveIndex: number) => {
    setSelectedMoveIndex(moveIndex);
    onPositionChange?.(moveIndex);
  }, [onPositionChange]);

  const handleFirstMove = useCallback(() => {
    if (history.length > 0) {
      setSelectedMoveIndex(0);
      onPositionChange?.(0);
    }
  }, [history.length, onPositionChange]);

  const handlePreviousMove = useCallback(() => {
    const newIndex = selectedMoveIndex === -1 
      ? history.length - 1 
      : Math.max(0, selectedMoveIndex - 1);
    setSelectedMoveIndex(newIndex);
    onPositionChange?.(newIndex);
  }, [selectedMoveIndex, history.length, onPositionChange]);

  const handleNextMove = useCallback(() => {
    if (selectedMoveIndex === -1) return;
    const newIndex = selectedMoveIndex + 1;
    if (newIndex >= history.length) {
      setSelectedMoveIndex(-1);
      onPositionChange?.(-1);
    } else {
      setSelectedMoveIndex(newIndex);
      onPositionChange?.(newIndex);
    }
  }, [selectedMoveIndex, history.length, onPositionChange]);

  const handleLastMove = useCallback(() => {
    setSelectedMoveIndex(-1);
    onPositionChange?.(-1);
  }, [onPositionChange]);

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl shadow-sm overflow-hidden">
      
      {/* 1. Trạng thái ván đấu */}
      <div className="p-4 border-b border-slate-800 bg-slate-900 shrink-0">
        <div className="flex items-center gap-2 mb-3 text-yellow-500">
          <Trophy className="w-5 h-5" />
          <h3 className="font-bold text-slate-200 uppercase text-xs tracking-widest">Trạng thái</h3>
        </div>
        
        <div className={`h-14 flex flex-col items-center justify-center rounded-lg border border-dashed transition-all ${
          gameResult ? 'border-green-500 bg-green-500/10' : 'border-slate-700 bg-slate-950/50'
        }`}>
          {isThinking && !gameResult && (
            <div className="flex items-center gap-2 text-blue-400 mb-1">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-[10px] font-bold uppercase">Máy đang nghĩ...</span>
            </div>
          )}
          <span className={`text-sm font-bold ${gameResult ? 'text-green-400' : 'text-slate-400'}`}>
            {gameResult || (isThinking ? "Đang tính toán nước đi" : "Sẵn sàng thi đấu")}
          </span>
        </div>
      </div>

      {/* 2. Biên bản nước đi (PGN) */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-4 py-2 border-b border-slate-800/50 flex items-center gap-2 text-slate-500 bg-slate-900/50">
          <ScrollText className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Biên bản nước đi</span>
        </div>
        
        <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar p-3 bg-slate-950/20">
          {pgn.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-600 text-xs italic opacity-50">
              Chưa có nước đi nào được thực hiện
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-1">
              {/* Render danh sách nước đi theo cặp (Trắng - Đen) */}
              {Array.from({ length: Math.ceil(pgn.length / 2) }).map((_, i) => (
                <div key={i} className="grid grid-cols-12 text-xs">
                  <div className="col-span-2 text-slate-600 font-mono font-bold py-1.5 px-2">
                    {i + 1}.
                  </div>
                  <div 
                    className={`col-span-5 font-medium py-1.5 px-2 rounded cursor-pointer transition-all ${
                      selectedMoveIndex === i * 2 
                        ? 'bg-blue-600 text-white' 
                        : 'text-slate-200 hover:bg-slate-800/40'
                    }`}
                    onClick={() => handleMoveClick(i * 2)}
                  >
                    {pgn[i * 2]}
                  </div>
                  <div 
                    className={`col-span-5 font-medium py-1.5 px-2 rounded cursor-pointer transition-all ${
                      selectedMoveIndex === i * 2 + 1 
                        ? 'bg-blue-600 text-white' 
                        : 'text-slate-200 hover:bg-slate-800/40'
                    }`}
                    onClick={() => pgn[i * 2 + 1] && handleMoveClick(i * 2 + 1)}
                  >
                    {pgn[i * 2 + 1] || ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Navigation Controls */}
      {pgn.length > 0 && (
        <div className="px-3 py-2 border-t border-slate-800/50 bg-slate-900/50">
          <div className="flex items-center justify-center gap-1">
            <button
              onClick={handleFirstMove}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors"
              title="Nước đầu tiên (Home)"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={handlePreviousMove}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors"
              title="Nước trước (←)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs text-slate-500 font-mono">
              {selectedMoveIndex === -1 
                ? `${pgn.length}/${pgn.length}` 
                : `${selectedMoveIndex + 1}/${pgn.length}`
              }
            </span>
            <button
              onClick={handleNextMove}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors"
              title="Nước tiếp (→)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleLastMove}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors"
              title="Nước cuối (End)"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 4. Nút điều khiển */}
      <div className="p-3 border-t border-slate-800 bg-slate-900 shrink-0">
        <button 
          onClick={onNewGame}
          className="w-full bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 group"
        >
          <RotateCcw className="w-4 h-4 group-hover:rotate-[-45deg] transition-transform" />
          Ván mới
        </button>
      </div>

    </div>
  );
}