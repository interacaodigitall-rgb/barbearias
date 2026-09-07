const fs = require('fs');

const path = 'src/models/demoData.ts';
let content = fs.readFileSync(path, 'utf8');

// Add demo appointments for rogerx
const rogerAppts = `
  {
    id: 'a-rogerx-1',
    customerId: 'demo-customer',
    barberId: 'b-rogerx-roger',
    serviceId: 's1', // we might need to use real service id for rogerx but let's just use whatever
    date: today,
    time: '14:30',
    status: 'completed',
    paymentMethod: 'mbway',
    paymentStatus: 'paid',
    createdAt: Date.now() - 1000000
  },
  {
    id: 'a-rogerx-2',
    customerId: 'demo-customer',
    barberId: 'b-rogerx-vitor',
    serviceId: 's2',
    date: today,
    time: '15:30',
    status: 'pending',
    paymentMethod: 'cash',
    paymentStatus: 'pending',
    createdAt: Date.now() - 500000
  },
`;
content = content.replace('export const demoAppointments: Appointment[] = [', 'export const demoAppointments: Appointment[] = [\n' + rogerAppts);

const rogerTx = `
  {
    id: 'tx-rogerx-1',
    barbershopId: 'shop-rogerx',
    type: 'income',
    category: 'service',
    description: 'Corte Efeito Matte',
    amount: 70.00,
    date: today,
    paymentMethod: 'mbway',
    barberId: 'b-rogerx-roger',
    barberName: 'Roger Santos',
    createdAt: Date.now() - 2000000
  },
  {
    id: 'tx-rogerx-2',
    barbershopId: 'shop-rogerx',
    type: 'expense',
    category: 'supplies',
    description: 'Compra de toalhas',
    amount: 180.00,
    date: today,
    paymentMethod: 'transfer',
    createdAt: Date.now() - 1000000
  },
  {
    id: 'tx-rogerx-3',
    barbershopId: 'shop-rogerx',
    type: 'expense',
    category: 'commission',
    description: 'Comissão (b-rogerx-roger)',
    amount: 15.00,
    date: today,
    paymentMethod: 'transfer',
    barberId: 'b-rogerx-roger',
    barberName: 'Roger Santos',
    createdAt: Date.now() - 500000
  },
`;
content = content.replace('export const demoCashFlowTransactions: CashFlowTransaction[] = [', 'export const demoCashFlowTransactions: CashFlowTransaction[] = [\n' + rogerTx);

fs.writeFileSync(path, content, 'utf8');
