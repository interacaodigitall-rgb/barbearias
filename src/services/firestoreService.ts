import { db } from '../lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc, addDoc, getDoc } from 'firebase/firestore';
import { Service, Barber, CompanySettings, User, BlockedTime } from '../models';
import { useAuthStore } from '../store/authStore';
import { demoServices, demoBarbers, demoCompanySettings, rogerXBarbers, rogerXServices } from '../models/demoData';
import { saasService } from './saasService';

const DEMO_SERVICES_KEY = 'barbearia_demo_services';
const DEMO_BARBERS_KEY = 'barbearia_demo_barbers';
const DEMO_COMPANY_KEY = 'barbearia_demo_company';

const getDemoServices = (): Service[] => {
  const saved = localStorage.getItem(DEMO_SERVICES_KEY);
  return saved ? JSON.parse(saved) : demoServices;
};

const saveDemoServices = (services: Service[]) => {
  localStorage.setItem(DEMO_SERVICES_KEY, JSON.stringify(services));
};

const getDemoBarbers = (): Barber[] => {
  const saved = localStorage.getItem(DEMO_BARBERS_KEY);
  if (saved) {
    const parsed = JSON.parse(saved);
    // Merge photoUrl from demoBarbers if missing and override names
    return parsed.map((b: Barber) => {
      const demoBarber = demoBarbers.find(db => db.id === b.id);
      if (demoBarber) {
        const photoUrl = demoBarber.photoUrl;
        return { 
          ...b, 
          name: demoBarber.name, // Override name
          photoUrl: photoUrl?.startsWith('/') ? photoUrl.replace('.png', '.webp').toLowerCase() : photoUrl
        };
      }
      return b.photoUrl?.startsWith('/') ? { ...b, photoUrl: b.photoUrl.replace('.png', '.webp').toLowerCase() } : b;
    });
  }
  return demoBarbers;
};

const saveDemoBarbers = (barbers: Barber[]) => {
  localStorage.setItem(DEMO_BARBERS_KEY, JSON.stringify(barbers));
};

const getDemoCompanySettings = (): CompanySettings => {
  const saved = localStorage.getItem(DEMO_COMPANY_KEY);
  return saved ? JSON.parse(saved) : demoCompanySettings;
};

const saveDemoCompanySettings = (settings: CompanySettings) => {
  localStorage.setItem(DEMO_COMPANY_KEY, JSON.stringify(settings));
};

