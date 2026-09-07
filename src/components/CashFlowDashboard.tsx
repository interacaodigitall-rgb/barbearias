import React, { useState, useEffect } from 'react';
import { cashFlowService } from '../services/cashFlowService';
import { CashFlowTransaction, Barber } from '../models';
import { 
  TrendingUp, TrendingDown, DollarSign, Wallet, ArrowUpRight, ArrowDownLeft, 
  Plus, Calendar, Filter, Download, Trash2, CheckCircle2, User, CreditCard,
  PieChart, Scissors, Package
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CashFlowDashboardProps {
  barbers: Barber[];
  barbershopName?: string;
  barbershopId?: string;
}

export default function CashFlowDashboard({ barbers, barbershopName = 'MISTER NAVALHA', barbershopId }: CashFlowDashboardProps) {
  const [transactions, setTransactions] = useState<CashFlowTransaction[]>([]);
  const [metrics, setMetrics] = useState({
    totalIncome: 0,
    totalExpense: 0,
    netBalance: 0,
    commissionsTotal: 0,
    averageTicket: 0,
    totalTransactions: 0
  });
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'commission'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'income' | 'expense'>('expense');
  
  // New transaction form
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'supplies',
    paymentMethod: 'mbway' as 'cash' | 'mbway' | 'card' | 'transfer',
    date: new Date().toISOString().split('T')[0],
    barberId: ''
  });

  const loadData = async () => {
    const [txs, mets] = await Promise.all([
      cashFlowService.getTransactions(barbershopId),
      cashFlowService.getMetrics(barbershopId)
    ]);
    setTransactions(txs);
    setMetrics(mets);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount) return;

    const selectedBarber = barbers.find(b => b.id === formData.barberId);

    await cashFlowService.addTransaction({
      barbershopId: barbershopId || 'shop-mister-navalha',
      type: modalType,
      category: formData.category as any,
      description: formData.description,
      amount: parseFloat(formData.amount),
      date: formData.date,
      paymentMethod: formData.paymentMethod,
      barberId: formData.barberId || undefined,
      barberName: selectedBarber?.name
    });

    setIsModalOpen(false);
    setFormData({
      description: '',
      amount: '',
      category: 'supplies',
      paymentMethod: 'mbway',
      date: new Date().toISOString().split('T')[0],
      barberId: ''
    });
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir este lançamento do fluxo de caixa?')) {
      await cashFlowService.deleteTransaction(id);
      loadData();
    }
  };

  const filteredTransactions = transactions.filter(t => {
    if (filterType === 'all') return true;
    if (filterType === 'income') return t.type === 'income';
    if (filterType === 'expense') return t.type === 'expense' && t.category !== 'commission';
    if (filterType === 'commission') return t.category === 'commission';
    return true;
  });

  // Calculate Barber commissions breakdown
  const barberCommissions = barbers.map(barber => {
    const barberTxs = transactions.filter(t => t.barberId === barber.id && t.category === 'commission');
    const totalCommission = barberTxs.reduce((sum, t) => sum + t.amount, 0);
    const cutsCount = transactions.filter(t => t.barberId === barber.id && t.type === 'income').length;
    return {
      barber,
      totalCommission: parseFloat(totalCommission.toFixed(2)),
      cutsCount
    };
  });

  return (
    <div className="space-y-6">
      {/* Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900 text-white p-6 rounded-3xl border border-zinc-800 shadow-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#d4a338]">Fluxo de Caixa em Tempo Real</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Gestão Financeira & Comissões</h2>
          <p className="text-zinc-400 text-sm mt-1">Controle de receitas, despesas operacionais e repasses aos profissionais da {barbershopName}.</p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={() => {
              setModalType('income');
              setFormData(prev => ({ ...prev, category: 'product' }));
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-sm"
          >
            <Plus size={16} />
            + Nova Receita
          </button>

          <button
            onClick={() => {
              setModalType('expense');
              setFormData(prev => ({ ...prev, category: 'supplies' }));
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#d4a338] hover:bg-[#c3922d] text-zinc-950 text-xs sm:text-sm font-bold rounded-xl transition-all shadow-sm"
          >
            <Plus size={16} />
            + Nova Despesa
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Líquido */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Saldo Líquido em Caixa</span>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <Wallet size={18} />
            </div>
          </div>
          <div>
            <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${metrics.netBalance >= 0 ? 'text-zinc-900' : 'text-rose-600'}`}>
              {metrics.netBalance.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
            </div>
            <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1">
              <CheckCircle2 size={12} className="text-emerald-500" /> Balanço acumulado atual
            </p>
          </div>
        </div>

        {/* Total Receitas */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Faturamento Total</span>
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <ArrowUpRight size={18} />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-600">
              +{metrics.totalIncome.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
            </div>
            <p className="text-xs text-zinc-400 mt-1">Serviços concluídos + produtos</p>
          </div>
        </div>

        {/* Comissões Barbeiros */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Comissões dos Barbeiros</span>
            <div className="p-2 bg-amber-50 rounded-xl text-[#d4a338]">
              <Scissors size={18} />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900">
              {metrics.commissionsTotal.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
            </div>
            <p className="text-xs text-zinc-400 mt-1">Provisão calculada por corte/serviço</p>
          </div>
        </div>

        {/* Despesas Operacionais */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Despesas Totais</span>
            <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
              <ArrowDownLeft size={18} />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-rose-600">
              -{metrics.totalExpense.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
            </div>
            <p className="text-xs text-zinc-400 mt-1">Insumos, comissões e utilidades</p>
          </div>
        </div>
      </div>

      {/* Grid: Barber Commissions Breakdown + Payment Methods Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel de Repasse aos Barbeiros */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-zinc-900 text-base">Fechamento de Comissões por Barbeiro</h3>
              <p className="text-xs text-zinc-400">Rateio automático com base no percentual cadastrado de cada profissional.</p>
            </div>
            <span className="text-xs font-bold bg-amber-50 text-[#d4a338] px-2.5 py-1 rounded-lg border border-amber-200">
              Automático
            </span>
          </div>

          <div className="space-y-3">
            {barberCommissions.map(({ barber, totalCommission, cutsCount }) => (
              <div key={barber.id} className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-100 hover:border-zinc-200 transition-colors text-zinc-900 bg-white placeholder:text-zinc-400">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-200 border border-zinc-300 flex items-center justify-center font-bold text-zinc-600 text-xs">
                    {barber.photoUrl ? (
                      <img src={barber.photoUrl} alt={barber.name} className="w-full h-full object-cover" />
                    ) : (
                      barber.name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-zinc-900">{barber.name}</h4>
                    <span className="text-xs text-zinc-500">
                      Regra: {barber.compensationValue}% por serviço • {cutsCount} atendimentos realizados
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-zinc-400 block">Total a pagar:</span>
                  <span className="font-extrabold text-base text-zinc-900">
                    {totalCommission.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Indicadores de Métodos de Pagamento */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-zinc-900 text-base mb-1">Métodos de Recebimento</h3>
            <p className="text-xs text-zinc-400 mb-4">Divisão de faturamento presencial e digital.</p>
            
            <div className="space-y-3">
              {[
                { label: 'MB WAY', method: 'mbway', color: 'bg-emerald-500', icon: '🇵🇹' },
                { label: 'Dinheiro', method: 'cash', color: 'bg-amber-500', icon: '💵' },
                { label: 'Cartão / Multibanco', method: 'card', color: 'bg-blue-500', icon: '💳' },
                { label: 'Transferência', method: 'transfer', color: 'bg-purple-500', icon: '🏦' }
              ].map(item => {
                const total = transactions
                  .filter(t => t.type === 'income' && t.paymentMethod === item.method)
                  .reduce((sum, t) => sum + t.amount, 0);
                const percent = metrics.totalIncome > 0 ? Math.round((total / metrics.totalIncome) * 100) : 0;
                
                return (
                  <div key={item.method} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-zinc-700 flex items-center gap-1.5">
                        <span>{item.icon}</span> {item.label}
                      </span>
                      <span className="text-zinc-900 font-bold">
                        {total.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${item.color} rounded-full transition-all duration-500`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
            <span>Ticket Médio por Cliente:</span>
            <span className="font-bold text-sm text-zinc-900">
              {metrics.averageTicket.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
            </span>
          </div>
        </div>
      </div>

      {/* Transaction History / Ledger */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-zinc-900 text-base">Extrato de Movimentações</h3>
            <p className="text-xs text-zinc-400">Histórico completo de entradas, despesas e comissões.</p>
          </div>

          <div className="flex items-center gap-1.5 bg-zinc-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${filterType === 'all' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
            >
              Todos ({transactions.length})
            </button>
            <button
              onClick={() => setFilterType('income')}
              className={`px-3 py-1.5 rounded-lg transition-all ${filterType === 'income' ? 'bg-white text-emerald-700 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
            >
              Receitas
            </button>
            <button
              onClick={() => setFilterType('expense')}
              className={`px-3 py-1.5 rounded-lg transition-all ${filterType === 'expense' ? 'bg-white text-rose-700 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
            >
              Despesas
            </button>
            <button
              onClick={() => setFilterType('commission')}
              className={`px-3 py-1.5 rounded-lg transition-all ${filterType === 'commission' ? 'bg-white text-amber-700 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
            >
              Comissões
            </button>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center text-zinc-400 text-sm">
            Nenhuma movimentação encontrada para o filtro selecionado.
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {filteredTransactions.map((tx) => {
              const isIncome = tx.type === 'income';
              const isCommission = tx.category === 'commission';
              return (
                <div key={tx.id} className="p-4 sm:px-6 flex items-center justify-between hover:bg-zinc-50/70 transition-colors">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isIncome 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                        : isCommission
                          ? 'bg-amber-50 text-[#d4a338] border border-amber-100'
                          : 'bg-rose-50 text-rose-600 border border-rose-100'
                    }`}>
                      {isIncome ? (
                        tx.category === 'product' ? <Package size={18} /> : <Scissors size={18} />
                      ) : isCommission ? (
                        <User size={18} />
                      ) : (
                        <ArrowDownLeft size={18} />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-zinc-900">{tx.description}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          tx.category === 'service' ? 'bg-blue-50 text-blue-700' :
                          tx.category === 'product' ? 'bg-purple-50 text-purple-700' :
                          tx.category === 'commission' ? 'bg-amber-50 text-amber-700' :
                          tx.category === 'rent' ? 'bg-zinc-100 text-zinc-700' :
                          'bg-zinc-100 text-zinc-600'
                        }`}>
                          {tx.category === 'service' ? 'Serviço' :
                           tx.category === 'product' ? 'Produto' :
                           tx.category === 'commission' ? 'Comissão' :
                           tx.category === 'rent' ? 'Aluguel' :
                           tx.category === 'supplies' ? 'Insumos' : 'Geral'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-zinc-400 mt-0.5">
                        <span>{tx.date}</span>
                        <span>•</span>
                        <span className="uppercase">{tx.paymentMethod}</span>
                        {tx.barberName && (
                          <>
                            <span>•</span>
                            <span className="text-zinc-600 font-medium">Barbeiro: {tx.barberName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`font-extrabold text-sm sm:text-base ${
                      isIncome ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {isIncome ? '+' : '-'}{tx.amount.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                    </span>

                    <button
                      onClick={() => handleDelete(tx.id)}
                      title="Excluir lançamento"
                      className="text-zinc-300 hover:text-rose-500 p-1.5 rounded-lg transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Nova Movimentação */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-zinc-100 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-zinc-900 mb-1">
              {modalType === 'income' ? 'Lançar Nova Receita' : 'Lançar Nova Despesa'}
            </h3>
            <p className="text-xs text-zinc-400 mb-5">
              {modalType === 'income' 
                ? 'Registre uma venda avulsa de produto ou serviço realizado fora da agenda.'
                : 'Registre despesas operacionais da barbearia (aluguel, lâminas, energia, etc).'
              }
            </p>

            <form onSubmit={handleCreateTransaction} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase mb-1">Descrição</label>
                <input
                  type="text"
                  required
                  placeholder={modalType === 'income' ? 'Ex: Venda de Pomada Efeito Seco' : 'Ex: Compra de toalhas e lâminas'}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-zinc-900 bg-white placeholder:text-zinc-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase mb-1">Valor (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-zinc-900 bg-white placeholder:text-zinc-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase mb-1">Data</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-zinc-900 bg-white placeholder:text-zinc-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase mb-1">Categoria</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-zinc-900 bg-white placeholder:text-zinc-400"
                  >
                    {modalType === 'income' ? (
                      <>
                        <option value="product">Venda de Produto</option>
                        <option value="service">Serviço Avulso</option>
                        <option value="other">Outra Entrada</option>
                      </>
                    ) : (
                      <>
                        <option value="supplies">Insumos & Descartáveis</option>
                        <option value="rent">Aluguel do Ponto</option>
                        <option value="utilities">Água / Luz / Internet</option>
                        <option value="marketing">Marketing & Anúncios</option>
                        <option value="other">Outras Despesas</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase mb-1">Pagamento</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-zinc-900 bg-white placeholder:text-zinc-400"
                  >
                    <option value="mbway">MB WAY</option>
                    <option value="cash">Dinheiro</option>
                    <option value="card">Multibanco / Cartão</option>
                    <option value="transfer">Transferência Bancária</option>
                  </select>
                </div>
              </div>

              {modalType === 'income' && formData.category === 'service' && (
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase mb-1">Barbeiro Responsável</label>
                  <select
                    value={formData.barberId}
                    onChange={(e) => setFormData({ ...formData, barberId: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-zinc-900 bg-white placeholder:text-zinc-400"
                  >
                    <option value="">Sem barbeiro específico</option>
                    {barbers.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-zinc-500 hover:text-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all ${
                    modalType === 'income' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-zinc-900 hover:bg-zinc-800'
                  }`}
                >
                  Confirmar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
