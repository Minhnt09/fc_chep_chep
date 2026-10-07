import scorers from '../data/scorers.json';
import members from '../data/members.json';
import matches from '../data/matches.json';
import stats from '../data/stats.json';
// Đổi nguồn dữ liệu tại đây khi tích hợp Supabase ở giai đoạn sau.
export const getMembers = () => members;
export const getMatches = () => matches;
export const getStats = () => stats;

export const getScorers = () => scorers;
