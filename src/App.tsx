import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import AnalysisPage from './pages/AnalysisPage';
import PuzzlePage from './pages/PuzzlePage';
import PlayPage from './pages/PlayPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="h-screen flex flex-col bg-slate-950 text-slate-300 font-sans selection:bg-blue-500/30 overflow-hidden">
        
        {/* Header hiển thị cố định ở mọi trang */}
        <Header />

        <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 overflow-hidden relative">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/analysis" element={<AnalysisPage />} />
            <Route path="/puzzle" element={<PuzzlePage />} />
            <Route path="/play" element={<PlayPage />} />
          </Routes>
        </main>
        
      </div>
    </BrowserRouter>
  );
}