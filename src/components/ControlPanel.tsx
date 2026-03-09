import { useState, useEffect } from 'react';
import { Search, BrainCircuit, ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { chessApi, type ChessGame } from '../services/chessApi';
import { useSearchParams } from 'react-router-dom';

export default function ControlPanel() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Khởi tạo username từ URL (nếu có), nếu không thì chuỗi rỗng
  const initialUsername = searchParams.get('username') || '';
  const [username, setUsername] = useState(initialUsername);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [games, setGames] = useState<ChessGame[]>([]);
  const [archives, setArchives] = useState<string[]>([]);
  const [currentArchiveIndex, setCurrentArchiveIndex] = useState(0);

  // Tách logic gọi API ra một hàm riêng, nhận tham số searchName để gọi cho chuẩn
  const executeSearch = async (searchName: string) => {
    if (!searchName.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setGames([]);
    setArchives([]);
    setCurrentArchiveIndex(0);

    try {
      await chessApi.checkUser(searchName);
      
      const archiveUrls = await chessApi.getArchives(searchName);
      
      if (archiveUrls.length === 0) {
        setError('Người chơi này chưa có ván đấu nào.');
        setIsLoading(false);
        return;
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

  // Lắng nghe sự thay đổi của searchParams (khi component mount hoặc URL đổi)
  useEffect(() => {
    const urlUsername = searchParams.get('username');
    if (urlUsername) {
      setUsername(urlUsername); // Cập nhật ô input
      executeSearch(urlUsername); // Tự động tìm kiếm
    }
  }, [searchParams]);

  // Hàm xử lý khi người dùng bấm nút Tìm kiếm
  const handleSearchClick = () => {
    if (!username.trim()) return;
    
    // Cập nhật lại URL params, việc này sẽ trigger useEffect ở trên để gọi API
    setSearchParams({ username: username.trim() });
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
      setError(err.message || 'Lỗi khi tải thêm ván đấu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-8rem)]">
      {/* Input Fetch Game */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm shrink-0">
        <label className="block text-sm font-medium text-slate-400 mb-2">
          Tìm kiếm người chơi Chess.com
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
              placeholder="Nhập username..." 
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
            />
          </div>
          <button 
            onClick={handleSearchClick}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading && games.length === 0 ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tìm'}
          </button>
        </div>
        
        {/* Báo lỗi */}
        {error && (
          <div className="mt-3 flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-2 rounded-lg border border-red-400/20">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
      </div>

      {/* Move List / Lịch sử đấu */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden">
        <h3 className="text-sm font-semibold text-slate-200 mb-3 border-b border-slate-800 pb-2 shrink-0">
          {games.length > 0 ? `Lịch sử ván đấu (${games.length})` : 'Lịch sử ván đấu'}
        </h3>
        
        {/* Danh sách cuộn */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-2">
          {games.length === 0 && !isLoading && !error && (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm border border-dashed border-slate-800 rounded-lg">
              Chưa có dữ liệu ván đấu
            </div>
          )}

          {games.map((game, idx) => (
            <button 
              key={`${game.url}-${idx}`}
              className="w-full text-left bg-slate-950 border border-slate-800 hover:border-slate-600 p-3 rounded-lg transition-colors group flex flex-col gap-1"
            >
              <div className="flex justify-between items-center w-full">
                <span className="text-sm font-medium text-slate-200 truncate pr-2">
                  <span className={game.white.username.toLowerCase() === username.toLowerCase() ? 'text-blue-400' : ''}>{game.white.username}</span>
                  <span className="text-slate-500 mx-2">vs</span>
                  <span className={game.black.username.toLowerCase() === username.toLowerCase() ? 'text-blue-400' : ''}>{game.black.username}</span>
                </span>
                <span className="text-xs font-mono text-slate-500 shrink-0">
                  {new Date(game.end_time * 1000).toLocaleDateString('vi-VN')}
                </span>
              </div>
              <div className="text-xs text-slate-400">
                 Kết quả: White {game.white.result} - Black {game.black.result}
              </div>
            </button>
          ))}

          {/* Nút Load More */}
          {games.length > 0 && currentArchiveIndex < archives.length - 1 && (
            <button 
              onClick={handleLoadMore}
              disabled={isLoading}
              className="w-full py-3 mt-2 border border-slate-700 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tải thêm ván đấu cũ hơn'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}