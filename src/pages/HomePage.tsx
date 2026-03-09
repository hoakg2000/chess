import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Puzzle, MonitorPlay, BarChart2 } from 'lucide-react';

export default function HomePage() {
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  const handleSearch = () => {
    if (username.trim()) {
      // Chuyển hướng sang trang phân tích và truyền tên user lên URL
      navigate(`/analysis?username=${username.trim()}`);
    } else {
      navigate('/analysis');
    }
  };

  return (
    <div className="h-full flex flex-col items-center max-w-4xl mx-auto space-y-12 px-4 mt-30">
      
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-100 tracking-tight">
          Jacky - ChessAnalyzer
        </h1>
        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto">
          Phân tích ván đấu, giải đố và nâng cao kỹ năng cờ vua của bạn.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        {/* Card 1: Phân tích trận đấu */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-5 shadow-lg shadow-black/20 hover:border-blue-500/50 transition-colors">
          <div className="flex items-center gap-3 text-blue-400">
            <BarChart2 className="w-7 h-7" />
            <h2 className="text-xl font-bold text-slate-200">Phân tích trận đấu</h2>
          </div>
          <p className="text-sm text-slate-500 flex-1">
            Đánh giá nước đi, tìm ra sai lầm (Blunder) với sức mạnh của Stockfish 18.
          </p>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Nhập username..."
              className="flex-1 w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button 
              onClick={handleSearch}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Card 2: Giải đố */}
        <button 
          onClick={() => navigate('/puzzle')}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-5 shadow-lg shadow-black/20 hover:border-green-500/50 hover:bg-slate-800/50 transition-all text-left group"
        >
          <div className="flex items-center gap-3 text-green-400 group-hover:scale-110 transition-transform origin-left">
            <Puzzle className="w-7 h-7" />
            <h2 className="text-xl font-bold text-slate-200">Giải đố</h2>
          </div>
          <p className="text-sm text-slate-500">
            Thử thách trí tuệ với hàng triệu câu đố chiến thuật trích xuất từ các ván đấu thực tế.
          </p>
        </button>

        {/* Card 3: Chơi với máy */}
        <button 
          onClick={() => navigate('/play')}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-5 shadow-lg shadow-black/20 hover:border-purple-500/50 hover:bg-slate-800/50 transition-all text-left group"
        >
          <div className="flex items-center gap-3 text-purple-400 group-hover:scale-110 transition-transform origin-left">
            <MonitorPlay className="w-7 h-7" />
            <h2 className="text-xl font-bold text-slate-200">Chơi với máy</h2>
          </div>
          <p className="text-sm text-slate-500">
            Luyện tập khai cuộc và cờ tàn trực tiếp với Stockfish ở nhiều cấp độ khó khác nhau.
          </p>
        </button>
      </div>

    </div>
  );
}