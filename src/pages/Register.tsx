import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';

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
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-zinc-100">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-zinc-900">
            Criar conta de Cliente
          </h2>
          <p className="mt-2 text-center text-sm text-zinc-600">
            Barbeiros devem fazer o primeiro acesso pela tela de Login.
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
                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-zinc-300 placeholder-zinc-500 text-zinc-900 focus:outline-none focus:ring-zinc-900 focus:border-zinc-900 focus:z-10 sm:text-sm"
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
                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-zinc-300 placeholder-zinc-500 text-zinc-900 focus:outline-none focus:ring-zinc-900 focus:border-zinc-900 focus:z-10 sm:text-sm"
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
                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-zinc-300 placeholder-zinc-500 text-zinc-900 focus:outline-none focus:ring-zinc-900 focus:border-zinc-900 focus:z-10 sm:text-sm"
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
                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-zinc-300 placeholder-zinc-500 text-zinc-900 focus:outline-none focus:ring-zinc-900 focus:border-zinc-900 focus:z-10 sm:text-sm"
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
            <Link to="/login" className="font-medium text-zinc-900 hover:text-zinc-700">
              Faça login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
