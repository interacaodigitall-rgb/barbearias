import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { saasService } from '../services/saasService';
import { User, Shield, Scissors, Users as UsersIcon, Play, Search } from 'lucide-react';

type Role = 'customer' | 'barber' | 'admin';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('customer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const getCustomerHomePath = () => {
    const activeShop = saasService.getActiveBarbershop();
    return activeShop?.slug ? `/${activeShop.slug}` : '/mister-navalha';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await authService.login(email, password);
      
      if (user.role === 'superadmin') {
        navigate('/super-admin');
      } else if (user.role === 'admin' || user.role === 'owner') {
        navigate('/admin');
      } else if (user.role === 'barber') {
        navigate('/barber-dashboard');
      } else {
        const pendingSaved = localStorage.getItem('pending_booking');
        if (pendingSaved) {
          try {
            const parsed = JSON.parse(pendingSaved);
            if (parsed?.shopSlug) {
              navigate(`/${parsed.shopSlug}/booking`);
              return;
            }
          } catch (e) {
            console.error('Error reading pending booking:', e);
          }
        }
        navigate(getCustomerHomePath());
      }
    } catch (err: any) {
      const barberEmails = [
        'barbeiro01@sherlocks.pt',
        'barbeiro02@sherlocks.pt',
        'barbeiro03@sherlocks.pt',
        'barbeiro04@sherlocks.pt',
        'barbeiro05@sherlocks.pt',
        'barbeiro06@sherlocks.pt'
      ];
      
      if (barberEmails.includes(email.toLowerCase())) {
        try {
          // Attempt to register on first access
          const name = `Barbeiro ${email.match(/\d+/)?.[0] || ''}`;
          await authService.register(email, password, name, '');
          navigate('/barber-dashboard');
          return;
        } catch (regErr: any) {
          if (regErr.code === 'auth/email-already-in-use') {
            setError('Senha incorreta. Se esqueceu a senha, contate o administrador.');
          } else {
            setError(regErr.message || 'Erro ao fazer login');
          }
        }
      } else {
        setError(err.message || 'Erro ao fazer login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const barberEmails = [
      'barbeiro01@sherlocks.pt',
      'barbeiro02@sherlocks.pt',
      'barbeiro03@sherlocks.pt',
      'barbeiro04@sherlocks.pt',
      'barbeiro05@sherlocks.pt',
      'barbeiro06@sherlocks.pt'
    ];
    
    if (barberEmails.includes(email.toLowerCase())) {
      alert('Para redefinir sua senha de barbeiro, por favor solicite ao administrador.');
      return;
    }
    
    if (!email) {
      alert('Por favor, preencha seu email primeiro.');
      return;
    }
    
    try {
      await authService.resetPassword(email);
      alert('Email de redefinição enviado! Verifique sua caixa de entrada.');
    } catch (err: any) {
      alert('Erro ao enviar email: ' + err.message);
    }
  };

  const handleDemoLogin = async (demoRole: Role) => {
    setLoading(true);
    try {
      const user = await authService.loginDemo(demoRole);
      if (user.role === 'admin' || user.role === 'owner') {
        navigate('/admin');
      } else if (user.role === 'barber') {
        navigate('/barber-dashboard');
      } else {
        const pendingSaved = localStorage.getItem('pending_booking');
        if (pendingSaved) {
          try {
            const parsed = JSON.parse(pendingSaved);
            if (parsed?.shopSlug) {
              navigate(`/${parsed.shopSlug}/booking`);
              return;
            }
          } catch (e) {
            console.error('Error reading pending booking:', e);
          }
        }
        navigate(getCustomerHomePath());
      }
    } catch (err: any) {
      setError('Erro ao entrar no modo demo');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { id: 'customer', label: 'Cliente', icon: UsersIcon },
    { id: 'barber', label: 'Barbeiro', icon: Scissors },
    { id: 'admin', label: 'Admin', icon: Shield },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100 space-y-8">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center overflow-hidden rounded-2xl border-2 border-zinc-900 bg-zinc-950 shadow-md">
              <img 
                src="https://i.postimg.cc/wM0yfhrM/Gemini-Generated-Image-474jdt474jdt474j.jpg" 
                alt="ProBarbearia Logo" 
                className="w-full h-full object-cover" 
                
              />
            </div>
            <h2 className="text-3xl font-black tracking-tight text-zinc-900 bg-white uppercase">
              Pro<span className="text-[#d4a338]">Barbearia</span>
            </h2>
            <p className="text-zinc-500 mt-2 text-sm">Entre na sua conta ou use o modo demo</p>
          </div>

          <div className="flex p-1 bg-zinc-100 rounded-2xl">
            {roles.map((r) => {
              const Icon = r.icon;
              return (
                <button
                  key={r.id}
                  onClick={() => setRole(r.id as Role)}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-xl text-sm font-medium transition-all ${
                    role === r.id ? 'bg-white text-zinc-900 bg-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
                  }`}
                >
                  <Icon size={16} />
                  <span>{r.label}</span>
                </button>
              );
            })}
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">{error}</div>}
            <div className="space-y-4">
              <input
                type="email"
                required
                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-zinc-300 focus:outline-none focus:ring-zinc-900 focus:border-zinc-900 sm:text-sm text-zinc-900 bg-white placeholder:text-zinc-400"
                placeholder="Seu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="password"
                required
                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-zinc-300 focus:outline-none focus:ring-zinc-900 focus:border-zinc-900 sm:text-sm text-zinc-900 bg-white placeholder:text-zinc-400"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-medium text-zinc-500 hover:text-zinc-900 bg-white"
                >
                  Esqueceu a senha?
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-zinc-900 hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Entrando...' : `Entrar como ${roles.find(r => r.id === role)?.label}`}
            </button>
            
            <div className="text-center text-sm">
              <span className="text-zinc-600">Não tem uma conta? </span>
              <Link to="/register" className="font-medium text-zinc-900 bg-white hover:text-zinc-700">
                Cadastre-se (Apenas Clientes)
              </Link>
            </div>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-zinc-500">Ou use o Modo Demo</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {roles.map((r) => {
              const Icon = r.icon;
              return (
                <button
                  key={r.id}
                  onClick={() => handleDemoLogin(r.id as Role)}
                  disabled={loading}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-zinc-50 border border-zinc-100 hover:bg-zinc-100 transition-all group"
                >
                  <Icon size={20} className="text-zinc-500 group-hover:text-zinc-900 bg-white mb-1" />
                  <span className="text-[10px] font-bold text-zinc-600 group-hover:text-zinc-900 bg-white">{r.label}</span>
                </button>
              );
            })}
          </div>

          <p className="text-[10px] text-zinc-400 text-center">
            O modo demo utiliza dados fictícios para demonstração rápida.
          </p>
        </div>

      </div>
    </div>
  );
}

