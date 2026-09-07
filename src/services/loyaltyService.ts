import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { LoyaltyPoint } from '../models';
import { useAuthStore } from '../store/authStore';

const DEMO_LOYALTY_KEY = 'barbearia_demo_loyalty';

const getDemoLoyalty = (): Record<string, number> => {
  const saved = localStorage.getItem(DEMO_LOYALTY_KEY);
  return saved ? JSON.parse(saved) : { 'demo-customer': 20 };
};

const saveDemoLoyalty = (data: Record<string, number>) => {
  localStorage.setItem(DEMO_LOYALTY_KEY, JSON.stringify(data));
};

export const loyaltyService = {
  async getPoints(customerId: string): Promise<number> {
    if (useAuthStore.getState().isDemo) {
      return getDemoLoyalty()[customerId] || 0;
    }
    try {
      const docRef = doc(db, 'loyalty_points', customerId);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return snapshot.data().points;
      }
      return 0;
    } catch {
      return getDemoLoyalty()[customerId] || 0;
    }
  },

  async getAllLoyaltyPoints(): Promise<Record<string, number>> {
    if (useAuthStore.getState().isDemo) {
      return getDemoLoyalty();
    }
    try {
      const { collection, getDocs } = await import('firebase/firestore');
      const snapshot = await getDocs(collection(db, 'loyalty_points'));
      return snapshot.docs.reduce((acc, doc) => ({ ...acc, [doc.id]: doc.data().points }), {});
    } catch {
      return getDemoLoyalty();
    }
  },

  async addPoints(customerId: string, points: number): Promise<void> {
    if (useAuthStore.getState().isDemo) {
      const data = getDemoLoyalty();
      data[customerId] = (data[customerId] || 0) + points;
      saveDemoLoyalty(data);
      return;
    }
    try {
      const docRef = doc(db, 'loyalty_points', customerId);
      const snapshot = await getDoc(docRef);
      
      if (snapshot.exists()) {
        await updateDoc(docRef, {
          points: increment(points),
          updatedAt: Date.now()
        });
      } else {
        await setDoc(docRef, {
          customerId,
          points,
          updatedAt: Date.now()
        });
      }
    } catch {
      const data = getDemoLoyalty();
      data[customerId] = (data[customerId] || 0) + points;
      saveDemoLoyalty(data);
    }
  }
};
