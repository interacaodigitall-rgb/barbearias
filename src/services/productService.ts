import { Product } from '../models';
import { demoProducts } from '../models/demoData';
import { saasService } from './saasService';

const getProductsKey = (): string => {
  try {
    const activeShop = saasService.getActiveBarbershop();
    const id = activeShop?.id || 'shop-rogerx';
    return `barbersaas_products_${id.toLowerCase().trim()}`;
  } catch {
    return 'barbersaas_products_shop-rogerx';
  }
};

const getStoredProducts = (): Product[] => {
  const key = getProductsKey();
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return demoProducts;
    }
  }
  // For known default shops (Roger'X and Mister Navalha), fall back to demoProducts
  const keyStr = key.toLowerCase();
  if (keyStr.includes('roger') || keyStr.includes('navalha') || keyStr.includes('shop-1')) {
    return demoProducts;
  }
  // Any other/new barbershops should start empty as per multi-tenant clean isolation
  return [];
};

const saveStoredProducts = (products: Product[]) => {
  const key = getProductsKey();
  localStorage.setItem(key, JSON.stringify(products));
};

export const productService = {
  async getProducts(): Promise<Product[]> {
    return getStoredProducts();
  },

  async addProduct(product: Omit<Product, 'id'>): Promise<Product> {
    const newProduct: Product = {
      ...product,
      id: `p-${Date.now()}`
    };
    const current = getStoredProducts();
    const updated = [...current, newProduct];
    saveStoredProducts(updated);
    return newProduct;
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    const current = getStoredProducts();
    const index = current.findIndex(p => p.id === id);
    if (index === -1) return null;

    current[index] = { ...current[index], ...updates };
    saveStoredProducts(current);
    return current[index];
  },

  async decrementStock(id: string, quantity: number = 1): Promise<Product | null> {
    const current = getStoredProducts();
    const index = current.findIndex(p => p.id === id);
    if (index === -1) return null;

    const newStock = Math.max(0, current[index].stock - quantity);
    current[index] = { ...current[index], stock: newStock };
    saveStoredProducts(current);
    return current[index];
  },

  async deleteProduct(id: string): Promise<void> {
    const current = getStoredProducts();
    const updated = current.filter(p => p.id !== id);
    saveStoredProducts(updated);
  }
};

