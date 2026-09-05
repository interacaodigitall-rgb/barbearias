import { auth, db } from '../lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { User } from '../models';
import { useAuthStore } from '../store/authStore';

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
    
    let role: 'customer' | 'admin' | 'barber' = 'customer';
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
    return user;
  },

  async login(email: string, password: string) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    const user = userDoc.data() as User;
    
    // Auto-promote to admin if it's the admin email
    if (user.email.toLowerCase() === 'adm@sherlocks.pt' && user.role !== 'admin') {
      user.role = 'admin';
      await setDoc(doc(db, 'users', user.uid), { role: 'admin' }, { merge: true });
    }
    
    useAuthStore.getState().setUser(user, false);
    return user;
  },

  async loginDemo(role: 'customer' | 'barber' | 'admin') {
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
        uid: 'demo-barber',
        name: 'Barbeiro Demo',
        email: 'barbeiro@demo.com',
        phone: '987654321',
        role: 'barber',
        createdAt: Date.now(),
      },
      admin: {
        uid: 'demo-admin',
        name: 'Admin Demo',
        email: 'admin@demo.com',
        phone: '000000000',
        role: 'admin',
        createdAt: Date.now(),
      }
    };
    
    const user = demoUsers[role];
    useAuthStore.getState().setUser(user, true);
    return user;
  },

  async logout() {
    if (useAuthStore.getState().isDemo) {
      useAuthStore.getState().setUser(null, false);
      return;
    }
    await signOut(auth);
    useAuthStore.getState().setUser(null, false);
  },

  async resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email);
  },

  initAuthListener() {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      // If we are in demo mode, don't let Firebase Auth override it
      if (useAuthStore.getState().isDemo) return;

      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          useAuthStore.getState().setUser(userDoc.data() as User, false);
        }
      } else {
        useAuthStore.getState().setUser(null, false);
      }
      useAuthStore.getState().setLoading(false);
    });
  }
};
