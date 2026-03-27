import { doc, updateDoc } from 'firebase/firestore';
import { db } from './config';

export const equipWeapon = async (uid: string, itemId: string | null) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      equippedWeaponId: itemId
    });
  } catch (error) {
    console.error('Error equipping weapon:', error);
    throw error;
  }
};

export const updateUserProfile = async (uid: string, data: { nickname?: string; photoURL?: string }) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, data);
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};
