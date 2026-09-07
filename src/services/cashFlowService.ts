import { CashFlowTransaction, Appointment, Barber, Service } from '../models';
import { useAuthStore } from '../store/authStore';
import { saasService } from './saasService';

const CASH_FLOW_KEY = 'barbersaas_cash_flow_transactions_v2';

const normalizeShopId = (id?: string): string => {
  if (!id) return '';
  const clean = id.toLowerCase().trim();
  if (clean === 'shop-mister-navalha' || clean === 'mister-navalha' || clean === 'shop-1') return 'shop-mister-navalha';
  if (clean === 'shop-rogerx' || clean === 'rogerx-barbershop' || clean.includes('roger')) return 'shop-rogerx';
  if (clean === 'shop-sherlocks' || clean === 'sherlocks') return 'shop-sherlocks';
  return clean;
};

const getStoredTransactions = (): CashFlowTransaction[] => {
  const saved = localStorage.getItem(CASH_FLOW_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        // Filter out old fake seed transactions if present
        return parsed.filter(t => !t.id.startsWith('seed-tx') && !t.id.startsWith('tx-demo'));
      }
    } catch {
      return [];
    }
  }
  return [];
};

const saveStoredTransactions = (txs: CashFlowTransaction[]) => {
  localStorage.setItem(CASH_FLOW_KEY, JSON.stringify(txs));
};

export const cashFlowService = {
  async getTransactions(barbershopId?: string): Promise<CashFlowTransaction[]> {
    const all = getStoredTransactions();
    if (barbershopId) {
      const normTarget = normalizeShopId(barbershopId);
      const filtered = all.filter(t => normalizeShopId(t.barbershopId) === normTarget);
      return filtered.sort((a, b) => b.createdAt - a.createdAt);
    }
    return all.sort((a, b) => b.createdAt - a.createdAt);
  },

  async addTransaction(tx: Omit<CashFlowTransaction, 'id' | 'createdAt'>): Promise<CashFlowTransaction> {
    const newTx: CashFlowTransaction = {
      ...tx,
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: Date.now()
    };
    const all = getStoredTransactions();
    const updated = [newTx, ...all];
    saveStoredTransactions(updated);
    return newTx;
  },

  async deleteTransaction(id: string): Promise<void> {
    const all = getStoredTransactions();
    const filtered = all.filter(t => t.id !== id);
    saveStoredTransactions(filtered);
  },

  async registerAppointmentCompletion(
    appt: Appointment,
    service: Service,
    barber?: Barber,
    barbershopId?: string
  ): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const shopId = barbershopId || saasService.getActiveBarbershop().id;

    // 1. Receita do Serviço
    await this.addTransaction({
      barbershopId: shopId,
      type: 'income',
      category: 'service',
      description: `${service.name} (Agendamento #${appt.id.slice(-4)})`,
      amount: service.price,
      date: appt.date || today,
      paymentMethod: (appt.paymentMethod as any) || 'mbway',
      appointmentId: appt.id,
      barberId: barber?.id,
      barberName: barber?.name
    });

    // 2. Receita de Produtos Inclusos se houver
    if (appt.selectedProducts && appt.selectedProducts.length > 0) {
      for (const prod of appt.selectedProducts) {
        await this.addTransaction({
          barbershopId: shopId,
          type: 'income',
          category: 'product',
          description: `Venda Upsell: ${prod.name} (${prod.quantity}x)`,
          amount: prod.price * prod.quantity,
          date: appt.date || today,
          paymentMethod: (appt.paymentMethod as any) || 'mbway',
          appointmentId: appt.id
        });
      }
    }

    // 3. Provisão automática da comissão do Barbeiro
    if (barber && barber.compensationValue > 0) {
      let commissionAmount = 0;
      if (barber.compensationType === 'percentage') {
        commissionAmount = (service.price * barber.compensationValue) / 100;
      } else {
        commissionAmount = barber.compensationValue;
      }

      if (commissionAmount > 0) {
        await this.addTransaction({
          barbershopId: shopId,
          type: 'expense',
          category: 'commission',
          description: `Comissão ${barber.name} (${barber.compensationValue}% sobre ${service.name})`,
          amount: parseFloat(commissionAmount.toFixed(2)),
          date: appt.date || today,
          paymentMethod: 'transfer',
          appointmentId: appt.id,
          barberId: barber.id,
          barberName: barber.name
        });
      }
    }
  },

  async getMetrics(barbershopId?: string) {
    const transactions = await this.getTransactions(barbershopId);

    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const netBalance = totalIncome - totalExpense;

    const commissionsTotal = transactions
      .filter(t => t.type === 'expense' && t.category === 'commission')
      .reduce((sum, t) => sum + t.amount, 0);

    const serviceIncomes = transactions.filter(t => t.type === 'income' && t.category === 'service');
    const averageTicket = serviceIncomes.length > 0
      ? totalIncome / serviceIncomes.length
      : 0;

    return {
      totalIncome: parseFloat(totalIncome.toFixed(2)),
      totalExpense: parseFloat(totalExpense.toFixed(2)),
      netBalance: parseFloat(netBalance.toFixed(2)),
      commissionsTotal: parseFloat(commissionsTotal.toFixed(2)),
      averageTicket: parseFloat(averageTicket.toFixed(2)),
      totalTransactions: transactions.length
    };
  }
};
