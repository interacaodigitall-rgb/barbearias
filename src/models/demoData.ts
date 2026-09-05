import { Service, Barber, Appointment, Product, SaaSBarbershop, SaaSPlan, CashFlowTransaction } from './index';

export const demoServices: Service[] = [
  {
    id: 's1',
    name: 'Corte',
    description: 'Corte clássico ou moderno com acabamento impecável.',
    price: 12.00,
    durationMinutes: 40,
    isActive: true
  },
  {
    id: 's2',
    name: 'Corte infantil',
    description: 'Corte cuidadoso e estilizado para os pequenos.',
    price: 10.00,
    durationMinutes: 30,
    isActive: true
  },
  {
    id: 's3',
    name: 'Barba',
    description: 'Toalha quente, navalha e hidratação profunda.',
    price: 8.00,
    durationMinutes: 25,
    isActive: true
  },
  {
    id: 's4',
    name: 'Sobrancelha',
    description: 'Design e alinhamento na navalha ou pinça.',
    price: 3.00,
    durationMinutes: 10,
    isActive: true
  },
  {
    id: 's5',
    name: 'Corte + Barba',
    description: 'Combo completo para renovar o visual por inteiro.',
    price: 18.00,
    durationMinutes: 60,
    isActive: true
  },
  {
    id: 's6',
    name: 'Corte + Sobrancelha',
    description: 'Corte alinhado com sobrancelha desenhada.',
    price: 14.00,
    durationMinutes: 45,
    isActive: true
  }
];

export const demoProducts: Product[] = [
  {
    id: 'p1',
    name: 'CERA',
    description: 'Modelador de alta fixação para pentear e estruturar.',
    price: 15.00,
    category: 'cabelo',
    stock: 24,
    isActive: true
  },
  {
    id: 'p2',
    name: 'ÓLEO PARA BARBA',
    description: 'Hidratação profunda para os fios com aroma amadeirado.',
    price: 16.00,
    category: 'barba',
    stock: 18,
    isActive: true
  },
  {
    id: 'p3',
    name: 'BÁLSAMO PARA BARBA',
    description: 'Maciez, controle do frizz e brilho natural.',
    price: 16.00,
    category: 'barba',
    stock: 15,
    isActive: true
  },
  {
    id: 'p4',
    name: 'MINOXIDIL',
    description: 'Tratamento premium para crescimento capilar e barba.',
    price: 25.00,
    category: 'tratamento',
    stock: 12,
    isActive: true
  },
  {
    id: 'p5',
    name: 'POMADA MATTE',
    description: 'Efeito seco e natural com sustentação duradoura.',
    price: 14.00,
    category: 'cabelo',
    stock: 30,
    isActive: true
  }
];

export const demoBarbers: Barber[] = [
  {
    id: 'b-ernando',
    name: 'ERNANDO SILVA',
    bio: 'Master Barber premiado, referência em degradê e visagismo.',
    rating: 5.0,
    isActive: true,
    branch: 'PT',
    compensationType: 'percentage',
    compensationValue: 50,
    photoUrl: '/almir.webp'
  },
  {
    id: 'b1',
    name: 'ALMIR',
    bio: 'Especialista em cortes clássicos e barbas tradicionais.',
    rating: 5.0,
    isActive: true,
    branch: 'PT',
    compensationType: 'percentage',
    compensationValue: 50,
    photoUrl: '/almir.webp'
  },
  {
    id: 'b2',
    name: 'ADRIANO',
    bio: 'Mestre em degrades, texturas e desenhos artísticos.',
    rating: 5.0,
    isActive: true,
    branch: 'PT',
    compensationType: 'percentage',
    compensationValue: 50,
    photoUrl: '/adriano.webp'
  }
];

