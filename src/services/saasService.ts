import { SaaSBarbershop, SaaSPlan, Service, Barber } from '../models';
import { demoSaaSBarbershops, demoSaaSPlans, demoBarbers, demoServices, rogerXBarbers, rogerXServices } from '../models/demoData';

const SAAS_SHOPS_KEY = 'barbersaas_barbershops';
const SAAS_ACTIVE_SHOP_KEY = 'barbersaas_active_shop_id';

const getStoredShops = (): SaaSBarbershop[] => {
  const saved = localStorage.getItem(SAAS_SHOPS_KEY);
  if (saved) {
    try {
      const parsed: SaaSBarbershop[] = JSON.parse(saved);
      // Ensure default/new demo shops (like Roger'X) are always present
      const existingSlugs = new Set(parsed.map(s => s.slug.toLowerCase()));
      const missing = demoSaaSBarbershops.filter(s => !existingSlugs.has(s.slug.toLowerCase()));
      if (missing.length > 0) {
        const merged = [...parsed, ...missing];
        localStorage.setItem(SAAS_SHOPS_KEY, JSON.stringify(merged));
        return merged;
      }
      return parsed;
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

  async getBarbershops(): Promise<SaaSBarbershop[]> {
    return getStoredShops();
  },

  async getBarbershopBySlug(slug: string): Promise<SaaSBarbershop | null> {
    const shops = getStoredShops();
    const cleanSlug = slug.toLowerCase().trim();
    const found = shops.find(s => s.slug.toLowerCase() === cleanSlug);
    return found || null;
  },

  getActiveBarbershop(): SaaSBarbershop {
    const shops = getStoredShops();
    const activeId = localStorage.getItem(SAAS_ACTIVE_SHOP_KEY);
    const found = shops.find(s => s.id === activeId);
    return found || shops[0];
  },

  setActiveBarbershop(id: string): void {
    localStorage.setItem(SAAS_ACTIVE_SHOP_KEY, id);
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
    if (target === 'shop-rogerx' || target === 'rogerx-barbershop' || target.includes('roger')) {
      return rogerXBarbers;
    }
    if (target === 'mister-navalha' || target === 'shop-1' || target === 'seu-elias') {
      return demoBarbers;
    }

    // Check tenant-specific custom barbers
    const custom = getCustomBarbersForShop(target);
    if (custom && custom.length > 0) {
      return custom;
    }

    // STRICT MULTI-TENANT ISOLATION:
    // New tenants start with ONLY their explicitly registered barbers, or empty []
    return [];
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
