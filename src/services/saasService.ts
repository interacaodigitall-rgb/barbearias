import { SaaSBarbershop, SaaSPlan, Service, Barber, User } from '../models';
import { demoSaaSBarbershops, demoSaaSPlans, demoBarbers, demoServices, rogerXBarbers, rogerXServices } from '../models/demoData';

const SAAS_SHOPS_KEY = 'barbersaas_barbershops';
const SAAS_ACTIVE_SHOP_KEY = 'barbersaas_active_shop_id';
const SAAS_ACCOUNTS_KEY = 'barbersaas_tenant_accounts';

export interface TenantAccount {
  uid: string;
  email: string;
  password?: string;
  name: string;
  phone?: string;
  role: 'owner' | 'barber' | 'admin';
  companyId: string;
  companyName?: string;
  barberId?: string;
  commissionPercent?: number;
  createdAt: number;
}

const defaultTenantAccounts: TenantAccount[] = [
  {
    uid: 'acc-owner-rogerx',
    email: 'roger@rogerxbarbershop.pt',
    password: 'rogerx',
    name: 'Roger (Dono Roger\'X)',
    phone: '+351 910 000 123',
    role: 'owner',
    companyId: 'shop-rogerx',
    companyName: "Roger'X BarberShop",
    createdAt: Date.now() - 30 * 86400000
  },
  {
    uid: 'acc-owner-navalha',
    email: 'dono@misternavalha.pt',
    password: 'dono123',
    name: 'Carlos Navalha (Dono)',
    phone: '+351 925 112 334',
    role: 'owner',
    companyId: 'shop-mister-navalha',
    companyName: 'Mister Navalha',
    createdAt: Date.now() - 45 * 86400000
  },
  // Real Roger'X Barbers
  {
    uid: 'acc-barber-roger',
    email: 'roger.barber@rogerx.pt',
    password: 'roger123',
    name: 'Roger',
    phone: '+351 910 000 123',
    role: 'barber',
    companyId: 'shop-rogerx',
    companyName: "Roger'X BarberShop",
    barberId: 'b-rogerx-roger',
    createdAt: Date.now() - 20 * 86400000
  },
  {
    uid: 'acc-barber-vitor',
    email: 'vitor@rogerx.pt',
    password: 'vitor123',
    name: 'Vítor Bitrekas',
    phone: '+351 910 000 124',
    role: 'barber',
    companyId: 'shop-rogerx',
    companyName: "Roger'X BarberShop",
    barberId: 'b-rogerx-vitor',
    createdAt: Date.now() - 20 * 86400000
  },
  {
    uid: 'acc-barber-fernando',
    email: 'fernando@rogerx.pt',
    password: 'fernando123',
    name: 'Fernando',
    phone: '+351 910 000 125',
    role: 'barber',
    companyId: 'shop-rogerx',
    companyName: "Roger'X BarberShop",
    barberId: 'b-rogerx-fernando',
    createdAt: Date.now() - 20 * 86400000
  },
  {
    uid: 'acc-barber-barbudo',
    email: 'barbudo@rogerx.pt',
    password: 'barbudo123',
    name: 'Barbudo',
    phone: '+351 910 000 126',
    role: 'barber',
    companyId: 'shop-rogerx',
    companyName: "Roger'X BarberShop",
    barberId: 'b-rogerx-barbudo',
    createdAt: Date.now() - 20 * 86400000
  }
];

export function getStoredTenantAccounts(): TenantAccount[] {
  try {
    const raw = localStorage.getItem(SAAS_ACCOUNTS_KEY);
    if (raw) {
      const parsed: TenantAccount[] = JSON.parse(raw);
      // Ensure defaults exist
      const existingEmails = new Set(parsed.map(a => a.email.toLowerCase()));
      const missing = defaultTenantAccounts.filter(a => !existingEmails.has(a.email.toLowerCase()));
      if (missing.length > 0) {
        const merged = [...parsed, ...missing];
        localStorage.setItem(SAAS_ACCOUNTS_KEY, JSON.stringify(merged));
        return merged;
      }
      return parsed;
    }
  } catch {}
  localStorage.setItem(SAAS_ACCOUNTS_KEY, JSON.stringify(defaultTenantAccounts));
  return defaultTenantAccounts;
}

export function saveStoredTenantAccounts(accounts: TenantAccount[]): void {
  localStorage.setItem(SAAS_ACCOUNTS_KEY, JSON.stringify(accounts));
}

