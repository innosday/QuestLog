export type Category = 'STR' | 'INT' | 'DEX' | 'CHA' | 'ECO';
export type Difficulty = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';
export type QuestStatus = 'pending' | 'success' | 'fail';

export interface Stats {
  str: number;
  int: number;
  dex: number;
  cha: number;
  eco: number;
}

export interface User {
  uid: string;
  nickname: string;
  email: string;
  totalScore: number;
  stats: Stats;
  friends: string[]; // array of uids
  trustScores: Record<string, number>; // uid -> score
  photoURL?: string;
  inventory?: string[]; // array of item IDs
  equippedWeaponId?: string;
}

export interface Quest {
  qid: string;
  authorId: string;
  title: string;
  description: string;
  category: Category;
  difficulty: Difficulty;
  deadline: number; // timestamp
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  status: QuestStatus;
  isTeam: boolean;
  proofPhotoURL?: string;
  createdAt: number;
  // AI Monster Metadata
  monsterName?: string;
  monsterDescription?: string;
  level?: number;
  lootDropped?: boolean;
}

export interface MonsterData {
  monsterName: string;
  monsterDescription: string;
  grade: Difficulty;
  level: number;
  category: Category;
}

export const DIFFICULTY_POINTS: Record<Difficulty, number> = {
  Common: 10,
  Uncommon: 30,
  Rare: 100,
  Epic: 500,
  Legendary: 2000,
};

export const CATEGORY_LABELS: Record<Category, { label: string; stat: keyof Stats }> = {
  STR: { label: '체력', stat: 'str' },
  INT: { label: '지식', stat: 'int' },
  DEX: { label: '기술', stat: 'dex' },
  CHA: { label: '매력', stat: 'cha' },
  ECO: { label: '환경', stat: 'eco' },
};
