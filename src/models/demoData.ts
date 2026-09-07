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
    slug: 'mister-navalha',
    tagline: 'Cortes nobres, barba de respeito & tradição',
    unit: 'GUARDA',
    city: 'Guarda',
    country: 'Portugal',
    address: 'Av. Coronel Orlindo de Carvalho, 42',
    phone: '+351 925 112 334',
    plan: 'imperio',
    planStatus: 'active',
    trialDaysLeft: 22,
    monthlyFee: 99.00,
    rating: 4.9,
    primaryColor: '#d4a338',
    storyText: 'Desde 2018, a Mister Navalha revoluciona o cuidado masculino com ambiente vintage, navalha quente e produtos de barboterapia de alta performance.',
    quietServiceEnabled: true,
    cashFlowBalance: 3840.50,
    active: true
  },
  {
    id: 'shop-seu-elias',
    name: 'BARBEARIA SEU ELIAS',
    slug: 'seu-elias',
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
    primaryColor: '#f5ab2b',
    storyText: 'Barbeiro desde os 13 anos por influência familiar, Seu Elias sempre gostou de mudanças e desafios. Pioneiro no estilo sofisticado de barbearias.',
    quietServiceEnabled: true,
    cashFlowBalance: 5290.00,
    active: true
  },
  {
    id: 'shop-sherlocks',
    name: 'SHERLOCKS BARBER CLUB',
    slug: 'sherlocks',
    tagline: 'O clube exclusivo para o homem moderno',
    unit: 'CHIADO',
    city: 'Lisboa',
    country: 'Portugal',
    address: 'Rua Garrett, 120, Chiado',
    phone: '+351 912 345 678',
    plan: 'starter',
    planStatus: 'active',
    trialDaysLeft: 30,
    monthlyFee: 29.00,
    rating: 5.0,
    primaryColor: '#c99738',
    storyText: 'Inspirada nas barbearias londrinas do século XIX, a Sherlocks combina mistério, elegância britânica e cortes contemporâneos.',
    quietServiceEnabled: true,
    cashFlowBalance: 7120.00,
    active: true
  },
  {
    id: 'shop-rogerx',
    name: "ROGER'X BARBERSHOP",
    slug: 'rogerx-barbershop',
    tagline: 'Barber | Tattoos | Piercings | Formação de Barbeiros',
    unit: 'BELAS',
    city: 'Belas',
    country: 'Portugal',
    address: 'Belas, Sintra, Portugal',
    phone: '+351 910 000 123',
    plan: 'pro',
    planStatus: 'active',
    trialDaysLeft: 14,
    monthlyFee: 59.00,
    rating: 5.0,
    logoUrl: 'https://i.postimg.cc/pLGNWyw8/logo-roger-png.png',
    primaryColor: '#d4a338',
    storyText: 'Referência em Belas, Portugal. Especialistas em corte masculino contemporâneo, visagismo, arte capilar na lâmina, barboterapia relaxante, tattoos, piercings e formação de novos barbeiros profissionais.',
    quietServiceEnabled: true,
    cashFlowBalance: 4620.00,
    active: true
  }
];