const getStoredShops = (): SaaSBarbershop[] => {
  const saved = localStorage.getItem(SAAS_SHOPS_KEY);
  if (saved) {
    try {
      const parsed: SaaSBarbershop[] = JSON.parse(saved);
      // Ensure default/new demo shops (like Roger'X) are always present and updated with new properties like logoUrl
      const demoMap = new Map(demoSaaSBarbershops.map(s => [s.slug.toLowerCase(), s]));
      const merged = parsed.map(s => {
        const demoShop = demoMap.get(s.slug.toLowerCase());
        return demoShop ? { ...s, ...demoShop, cashFlowBalance: s.cashFlowBalance } : s; // Preserve cashFlowBalance if needed, or just overwrite
      });
      const existingSlugs = new Set(merged.map(s => s.slug.toLowerCase()));
      const missing = demoSaaSBarbershops.filter(s => !existingSlugs.has(s.slug.toLowerCase()));
      
      const finalShops = [...merged, ...missing];
      
      // Force update rogerx to ensure it has the logo
      const rogerx = finalShops.find(s => s.slug === 'rogerx-barbershop');
      if (rogerx) {
        rogerx.logoUrl = 'https://i.postimg.cc/pLGNWyw8/logo-roger-png.png';
      }

      localStorage.setItem(SAAS_SHOPS_KEY, JSON.stringify(finalShops));
      return finalShops;
    } catch {
      return demoSaaSBarbershops;
    }
  }
  return demoSaaSBarbershops;
};

const saveStoredShops = (shops: SaaSBarbershop[]) => {
  localStorage.setItem(SAAS_SHOPS_KEY, JSON.stringify(shops));
};

