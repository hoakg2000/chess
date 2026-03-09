// src/services/chessApi.ts

const BASE_URL = 'https://api.chess.com/pub';

export interface ChessGame {
  url: string;
  pgn: string;
  time_control: string;
  end_time: number;
  rated: boolean;
  white: { rating: number; result: string; username: string };
  black: { rating: number; result: string; username: string };
}

export const chessApi = {
  // 1. Check user tồn tại
  async checkUser(username: string) {
    const res = await fetch(`${BASE_URL}/player/${username}`);
    if (res.status === 404) throw new Error('Không tìm thấy người chơi này');
    if (!res.ok) throw new Error('Lỗi khi kết nối Chess.com');
    return res.json();
  },

  // 2. Lấy danh sách các tháng có ván đấu (Archives)
  async getArchives(username: string) {
    const res = await fetch(`${BASE_URL}/player/${username}/games/archives`);
    if (!res.ok) throw new Error('Không lấy được lịch sử ván đấu');
    const data = await res.json();
    // Đảo ngược mảng để tháng mới nhất lên đầu
    return data.archives.reverse() as string[];
  },

  // 3. Fetch data ván đấu từ 1 URL Archive cụ thể
  async getGamesFromArchive(archiveUrl: string) {
    const res = await fetch(archiveUrl);
    if (!res.ok) throw new Error('Không lấy được dữ liệu tháng này');
    const data = await res.json();
    // Đảo ngược để ván mới nhất lên đầu
    return data.games.reverse() as ChessGame[];
  }
};