export const demoSaaSPlans: SaaSPlan[] = [
  {
    id: 'plan-starter',
    name: 'Starter',
    badge: 'INDIVIDUAL',
    description: 'Perfeito para barbearias individuais ou profissionais autônomos.',
    priceMonthly: 29.00,
    priceYearly: 24.00,
    maxBarbers: 2,
    features: [
      'App do Cliente PWA exclusivo (/:slug próprio)',
      'Agendamento Online 24h sem sobreposição',
      'Fluxo de Caixa básico (entradas e saídas)',
      'Controle de até 2 Barbeiros',
      'Lembretes de agendamento automáticos'
    ]
  },
  {
    id: 'plan-pro',
    name: 'Pro',
    badge: 'MAIS POPULAR',
    description: 'Para barbearias em crescimento que buscam gestão financeira e alta fidelização.',
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
      'Programa de Fidelidade e Cashback'
    ]
  },
  {
    id: 'plan-imperio',
    name: 'Império',
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
  },
  // Roger'X BarberShop Real Team Appointments
  {
    id: 'rx-app-1',
    customerId: 'cust-rx-1',
    barberId: 'b-rogerx-roger',
    serviceId: 'rx-corte-barba',
    date: today,
    time: '10:00',
    status: 'confirmed',
    paymentMethod: 'mbway',
    paymentStatus: 'paid',
    branch: 'PT',
    barbershopId: 'shop-rogerx',
    quietService: false,
    notes: 'Degradê na navalha com barba alinhada.',
    totalAmount: 20.00,
    createdAt: Date.now() - 7200000
  },
  {
    id: 'rx-app-2',
    customerId: 'cust-rx-2',
    barberId: 'b-rogerx-roger',
    serviceId: 'rx-arte-capilar',
    date: today,
    time: '14:30',
    status: 'completed',
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    branch: 'PT',
    barbershopId: 'shop-rogerx',
    quietService: false,
    totalAmount: 5.00,
    createdAt: Date.now() - 3600000
  },
  {
    id: 'rx-app-3',
    customerId: 'cust-rx-3',
    barberId: 'b-rogerx-vitor',
    serviceId: 'rx-barboterapia',
    date: today,
    time: '11:30',
    status: 'confirmed',
    paymentMethod: 'mbway',
    paymentStatus: 'paid',
    branch: 'PT',
    barbershopId: 'shop-rogerx',
    quietService: true,
    notes: 'Cliente solicitou atendimento silencioso.',
    totalAmount: 20.00,
    createdAt: Date.now() - 5400000
  },
  {
    id: 'rx-app-4',
    customerId: 'cust-rx-4',
    barberId: 'b-rogerx-vitor',
    serviceId: 'rx-corte-pigmentacao',
    date: today,
    time: '16:00',
    status: 'completed',
    paymentMethod: 'local',
    paymentStatus: 'paid',
    branch: 'PT',
    barbershopId: 'shop-rogerx',
    quietService: false,
    totalAmount: 18.00,
    createdAt: Date.now() - 2800000
  },
  {
    id: 'rx-app-5',
    customerId: 'cust-rx-5',
    barberId: 'b-rogerx-fernando',
    serviceId: 'rx-corte',
    date: today,
    time: '13:00',
    status: 'confirmed',
    paymentMethod: 'multibanco',
    paymentStatus: 'pending',
    branch: 'PT',
    barbershopId: 'shop-rogerx',
    quietService: false,
    totalAmount: 13.00,
    createdAt: Date.now() - 4000000
  },
  {
    id: 'rx-app-6',
    customerId: 'cust-rx-6',
    barberId: 'b-rogerx-fernando',
    serviceId: 'rx-coloracao',
    date: today,
    time: '17:00',
    status: 'completed',
    paymentMethod: 'mbway',
    paymentStatus: 'paid',
    branch: 'PT',
    barbershopId: 'shop-rogerx',
    quietService: false,
    totalAmount: 30.00,
    createdAt: Date.now() - 1800000
  },
  {
    id: 'rx-app-7',
    customerId: 'cust-rx-7',
    barberId: 'b-rogerx-barbudo',
    serviceId: 'rx-pack-servicos',
    date: today,
    time: '15:00',
    status: 'confirmed',
    paymentMethod: 'mbway',
    paymentStatus: 'paid',
    branch: 'PT',
    barbershopId: 'shop-rogerx',
    quietService: false,
    notes: 'Pack VIP completo.',
    totalAmount: 30.00,
    createdAt: Date.now() - 3200000
  },
  {
    id: 'rx-app-8',
    customerId: 'cust-rx-8',
    barberId: 'b-rogerx-barbudo',
    serviceId: 'rx-barba',
    date: today,
    time: '18:30',
    status: 'completed',
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    branch: 'PT',
    barbershopId: 'shop-rogerx',
    quietService: false,
    totalAmount: 10.00,
    createdAt: Date.now() - 1000000
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

export const rogerXBarbers: Barber[] = [
  {
    id: 'b-rogerx-roger',
    name: 'Roger',
    bio: 'Master Barber & Fundador da Roger\'X. Especialista em visagismo, arte capilar e formação de novos profissionais.',
    rating: 5.0,
    isActive: true,
    branch: 'PT',
    compensationType: 'percentage',
    compensationValue: 60,
    photoUrl: 'https://i.postimg.cc/pLGNWyw8/logo-roger-png.png',
    companyId: 'shop-rogerx'
  },
  {
    id: 'b-rogerx-vitor',
    name: 'Vítor Bitrekas',
    bio: 'Barbeiro especialista em degradês de precisão milimétrica, barboterapia e cortes modernos.',
    rating: 5.0,
    isActive: true,
    branch: 'PT',
    compensationType: 'percentage',
    compensationValue: 50,
    photoUrl: 'https://i.postimg.cc/pLGNWyw8/logo-roger-png.png',
    companyId: 'shop-rogerx'
  },
  {
    id: 'b-rogerx-fernando',
    name: 'Fernando',
    bio: 'Barbeiro profissional com domínio em cortes clássicos, pigmentação capilar e navalha afiada.',
    rating: 5.0,
    isActive: true,
    branch: 'PT',
    compensationType: 'percentage',
    compensationValue: 50,
    photoUrl: 'https://i.postimg.cc/pLGNWyw8/logo-roger-png.png',
    companyId: 'shop-rogerx'
  },
  {
    id: 'b-rogerx-barbudo',
    name: 'Barbudo',
    bio: 'Barbeiro mestre em barboterapia com toalha quente, alinhamento de barba e tratamentos faciais.',
    rating: 5.0,
    isActive: true,
    branch: 'PT',
    compensationType: 'percentage',
    compensationValue: 50,
    photoUrl: 'https://i.postimg.cc/pLGNWyw8/logo-roger-png.png',
    companyId: 'shop-rogerx'
  }
];

export const rogerXServices: Service[] = [
  {
    id: 'rx-corte',
    name: 'Corte',
    description: 'Corte tradicional ou contemporâneo com acabamento na navalha e finalização de alto padrão.',
    price: 13.00,
    durationMinutes: 30,
    category: 'Cortes & Cabelo',
    companyId: 'shop-rogerx',
    isActive: true
  },
  {
    id: 'rx-barba',
    name: 'Barba',
    description: 'Alinhamento, toalha quente, navalha e hidratação com óleo especial para barba.',
    price: 10.00,
    durationMinutes: 20,
    category: 'Barba & Rosto',
    companyId: 'shop-rogerx',
    isActive: true
  },
  {
    id: 'rx-corte-barba',
    name: 'Corte e Barba',
    description: 'Combo completo de corte e barba com alinhamento na navalha e toalha quente relaxante.',
    price: 20.00,
    durationMinutes: 60,
    category: 'Combos & Packs',
    companyId: 'shop-rogerx',
    isActive: true
  },
  {
    id: 'rx-barboterapia',
    name: 'Barboterapia',
    description: 'Tratamento de alto padrão com toalha quente, esfoliação facial, hidratação profunda e massagem.',
    price: 20.00,
    durationMinutes: 40,
    category: 'Barba & Rosto',
    companyId: 'shop-rogerx',
    isActive: true
  },
  {
    id: 'rx-limpeza-pele',
    name: 'Limpeza de Pele',
    description: 'Higienização facial profunda com remoção de impurezas, cravos e máscara restauradora.',
    price: 15.00,
    durationMinutes: 30,
    category: 'Estética & Rosto',
    companyId: 'shop-rogerx',
    isActive: true
  },
  {
    id: 'rx-coloracao',
    name: 'Coloração',
    description: 'Procedimento químico completo de descoloração, platinado uniforme ou tingimento capilar.',
    price: 30.00,
    durationMinutes: 125,
    category: 'Cortes & Cabelo',
    companyId: 'shop-rogerx',
    isActive: true
  },
  {
    id: 'rx-arte-capilar',
    name: 'Arte Capilar',
    description: 'Desenhos artísticos, freestyle, riscos geométricos e alinhamentos milimétricos na lâmina.',
    price: 5.00,
    durationMinutes: 20,
    category: 'Cortes & Cabelo',
    companyId: 'shop-rogerx',
    isActive: true
  },
  {
    id: 'rx-sobrancelha',
    name: 'Design de Sobrancelha',
    description: 'Alinhamento facial, limpeza e desenho milimétrico na navalha ou pinça.',
    price: 5.00,
    durationMinutes: 15,
    category: 'Estética & Rosto',
    companyId: 'shop-rogerx',
    isActive: true
  },
  {
    id: 'rx-rapar',
    name: 'Rapar',
    description: 'Corte rente na máquina zero ou raspado com lâmina e loção pós-barba refrescante.',
    price: 5.00,
    durationMinutes: 15,
    category: 'Cortes & Cabelo',
    companyId: 'shop-rogerx',
    isActive: true
  },
  {
    id: 'rx-pack-servicos',
    name: 'Pack de Serviços',
    description: 'Experiência completa VIP na Roger\'X: corte, barba alinhada, tratamento facial e sobrancelha.',
    price: 30.00,
    durationMinutes: 80,
    category: 'Combos & Packs',
    companyId: 'shop-rogerx',
    isActive: true
  },
  {
    id: 'rx-corte-pigmentacao',
    name: 'Corte com Pigmentação',
    description: 'Corte degradê de alta definição acompanhado de pigmentação para destacar contornos e preenchimento.',
    price: 18.00,
    durationMinutes: 40,
    category: 'Cortes & Cabelo',
    companyId: 'shop-rogerx',
    isActive: true
  }
];

