// src/hooks/useStockfish.ts
import { useState, useEffect, useRef, useCallback } from 'react';

export function useStockfish() {
  const workerRef = useRef<Worker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const resolverRef = useRef<((value: number) => void) | null>(null);
  const lastScoreRef = useRef<number>(0);

  useEffect(() => {
    // Khởi tạo Worker từ thư mục public
    const worker = new Worker('/stockfish/stockfish-18-single.js');
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const line = e.data as string;
      
      if (line === 'uciok') {
        worker.postMessage('isready');
      } else if (line === 'readyok') {
        setIsReady(true);
      } else if (line.startsWith('info depth')) {
        // Bắt điểm Centipawns (cp) hoặc Mate
        const matchCp = line.match(/score cp (-?\d+)/);
        const matchMate = line.match(/score mate (-?\d+)/);
        
        if (matchCp) {
           lastScoreRef.current = parseInt(matchCp[1], 10);
        } else if (matchMate) {
           const mate = parseInt(matchMate[1], 10);
           // Mate > 0 là chuẩn bị chiếu bí đối thủ, Mate < 0 là sắp bị chiếu bí
           lastScoreRef.current = mate > 0 ? 10000 - mate : -10000 - mate;
        }
      } else if (line.startsWith('bestmove')) {
        // Khi engine chốt nước đi, trả về kết quả cho Promise
        if (resolverRef.current) {
          resolverRef.current(lastScoreRef.current);
          resolverRef.current = null;
        }
      }
    };

    worker.postMessage('uci'); // Khởi động UCI
    return () => worker.terminate(); // Dọn dẹp khi unmount
  }, []);

  const evaluateFen = useCallback((fen: string, depth = 10): Promise<number> => {
    return new Promise((resolve) => {
      if (!workerRef.current) return resolve(0);
      resolverRef.current = resolve;
      lastScoreRef.current = 0;
      
      workerRef.current.postMessage(`position fen ${fen}`);
      workerRef.current.postMessage(`go depth ${depth}`);
    });
  }, []);

  return { isReady, evaluateFen };
}