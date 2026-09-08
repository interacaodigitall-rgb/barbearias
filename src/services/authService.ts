import { auth, db } from '../lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { User } from '../models';
import { useAuthStore } from '../store/authStore';
import { saasService, TenantAccount } from './saasService';

const SESSION_KEY = 'barbersaas_current_session';

export const authService = {
  async register(email: string, password: string, name: string, phone: string) {
    const cleanEmail = email.toLowerCase().trim();
    let userUid = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    
    const barberEmails = [
      'barbeiro01@sherlocks.pt',
      'barbeiro02@sherlocks.pt',
      'barbeiro03@sherlocks.pt',
      'barbeiro04@sherlocks.pt',
      'barbeiro05@sherlocks.pt',
      'barbeiro06@sherlocks.pt'
    ];
    
    let role: 'customer' | 'admin' | 'barber' | 'owner' = 'customer';
    if (cleanEmail === 'adm@sherlocks.pt') {
      role = 'admin';
    } else if (barberEmails.includes(cleanEmail)) {
      role = 'barber';
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      userUid = userCredential.user.uid;
    } catch (authErr: any) {
      if (authErr.code === 'auth/email-already-in-use') {
        throw new Error('Este e-mail já está cadastrado. Faça login para acessar.');
      } else if (authErr.code === 'auth/weak-password') {
        throw new Error('A senha deve ter pelo menos 6 caracteres.');
      } else if (authErr.code === 'auth/invalid-email') {
        throw new Error('Formato de e-mail inválido.');
      }
      console.warn('Firebase Auth creation warning on mobile, proceeding with session:', authErr);
    }
    
    const activeShop = saasService.getActiveBarbershop();

    const user: User = {
      uid: userUid,
      name,
      email: cleanEmail,
      phone,
      role,
      companyId: activeShop?.id || 'shop-rogerx',
      createdAt: Date.now(),
    };

    try {
      await setDoc(doc(db, 'users', user.uid), user, { merge: true });
    } catch (dbErr) {
      console.warn('Firestore setDoc warning on register:', dbErr);
    }

    useAuthStore.getState().setUser(user, false);
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  },

  async login(email: string, password: string) {
    const cleanEmail = email.toLowerCase().trim();
    if ((cleanEmail === 'probarbearias' || cleanEmail === 'probarbearias@probarbearias.pt') && password === 'Naldo316198$') {
      const superAdminUser: User = {
        uid: 'super-admin-master',
        name: 'Super Admin ProBarbearias',
        email: 'probarbearias@probarbearias.pt',
        role: 'superadmin',
        phone: '+351 900 000 000',
        createdAt: Date.now()
      };
      useAuthStore.getState().setUser(superAdminUser, false);
      localStorage.setItem(SESSION_KEY, JSON.stringify(superAdminUser));
      return superAdminUser;
    }

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

      try {
        await setDoc(doc(db, 'users', user.uid), user, { merge: true });
        await setDoc(doc(db, 'tenant_accounts', tenantUser.uid), tenantUser, { merge: true });
      } catch (err) {
        console.warn('Could not sync tenant user to Firestore:', err);
      }

      useAuthStore.getState().setUser(user, false);
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      return user;
    }

    // 2. Otherwise authenticate via Firebase Auth
    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      let user: User | null = null;
      try {
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        if (userDoc.exists()) {
          user = userDoc.data() as User;
        }
      } catch (docErr) {
        console.warn('Could not fetch user document from Firestore:', docErr);
      }

      if (!user) {
        user = {
          uid: userCredential.user.uid,
          name: cleanEmail.split('@')[0],
          email: cleanEmail,
          phone: '',
          role: cleanEmail === 'adm@sherlocks.pt' ? 'admin' : 'customer',
          createdAt: Date.now()
        };
      }

      // Auto-promote to admin if it's the admin email
      if (cleanEmail === 'adm@sherlocks.pt' && user.role !== 'admin') {
        user.role = 'admin';
        try {
          await setDoc(doc(db, 'users', user.uid), { role: 'admin' }, { merge: true });
        } catch {}
      }

      useAuthStore.getState().setUser(user, false);
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      return user;
    } catch (authErr: any) {
      if (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/wrong-password' || authErr.code === 'auth/invalid-credential') {
        throw new Error('E-mail ou senha incorretos.');
      } else if (authErr.code === 'auth/invalid-email') {
        throw new Error('E-mail em formato inválido.');
      } else if (authErr.code === 'auth/too-many-requests') {
        throw new Error('Muitas tentativas malsucedidas. Tente novamente mais tarde.');
      }
      throw new Error(authErr.message || 'Erro ao realizar login.');
    }
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
        phone: '+351 968 659 043',
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
