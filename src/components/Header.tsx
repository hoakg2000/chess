import { BrainCircuit, Settings } from 'lucide-react';

export default function Header() {
  return (
    <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-6 h-6 text-blue-500" />
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">
            Chess<span className="text-blue-500">Analyzer</span>
          </h1>
        </div>
        <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
          <Settings className="w-5 h-5 text-slate-400" />
        </button>
      </div>
    </header>
  );
}