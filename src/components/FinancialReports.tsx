import React, { useState, useEffect, useMemo } from 'react';
import { cashFlowService } from '../services/cashFlowService';
import { appointmentService } from '../services/appointmentService';
import { firestoreService } from '../services/firestoreService';
import { saasService } from '../services/saasService';
import { CashFlowTransaction, Barber, Service, Appointment } from '../models';
import { isBarberOwner } from '../utils/commissionUtils';
import {
  TrendingUp, TrendingDown, DollarSign, Wallet, Calendar, Download,
  Printer, Scissors, Award, CheckCircle2, ChevronRight, BarChart3,
  Package, Users, Filter, Sparkles, AlertCircle
} from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, subMonths, isSameDay, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FinancialReportsProps {
  barbers: Barber[];
  services?: Service[];
  barbershopName?: string;
  barbershopId?: string;
}

type PeriodType = 'daily' | 'weekly' | 'quarterly';

export default function FinancialReports({
  barbers,
  services: propServices,
  barbershopName = "Roger'X BarberShop",
  barbershopId
}: FinancialReportsProps) {
  const [period, setPeriod] = useState<PeriodType>('weekly');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [transactions, setTransactions] = useState<CashFlowTransaction[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>(propServices || []);
  const [isLoading, setIsLoading] = useState(true);

  // Load data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const activeShopId = barbershopId || saasService.getActiveBarbershop().id;
      const [txs, appts, srvs] = await Promise.all([
        cashFlowService.getTransactions(activeShopId),
        appointmentService.getAllAppointments(activeShopId),
        propServices && propServices.length > 0 ? Promise.resolve(propServices) : firestoreService.getServices()
      ]);
      setTransactions(txs);
      setAppointments(appts);
      setServices(srvs);
    } catch (err) {
      console.error('Erro ao carregar dados do relatório financeiro:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [barbershopId]);

  // Date ranges
  const today = useMemo(() => new Date(), []);
  
  // Filtered transactions and appointments based on period
  const { filteredTransactions, filteredAppointments, periodLabel } = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    if (period === 'daily') {
      const targetDate = selectedDate || todayStr;
      const txs = transactions.filter(t => t.date === targetDate);
      const appts = appointments.filter(a => a.date === targetDate && a.status === 'completed');
      
      const [y, m, d] = targetDate.split('-').map(Number);
      const dateObj = new Date(y, (m || 1) - 1, d || 1);
      const dayName = format(dateObj, "EEEE, d 'de' MMMM", { locale: ptBR });
      
      return {
        filteredTransactions: txs,
        filteredAppointments: appts,
        periodLabel: `Diário: ${dayName}`
      };
    }

    if (period === 'weekly') {
      const weekStart = subDays(today, 6); // Last 7 days
      const txs = transactions.filter(t => {
        try {
          const [y, m, d] = t.date.split('-').map(Number);
          const dt = new Date(y, m - 1, d);
          return dt >= weekStart && dt <= today;
        } catch {
          return false;
        }
      });
      const appts = appointments.filter(a => {
        if (a.status !== 'completed') return false;
        try {
          const [y, m, d] = a.date.split('-').map(Number);
          const dt = new Date(y, m - 1, d);
          return dt >= weekStart && dt <= today;
        } catch {
          return false;
        }
      });

      return {
        filteredTransactions: txs,
        filteredAppointments: appts,
        periodLabel: `Últimos 7 dias (${format(weekStart, 'dd/MM')} a ${format(today, 'dd/MM')})`
      };
    }

    // Quarterly (Last 3 months: M-2, M-1, Current)
    const quarterStart = subMonths(today, 3);
    const txs = transactions.filter(t => {
      try {
        const [y, m, d] = t.date.split('-').map(Number);
        const dt = new Date(y, m - 1, d);
        return dt >= quarterStart && dt <= today;
      } catch {
        return false;
      }
    });
    const appts = appointments.filter(a => {
      if (a.status !== 'completed') return false;
      try {
        const [y, m, d] = a.date.split('-').map(Number);
        const dt = new Date(y, m - 1, d);
        return dt >= quarterStart && dt <= today;
      } catch {
        return false;
      }
    });

    return {
      filteredTransactions: txs,
      filteredAppointments: appts,
      periodLabel: `Trimestral (Últimos 3 Meses • ${format(quarterStart, 'MMM/yy', { locale: ptBR })} a ${format(today, 'MMM/yy', { locale: ptBR })})`
    };
  }, [period, selectedDate, transactions, appointments, today]);

  // Core Financial Aggregates
  const financialTotals = useMemo(() => {
    // Income
    const grossRevenue = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const serviceIncome = filteredTransactions
      .filter(t => t.type === 'income' && t.category === 'service')
      .reduce((sum, t) => sum + t.amount, 0);

    const productIncome = filteredTransactions
      .filter(t => t.type === 'income' && t.category === 'product')
      .reduce((sum, t) => sum + t.amount, 0);

    // Commissions (Expenses with category 'commission')
    const totalCommissions = filteredTransactions
      .filter(t => t.type === 'expense' && t.category === 'commission')
      .reduce((sum, t) => sum + t.amount, 0);

    // Operational expenses (excluding commissions)
    const operationalExpenses = filteredTransactions
      .filter(t => t.type === 'expense' && t.category !== 'commission')
      .reduce((sum, t) => sum + t.amount, 0);

    // Net Revenue = Gross Revenue - Commissions - Operational Expenses
    const netRevenue = grossRevenue - totalCommissions - operationalExpenses;

    const completedCount = filteredAppointments.length;
    const averageTicket = completedCount > 0 ? parseFloat((grossRevenue / completedCount).toFixed(2)) : 0;

    return {
      grossRevenue: parseFloat(grossRevenue.toFixed(2)),
      serviceIncome: parseFloat(serviceIncome.toFixed(2)),
      productIncome: parseFloat(productIncome.toFixed(2)),
      totalCommissions: parseFloat(totalCommissions.toFixed(2)),
      operationalExpenses: parseFloat(operationalExpenses.toFixed(2)),
      netRevenue: parseFloat(netRevenue.toFixed(2)),
      completedCount,
      averageTicket
    };
  }, [filteredTransactions, filteredAppointments]);

  // Top Services Ranking
  const topServices = useMemo(() => {
    const serviceMap = new Map<string, { serviceName: string; count: number; totalRevenue: number }>();

    filteredAppointments.forEach(appt => {
      const srv = services.find(s => s.id === appt.serviceId);
      const srvName = srv ? srv.name : 'Serviço Personalizado';
      const srvPrice = srv ? srv.price : (appt.totalAmount || 15);

      const existing = serviceMap.get(appt.serviceId) || { serviceName: srvName, count: 0, totalRevenue: 0 };
      existing.count += 1;
      existing.totalRevenue += srvPrice;
      serviceMap.set(appt.serviceId, existing);
    });

    const list = Array.from(serviceMap.values());
    list.sort((a, b) => b.count - a.count || b.totalRevenue - a.totalRevenue);
    return list;
  }, [filteredAppointments, services]);

  // Barbers Performance & MVP
  const barbersPerformance = useMemo(() => {
    return barbers.map(barber => {
      const isOwner = isBarberOwner(barber);
      const barberAppts = filteredAppointments.filter(a => a.barberId === barber.id);
      const cutsCount = barberAppts.length;

      // Gross generated by this barber
      const incomeTxs = filteredTransactions.filter(t => t.barberId === barber.id && t.type === 'income');
      const grossGenerated = incomeTxs.reduce((sum, t) => sum + t.amount, 0);

      // Commissions generated for this barber
      const commTxs = filteredTransactions.filter(t => t.barberId === barber.id && t.category === 'commission');
      const totalCommission = commTxs.reduce((sum, t) => sum + t.amount, 0);

      // Net left for the shop from this barber
      const shopRetained = grossGenerated - totalCommission;

      return {
        barber,
        isOwner,
        cutsCount,
        grossGenerated: parseFloat(grossGenerated.toFixed(2)),
        totalCommission: parseFloat(totalCommission.toFixed(2)),
        shopRetained: parseFloat(shopRetained.toFixed(2)),
      };
    }).sort((a, b) => b.cutsCount - a.cutsCount || b.grossGenerated - a.grossGenerated);
  }, [barbers, filteredAppointments, filteredTransactions]);

  const topBarber = barbersPerformance.length > 0 && barbersPerformance[0].cutsCount > 0 ? barbersPerformance[0] : null;

  // Monthly breakdown for Quarterly view
  const quarterlyMonths = useMemo(() => {
    if (period !== 'quarterly') return [];
    
    const months = [0, 1, 2].map(offset => {
      const targetMonthDate = subMonths(today, 2 - offset);
      const monthYearStr = format(targetMonthDate, 'yyyy-MM');
      const monthLabel = format(targetMonthDate, 'MMMM yyyy', { locale: ptBR });

      const txsInMonth = transactions.filter(t => t.date.startsWith(monthYearStr));
      const gross = txsInMonth.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const comms = txsInMonth.filter(t => t.type === 'expense' && t.category === 'commission').reduce((sum, t) => sum + t.amount, 0);
      const expenses = txsInMonth.filter(t => t.type === 'expense' && t.category !== 'commission').reduce((sum, t) => sum + t.amount, 0);
      const net = gross - comms - expenses;
      const apptsCount = appointments.filter(a => a.date.startsWith(monthYearStr) && a.status === 'completed').length;

      return {
        monthLabel: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
        monthYearStr,
        gross: parseFloat(gross.toFixed(2)),
        comms: parseFloat(comms.toFixed(2)),
        expenses: parseFloat(expenses.toFixed(2)),
        net: parseFloat(net.toFixed(2)),
        apptsCount
      };
    });

    return months;
  }, [period, transactions, appointments, today]);

  // Last 7 days breakdown for Weekly view
  const weeklyDays = useMemo(() => {
    if (period !== 'weekly') return [];

    return Array.from({ length: 7 }).map((_, i) => {
      const dayDate = subDays(today, 6 - i);
      const dateStr = format(dayDate, 'yyyy-MM-dd');
      const dayName = format(dayDate, 'EEE (dd)', { locale: ptBR });

      const dayTxs = filteredTransactions.filter(t => t.date === dateStr);
      const gross = dayTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const comms = dayTxs.filter(t => t.type === 'expense' && t.category === 'commission').reduce((sum, t) => sum + t.amount, 0);
      const net = gross - comms;
      const cuts = filteredAppointments.filter(a => a.date === dateStr).length;

      return {
        dateStr,
        dayName,
        gross: parseFloat(gross.toFixed(2)),
        comms: parseFloat(comms.toFixed(2)),
        net: parseFloat(net.toFixed(2)),
        cuts
      };
    });
  }, [period, filteredTransactions, filteredAppointments, today]);

  // Export CSV
  const handleExportCSV = () => {
    const rows = [
      ['RELATÓRIO FINANCEIRO - ROGER\'X BARBERSHOP'],
      ['Período:', periodLabel],
      ['Data de Emissão:', format(new Date(), 'dd/MM/yyyy HH:mm')],
      [''],
      ['RESUMO CONSOLIDADO'],
      ['Métrica', 'Valor (€)'],
      ['Faturamento Bruto', financialTotals.grossRevenue.toFixed(2)],
      ['Receita de Serviços', financialTotals.serviceIncome.toFixed(2)],
      ['Receita de Produtos', financialTotals.productIncome.toFixed(2)],
      ['Total de Comissões Barbeiros', financialTotals.totalCommissions.toFixed(2)],
      ['Despesas Operacionais', financialTotals.operationalExpenses.toFixed(2)],
      ['Faturamento Líquido (Caixa Real da Casa)', financialTotals.netRevenue.toFixed(2)],
      ['Atendimentos Realizados', financialTotals.completedCount.toString()],
      ['Ticket Médio', financialTotals.averageTicket.toFixed(2)],
      [''],
      ['DESEMPENHO DOS BARBEIROS'],
      ['Barbeiro', 'Tipo', 'Atendimentos', 'Faturamento Bruto (€)', 'Comissão (€)', 'Líquido Casa (€)'],
      ...barbersPerformance.map(b => [
        b.barber.name,
        b.isOwner ? 'Proprietário (100% Casa)' : 'Contratado (55% / 70%)',
        b.cutsCount.toString(),
        b.grossGenerated.toFixed(2),
        b.totalCommission.toFixed(2),
        b.shopRetained.toFixed(2)
      ]),
      [''],
      ['SERVIÇOS MAIS VENDIDOS'],
      ['Serviço', 'Quantidade', 'Total Gerado (€)'],
      ...topServices.map(s => [s.serviceName, s.count.toString(), s.totalRevenue.toFixed(2)]),
      [''],
      ['DETALHAMENTO DE TRANSAÇÕES'],
      ['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor (€)', 'Método', 'Barbeiro'],
      ...filteredTransactions.map(t => [
        t.date,
        t.type === 'income' ? 'Entrada' : 'Saída',
        t.category,
        `"${t.description.replace(/"/g, '""')}"`,
        t.amount.toFixed(2),
        t.paymentMethod,
        t.barberName || '-'
      ])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map(e => e.join(';')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio-financeiro-${period}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print PDF
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header with Period Tabs & Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-zinc-900 text-white p-6 rounded-3xl border border-zinc-800 shadow-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#d4a338] animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#d4a338]">Auditoria & Gestão Executiva</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Relatórios Financeiros</h2>
          <p className="text-zinc-400 text-sm mt-1">
            Métricas de faturamento bruto, cálculo dinâmico de comissões (55% Seg-Sáb / 70% Dom) e caixa líquido da {barbershopName}.
          </p>
        </div>

        {/* Period Selector & Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Period Tabs */}
          <div className="flex bg-zinc-800 p-1 rounded-2xl border border-zinc-700">
            <button
              onClick={() => setPeriod('daily')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                period === 'daily' ? 'bg-[#d4a338] text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Diário
            </button>
            <button
              onClick={() => setPeriod('weekly')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                period === 'weekly' ? 'bg-[#d4a338] text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Semanal
            </button>
            <button
              onClick={() => setPeriod('quarterly')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                period === 'quarterly' ? 'bg-[#d4a338] text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Trimestral
            </button>
          </div>

          {/* Export & Print */}
          <button
            onClick={handleExportCSV}
            title="Exportar planilha Excel/CSV"
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs sm:text-sm font-semibold rounded-xl border border-zinc-700 transition-colors shadow-sm"
          >
            <Download size={15} />
            <span className="hidden sm:inline">CSV</span>
          </button>

          <button
            onClick={handlePrint}
            title="Imprimir Resumo Executivo"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-zinc-100 text-zinc-900 text-xs sm:text-sm font-bold rounded-xl transition-colors shadow-sm"
          >
            <Printer size={15} />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* Daily Date Picker when in Daily mode */}
      {period === 'daily' && (
        <div className="flex items-center justify-between bg-zinc-50 p-4 rounded-2xl border border-zinc-200">
          <div className="flex items-center gap-3">
            <Calendar size={18} className="text-[#d4a338]" />
            <span className="text-sm font-bold text-zinc-900">Selecione o Dia para Análise:</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 bg-white border border-zinc-300 rounded-xl text-sm font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#d4a338]"
            />
            <button
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="px-3 py-1.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 text-xs font-bold rounded-xl transition-colors"
            >
              Hoje
            </button>
          </div>
        </div>
      )}

      {/* Current Period Badge */}
      <div className="flex items-center justify-between text-xs text-zinc-500 px-1">
        <span className="font-semibold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5">
          <Filter size={13} className="text-[#d4a338]" />
          Visualizando: <strong className="text-zinc-900">{periodLabel}</strong>
        </span>
        <span>Atualizado em tempo real</span>
      </div>

      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Faturamento Bruto</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-zinc-900 tracking-tight">
            € {financialTotals.grossRevenue.toFixed(2)}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-zinc-500">
            <span>Serviços: € {financialTotals.serviceIncome.toFixed(2)}</span>
            <span>•</span>
            <span>Produtos: € {financialTotals.productIncome.toFixed(2)}</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500"></div>
        </div>

        {/* Total Commissions */}
        <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Comissões Barbeiros</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-[#d4a338] flex items-center justify-center font-bold">
              <Scissors size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-600 tracking-tight">
            € {financialTotals.totalCommissions.toFixed(2)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-zinc-500">
            <span className="font-medium">55% Seg-Sáb • 70% Domingo</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#d4a338]"></div>
        </div>

        {/* Net Revenue (Real Cash in Box) */}
        <div className="bg-zinc-900 text-white p-5 rounded-3xl border border-zinc-800 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#d4a338]">Faturamento Líquido</span>
            <div className="w-8 h-8 rounded-xl bg-zinc-800 text-emerald-400 flex items-center justify-center font-bold">
              <Wallet size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-400 tracking-tight">
            € {financialTotals.netRevenue.toFixed(2)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-zinc-400">
            <span>Caixa Real do Estabelecimento</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-400"></div>
        </div>

        {/* Volume & Ticket */}
        <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Atendimentos & Ticket</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Users size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-black text-zinc-900 tracking-tight">
              {financialTotals.completedCount}
            </div>
            <span className="text-xs font-semibold text-zinc-500">cortes</span>
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs text-zinc-500">
            <span>Ticket Médio: <strong className="text-zinc-900">€ {financialTotals.averageTicket.toFixed(2)}</strong></span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500"></div>
        </div>
      </div>

      {/* Owner Exemption Notice Card */}
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
        <AlertCircle size={20} className="text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <strong>Regra de Negócio Roger'X:</strong> O Proprietário/Dono (Roger) não recebe comissão sobre os serviços prestados; 100% da receita gerada por ele fica retida no faturamento líquido da barbearia. Barbeiros contratados recebem automaticamente <strong>55% de segunda a sábado</strong> e <strong>70% aos domingos</strong>.
        </div>
      </div>

      {/* Visual Charts / Comparative Breakdown depending on Period */}
      {period === 'weekly' && weeklyDays.length > 0 && (
        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
          <h3 className="text-base font-bold text-zinc-900 mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-[#d4a338]" />
            Comparativo Diário dos Últimos 7 Dias
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {weeklyDays.map((day, idx) => {
              const hasMovement = day.gross > 0;
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl border transition-all text-center ${
                    hasMovement ? 'bg-zinc-50 border-zinc-200 hover:border-[#d4a338]' : 'bg-white border-zinc-100 opacity-60'
                  }`}
                >
                  <span className="text-xs font-bold text-zinc-500 block uppercase">{day.dayName}</span>
                  <div className="text-lg font-black text-zinc-900 mt-1">€ {day.gross.toFixed(2)}</div>
                  <div className="text-[11px] text-amber-600 font-semibold mt-0.5">
                    Comissão: € {day.comms.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-emerald-600 font-bold mt-0.5">
                    Líquido: € {day.net.toFixed(2)}
                  </div>
                  <div className="mt-2 text-[10px] text-zinc-400 bg-zinc-200/60 py-0.5 rounded-md font-medium">
                    {day.cuts} atendimento{day.cuts === 1 ? '' : 's'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {period === 'quarterly' && quarterlyMonths.length > 0 && (
        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
          <h3 className="text-base font-bold text-zinc-900 mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-[#d4a338]" />
            Evolução Mensal do Trimestre
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quarterlyMonths.map((m, idx) => (
              <div key={idx} className="bg-zinc-50 p-5 rounded-2xl border border-zinc-200 relative overflow-hidden">
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">{m.monthLabel}</div>
                <div className="text-2xl font-black text-zinc-900">€ {m.gross.toFixed(2)}</div>
                <p className="text-xs text-zinc-400 mt-0.5 font-medium">{m.apptsCount} atendimentos concluídos</p>

                <div className="mt-4 pt-3 border-t border-zinc-200/70 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Repasse Comissões:</span>
                    <span className="font-bold text-amber-600">€ {m.comms.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Despesas Operacionais:</span>
                    <span className="font-bold text-red-600">€ {m.expenses.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-zinc-200 text-sm">
                    <span className="font-bold text-zinc-800">Líquido Casa:</span>
                    <span className="font-black text-emerald-600">€ {m.net.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dual Column: Top Services Ranking + Barbers Volume MVP */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Services */}
        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <Scissors size={18} className="text-[#d4a338]" />
                Serviços Mais Vendidos
              </h3>
              <span className="text-xs text-zinc-400 font-semibold">{topServices.length} serviços realizados</span>
            </div>

            {topServices.length === 0 ? (
              <div className="py-8 text-center text-sm text-zinc-400">
                Nenhum serviço registrado neste período.
              </div>
            ) : (
              <div className="space-y-3">
                {topServices.slice(0, 5).map((service, index) => {
                  const maxCount = topServices[0]?.count || 1;
                  const percentage = Math.round((service.count / maxCount) * 100);

                  return (
                    <div key={index} className="p-3 rounded-2xl bg-zinc-50 border border-zinc-100 hover:border-zinc-200 transition-all">
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                            index === 0 ? 'bg-[#d4a338] text-zinc-950' : 'bg-zinc-200 text-zinc-700'
                          }`}>
                            {index + 1}
                          </span>
                          <span className="font-bold text-zinc-900">{service.serviceName}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-zinc-900">€ {service.totalRevenue.toFixed(2)}</span>
                          <span className="text-xs text-zinc-500 ml-1">({service.count}x)</span>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-zinc-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#d4a338] h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
            <span>Ticket médio dos serviços: € {financialTotals.averageTicket.toFixed(2)}</span>
            <span className="font-semibold text-emerald-600">Alta rentabilidade</span>
          </div>
        </div>

        {/* Barbers Volume MVP / Performance Ranking */}
        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <Award size={18} className="text-[#d4a338]" />
                Volume de Atendimentos por Barbeiro
              </h3>
              <span className="text-xs text-zinc-400 font-semibold">{barbers.length} profissionais</span>
            </div>

            {/* Top Barber Highlight Card */}
            {topBarber && (
              <div className="mb-4 p-4 rounded-2xl bg-zinc-950 text-white border border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#d4a338] text-zinc-950 flex items-center justify-center font-black text-lg overflow-hidden border-2 border-[#d4a338]">
                    {topBarber.barber.photoUrl ? (
                      <img src={topBarber.barber.photoUrl} alt={topBarber.barber.name} className="w-full h-full object-cover" />
                    ) : (
                      topBarber.barber.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#d4a338]">Barbeiro Destaque</span>
                      {topBarber.isOwner && (
                        <span className="px-1.5 py-0.5 bg-amber-900/60 text-amber-300 text-[10px] font-bold rounded">Dono</span>
                      )}
                    </div>
                    <div className="text-base font-black text-white">{topBarber.barber.name}</div>
                    <div className="text-xs text-zinc-400">
                      {topBarber.cutsCount} atendimentos realizados
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-zinc-400">Faturamento</div>
                  <div className="text-lg font-black text-[#d4a338]">€ {topBarber.grossGenerated.toFixed(2)}</div>
                  <div className="text-[11px] text-zinc-400">
                    Comissão: € {topBarber.totalCommission.toFixed(2)}
                  </div>
                </div>
              </div>
            )}

            {/* List of all barbers */}
            <div className="space-y-2">
              {barbersPerformance.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-100 text-sm">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 text-xs font-bold text-zinc-400">#{idx + 1}</span>
                    <div>
                      <div className="font-bold text-zinc-900 flex items-center gap-1.5">
                        {item.barber.name}
                        {item.isOwner && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-zinc-200 text-zinc-700 rounded-md">
                            Proprietário
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {item.cutsCount} corte{item.cutsCount === 1 ? '' : 's'} concluído{item.cutsCount === 1 ? '' : 's'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-black text-zinc-900">€ {item.grossGenerated.toFixed(2)}</div>
                    <div className="text-xs text-amber-600 font-semibold">
                      Comissão: € {item.totalCommission.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-100 text-xs text-zinc-400">
            A comissão dos barbeiros contratados é liquidada periodicamente conforme fechamento do turno.
          </div>
        </div>
      </div>

      {/* Detailed Transactions List of the Period */}
      <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-zinc-900">Extrato Consolidado do Período</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Todas as entradas, saídas operacionais e provisões de comissão</p>
          </div>
          <span className="text-xs font-bold text-zinc-500 bg-zinc-100 px-3 py-1 rounded-full">
            {filteredTransactions.length} lançamentos
          </span>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="py-8 text-center text-sm text-zinc-400">
            Nenhuma transação financeira registrada neste intervalo.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Data</th>
                  <th className="pb-3 font-semibold">Descrição</th>
                  <th className="pb-3 font-semibold">Categoria</th>
                  <th className="pb-3 font-semibold">Barbeiro / Origem</th>
                  <th className="pb-3 font-semibold">Método</th>
                  <th className="pb-3 font-semibold text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredTransactions.map((tx) => {
                  const isIncome = tx.type === 'income';
                  const isCommission = tx.category === 'commission';

                  return (
                    <tr key={tx.id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="py-3 text-xs text-zinc-500 whitespace-nowrap">
                        {tx.date}
                      </td>
                      <td className="py-3 font-medium text-zinc-900">
                        {tx.description}
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          isIncome ? 'bg-emerald-50 text-emerald-700' :
                          isCommission ? 'bg-amber-50 text-amber-700' :
                          'bg-red-50 text-red-700'
                        }`}>
                          {tx.category === 'service' ? 'Serviço' :
                           tx.category === 'product' ? 'Produto' :
                           tx.category === 'commission' ? 'Comissão' :
                           tx.category === 'supplies' ? 'Insumos' :
                           tx.category === 'rent' ? 'Aluguel' : 'Despesa'}
                        </span>
                      </td>
                      <td className="py-3 text-xs text-zinc-600">
                        {tx.barberName || '-'}
                      </td>
                      <td className="py-3 text-xs uppercase font-semibold text-zinc-500">
                        {tx.paymentMethod}
                      </td>
                      <td className={`py-3 text-right font-black ${
                        isIncome ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {isIncome ? '+ ' : '- '}€ {tx.amount.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Print Layout Styling (Only triggered when printing) */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-report-section, #print-report-section * {
            visibility: visible;
          }
          #print-report-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>

      {/* Hidden container specifically for clean print */}
      <div id="print-report-section" className="hidden print:block p-8 bg-white text-black">
        <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black">{barbershopName}</h1>
            <p className="text-sm">Relatório Financeiro & Comissões Executivo</p>
          </div>
          <div className="text-right text-xs">
            <p><strong>Período:</strong> {periodLabel}</p>
            <p><strong>Emissão:</strong> {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6 border border-zinc-300 p-4 rounded">
          <div>
            <p className="text-xs uppercase text-zinc-600">Faturamento Bruto</p>
            <p className="text-xl font-bold">€ {financialTotals.grossRevenue.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-zinc-600">Comissões Barbeiros</p>
            <p className="text-xl font-bold">€ {financialTotals.totalCommissions.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-zinc-600">Faturamento Líquido (Caixa)</p>
            <p className="text-xl font-bold text-emerald-800">€ {financialTotals.netRevenue.toFixed(2)}</p>
          </div>
        </div>

        <h3 className="font-bold text-sm mb-2 uppercase">Desempenho dos Profissionais</h3>
        <table className="w-full text-xs border-collapse border border-zinc-300 mb-6">
          <thead>
            <tr className="bg-zinc-100">
              <th className="border border-zinc-300 p-2 text-left">Barbeiro</th>
              <th className="border border-zinc-300 p-2 text-center">Atendimentos</th>
              <th className="border border-zinc-300 p-2 text-right">Bruto (€)</th>
              <th className="border border-zinc-300 p-2 text-right">Comissão (€)</th>
              <th className="border border-zinc-300 p-2 text-right">Líquido Casa (€)</th>
            </tr>
          </thead>
          <tbody>
            {barbersPerformance.map((b, i) => (
              <tr key={i}>
                <td className="border border-zinc-300 p-2 font-medium">
                  {b.barber.name} {b.isOwner ? '(Proprietário - Sem comissão)' : ''}
                </td>
                <td className="border border-zinc-300 p-2 text-center">{b.cutsCount}</td>
                <td className="border border-zinc-300 p-2 text-right">{b.grossGenerated.toFixed(2)}</td>
                <td className="border border-zinc-300 p-2 text-right">{b.totalCommission.toFixed(2)}</td>
                <td className="border border-zinc-300 p-2 text-right font-bold">{b.shopRetained.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="text-center text-xs text-zinc-500 pt-6 border-t border-zinc-300">
          Documento gerado para controle interno de caixa e conciliação de repasses aos profissionais.
        </div>
      </div>
    </div>
  );
}