export const demoSaaSBarbershops: SaaSBarbershop[] = [
  {
    id: 'shop-mister-navalha',
    name: 'MISTER NAVALHA',
    slug: 'mister-navalha-guarda',
    tagline: 'Cortes nobres, barba de respeito & tradição',
    unit: 'GUARDA',
    city: 'Guarda',
    country: 'Portugal',
    address: 'Av. Coronel Orlindo de Carvalho, 42',
    phone: '+351 925 112 334',
    plan: 'pro',
    planStatus: 'active',
    trialDaysLeft: 22,
    monthlyFee: 59.00,
    rating: 4.9,
    quietServiceEnabled: true,
    cashFlowBalance: 3840.50
  },
  {
    id: 'shop-sherlocks',
    name: 'SHERLOCKS BARBER CLUB',
    slug: 'sherlocks-lisboa',
    tagline: 'O clube exclusivo para o homem moderno',
    unit: 'LISBOA',
    city: 'Lisboa',
    country: 'Portugal',
    address: 'Rua Principal, 123, Chiado',
    phone: '+351 912 345 678',
    plan: 'enterprise',
    planStatus: 'active',
    trialDaysLeft: 30,
    monthlyFee: 99.00,
    rating: 5.0,
    quietServiceEnabled: true,
    cashFlowBalance: 7120.00
  },
  {
    id: 'shop-seu-elias',
    name: 'BARBEARIA SEU ELIAS',
    slug: 'seu-elias-prime',
    tagline: 'Barba, Cabelo & Bigode com alto padrão e estilo',
    unit: 'PRIME',
    city: 'Porto',
    country: 'Portugal',
    address: 'Avenida dos Aliados, 88',
    phone: '+351 933 888 123',
    plan: 'pro',
    planStatus: 'active',
    trialDaysLeft: 18,
    monthlyFee: 59.00,
    rating: 4.9,
    quietServiceEnabled: true,
    cashFlowBalance: 5290.00
  }
];

export const demoSaaSPlans: SaaSPlan[] = [
  {
    id: 'plan-starter',
    name: 'Starter Barber',
    description: 'Perfeito para barbearias individuais ou profissionais autônomos.',
    priceMonthly: 29.00,
    priceYearly: 24.00,
    maxBarbers: 2,
    features: [
      'App do Cliente PWA exclusivo com link próprio',
      'Agendamento Online 24h sem sobreposição',
      'Fluxo de Caixa básico (entradas e saídas)',
      'Controle de até 2 Barbeiros',
      'Lembretes de agendamento'
    ]
  },
  {
    id: 'plan-pro',
    name: 'Pro Barber SaaS',
    badge: 'MAIS POPULAR',
    description: 'Para barbearias em crescimento que buscam gestão financeira e alta taxa de fidelidade.',
    priceMonthly: 59.00,
    priceYearly: 49.00,
    maxBarbers: 6,
    popular: true,
    features: [
      'Tudo do Starter, mais:',
      'Fluxo de Caixa Completo com DRE e Gráficos',
      'Cálculo Automático de Comissões por Barbeiro',
      'Upsell no Agendamento (Venda de Produtos Cera, Óleo, Minoxidil)',
      'Modo Quiet Service (Atendimento em silêncio)',
      'Controle de até 6 Barbeiros com metas',
      'Suporte prioritário via WhatsApp'
    ]
  },
  {
    id: 'plan-enterprise',
    name: 'Império & Redes',
    badge: 'COMPLETO',
    description: 'Para grandes barbearias, redes ou franquias que exigem escala e gestão multi-unidade.',
    priceMonthly: 99.00,
    priceYearly: 79.00,
    maxBarbers: 99,
    features: [
      'Barbeiros e Cadeiras Ilimitados',
      'Gestão Multi-Unidades / Franquias',
      'Fluxo de Caixa Consolidado por Unidade',
      'Domínio Próprio ou Subdomínio Personalizado',
      'Integrações com gateways de pagamento locais',
      'Gerente de Contas dedicado 24/7'
    ]
  }
];

const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