export function getCustomBarbersForShop(slugOrId: string): Barber[] {
  try {
    const clean = slugOrId.toLowerCase().trim();
    const raw = localStorage.getItem(`saas_barbers_${clean}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomBarbersForShop(slugOrId: string, barbers: Barber[]): void {
  const clean = slugOrId.toLowerCase().trim();
  localStorage.setItem(`saas_barbers_${clean}`, JSON.stringify(barbers));
}

export function getCustomServicesForShop(slugOrId: string): Service[] {
  try {
    const clean = slugOrId.toLowerCase().trim();
    const raw = localStorage.getItem(`saas_services_${clean}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomServicesForShop(slugOrId: string, services: Service[]): void {
  const clean = slugOrId.toLowerCase().trim();
  localStorage.setItem(`saas_services_${clean}`, JSON.stringify(services));
}

export const saasService = {
  getPlans(): SaaSPlan[] {
    return demoSaaSPlans;
  },

  getBarbershopsSync(): SaaSBarbershop[] {
    return getStoredShops();
  },

  async getBarbershops(): Promise<SaaSBarbershop[]> {
    return getStoredShops();
  },

  getBarbershopBySlugSync(slug: string): SaaSBarbershop | null {
    const shops = getStoredShops();
    const cleanSlug = slug.toLowerCase().trim();
    return shops.find(s => s.slug.toLowerCase() === cleanSlug || s.id.toLowerCase() === cleanSlug) || null;
  },

  async getBarbershopBySlug(slug: string): Promise<SaaSBarbershop | null> {
    return this.getBarbershopBySlugSync(slug);
  },

  getBarbershopById(id: string): SaaSBarbershop | null {
    const shops = getStoredShops();
    const clean = id.toLowerCase().trim();
    return shops.find(s => s.id.toLowerCase() === clean || s.slug.toLowerCase() === clean) || null;
  },

  getActiveBarbershop(): SaaSBarbershop {
    const shops = getStoredShops();
    const activeId = localStorage.getItem(SAAS_ACTIVE_SHOP_KEY);
    const found = shops.find(s => s.id === activeId || s.slug === activeId);
    return found || shops[0];
  },

  setActiveBarbershop(idOrSlug: string): void {
    const shops = getStoredShops();
    const clean = idOrSlug.toLowerCase().trim();
    const found = shops.find(s => s.id.toLowerCase() === clean || s.slug.toLowerCase() === clean);
    if (found) {
      localStorage.setItem(SAAS_ACTIVE_SHOP_KEY, found.id);
    } else {
      localStorage.setItem(SAAS_ACTIVE_SHOP_KEY, idOrSlug);
    }
  },

  async getServicesForShop(shopIdOrSlug?: string): Promise<Service[]> {
    const target = (shopIdOrSlug || this.getActiveBarbershop().slug).toLowerCase().trim();
    if (target === 'shop-rogerx' || target === 'rogerx-barbershop' || target.includes('roger')) {
      return rogerXServices;
    }
    if (target === 'mister-navalha' || target === 'shop-1' || target === 'seu-elias') {
      return demoServices;
    }

    // Check tenant-specific custom services
    const custom = getCustomServicesForShop(target);
    if (custom && custom.length > 0) {
      return custom;
    }

    // STRICT MULTI-TENANT ISOLATION:
    // New tenants do not inherit default demo services
    return [];
  },

  async getBarbersForShop(shopIdOrSlug?: string): Promise<Barber[]> {
    const target = (shopIdOrSlug || this.getActiveBarbershop().slug).toLowerCase().trim();
    
    // Roger'X BarberShop: Only the 4 real barbers (Roger, Vítor Bitrekas, Fernando, Barbudo)
    if (target === 'shop-rogerx' || target === 'rogerx-barbershop' || target.includes('roger')) {
      const custom = getCustomBarbersForShop(target);
      if (custom && custom.length > 0) {
        return custom;
      }
      return rogerXBarbers;
    }

    if (target === 'mister-navalha' || target === 'shop-1' || target === 'seu-elias') {
      const custom = getCustomBarbersForShop(target);
      if (custom && custom.length > 0) {
        return custom;
      }
      return demoBarbers;
    }

    // Check tenant-specific custom barbers
    const custom = getCustomBarbersForShop(target);
    if (custom && custom.length > 0) {
      return custom;
    }

    // STRICT MULTI-TENANT ISOLATION FOR NEW BARBERSHOPS:
    // Any new barbershop starts strictly with NO mock or fictitious barbers (empty array [])
    return [];
  },

  // ==========================================================================
  // TENANT ACCOUNTS MANAGEMENT (OWNERS & BARBERS)
  // ==========================================================================

  getTenantAccounts(companyId?: string): TenantAccount[] {
    const accounts = getStoredTenantAccounts();
    if (!companyId) return accounts;
    const cleanId = companyId.toLowerCase().trim();
    return accounts.filter(a => a.companyId.toLowerCase() === cleanId);
  },

  async createTenantOwnerAccount(data: {
    companyId: string;
    name: string;
    email: string;
    password?: string;
    phone?: string;
  }): Promise<TenantAccount> {
    const accounts = getStoredTenantAccounts();
    const cleanEmail = data.email.toLowerCase().trim();

    // Check if account with this email already exists
    const existingIndex = accounts.findIndex(a => a.email.toLowerCase() === cleanEmail);
    const shop = this.getBarbershopById(data.companyId);

    const newAccount: TenantAccount = {
      uid: `acc-owner-${Date.now()}`,
      email: cleanEmail,
      password: data.password || 'owner123',
      name: data.name.trim(),
      phone: data.phone || '',
      role: 'owner',
      companyId: data.companyId,
      companyName: shop?.name || 'Barbearia',
      createdAt: Date.now()
    };

    let updated: TenantAccount[];
    if (existingIndex >= 0) {
      updated = [...accounts];
      updated[existingIndex] = { ...updated[existingIndex], ...newAccount, uid: accounts[existingIndex].uid };
    } else {
      updated = [newAccount, ...accounts];
    }

    saveStoredTenantAccounts(updated);
    return newAccount;
  },

  async createBarberAccount(data: {
    companyId: string;
    barberId: string;
    name: string;
    email: string;
    password?: string;
    phone?: string;
    commissionPercent?: number;
  }): Promise<TenantAccount> {
    const accounts = getStoredTenantAccounts();
    const cleanEmail = data.email.toLowerCase().trim();
    const shop = this.getBarbershopById(data.companyId);

    const existingIndex = accounts.findIndex(a => a.email.toLowerCase() === cleanEmail || (a.barberId === data.barberId && a.companyId === data.companyId));

    const newAccount: TenantAccount = {
      uid: `acc-barber-${Date.now()}`,
      email: cleanEmail,
      password: data.password || 'barber123',
      name: data.name.trim(),
      phone: data.phone || '',
      role: 'barber',
      companyId: data.companyId,
      companyName: shop?.name || 'Barbearia',
      barberId: data.barberId,
      commissionPercent: data.commissionPercent || 50,
      createdAt: Date.now()
    };

    let updated: TenantAccount[];
    if (existingIndex >= 0) {
      updated = [...accounts];
      updated[existingIndex] = { ...updated[existingIndex], ...newAccount, uid: accounts[existingIndex].uid };
    } else {
      updated = [newAccount, ...accounts];
    }

    saveStoredTenantAccounts(updated);
    return newAccount;
  },

  getBarberAccount(barberId: string): TenantAccount | null {
    const accounts = getStoredTenantAccounts();
    return accounts.find(a => a.barberId === barberId && a.role === 'barber') || null;
  },

  async deleteTenantAccount(uid: string): Promise<void> {
    const accounts = getStoredTenantAccounts();
    const filtered = accounts.filter(a => a.uid !== uid);
    saveStoredTenantAccounts(filtered);
  },

  authenticateTenantUser(email: string, password?: string): TenantAccount | null {
    const accounts = getStoredTenantAccounts();
    const cleanEmail = email.toLowerCase().trim();
    const found = accounts.find(a => a.email.toLowerCase() === cleanEmail);
    if (!found) return null;
    if (password && found.password && found.password !== password) {
      return null;
    }
    return found;
  },

  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },

  async registerNewBarbershop(data: {
    name: string;
    slug?: string;
    unit?: string;
    city?: string;
    phone?: string;
    plan: 'starter' | 'pro' | 'imperio';
    primaryColor?: string;
    storyText?: string;
  }): Promise<SaaSBarbershop> {
    const shops = getStoredShops();
    
    // Auto-generate clean slug if not provided or format given slug
    const cleanSlug = data.slug 
      ? this.generateSlug(data.slug) 
      : this.generateSlug(data.name);

    // Prevent duplicate slugs
    let finalSlug = cleanSlug;
    let counter = 1;
    while (shops.some(s => s.slug === finalSlug)) {
      finalSlug = `${cleanSlug}-${counter}`;
      counter++;
    }

    const monthlyFee = data.plan === 'starter' ? 29.00 : data.plan === 'pro' ? 59.00 : 99.00;

    const newShop: SaaSBarbershop = {
      id: `shop-${Date.now()}`,
      name: data.name.toUpperCase(),
      slug: finalSlug,
      tagline: 'Cortes exclusivos, barba na toalha quente & estilo impecável',
      unit: (data.unit || 'Matriz').toUpperCase(),
      city: data.city || 'Lisboa',
      country: 'Portugal',
      address: `Avenida Principal, ${Math.floor(Math.random() * 120) + 1}`,
      phone: data.phone || '+351 912 345 678',
      plan: data.plan,
      planStatus: 'trial',
      trialDaysLeft: 14,
      monthlyFee: monthlyFee,
      rating: 5.0,
      primaryColor: data.primaryColor || '#d4a338',
      storyText: data.storyText || `A ${data.name} nasceu com o compromisso de trazer a verdadeira experiência clássica do cuidado masculino aliada às técnicas mais modernas.`,
      quietServiceEnabled: true,
      cashFlowBalance: 0,
      active: true
    };

    const updated = [newShop, ...shops];
    saveStoredShops(updated);
    this.setActiveBarbershop(newShop.id);
    return newShop;
  },

  async updateBarbershop(id: string, data: Partial<SaaSBarbershop>): Promise<SaaSBarbershop> {
    const shops = getStoredShops();
    const index = shops.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Barbearia não encontrada');

    const updatedShop = {
      ...shops[index],
      ...data,
      // If slug changed, sanitize it
      ...(data.slug ? { slug: this.generateSlug(data.slug) } : {})
    };

    shops[index] = updatedShop;
    saveStoredShops(shops);
    return updatedShop;
  },

  async deleteBarbershop(id: string): Promise<void> {
    const shops = getStoredShops();
    const filtered = shops.filter(s => s.id !== id);
    saveStoredShops(filtered);
    if (localStorage.getItem(SAAS_ACTIVE_SHOP_KEY) === id && filtered.length > 0) {
      this.setActiveBarbershop(filtered[0].id);
    }
  },

  async getSuperAdminMetrics(): Promise<{
    totalShops: number;
    activeShops: number;
    totalMRR: number;
    planBreakdown: Record<string, number>;
  }> {
    const shops = getStoredShops();
    const activeShops = shops.filter(s => s.active !== false);
    const totalMRR = activeShops.reduce((sum, s) => sum + s.monthlyFee, 0);

    const planBreakdown = shops.reduce((acc, s) => {
      acc[s.plan] = (acc[s.plan] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalShops: shops.length,
      activeShops: activeShops.length,
      totalMRR,
      planBreakdown
    };
  }
};
