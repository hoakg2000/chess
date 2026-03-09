import { useState } from 'react';
import { Play, Settings2, Loader2 } from 'lucide-react';

interface PuzzleSettingsPanelProps {
  onStart: (theme: string) => void;
  isPlaying: boolean;
}

// Danh sách các Thể loại khớp với các key trong file puzzles.json
const THEME_OPTIONS = [
  { value: 'all', label: 'Tất cả (Ngẫu nhiên)' },
  { value: 'mateIn2', label: 'Chiếu bí 2 nước' },
  { value: 'fork', label: 'Đòn bắt đôi (Fork)' },
  { value: 'endgame', label: 'Cờ tàn (Endgame)' },
  { value: 'pin', label: 'Đòn ghim (Pin)' },
  { value: 'crushing', label: 'Áp đảo (Crushing)' },
];

export default function PuzzleSettingsPanel({ onStart, isPlaying }: PuzzleSettingsPanelProps) {
  // Quản lý state thẻ loại đang chọn (mặc định là 'all')
  const [selectedTheme, setSelectedTheme] = useState('all');

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl shadow-sm overflow-hidden p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6 text-blue-400">
        <Settings2 className="w-5 h-5" />
        <h2 className="font-bold text-lg text-slate-200">Cấu hình</h2>
      </div>

      {/* Form Area */}
      <div className="space-y-4 flex-1">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5">
            Thể loại câu đố
          </label>
          <select 
            value={selectedTheme}
            onChange={(e) => setSelectedTheme(e.target.value)}
            disabled={isPlaying}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {THEME_OPTIONS.map(theme => (
              <option key={theme.value} value={theme.value}>
                {theme.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Nút Bắt đầu */}
      <button 
        onClick={() => onStart(selectedTheme)}
        disabled={isPlaying}
        className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-500 text-white py-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
      >
        {isPlaying ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang giải đố...
          </>
        ) : (
          <>
            <Play className="w-4 h-4 fill-current" />
            Bắt đầu
          </>
        )}
      </button>
    </div>
  );
}