export const demoAppointments: Appointment[] = [
  {
    id: 'a1',
    customerId: 'demo-customer',
    barberId: 'b-ernando',
    serviceId: 's1',
    date: today,
    time: '14:30',
    status: 'confirmed',
    paymentMethod: 'mbway',
    paymentStatus: 'pending',
    branch: 'PT',
    barbershopId: 'shop-mister-navalha',
    quietService: true,
    notes: 'Preferência por degradê baixo com navalha.',
    selectedProducts: [
      { productId: 'p1', name: 'CERA', price: 15.00, quantity: 1 }
    ],
    totalAmount: 27.00,
    createdAt: Date.now() - 3600000
  },
  {
    id: 'a2',
    customerId: 'demo-customer',
    barberId: 'b1',
    serviceId: 's5',
    date: yesterday,
    time: '10:00',
    status: 'completed',
    paymentMethod: 'local',
    paymentStatus: 'paid',
    branch: 'PT',
    barbershopId: 'shop-mister-navalha',
    quietService: false,
    selectedProducts: [],
    totalAmount: 18.00,
    createdAt: Date.now() - 86400000
  }
];

export const demoCashFlowTransactions: CashFlowTransaction[] = [
  {
    id: 'tx-1',
    barbershopId: 'shop-mister-navalha',
    type: 'income',
    category: 'service',
    description: 'Corte + Barba (Cliente Tiago Mendes)',
    amount: 18.00,
    date: today,
    paymentMethod: 'mbway',
    barberId: 'b-ernando',
    barberName: 'ERNANDO SILVA',
    createdAt: Date.now() - 7200000
  },
  {
    id: 'tx-2',
    barbershopId: 'shop-mister-navalha',
    type: 'income',
    category: 'product',
    description: 'Venda de Produto: Cera Modeladora Fixação Forte',
    amount: 15.00,
    date: today,
    paymentMethod: 'cash',
    createdAt: Date.now() - 6500000
  },
  {
    id: 'tx-3',
    barbershopId: 'shop-mister-navalha',
    type: 'expense',
    category: 'commission',
    description: 'Comissão Ernando Silva (50% sobre Corte + Barba)',
    amount: 9.00,
    date: today,
    paymentMethod: 'transfer',
    barberId: 'b-ernando',
    barberName: 'ERNANDO SILVA',
    createdAt: Date.now() - 7100000
  },
  {
    id: 'tx-4',
    barbershopId: 'shop-mister-navalha',
    type: 'income',
    category: 'service',
    description: 'Corte Masculino Degradê (Cliente André Costa)',
    amount: 12.00,
    date: today,
    paymentMethod: 'card',
    barberId: 'b1',
    barberName: 'ALMIR',
    createdAt: Date.now() - 14000000
  },
  {
    id: 'tx-5',
    barbershopId: 'shop-mister-navalha',
    type: 'expense',
    category: 'commission',
    description: 'Comissão Almir (50% sobre Corte)',
    amount: 6.00,
    date: today,
    paymentMethod: 'transfer',
    barberId: 'b1',
    barberName: 'ALMIR',
    createdAt: Date.now() - 13900000
  },
  {
    id: 'tx-6',
    barbershopId: 'shop-mister-navalha',
    type: 'income',
    category: 'product',
    description: 'Venda de Produto: Minoxidil Fortalecimento Capilar',
    amount: 25.00,
    date: yesterday,
    paymentMethod: 'mbway',
    createdAt: Date.now() - 95000000
  },
  {
    id: 'tx-7',
    barbershopId: 'shop-mister-navalha',
    type: 'expense',
    category: 'supplies',
    description: 'Compra de Lâminas descartáveis, álcool e capas descartáveis',
    amount: 45.00,
    date: yesterday,
    paymentMethod: 'card',
    createdAt: Date.now() - 100000000
  },
  {
    id: 'tx-8',
    barbershopId: 'shop-mister-navalha',
    type: 'expense',
    category: 'utilities',
    description: 'Fatura de Eletricidade & Água (Mensalidade)',
    amount: 120.00,
    date: yesterday,
    paymentMethod: 'transfer',
    createdAt: Date.now() - 105000000
  }
];

export const demoCompanySettings = {
  id: 'default',
  companyName: 'MISTER NAVALHA',
  nif: '123456789',
  address: 'Av. Coronel Orlindo de Carvalho, 42, Guarda',
  phone: '+351 925 112 334',
  ownerName: 'Ernando Silva & Gestores',
  updatedAt: Date.now()
};

