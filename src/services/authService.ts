import { auth, db } from '../lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { User } from '../models';
import { useAuthStore } from '../store/authStore';
import { saasService, TenantAccount } from './saasService';

const SESSION_KEY = 'barbersaas_current_session';

export const authService = {
  async register(email: string, password: string, name: string, phone: string) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    const barberEmails = [
      'barbeiro01@sherlocks.pt',
      'barbeiro02@sherlocks.pt',
      'barbeiro03@sherlocks.pt',
      'barbeiro04@sherlocks.pt',
      'barbeiro05@sherlocks.pt',
      'barbeiro06@sherlocks.pt'
    ];
    
    let role: 'customer' | 'admin' | 'barber' | 'owner' = 'customer';
    if (email.toLowerCase() === 'adm@sherlocks.pt') {
      role = 'admin';
    } else if (barberEmails.includes(email.toLowerCase())) {
      role = 'barber';
    }
    
    const user: User = {
      uid: userCredential.user.uid,
      name,
      email,
      phone,
      role,
      createdAt: Date.now(),
    };
    await setDoc(doc(db, 'users', user.uid), user);
    useAuthStore.getState().setUser(user, false);
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  },

  async login(email: string, password: string) {
    // 1. Check local tenant accounts (Owners & Barbers registered via Super Admin or Shop Admin)
    const tenantUser = saasService.authenticateTenantUser(email, password);
    if (tenantUser) {
      const user: User = {
        uid: tenantUser.uid,
        name: tenantUser.name,
        email: tenantUser.email,
        phone: tenantUser.phone || '',
        role: tenantUser.role,
        companyId: tenantUser.companyId,
        barberId: tenantUser.barberId,
        createdAt: tenantUser.createdAt
      };

      if (user.companyId) {
        saasService.setActiveBarbershop(user.companyId);
      }

      useAuthStore.getState().setUser(user, false);
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      return user;
    }

    // 2. Otherwise authenticate via Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    const user = userDoc.data() as User;
    
    // Auto-promote to admin if it's the admin email
    if (user.email.toLowerCase() === 'adm@sherlocks.pt' && user.role !== 'admin') {
      user.role = 'admin';
      await setDoc(doc(db, 'users', user.uid), { role: 'admin' }, { merge: true });
    }
    
    useAuthStore.getState().setUser(user, false);
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  },

  async loginDirect(user: User) {
    if (user.companyId) {
      saasService.setActiveBarbershop(user.companyId);
    }
    useAuthStore.getState().setUser(user, false);
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  },

  async loginDemo(role: 'customer' | 'barber' | 'admin' | 'owner') {
    const demoUsers: Record<string, User> = {
      customer: {
        uid: 'demo-customer',
        name: 'Cliente Demo',
        email: 'cliente@demo.com',
        phone: '123456789',
        role: 'customer',
        createdAt: Date.now(),
      },
      barber: {
        uid: 'acc-barber-vitor',
        name: 'Vítor Bitrekas',
        email: 'vitor@rogerx.pt',
        phone: '+351 910 000 124',
        role: 'barber',
        companyId: 'shop-rogerx',
        barberId: 'b-rogerx-vitor',
        createdAt: Date.now(),
      },
      owner: {
        uid: 'acc-owner-rogerx',
        name: 'Roger (Dono Roger\'X)',
        email: 'roger@rogerxbarbershop.pt',
        phone: '+351 910 000 123',
        role: 'owner',
        companyId: 'shop-rogerx',
        createdAt: Date.now(),
      },
      admin: {
        uid: 'demo-admin',
        name: 'Super Admin',
        email: 'admin@demo.com',
        phone: '000000000',
        role: 'admin',
        createdAt: Date.now(),
      }
    };
    
    const user = demoUsers[role] || demoUsers['admin'];
    if (user.companyId) {
      saasService.setActiveBarbershop(user.companyId);
    }
    useAuthStore.getState().setUser(user, true);
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  },

  async logout() {
    localStorage.removeItem(SESSION_KEY);
    if (useAuthStore.getState().isDemo) {
      useAuthStore.getState().setUser(null, false);
      return;
    }
    try {
      await signOut(auth);
    } catch {}
    useAuthStore.getState().setUser(null, false);
  },

  async resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email);
  },

  initAuthListener() {
    // 1. Check if we have an active tenant user session saved
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) {
      try {
        const parsed: User = JSON.parse(saved);
        if (parsed && parsed.uid) {
          useAuthStore.getState().setUser(parsed, false);
          useAuthStore.getState().setLoading(false);
          return () => {};
        }
      } catch {}
    }

    return onAuthStateChanged(auth, async (firebaseUser) => {
      // If we are in demo or tenant mode, don't let Firebase Auth override it
      if (useAuthStore.getState().isDemo) return;

      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const user = userDoc.data() as User;
          useAuthStore.getState().setUser(user, false);
          localStorage.setItem(SESSION_KEY, JSON.stringify(user));
        }
      } else {
        useAuthStore.getState().setUser(null, false);
      }
      useAuthStore.getState().setLoading(false);
    });
  }
};
