import type { Difficulty, Category } from "../types";

export interface Item {
  id: string;
  name: string;
  grade: Difficulty;
  statType: Category;
  bonusValue: number;
  description: string;
}

export const WEAPON_DATABASE: Item[] = [
  // STR Weapons
  { id: 'str_w1', name: 'Rusty Dumbbell', grade: 'Common', statType: 'STR', bonusValue: 5, description: 'Heavy but reliable.' },
  { id: 'str_w2', name: 'Iron-Bound Greatsword', grade: 'Rare', statType: 'STR', bonusValue: 25, description: 'Crushes anything in its path.' },
  { id: 'str_w3', name: 'Titanium Kettlebell Hammer', grade: 'Legendary', statType: 'STR', bonusValue: 100, description: 'Forged in the fires of discipline.' },
  
  // INT Weapons
  { id: 'int_w1', name: 'Encoded Scroll', grade: 'Common', statType: 'INT', bonusValue: 5, description: 'Contains basic logic.' },
  { id: 'int_w2', name: 'Quantum Processor Wand', grade: 'Rare', statType: 'INT', bonusValue: 25, description: 'Calculates every move.' },
  { id: 'int_w3', name: 'Archmage\'s Neural Network', grade: 'Legendary', statType: 'INT', bonusValue: 100, description: 'Omniscience at your fingertips.' },
  
  // DEX Weapons
  { id: 'dex_w1', name: 'Precision Tweezers', grade: 'Common', statType: 'DEX', bonusValue: 5, description: 'Small but steady.' },
  { id: 'dex_w2', name: 'Sonic Tuner Blade', grade: 'Rare', statType: 'DEX', bonusValue: 25, description: 'Vibrates with perfect frequency.' },
  { id: 'dex_w3', name: 'Clockwork God\'s Dagger', grade: 'Legendary', statType: 'DEX', bonusValue: 100, description: 'Moves faster than time itself.' },
];

export const getRandomLoot = (grade: Difficulty, category: Category): Item | null => {
  // Drop rate logic based on grade
  const dropChances: Record<Difficulty, number> = {
    Common: 0.1,      // 10%
    Uncommon: 0.2,    // 20%
    Rare: 0.4,        // 40%
    Epic: 0.7,        // 70%
    Legendary: 1.0    // 100%
  };

  if (Math.random() > dropChances[grade]) return null;

  const possibleItems = WEAPON_DATABASE.filter(item => item.statType === category && item.grade === grade);
  if (possibleItems.length === 0) {
    // Fallback to same category but lower/available grade if specific one doesn't exist
    const fallbackItems = WEAPON_DATABASE.filter(item => item.statType === category);
    return fallbackItems[Math.floor(Math.random() * fallbackItems.length)];
  }

  return possibleItems[Math.floor(Math.random() * possibleItems.length)];
};
