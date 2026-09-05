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

  getActiveBarbershop(): SaaSBarbershop {
    const shops = getStoredShops();
    const activeId = localStorage.getItem(SAAS_ACTIVE_SHOP_KEY);
    const found = shops.find(s => s.id === activeId);
    return found || shops[0];
  },

  setActiveBarbershop(id: string): void {
    localStorage.setItem(SAAS_ACTIVE_SHOP_KEY, id);
  },

  async registerNewBarbershop(data: {
    name: string;
    unit: string;
    city: string;
    phone: string;
    plan: 'starter' | 'pro' | 'enterprise';
  }): Promise<SaaSBarbershop> {
    const shops = getStoredShops();
    const newShop: SaaSBarbershop = {
      id: `shop-${Date.now()}`,
      name: data.name.toUpperCase(),
      slug: data.name.toLowerCase().replace(/\s+/g, '-'),
      tagline: 'Cortes exclusivos & atendimento personalizado',
      unit: data.unit.toUpperCase(),
      city: data.city,
      country: 'Portugal',
      address: `Rua Central, ${Math.floor(Math.random() * 100) + 1}`,
      phone: data.phone,
      plan: data.plan,
      planStatus: 'trial',
      trialDaysLeft: 14,
      monthlyFee: data.plan === 'starter' ? 29 : data.plan === 'pro' ? 59 : 99,
      rating: 5.0,
      quietServiceEnabled: true,
      cashFlowBalance: 0
    };

    const updated = [newShop, ...shops];
    saveStoredShops(updated);
    this.setActiveBarbershop(newShop.id);
    return newShop;
  }
};
