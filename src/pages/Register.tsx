import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { saasService } from '../services/saasService';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authService.register(email, password, name, phone);
      
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

      const activeShop = saasService.getActiveBarbershop();
      const targetSlug = activeShop?.slug || 'rogerx-barbershop';
      navigate(`/${targetSlug}`);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl shadow-sm border border-zinc-100">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-3 flex items-center justify-center overflow-hidden rounded-2xl border-2 border-zinc-900 bg-zinc-950 shadow-md">
            <img 
              src="https://i.postimg.cc/wM0yfhrM/Gemini-Generated-Image-474jdt474jdt474j.jpg" 
              alt="ProBarbearia Logo" 
              className="w-full h-full object-cover" 
              
            />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-zinc-900 bg-white uppercase">
            Criar conta • Pro<span className="text-[#d4a338]">Barbearia</span>
          </h2>
          <p className="mt-1 text-center text-xs text-zinc-500">
            Cadastre-se para agendar cortes e acumular cashback.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">{error}</div>}
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="name" className="sr-only">Nome Completo</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-zinc-300 focus:outline-none focus:ring-zinc-900 focus:border-zinc-900 focus:z-10 sm:text-sm text-zinc-900 bg-white placeholder:text-zinc-400"
                placeholder="Nome Completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="email-address" className="sr-only">Email</label>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-zinc-300 focus:outline-none focus:ring-zinc-900 focus:border-zinc-900 focus:z-10 sm:text-sm text-zinc-900 bg-white placeholder:text-zinc-400"
                placeholder="Seu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="phone" className="sr-only">Telefone</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-zinc-300 focus:outline-none focus:ring-zinc-900 focus:border-zinc-900 focus:z-10 sm:text-sm text-zinc-900 bg-white placeholder:text-zinc-400"
                placeholder="Telefone (WhatsApp)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Senha</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-zinc-300 focus:outline-none focus:ring-zinc-900 focus:border-zinc-900 focus:z-10 sm:text-sm text-zinc-900 bg-white placeholder:text-zinc-400"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-zinc-900 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 transition-colors disabled:opacity-50"
            >
              {loading ? 'Criando...' : 'Criar Conta'}
            </button>
          </div>
          
          <div className="text-center text-sm">
            <span className="text-zinc-600">Já tem uma conta? </span>
            <Link to="/login" className="font-medium text-zinc-900 bg-white hover:text-zinc-700">
              Faça login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
