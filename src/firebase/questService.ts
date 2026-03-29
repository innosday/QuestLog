import {
  collection,
  addDoc,
  doc,
  query,
  where,
  getDocs,
  orderBy,
  increment,
  writeBatch,
  getDoc,
  arrayUnion,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './config';
import { DIFFICULTY_POINTS, CATEGORY_LABELS } from '../types';
import type { Quest, User } from '../types';
import { getRandomLoot, WEAPON_DATABASE } from '../data/items';
import { useUserStore } from '../store/userStore';
import { useQuestStore } from '../store/questStore';

const QUESTS_COLLECTION = 'quests';
const USERS_COLLECTION = 'users';

export const createQuest = async (questData: Omit<Quest, 'qid' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, QUESTS_COLLECTION), {
      ...questData,
      createdAt: Date.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating quest:', error);
    throw error;
  }
};

export const getQuestsByUser = async (uid: string) => {
  try {
    const q = query(
      collection(db, QUESTS_COLLECTION),
      where('authorId', '==', uid),
      orderBy('deadline', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      qid: doc.id,
      ...doc.data(),
    })) as Quest[];
  } catch (error) {
    console.error('Error fetching quests:', error);
    throw error;
  }
};

export const uploadProofPhoto = async (qid: string, file: File) => {
  try {
    const storageRef = ref(storage, `proofs/${qid}_${Date.now()}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  } catch (error) {
    console.error('Error uploading photo:', error);
    throw error;
  }
};

export const completeQuest = async (quest: Quest, proofPhotoURL?: string) => {
  try {
    const batch = writeBatch(db);
    const userRef = doc(db, USERS_COLLECTION, quest.authorId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) throw new Error('User not found');
    const userData = userSnap.data() as User;

    // 1. Calculate points with Weapon Bonus
    let points = DIFFICULTY_POINTS[quest.difficulty];
    
    // Check equipped weapon
    if (userData.equippedWeaponId) {
      const weapon = WEAPON_DATABASE.find(w => w.id === userData.equippedWeaponId);
      if (weapon && weapon.statType === quest.category) {
        points += weapon.bonusValue; // Add weapon bonus
      }
    }

    // 2. Roll for Loot
    const loot = getRandomLoot(quest.difficulty, quest.category);
    
    // 3. Update Quest Status
    const questRef = doc(db, QUESTS_COLLECTION, quest.qid);
    const questUpdates: Partial<Quest> = { status: 'success' };
    if (proofPhotoURL) questUpdates.proofPhotoURL = proofPhotoURL;
    if (loot) questUpdates.lootDropped = true;
    batch.update(questRef, questUpdates);

    // 4. Update User Stats, Score, and Inventory
    const statKey = CATEGORY_LABELS[quest.category].stat;
    const userUpdates: Record<string, any> = {
      totalScore: increment(points),
      [`stats.${statKey}`]: increment(1),
    };

    if (loot) {
      userUpdates.inventory = arrayUnion(loot.id);
    }

    batch.update(userRef, userUpdates);

    await batch.commit();

    // 5. Update Local State (Zustand Stores)
    const { addScore, updateStats, addInventoryItem } = useUserStore.getState();
    const { updateQuest } = useQuestStore.getState();

    addScore(points);
    updateStats({ [statKey]: (userData.stats[statKey] || 0) + 1 });
    if (loot) addInventoryItem(loot.id);
    updateQuest(quest.qid, questUpdates);

    return loot; // Return loot so UI can show a popup
  } catch (error) {
    console.error('Error completing quest:', error);
    throw error;
  }
};
