import { useState, useEffect, useRef, useCallback } from 'react';

export function useStockfish() {
  const workerRef = useRef<Worker | null>(null);
  const [isReady, setIsReady] = useState(false);
  
  const moveResolverRef = useRef<((value: string) => void) | null>(null);
  const scoreResolverRef = useRef<((value: number) => void) | null>(null);
  const lastScoreRef = useRef<number>(0);

  useEffect(() => {
    const worker = new Worker('/stockfish/stockfish-18-single.js');
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const line = e.data as string;
      
      if (line === 'uciok') {
        worker.postMessage('isready');
      } else if (line === 'readyok') {
        setIsReady(true);
      } else if (line.includes('score cp') || line.includes('score mate')) {
        const matchCp = line.match(/score cp (-?\d+)/);
        const matchMate = line.match(/score mate (-?\d+)/);
        if (matchCp) lastScoreRef.current = parseInt(matchCp[1], 10);
        else if (matchMate) {
          const mate = parseInt(matchMate[1], 10);
          lastScoreRef.current = mate > 0 ? 10000 - mate : -10000 - mate;
        }
      } else if (line.startsWith('bestmove')) {
        const move = line.split(' ')[1];
        if (moveResolverRef.current) {
          moveResolverRef.current(move);
          moveResolverRef.current = null;
        }
        if (scoreResolverRef.current) {
          scoreResolverRef.current(lastScoreRef.current);
          scoreResolverRef.current = null;
        }
      }
    };

    worker.postMessage('uci');
    return () => worker.terminate();
  }, []);

  const sendMessage = useCallback((msg: string) => {
    workerRef.current?.postMessage(msg);
  }, []);

  const getBestMove = useCallback((fen: string, time = 1000): Promise<string> => {
    return new Promise((resolve) => {
      if (!workerRef.current || !isReady) return resolve('');
      moveResolverRef.current = resolve;
      workerRef.current.postMessage(`position fen ${fen}`);
      workerRef.current.postMessage(`go movetime ${time}`);
    });
  }, [isReady]);

  const evaluateFen = useCallback((fen: string, depth = 12): Promise<number> => {
    return new Promise((resolve) => {
      if (!workerRef.current || !isReady) return resolve(0);
      scoreResolverRef.current = resolve;
      lastScoreRef.current = 0;
      workerRef.current.postMessage(`position fen ${fen}`);
      workerRef.current.postMessage(`go depth ${depth}`);
    });
  }, [isReady]);

  return { isReady, sendMessage, getBestMove, evaluateFen };
}