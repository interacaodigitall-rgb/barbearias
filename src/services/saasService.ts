import { SaaSBarbershop, SaaSPlan } from '../models';
import { demoSaaSBarbershops, demoSaaSPlans } from '../models/demoData';

const SAAS_SHOPS_KEY = 'barbersaas_barbershops';
const SAAS_ACTIVE_SHOP_KEY = 'barbersaas_active_shop_id';

const getStoredShops = (): SaaSBarbershop[] => {
  const saved = localStorage.getItem(SAAS_SHOPS_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return demoSaaSBarbershops;
    }
  }
  return demoSaaSBarbershops;
};

const saveStoredShops = (shops: SaaSBarbershop[]) => {
  localStorage.setItem(SAAS_SHOPS_KEY, JSON.stringify(shops));
};

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