export const firestoreService = {
  async seedDatabase(): Promise<void> {
    if (useAuthStore.getState().isDemo) return;

    try {
      // Check if services exist
      const servicesSnap = await getDocs(collection(db, 'services'));
      if (servicesSnap.empty) {
        for (const service of demoServices) {
          const { id, ...serviceData } = service;
          await addDoc(collection(db, 'services'), serviceData);
        }
      }

      // Check if barbers exist
      const barbersSnap = await getDocs(collection(db, 'barbers'));
      if (barbersSnap.empty) {
        for (const barber of demoBarbers) {
          const { id, ...barberData } = barber;
          await addDoc(collection(db, 'barbers'), barberData);
        }
      }
      
      // Company settings
      const settingsSnap = await getDoc(doc(db, 'settings', 'company'));
      if (!settingsSnap.exists()) {
        const { id, ...settingsData } = demoCompanySettings;
        await setDoc(doc(db, 'settings', 'company'), settingsData);
      }
    } catch (error) {
      console.error('Error seeding database:', error);
    }
  },

  async getServices(shopIdOrSlug?: string): Promise<Service[]> {
    if (useAuthStore.getState().isDemo) {
      if (shopIdOrSlug) {
        return saasService.getServicesForShop(shopIdOrSlug);
      }
      return getDemoServices();
    }
    const snapshot = await getDocs(collection(db, 'services'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
  },

  async addService(service: Omit<Service, 'id'>): Promise<Service> {
    if (useAuthStore.getState().isDemo) {
      const services = getDemoServices();
      const newService = { ...service, id: `s-${Date.now()}` };
      saveDemoServices([...services, newService]);
      return newService;
    }
    const docRef = await addDoc(collection(db, 'services'), service);
    return { id: docRef.id, ...service } as Service;
  },

  async updateService(id: string, service: Partial<Service>): Promise<void> {
    if (useAuthStore.getState().isDemo) {
      const services = getDemoServices();
      const updated = services.map(s => s.id === id ? { ...s, ...service } : s);
      saveDemoServices(updated);
      return;
    }
    await updateDoc(doc(db, 'services', id), service);
  },

  async deleteService(id: string): Promise<void> {
    if (useAuthStore.getState().isDemo) {
      const services = getDemoServices();
      saveDemoServices(services.filter(s => s.id !== id));
      return;
    }
    await deleteDoc(doc(db, 'services', id));
  },

  async getBarbers(shopIdOrSlug?: string): Promise<Barber[]> {
    if (useAuthStore.getState().isDemo) {
      if (shopIdOrSlug) {
        return saasService.getBarbersForShop(shopIdOrSlug);
      }
      return getDemoBarbers();
    }
    const snapshot = await getDocs(collection(db, 'barbers'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Barber));
  },

  async getUsers(): Promise<User[]> {
    if (useAuthStore.getState().isDemo) {
      return [
        {
          uid: 'demo-customer',
          name: 'Cliente Demo',
          email: 'cliente@demo.com',
          phone: '123456789',
          role: 'customer',
          createdAt: Date.now(),
        }
      ];
    }
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
  },

  async addBarber(barber: Omit<Barber, 'id'>): Promise<Barber> {
    const processedBarber = {
      ...barber,
      photoUrl: barber.photoUrl?.startsWith('/') ? barber.photoUrl.replace('.png', '.webp').toLowerCase() : barber.photoUrl
    };

    if (useAuthStore.getState().isDemo) {
      const barbers = getDemoBarbers();
      const newBarber = { ...processedBarber, id: `b-${Date.now()}` };
      saveDemoBarbers([...barbers, newBarber]);
      return newBarber;
    }
    const docRef = await addDoc(collection(db, 'barbers'), processedBarber);
    return { id: docRef.id, ...processedBarber } as Barber;
  },

  async updateBarber(id: string, barber: Partial<Barber>): Promise<void> {
    const processedBarber = {
      ...barber,
      photoUrl: barber.photoUrl?.startsWith('/') ? barber.photoUrl.replace('.png', '.webp').toLowerCase() : barber.photoUrl
    };

    if (useAuthStore.getState().isDemo) {
      const barbers = getDemoBarbers();
      const updated = barbers.map(b => b.id === id ? { ...b, ...processedBarber } : b);
      saveDemoBarbers(updated);
      return;
    }
    await updateDoc(doc(db, 'barbers', id), processedBarber);
  },

  async deleteBarber(id: string): Promise<void> {
    if (useAuthStore.getState().isDemo) {
      const barbers = getDemoBarbers();
      saveDemoBarbers(barbers.filter(b => b.id !== id));
      return;
    }
    await deleteDoc(doc(db, 'barbers', id));
  },

  async getCompanySettings(): Promise<CompanySettings | null> {
    if (useAuthStore.getState().isDemo) {
      return getDemoCompanySettings();
    }
    const docRef = doc(db, 'settings', 'company');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as CompanySettings;
    }
    return null;
  },

  async updateCompanySettings(settings: Omit<CompanySettings, 'id'>): Promise<void> {
    if (useAuthStore.getState().isDemo) {
      saveDemoCompanySettings({ id: 'default', ...settings });
      return;
    }
    await setDoc(doc(db, 'settings', 'company'), settings, { merge: true });
  },

  async getBlockedTimes(): Promise<BlockedTime[]> {
    if (useAuthStore.getState().isDemo) {
      const saved = localStorage.getItem('barbearia_demo_blocked_times');
      return saved ? JSON.parse(saved) : [];
    }
    const snapshot = await getDocs(collection(db, 'blockedTimes'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlockedTime));
  },

  async addBlockedTime(blockedTime: Omit<BlockedTime, 'id'>): Promise<BlockedTime> {
    if (useAuthStore.getState().isDemo) {
      const saved = localStorage.getItem('barbearia_demo_blocked_times');
      const times = saved ? JSON.parse(saved) : [];
      const newTime = { ...blockedTime, id: `bt-${Date.now()}` };
      localStorage.setItem('barbearia_demo_blocked_times', JSON.stringify([...times, newTime]));
      return newTime;
    }
    const docRef = await addDoc(collection(db, 'blockedTimes'), blockedTime);
    return { id: docRef.id, ...blockedTime } as BlockedTime;
  },

  async deleteBlockedTime(id: string): Promise<void> {
    if (useAuthStore.getState().isDemo) {
      const saved = localStorage.getItem('barbearia_demo_blocked_times');
      const times: BlockedTime[] = saved ? JSON.parse(saved) : [];
      localStorage.setItem('barbearia_demo_blocked_times', JSON.stringify(times.filter(t => t.id !== id)));
      return;
    }
    await deleteDoc(doc(db, 'blockedTimes', id));
  }
};
