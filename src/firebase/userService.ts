import { doc, updateDoc, collection, query, orderBy, limit, onSnapshot, increment, writeBatch, arrayRemove, arrayUnion } from 'firebase/firestore';
import { db } from './config';
import { useUserStore } from '../store/userStore';
import type { User, Difficulty } from '../types';
import { WEAPON_DATABASE } from '../data/items';

/**
 * ⚔️ Equip or Unequip a Weapon
 */
export const equipWeapon = async (uid: string, itemId: string | null) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      equippedWeaponId: itemId
    });
    
    // Sync local state
    useUserStore.getState().setEquippedWeapon(itemId);
  } catch (error) {
    console.error('Error equipping weapon:', error);
    throw error;
  }
};

/**
 * 👤 Update User Profile Data
 */
export const updateUserProfile = async (uid: string, data: { nickname?: string; photoURL?: string }) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, data);
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

/**
 * 🛠️ Enhance Weapon Level
 */
export const enhanceWeapon = async (uid: string, itemId: string, cost: number) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      totalScore: increment(-cost),
      [`itemLevels.${itemId}`]: increment(1)
    });
  } catch (error) {
    console.error('Enhance error:', error);
    throw error;
  }
};

/**
 * 🧪 Synthesize 3 Items into 1 Higher Grade Item
 */
export const synthesizeItems = async (uid: string, consumedIds: string[], targetGrade: Difficulty) => {
  try {
    const batch = writeBatch(db);
    const userRef = doc(db, 'users', uid);

    // 1. Remove consumed items
    consumedIds.forEach(id => {
      batch.update(userRef, {
        inventory: arrayRemove(id)
      });
    });

    // 2. Add random item of target grade
    const possibleItems = WEAPON_DATABASE.filter(item => item.grade === targetGrade);
    const newItem = possibleItems[Math.floor(Math.random() * possibleItems.length)];
    
    batch.update(userRef, {
      inventory: arrayUnion(newItem.id)
    });

    await batch.commit();
    return newItem;
  } catch (error) {
    console.error('Synthesis error:', error);
    throw error;
  }
};

/**
 * 🏆 Listen to Top 10 Global Rankings
 */
export const listenToRankings = (callback: (rankers: User[]) => void) => {
  const q = query(
    collection(db, 'users'),
    orderBy('totalScore', 'desc'),
    limit(10)
  );

  return onSnapshot(q, (snapshot) => {
    const rankers = snapshot.docs.map(doc => ({
      ...doc.data()
    })) as User[];
    callback(rankers);
  }, (error) => {
    console.error('Ranking listener error:', error);
  });
};
