import { Settings, Play, Loader2 } from 'lucide-react';

interface PlaySettingsPanelProps {
  onStart: () => void;
  isLoading: boolean;
  isStarted: boolean;
  level: number;
  setLevel: (l: number) => void;
  userColor: 'white' | 'black';
  setUserColor: (c: 'white' | 'black') => void;
}

export default function PlaySettingsPanel({ 
  onStart, isLoading, isStarted, level, setLevel, userColor, setUserColor 
}: PlaySettingsPanelProps) {
  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl shadow-sm overflow-hidden p-4">
      <div className="flex items-center gap-2 mb-6 text-blue-400">
        <Settings className="w-5 h-5" />
        <h2 className="font-bold text-lg text-slate-200">Cấu hình trận đấu</h2>
      </div>

      <div className="space-y-6 flex-1">
        {/* Chọn cấp độ Stockfish */}
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5">Độ khó của máy</label>
          <select 
            value={level}
            onChange={(e) => setLevel(Number(e.target.value))}
            disabled={isStarted}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-50"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map(lvl => (
              <option key={lvl} value={lvl}>Level {lvl} {lvl <= 2 ? '(Dễ)' : lvl <= 5 ? '(Trung bình)' : '(Khó)'}</option>
            ))}
          </select>
        </div>

        {/* Chọn màu quân */}
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5">Bạn cầm quân</label>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => setUserColor('white')}
              disabled={isStarted}
              className={`py-2 rounded-lg text-sm font-medium transition-all ${userColor === 'white' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}
            >
              Trắng
            </button>
            <button 
              onClick={() => setUserColor('black')}
              disabled={isStarted}
              className={`py-2 rounded-lg text-sm font-medium transition-all ${userColor === 'black' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}
            >
              Đen
            </button>
          </div>
        </div>
      </div>

      <button 
        onClick={onStart}
        disabled={isLoading || isStarted}
        className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-500 text-white py-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
        {isStarted ? 'Đang thi đấu...' : 'Bắt đầu thi đấu'}
      </button>
    </div>
  );
}