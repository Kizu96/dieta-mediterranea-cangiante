import type { Season } from '../data/types';

// Aprile–Settembre = estate, altrimenti inverno. (Giugno = estate.)
export function currentSeasonByDate(d: Date = new Date()): Season {
  const m = d.getMonth(); // 0 = gennaio
  return m >= 3 && m <= 8 ? 'estate' : 'inverno';
}
