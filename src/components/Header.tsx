import { BrainCircuit, ChessPawn, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link className="flex items-center gap-2" to='/'>
          <ChessPawn className="w-6 h-6 text-white-500" />
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">
            Jacky - Chess<span className="text-blue-500">Analyzer</span>
          </h1>
        </Link>
        <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
          <Settings className="w-5 h-5 text-slate-400" />
        </button>
      </div>
    </header>
  );
}