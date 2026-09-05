import { Product } from '../models';
import { demoProducts } from '../models/demoData';

const PRODUCTS_STORAGE_KEY = 'barbersaas_products';

const getStoredProducts = (): Product[] => {
  const saved = localStorage.getItem(PRODUCTS_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return demoProducts;
    }
  }
  return demoProducts;
};

const saveStoredProducts = (products: Product[]) => {
  localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
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

  async deleteProduct(id: string): Promise<void> {
    const current = getStoredProducts();
    const updated = current.filter(p => p.id !== id);
    saveStoredProducts(updated);
  }
};
