import { useState } from 'react';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import { chessApi, type ChessGame } from '../services/chessApi';

interface GameSearchPanelProps {
  // Thay đổi: Nhận toàn bộ object ChessGame thay vì chỉ string PGN
  onSelectGame: (game: ChessGame, searchedUsername: string) => void;
}

export default function GameSearchPanel({ onSelectGame }: GameSearchPanelProps) {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [games, setGames] = useState<ChessGame[]>([]);
  const [archives, setArchives] = useState<string[]>([]);
  const [currentArchiveIndex, setCurrentArchiveIndex] = useState(0);

  const formatTimeControl = (tc: string) => {
    if (!tc) return '--';
    if (tc.includes('+')) {
      const [time, inc] = tc.split('+');
      return `${parseInt(time) / 60} phút + ${inc}s`;
    }
    if (tc.includes('/')) return 'Daily';
    
    const seconds = parseInt(tc);
    if (isNaN(seconds)) return tc;
    if (seconds < 60) return `${seconds}s`;
    return `${seconds / 60} phút`;
  };

  const handleSearch = async () => {
    if (!username.trim()) return;
    setIsLoading(true); setError(null); setGames([]); setArchives([]); setCurrentArchiveIndex(0);

    try {
      await chessApi.checkUser(username);
      const archiveUrls = await chessApi.getArchives(username);
      if (archiveUrls.length === 0) {
        setError('Người chơi này chưa có ván đấu nào.'); return;
      }
      setArchives(archiveUrls);
      const recentGames = await chessApi.getGamesFromArchive(archiveUrls[0]);
      setGames(recentGames);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (currentArchiveIndex + 1 >= archives.length) return;
    setIsLoading(true);
    const nextIndex = currentArchiveIndex + 1;
    try {
      const moreGames = await chessApi.getGamesFromArchive(archives[nextIndex]);
      setGames(prev => [...prev, ...moreGames]);
      setCurrentArchiveIndex(nextIndex);
    } catch (err: any) {
      setError(err.message || 'Lỗi tải thêm');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-slate-800 shrink-0 bg-slate-900 z-10">
        <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
          Tìm kiếm ván đấu
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" value={username} onChange={(e) => setUsername(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Username..." 
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>
          <button onClick={handleSearch} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center justify-center min-w-[3rem]">
            {isLoading && games.length === 0 ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tìm'}
          </button>
        </div>
        {error && (
          <div className="mt-3 flex items-center gap-2 text-red-400 text-xs bg-red-400/10 p-2 rounded-md border border-red-400/20">
            <AlertCircle className="w-3 h-3 shrink-0" /> {error}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 bg-slate-950/50">
        {games.length === 0 && !isLoading && !error && (
           <div className="h-full flex items-center justify-center text-slate-600 text-sm">Chưa có dữ liệu</div>
        )}
        <div className="flex flex-col gap-1.5">
          {games.map((game, idx) => (
            <button 
              key={`${game.url}-${idx}`}
              onClick={() => onSelectGame(game, username)} // Truyền toàn bộ object game
              className="w-full text-left bg-slate-900 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800 p-2.5 rounded-lg transition-all group flex flex-col gap-1"
            >
              <div className="flex justify-between items-center w-full">
                <span className="text-sm font-medium text-slate-300 truncate pr-2">
                  <span className={game.white.username.toLowerCase() === username.toLowerCase() ? 'text-blue-400 font-semibold' : ''}>{game.white.username}</span>
                  <span className="text-slate-600 mx-1.5 text-xs">vs</span>
                  <span className={game.black.username.toLowerCase() === username.toLowerCase() ? 'text-blue-400 font-semibold' : ''}>{game.black.username}</span>
                </span>
              </div>
              <div className="flex justify-between items-center w-full">
                 <span className="text-[11px] font-mono text-slate-500">
                    {new Date(game.end_time * 1000).toLocaleDateString('vi-VN')}
                 </span>
                 <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    {formatTimeControl(game.time_control)}
                 </span>
              </div>
            </button>
          ))}
          {games.length > 0 && currentArchiveIndex < archives.length - 1 && (
            <button onClick={handleLoadMore} disabled={isLoading} className="w-full py-2 mt-2 border border-slate-800 border-dashed rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors flex justify-center">
              {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Tải thêm'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}