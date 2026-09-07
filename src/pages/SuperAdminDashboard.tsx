import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { saasService, TenantAccount } from '../services/saasService';
import { authService } from '../services/authService';
import { SaaSBarbershop } from '../models';
import { 
  Building2, Plus, ExternalLink, Copy, Check, TrendingUp, 
  DollarSign, Users, ShieldCheck, Database, Code, Search, 
  Trash2, Edit3, Sparkles, ArrowRight, Smartphone, Scissors, AlertCircle,
  Shield, Key, UserCheck, Lock, LogIn
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [shops, setShops] = useState<SaaSBarbershop[]>([]);
  const [tenantAccounts, setTenantAccounts] = useState<TenantAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [copiedAccountUid, setCopiedAccountUid] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeTab, setActiveTab] = useState<'tenants' | 'accounts' | 'sql'>('tenants');

  // Metrics
  const [metrics, setMetrics] = useState({
    totalShops: 0,
    activeShops: 0,
    totalMRR: 0,
    planBreakdown: {} as Record<string, number>
  });

  // Modal State for New Tenant
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newShopForm, setNewShopForm] = useState({
    name: '',
    slug: '',
    unit: 'Matriz',
    city: 'Lisboa',
    phone: '+351 912 345 678',
    plan: 'pro' as 'starter' | 'pro' | 'imperio',
    primaryColor: '#d4a338',
    storyText: ''
  });
  const [createdTenantAlert, setCreatedTenantAlert] = useState<SaaSBarbershop | null>(null);

  // Modal State for "+ Criar Acesso do Cliente" (Owner)
  const [isCreateAccessModalOpen, setIsCreateAccessModalOpen] = useState(false);
  const [accessForm, setAccessForm] = useState({
    companyId: '',
    name: '',
    email: '',
    password: '',
    phone: ''
  });
  const [createdAccessAlert, setCreatedAccessAlert] = useState<TenantAccount | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const allShops = await saasService.getBarbershops();
      setShops(allShops);
      const m = await saasService.getSuperAdminMetrics();
      setMetrics(m);
      const accs = saasService.getTenantAccounts();
      setTenantAccounts(accs);
    } catch (err) {
      console.error('Erro ao carregar dados do Super Admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setNewShopForm(prev => ({
      ...prev,
      name,
      slug: saasService.generateSlug(name)
    }));
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShopForm.name.trim()) return;

    try {
      const created = await saasService.registerNewBarbershop({
        name: newShopForm.name.trim(),
        slug: newShopForm.slug.trim(),
        unit: newShopForm.unit,
        city: newShopForm.city,
        phone: newShopForm.phone,
        plan: newShopForm.plan,
        primaryColor: newShopForm.primaryColor,
        storyText: newShopForm.storyText
      });

      setIsCreateModalOpen(false);
      setCreatedTenantAlert(created);
      await loadData();

      // Reset form
      setNewShopForm({
        name: '',
        slug: '',
        unit: 'Matriz',
        city: 'Lisboa',
        phone: '+351 912 345 678',
        plan: 'pro',
        primaryColor: '#d4a338',
        storyText: ''
      });
    } catch (err) {
      alert('Erro ao cadastrar barbearia.');
    }
  };

  const handleCreateClientAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessForm.email.trim() || !accessForm.name.trim()) {
      alert('Preencha o nome e o email do cliente.');
      return;
    }
    const targetCompanyId = accessForm.companyId || shops[0]?.id || 'shop-rogerx';

    try {
      const newAcc = await saasService.createTenantOwnerAccount({
        companyId: targetCompanyId,
        name: accessForm.name.trim(),
        email: accessForm.email.trim(),
        password: accessForm.password.trim() || 'owner123',
        phone: accessForm.phone.trim()
      });

      setIsCreateAccessModalOpen(false);
      setCreatedAccessAlert(newAcc);
      await loadData();

      setAccessForm({
        companyId: '',
        name: '',
        email: '',
        password: '',
        phone: ''
      });
    } catch (err) {
      alert('Erro ao criar acesso do cliente.');
    }
  };

  const handleCopyAccessCredentials = (account: TenantAccount) => {
    const text = `Credenciais de Acesso ao Painel:\nEmpresa: ${account.companyName || account.companyId}\nEmail: ${account.email}\nSenha: ${account.password || 'owner123'}\nLink de Login: ${window.location.origin}/login`;
    navigator.clipboard.writeText(text);
    setCopiedAccountUid(account.uid);
    setTimeout(() => setCopiedAccountUid(null), 2500);
  };

  const handleLoginAsOwner = async (account: TenantAccount) => {
    saasService.setActiveBarbershop(account.companyId);
    await authService.loginDirect({
      uid: account.uid,
      name: account.name,
      email: account.email,
      phone: account.phone || '',
      role: 'owner',
      companyId: account.companyId,
      createdAt: account.createdAt
    });
    navigate('/admin');
  };

  const handleDeleteAccount = async (uid: string, name: string) => {
    if (!window.confirm(`Deseja remover o acesso de "${name}"?`)) return;
    await saasService.deleteTenantAccount(uid);
    await loadData();
  };

  const handleCopyLink = (slug: string) => {
    const origin = window.location.origin;
    const url = `${origin}/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  const handleDeleteTenant = async (id: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja desativar/excluir a barbearia "${name}"?`)) return;
    await saasService.deleteBarbershop(id);
    await loadData();
  };

  const handleSelectShopForManagement = (shop: SaaSBarbershop) => {
    saasService.setActiveBarbershop(shop.id);
    navigate('/admin');
  };

  const filteredShops = shops.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const supabaseSqlPreview = `-- ESQUEMA SUPABASE MULTI-TENANT COM RLS (Extrato Rápido)
-- Tabela Master de Tenants
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    primary_color TEXT DEFAULT '#d4a338',
    plan plan_type NOT NULL DEFAULT 'pro',
    active BOOLEAN NOT NULL DEFAULT true,
    monthly_fee NUMERIC(10, 2) DEFAULT 59.00
);

-- Políticas RLS com isolamento por company_id
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active companies by slug" ON public.companies FOR SELECT USING (active = true);
CREATE POLICY "Super Admins manage all companies" ON public.companies FOR ALL USING (public.is_super_admin());`;

  const copyFullSql = () => {
    fetch('/supabase/schema.sql')
      .then(res => res.text())
      .then(sql => {
        navigator.clipboard.writeText(sql);
        setCopiedSql(true);
        setTimeout(() => setCopiedSql(false), 3000);
      })
      .catch(() => {
        navigator.clipboard.writeText(supabaseSqlPreview);
        setCopiedSql(true);
        setTimeout(() => setCopiedSql(false), 3000);
      });
  };

  return (
    <div className="min-h-screen bg-[#0d0f12] text-white p-4 sm:p-6 lg:p-8 font-sans">
      {/* Top Header */}
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#d4a338] to-amber-600 flex items-center justify-center text-zinc-950 font-black shadow-lg">
                <ShieldCheck size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">Painel Master Super Admin</h1>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    SaaS Platform
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-400">
                  Gestão Centralizada de Tenants (Barbearias), Planos, Faturamento e Arquitetura Multi-Tenant
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/saas"
              className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <ExternalLink size={14} />
              Landing Page B2B
            </Link>

            <button
              onClick={() => {
                setAccessForm({
                  companyId: shops[0]?.id || 'shop-rogerx',
                  name: '',
                  email: '',
                  password: 'owner' + Math.floor(100 + Math.random() * 900),
                  phone: '+351 '
                });
                setIsCreateAccessModalOpen(true);
              }}
              className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-amber-500/50 text-amber-300 hover:text-white rounded-xl text-xs font-bold transition-all shadow-[0_0_15px_rgba(212,163,56,0.15)] flex items-center gap-2"
            >
              <Shield size={16} className="text-[#d4a338]" />
              + Criar Acesso do Cliente
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-5 py-2.5 bg-[#d4a338] hover:bg-[#c3922d] text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(212,163,56,0.3)] hover:scale-105 flex items-center gap-2"
            >
              <Plus size={16} />
              Cadastrar Nova Barbearia
            </button>
          </div>
        </div>

        {/* Success Alert when a client access (owner) is created */}
        {createdAccessAlert && (
          <div className="p-4 rounded-2xl bg-amber-950/70 border border-amber-500/40 text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#d4a338] text-zinc-950 flex items-center justify-center font-black">
                <Key size={16} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  Acesso de Dono criado com sucesso para "{createdAccessAlert.name}"!
                </p>
                <p className="text-xs text-amber-300">
                  Email: <strong className="text-white">{createdAccessAlert.email}</strong> | Barbearia: <strong className="text-white">{createdAccessAlert.companyName || createdAccessAlert.companyId}</strong> | Senha: <code className="bg-zinc-900 px-1.5 py-0.5 rounded text-white font-mono">{createdAccessAlert.password}</code>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopyAccessCredentials(createdAccessAlert)}
                className="px-3 py-1.5 bg-amber-800/80 hover:bg-amber-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
              >
                {copiedAccountUid === createdAccessAlert.uid ? <Check size={14} /> : <Copy size={14} />}
                {copiedAccountUid === createdAccessAlert.uid ? 'Copiado!' : 'Copiar Acesso'}
              </button>
              <button
                onClick={() => handleLoginAsOwner(createdAccessAlert)}
                className="px-3 py-1.5 bg-[#d4a338] hover:bg-[#c3922d] text-zinc-950 text-xs font-black rounded-lg transition-colors flex items-center gap-1"
              >
                Entrar como Dono <LogIn size={13} />
              </button>
            </div>
          </div>
        )}

        {/* Success Alert when a new tenant is created */}
        {createdTenantAlert && (
          <div className="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center font-black">
                ✓
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  Barbearia "{createdTenantAlert.name}" cadastrada com sucesso!
                </p>
                <p className="text-xs text-emerald-300">
                  Link público ativado: <strong className="text-white">/{createdTenantAlert.slug}</strong>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopyLink(createdTenantAlert.slug)}
                className="px-3 py-1.5 bg-emerald-800/80 hover:bg-emerald-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
              >
                {copiedSlug === createdTenantAlert.slug ? <Check size={14} /> : <Copy size={14} />}
                {copiedSlug === createdTenantAlert.slug ? 'Copiado!' : 'Copiar Link'}
              </button>
              <Link
                to={`/${createdTenantAlert.slug}`}
                target="_blank"
                className="px-3 py-1.5 bg-white text-zinc-950 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
              >
                Abrir PWA <ExternalLink size={12} />
              </Link>
            </div>
          </div>
        )}

        {/* Consolidated SaaS Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl relative overflow-hidden">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total Barbearias</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                <Building2 size={18} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-black text-white">{metrics.totalShops}</span>
              <span className="text-xs text-emerald-400 font-bold ml-2">100% ativas</span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Multi-tenants isolados no banco</p>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl relative overflow-hidden">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Faturamento MRR</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <DollarSign size={18} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-black text-emerald-400">€ {metrics.totalMRR.toFixed(2)}</span>
              <span className="text-xs text-zinc-400 ml-1">/mês</span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Receita recorrente de assinaturas</p>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl relative overflow-hidden">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Divisão de Planos</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-[#d4a338]">
                <TrendingUp size={18} />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs font-bold">
              <span className="px-2 py-1 bg-zinc-800 rounded text-zinc-300">
                Starter: {metrics.planBreakdown['starter'] || 0}
              </span>
              <span className="px-2 py-1 bg-amber-500/20 text-[#d4a338] rounded">
                Pro: {metrics.planBreakdown['pro'] || 0}
              </span>
              <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded">
                Império: {metrics.planBreakdown['imperio'] || 0}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Plano Pro & Império lideram</p>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl relative overflow-hidden">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Supabase & RLS</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Database size={18} />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-bold text-white">Pronto p/ Produção</span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">company_id em 100% das tabelas</p>
          </div>
        </div>

        {/* Tabs: Tenants vs Accounts vs Supabase Schema */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 border-b border-zinc-800 pb-2">
          <button
            onClick={() => setActiveTab('tenants')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 rounded-lg ${
              activeTab === 'tenants' ? 'bg-[#d4a338] text-zinc-950 font-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Building2 size={16} />
            Barbearias Cadastradas ({shops.length})
          </button>
          <button
            onClick={() => setActiveTab('accounts')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 rounded-lg ${
              activeTab === 'accounts' ? 'bg-[#d4a338] text-zinc-950 font-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Key size={16} />
            Acessos de Clientes ({tenantAccounts.length})
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 rounded-lg ${
              activeTab === 'sql' ? 'bg-[#d4a338] text-zinc-950 font-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Code size={16} />
            Script SQL Supabase & RLS
          </button>
        </div>

        {/* TAB 1: Tenants List */}
        {activeTab === 'tenants' && (
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Buscar por nome, slug ou cidade..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#d4a338]"
                />
              </div>
              <p className="text-xs text-zinc-500">
                Mostrando {filteredShops.length} de {shops.length} barbearias
              </p>
            </div>

            {/* Tenants Table */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800 font-bold">
                    <tr>
                      <th className="py-4 px-6">Barbearia & Unidade</th>
                      <th className="py-4 px-6">Link Público (/:slug)</th>
                      <th className="py-4 px-6">Plano & Valor</th>
                      <th className="py-4 px-6">Status & Cidade</th>
                      <th className="py-4 px-6 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {filteredShops.map(shop => (
                      <tr key={shop.id} className="hover:bg-zinc-800/40 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-zinc-950 shadow-sm shrink-0"
                              style={{ backgroundColor: shop.primaryColor || '#d4a338' }}
                            >
                              <Scissors size={16} />
                            </div>
                            <div>
                              <p className="font-bold text-sm text-white">{shop.name}</p>
                              <p className="text-[10px] text-zinc-400 uppercase tracking-wider">{shop.unit} • {shop.city}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <div className="inline-flex items-center gap-2 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800">
                            <span className="font-mono text-[#d4a338] font-semibold">/{shop.slug}</span>
                            <button
                              onClick={() => handleCopyLink(shop.slug)}
                              className="text-zinc-400 hover:text-white transition-colors"
                              title="Copiar Link"
                            >
                              {copiedSlug === shop.slug ? (
                                <Check size={14} className="text-emerald-400" />
                              ) : (
                                <Copy size={14} />
                              )}
                            </button>
                            <Link
                              to={`/${shop.slug}`}
                              target="_blank"
                              className="text-zinc-400 hover:text-white transition-colors"
                              title="Abrir no Navegador"
                            >
                              <ExternalLink size={14} />
                            </Link>
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <div className="space-y-1">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              shop.plan === 'imperio' 
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                                : shop.plan === 'pro'
                                ? 'bg-amber-500/20 text-[#d4a338] border border-amber-500/30'
                                : 'bg-zinc-800 text-zinc-300'
                            }`}>
                              Plano {shop.plan.toUpperCase()}
                            </span>
                            <p className="text-zinc-400 font-bold">€ {shop.monthlyFee.toFixed(2)}/mês</p>
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              Ativa (14d teste)
                            </span>
                            <p className="text-zinc-500 text-[11px]">{shop.city}, {shop.country}</p>
                          </div>
                        </td>

                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleSelectShopForManagement(shop)}
                              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                              title="Gerenciar Painel desta Barbearia"
                            >
                              Painel Admin
                            </button>

                            <button
                              onClick={() => handleDeleteTenant(shop.id, shop.name)}
                              className="p-1.5 text-zinc-500 hover:text-rose-400 transition-colors rounded-lg hover:bg-zinc-800"
                              title="Remover Barbearia"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Client & Barber Accounts List */}
        {activeTab === 'accounts' && (
          <div className="space-y-6">
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Key size={20} className="text-[#d4a338]" />
                    Contas e Acessos de Clientes (Owners & Barbeiros)
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Credenciais vinculadas estritamente ao <code className="text-[#d4a338] bg-zinc-950 px-1 py-0.5 rounded">company_id</code> de cada barbearia.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setAccessForm({
                      companyId: shops[0]?.id || 'shop-rogerx',
                      name: '',
                      email: '',
                      password: 'owner' + Math.floor(100 + Math.random() * 900),
                      phone: '+351 '
                    });
                    setIsCreateAccessModalOpen(true);
                  }}
                  className="px-4 py-2 bg-[#d4a338] hover:bg-[#c3922d] text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 shrink-0"
                >
                  <Plus size={16} />
                  + Criar Acesso do Cliente
                </button>
              </div>

              {/* Table of Accounts */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-zinc-950/60 text-zinc-500 uppercase font-black text-[10px] tracking-wider border-b border-zinc-800">
                    <tr>
                      <th className="px-6 py-3.5">Nome / Titular</th>
                      <th className="px-6 py-3.5">Email de Login</th>
                      <th className="px-6 py-3.5">Barbearia Vinculada</th>
                      <th className="px-6 py-3.5">Nível / Role</th>
                      <th className="px-6 py-3.5">Senha Provisória</th>
                      <th className="px-6 py-3.5 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {tenantAccounts.map(acc => {
                      const shop = shops.find(s => s.id === acc.companyId);
                      const isOwner = acc.role === 'owner';

                      return (
                        <tr key={acc.uid} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                isOwner ? 'bg-[#d4a338]/20 text-[#d4a338]' : 'bg-blue-500/20 text-blue-400'
                              }`}>
                                {isOwner ? <Shield size={14} /> : <Scissors size={14} />}
                              </div>
                              <div>
                                <span className="font-bold text-white text-sm block">{acc.name}</span>
                                {acc.phone && <span className="text-[11px] text-zinc-400">{acc.phone}</span>}
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4 font-mono text-zinc-200">
                            {acc.email}
                          </td>

                          <td className="px-6 py-4">
                            <span className="font-semibold text-white">
                              {shop?.name || acc.companyName || acc.companyId}
                            </span>
                            <span className="block text-[10px] text-zinc-500 font-mono">
                              ID: {acc.companyId}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isOwner 
                                ? 'bg-amber-500/10 text-[#d4a338] border border-amber-500/30' 
                                : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                            }`}>
                              {isOwner ? 'Dono (Owner)' : 'Barbeiro'}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <code className="bg-zinc-950 px-2 py-1 rounded border border-zinc-800 text-amber-200 font-mono text-xs">
                              {acc.password || '••••••••'}
                            </code>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleCopyAccessCredentials(acc)}
                                className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                                title="Copiar Credenciais de Acesso"
                              >
                                {copiedAccountUid === acc.uid ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                {copiedAccountUid === acc.uid ? 'Copiado' : 'Copiar'}
                              </button>

                              {isOwner && (
                                <button
                                  onClick={() => handleLoginAsOwner(acc)}
                                  className="px-2.5 py-1.5 bg-[#d4a338] hover:bg-[#c3922d] text-zinc-950 rounded-lg text-xs font-black transition-colors flex items-center gap-1"
                                  title="Acessar Painel como este Dono"
                                >
                                  <LogIn size={13} />
                                  Entrar
                                </button>
                              )}

                              <button
                                onClick={() => handleDeleteAccount(acc.uid, acc.name)}
                                className="p-1.5 text-zinc-500 hover:text-rose-400 transition-colors rounded-lg hover:bg-zinc-800"
                                title="Remover Acesso"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {tenantAccounts.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                          Nenhum acesso de cliente cadastrado ainda. Clique em "+ Criar Acesso do Cliente" acima para gerar o primeiro acesso.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Supabase Schema & RLS */}
        {activeTab === 'sql' && (
          <div className="space-y-6">
            <div className="bg-zinc-900/70 border border-zinc-800 p-6 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Database size={20} className="text-[#d4a338]" />
                    Esquema Multi-Tenant Completo para Supabase (PostgreSQL)
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Inclui tabelas isoladas por <code className="text-[#d4a338] bg-zinc-950 px-1 py-0.5 rounded">company_id</code>, políticas RLS para leitura pública do slug e restrição estrita de caixa.
                  </p>
                </div>
                <button
                  onClick={copyFullSql}
                  className="px-5 py-2.5 bg-[#d4a338] hover:bg-[#c3922d] text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2"
                >
                  {copiedSql ? <Check size={16} /> : <Copy size={16} />}
                  {copiedSql ? 'SQL Copiado com Sucesso!' : 'Copiar Script SQL Completo'}
                </button>
              </div>

              {/* Code Box */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 overflow-x-auto max-h-[460px] font-mono text-xs text-zinc-300 leading-relaxed">
                <pre>{supabaseSqlPreview}

-- Arquivo completo disponível em: /supabase/schema.sql
-- Contém:
-- 1. companies (id, slug, name, primary_color, plan, active)
-- 2. profiles (vinculado a auth.users e company_id)
-- 3. services, barbers, clients, products, appointments, cash_flow
-- 4. Funções helpers: current_user_company_id(), is_super_admin()
-- 5. Row Level Security habilitado em 100% das tabelas
-- 6. Seed data inicial pronto para rodar no Supabase SQL Editor</pre>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Modal: Cadastrar Nova Barbearia */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 text-white max-w-xl w-full p-6 sm:p-8 rounded-3xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#d4a338] text-zinc-950 flex items-center justify-center font-black">
                  <Plus size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase text-white">Cadastrar Nova Barbearia</h3>
                  <p className="text-xs text-zinc-400">Criará um novo Tenant com link PWA dinâmico (/:slug)</p>
                </div>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTenant} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Nome da Barbearia *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Barbearia Viking Club"
                  value={newShopForm.name}
                  onChange={handleNameChange}
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#d4a338]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5 flex items-center justify-between">
                  <span>Slug Único do Link (URL) *</span>
                  <span className="text-[10px] text-[#d4a338] font-mono">/{newShopForm.slug || 'seu-slug'}</span>
                </label>
                <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3">
                  <span className="text-zinc-500 text-sm mr-1">{window.location.origin}/</span>
                  <input
                    type="text"
                    required
                    placeholder="barbearia-viking"
                    value={newShopForm.slug}
                    onChange={e => setNewShopForm({ ...newShopForm, slug: saasService.generateSlug(e.target.value) })}
                    className="flex-1 bg-transparent text-sm text-[#d4a338] font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                    Plano do SaaS *
                  </label>
                  <select
                    value={newShopForm.plan}
                    onChange={e => setNewShopForm({ ...newShopForm, plan: e.target.value as any })}
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-[#d4a338]"
                  >
                    <option value="starter">Starter (€ 29/mês)</option>
                    <option value="pro">Pro Barber (€ 59/mês - Recomendado)</option>
                    <option value="imperio">Império & Redes (€ 99/mês)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                    Cor Primária da Marca
                  </label>
                  <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl p-2">
                    <input
                      type="color"
                      value={newShopForm.primaryColor}
                      onChange={e => setNewShopForm({ ...newShopForm, primaryColor: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
                    />
                    <span className="text-xs font-mono text-zinc-300">{newShopForm.primaryColor}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                    Unidade
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Centro"
                    value={newShopForm.unit}
                    onChange={e => setNewShopForm({ ...newShopForm, unit: e.target.value })}
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#d4a338]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                    Cidade
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Lisboa"
                    value={newShopForm.city}
                    onChange={e => setNewShopForm({ ...newShopForm, city: e.target.value })}
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#d4a338]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                    Telefone
                  </label>
                  <input
                    type="text"
                    placeholder="+351 912 345 678"
                    value={newShopForm.phone}
                    onChange={e => setNewShopForm({ ...newShopForm, phone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#d4a338]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                  História / Slogan Personalizado (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Conte brevemente a história e diferencial desta barbearia..."
                  value={newShopForm.storyText}
                  onChange={e => setNewShopForm({ ...newShopForm, storyText: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#d4a338]"
                />
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#d4a338] hover:bg-[#c3922d] text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2"
                >
                  <Plus size={16} />
                  Criar Barbearia & Ativar Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: + Criar Acesso do Cliente (Owner) */}
      {isCreateAccessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#d4a338]/20 text-[#d4a338] flex items-center justify-center font-black">
                  <Shield size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Criar Acesso do Cliente</h3>
                  <p className="text-xs text-zinc-400">Gera credenciais de Dono (Owner) vinculadas ao tenant</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateAccessModalOpen(false)}
                className="text-zinc-400 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateClientAccess} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Barbearia / Empresa (Tenant)
                </label>
                <select
                  value={accessForm.companyId}
                  onChange={e => setAccessForm({ ...accessForm, companyId: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-[#d4a338]"
                  required
                >
                  <option value="">Selecione uma Barbearia...</option>
                  {shops.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} (/{s.slug})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Nome do Dono / Responsável
                </label>
                <input
                  type="text"
                  placeholder="Ex: Roger Santos"
                  value={accessForm.name}
                  onChange={e => setAccessForm({ ...accessForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#d4a338]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Email de Login (Acesso ao Painel)
                </label>
                <input
                  type="email"
                  placeholder="Ex: roger@rogerxbarbershop.pt"
                  value={accessForm.email}
                  onChange={e => setAccessForm({ ...accessForm, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#d4a338]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                    Senha Provisória
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: rogerx2026"
                    value={accessForm.password}
                    onChange={e => setAccessForm({ ...accessForm, password: e.target.value })}
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#d4a338]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                    WhatsApp / Telefone
                  </label>
                  <input
                    type="text"
                    placeholder="+351 912 345 678"
                    value={accessForm.phone}
                    onChange={e => setAccessForm({ ...accessForm, phone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#d4a338]"
                  />
                </div>
              </div>

              <div className="p-3 bg-zinc-950/70 border border-zinc-800/80 rounded-xl text-[11px] text-zinc-400 space-y-1">
                <p className="font-bold text-amber-300 flex items-center gap-1.5">
                  <ShieldCheck size={14} />
                  Permissões do Usuário Criado:
                </p>
                <p>
                  • Acesso completo como <strong>Dono (Owner)</strong> ao Painel da Barbearia selecionada.
                </p>
                <p>
                  • Isolamento estrito por <code className="text-[#d4a338]">company_id</code>: não tem acesso a dados de outras empresas.
                </p>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateAccessModalOpen(false)}
                  className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#d4a338] hover:bg-[#c3922d] text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2"
                >
                  <Key size={16} />
                  Gerar Acesso & Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
