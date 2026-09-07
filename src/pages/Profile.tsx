import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { User as UserIcon, Phone, Mail, Calendar, Building, FileText, MapPin, Save } from 'lucide-react';
import { format } from 'date-fns';
import { firestoreService } from '../services/firestoreService';
import { CompanySettings } from '../models';

export default function Profile() {
  const { user } = useAuthStore();
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (user?.role === 'admin') {
      loadCompanySettings();
    }
  }, [user]);

  const loadCompanySettings = async () => {
    const settings = await firestoreService.getCompanySettings();
    if (settings) {
      setCompanySettings(settings);
    } else {
      setCompanySettings({
        id: 'default',
        companyName: '',
        nif: '',
        address: '',
        phone: '',
        ownerName: '',
        updatedAt: Date.now()
      });
    }
  };

  const handleSaveCompanySettings = async () => {
    if (!companySettings) return;
    setLoading(true);
    setSuccessMsg('');
    try {
      const { id, ...data } = companySettings;
      await firestoreService.updateCompanySettings({ ...data, updatedAt: Date.now() });
      setIsEditingCompany(false);
      setSuccessMsg('Configurações da empresa atualizadas com sucesso!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error('Error saving company settings', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h2 className="text-3xl font-bold tracking-tight text-zinc-900 mb-8">Meu Perfil</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* User Profile Card */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-zinc-100 h-fit">
          <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 bg-zinc-100 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-sm overflow-hidden">
              {user.role === 'admin' ? (
                <img 
                  src="https://i.postimg.cc/wM0yfhrM/Gemini-Generated-Image-474jdt474jdt474j.jpg" 
                  alt="ProBarbearia Logo" 
                  className="w-full h-full object-cover" 
                  
                />
              ) : (
                <UserIcon size={40} className="text-zinc-400" />
              )}
            </div>
            <h3 className="text-2xl font-bold text-zinc-900">{user.name}</h3>
            <span className="px-3 py-1 bg-zinc-100 text-zinc-600 rounded-full text-xs font-bold uppercase tracking-wider mt-2">
              {user.role}
            </span>
          </div>

          <div className="space-y-6">
            <div className="flex items-center space-x-4 p-4 bg-zinc-50 rounded-2xl">
              <div className="p-2 bg-white rounded-xl shadow-sm">
                <Mail size={20} className="text-zinc-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-medium">Email</p>
                <p className="text-sm font-bold text-zinc-900">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-4 bg-zinc-50 rounded-2xl">
              <div className="p-2 bg-white rounded-xl shadow-sm">
                <Phone size={20} className="text-zinc-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-medium">Telefone</p>
                <p className="text-sm font-bold text-zinc-900">{user.phone}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-4 bg-zinc-50 rounded-2xl">
              <div className="p-2 bg-white rounded-xl shadow-sm">
                <Calendar size={20} className="text-zinc-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-medium">Membro desde</p>
                <p className="text-sm font-bold text-zinc-900">
                  {format(new Date(user.createdAt), 'dd/MM/yyyy')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Company Settings Card (Admin Only) */}
        {user.role === 'admin' && companySettings && (
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-zinc-100">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-zinc-900 text-white rounded-xl">
                  <Building size={24} />
                </div>
                <h3 className="text-xl font-bold text-zinc-900">Dados da Empresa</h3>
              </div>
              {!isEditingCompany && (
                <button 
                  onClick={() => setIsEditingCompany(true)}
                  className="text-sm font-bold text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                  Editar
                </button>
              )}
            </div>

            {successMsg && (
              <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-2xl text-sm font-medium border border-green-100">
                {successMsg}
              </div>
            )}

            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Nome da Empresa</label>
                  {isEditingCompany ? (
                    <input 
                      type="text" 
                      className="w-full p-3 rounded-xl border border-zinc-200 text-sm focus:ring-zinc-900 focus:border-zinc-900 text-zinc-900 bg-white placeholder:text-zinc-400"
                      value={companySettings.companyName}
                      onChange={e => setCompanySettings({...companySettings, companyName: e.target.value})}
                    />
                  ) : (
                    <p className="text-sm font-bold text-zinc-900 p-3 bg-zinc-50 rounded-xl">{companySettings.companyName || 'Não informado'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">NIF / CNPJ</label>
                  {isEditingCompany ? (
                    <input 
                      type="text" 
                      className="w-full p-3 rounded-xl border border-zinc-200 text-sm focus:ring-zinc-900 focus:border-zinc-900 text-zinc-900 bg-white placeholder:text-zinc-400"
                      value={companySettings.nif}
                      onChange={e => setCompanySettings({...companySettings, nif: e.target.value})}
                    />
                  ) : (
                    <p className="text-sm font-bold text-zinc-900 p-3 bg-zinc-50 rounded-xl">{companySettings.nif || 'Não informado'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Endereço Sede</label>
                  {isEditingCompany ? (
                    <input 
                      type="text" 
                      className="w-full p-3 rounded-xl border border-zinc-200 text-sm focus:ring-zinc-900 focus:border-zinc-900 text-zinc-900 bg-white placeholder:text-zinc-400"
                      value={companySettings.address}
                      onChange={e => setCompanySettings({...companySettings, address: e.target.value})}
                    />
                  ) : (
                    <p className="text-sm font-bold text-zinc-900 p-3 bg-zinc-50 rounded-xl">{companySettings.address || 'Não informado'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Telefone Comercial</label>
                  {isEditingCompany ? (
                    <input 
                      type="text" 
                      className="w-full p-3 rounded-xl border border-zinc-200 text-sm focus:ring-zinc-900 focus:border-zinc-900 text-zinc-900 bg-white placeholder:text-zinc-400"
                      value={companySettings.phone}
                      onChange={e => setCompanySettings({...companySettings, phone: e.target.value})}
                    />
                  ) : (
                    <p className="text-sm font-bold text-zinc-900 p-3 bg-zinc-50 rounded-xl">{companySettings.phone || 'Não informado'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Sócio / Proprietário</label>
                  {isEditingCompany ? (
                    <input 
                      type="text" 
                      className="w-full p-3 rounded-xl border border-zinc-200 text-sm focus:ring-zinc-900 focus:border-zinc-900 text-zinc-900 bg-white placeholder:text-zinc-400"
                      value={companySettings.ownerName}
                      onChange={e => setCompanySettings({...companySettings, ownerName: e.target.value})}
                    />
                  ) : (
                    <p className="text-sm font-bold text-zinc-900 p-3 bg-zinc-50 rounded-xl">{companySettings.ownerName || 'Não informado'}</p>
                  )}
                </div>
              </div>

              {isEditingCompany && (
                <div className="pt-6 border-t border-zinc-100 flex gap-3">
                  <button 
                    onClick={() => setIsEditingCompany(false)}
                    className="flex-1 py-3 px-4 bg-zinc-100 text-zinc-600 rounded-xl font-bold hover:bg-zinc-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSaveCompanySettings}
                    disabled={loading}
                    className="flex-1 py-3 px-4 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Save size={18} />
                    {loading ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
