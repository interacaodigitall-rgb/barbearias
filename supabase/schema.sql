-- ============================================================================
-- SAAS BARBEARIAS - ESQUEMA MULTI-TENANT PARA POSTGRESQL / SUPABASE
-- Arquitetura Isolada com Row Level Security (RLS) e Chave 'company_id'
-- ============================================================================

-- 1. HABILITAR EXTENSÃO DE UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TIPOS CUSTOMIZADOS (ENUMS)
DO $$ BEGIN
    CREATE TYPE plan_type AS ENUM ('starter', 'pro', 'imperio');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('superadmin', 'owner', 'barber', 'client');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('debit', 'mbway', 'cash', 'multibanco', 'card', 'transfer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'paid');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE cash_flow_type AS ENUM ('income', 'expense');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABELA MASTER DE TENANTS: COMPANIES (Barbearias)
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    tagline TEXT DEFAULT 'Cortes clássicos, barba e estilo.',
    unit TEXT DEFAULT 'Matriz',
    city TEXT DEFAULT 'Lisboa',
    country TEXT DEFAULT 'Portugal',
    address TEXT,
    phone TEXT,
    logo_url TEXT,
    cover_image_url TEXT,
    primary_color TEXT DEFAULT '#d4a338', -- Cor de destaque da barbearia
    plan plan_type NOT NULL DEFAULT 'starter',
    active BOOLEAN NOT NULL DEFAULT true,
    trial_until TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '14 days'),
    monthly_fee NUMERIC(10, 2) DEFAULT 29.00,
    quiet_service_enabled BOOLEAN DEFAULT true,
    story_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Índices essenciais para consultas rápidas pelo slug público
CREATE INDEX IF NOT EXISTS idx_companies_slug ON public.companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_active ON public.companies(active);

-- 4. TABELA DE USUÁRIOS / PERFIS VINCULADOS A UMA BARBEARIA
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    role user_role NOT NULL DEFAULT 'client',
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_profiles_company ON public.profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 5. TABELA OPERACIONAL: SERVICES (Serviços da Barbearia)
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 15.00,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    image_url TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_services_company ON public.services(company_id);

-- 6. TABELA OPERACIONAL: BARBERS (Profissionais)
CREATE TABLE IF NOT EXISTS public.barbers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    bio TEXT,
    photo_url TEXT,
    rating NUMERIC(2, 1) DEFAULT 5.0,
    active BOOLEAN NOT NULL DEFAULT true,
    branch TEXT DEFAULT 'PT',
    compensation_type TEXT DEFAULT 'percentage', -- 'salary' | 'percentage'
    compensation_value NUMERIC(10, 2) DEFAULT 50.00, -- Ex: 50% de comissão
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_barbers_company ON public.barbers(company_id);

-- 7. TABELA OPERACIONAL: CLIENTS (Clientes Registrados da Barbearia)
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    loyalty_points INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_clients_company ON public.clients(company_id);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON public.clients(phone);

-- 8. TABELA OPERACIONAL: PRODUCTS (Produtos para Upsell no Caixa)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 15.00,
    category TEXT DEFAULT 'styling', -- 'cabelo' | 'barba' | 'tratamento'
    image_url TEXT,
    stock INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_products_company ON public.products(company_id);

-- 9. TABELA OPERACIONAL: APPOINTMENTS (Agendamentos dos Clientes)
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    barber_id UUID REFERENCES public.barbers(id) ON DELETE SET NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status appointment_status NOT NULL DEFAULT 'pending',
    cancellation_reason TEXT,
    payment_method payment_method DEFAULT 'mbway',
    payment_status payment_status DEFAULT 'pending',
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    quiet_service BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_appointments_company ON public.appointments(company_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_barber ON public.appointments(barber_id);

-- 10. TABELA OPERACIONAL: CASH_FLOW (Fluxo de Caixa, Entradas, Saídas e Comissões)
CREATE TABLE IF NOT EXISTS public.cash_flow (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    barber_id UUID REFERENCES public.barbers(id) ON DELETE SET NULL,
    type cash_flow_type NOT NULL, -- 'income' ou 'expense'
    category TEXT NOT NULL, -- 'service', 'product', 'commission', 'rent', 'supplies', 'utilities'
    description TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method payment_method DEFAULT 'cash',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_cash_flow_company ON public.cash_flow(company_id);
CREATE INDEX IF NOT EXISTS idx_cash_flow_date ON public.cash_flow(transaction_date);

-- ============================================================================
-- 11. FUNÇÕES DE SEGURANÇA E AUXILIARES DO SUPABASE (RLS HELPERS)
-- ============================================================================

-- Função que recupera o company_id do usuário logado via tabela profiles
CREATE OR REPLACE FUNCTION public.current_user_company_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT company_id 
        FROM public.profiles 
        WHERE id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função que verifica se o usuário autenticado é Super Admin da plataforma SaaS
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.profiles 
        WHERE id = auth.uid() AND role = 'superadmin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 12. HABILITAR ROW LEVEL SECURITY (RLS) EM TODAS AS TABELAS
-- ============================================================================
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_flow ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 13. POLÍTICAS DE SEGURANÇA (POLICIES) RLS
-- ============================================================================

-- ---- TABELA: COMPANIES ----
-- 1. Qualquer visitante (inclusive anônimo) pode visualizar barbearias ativas (Necessário para a rota pública /:slug)
CREATE POLICY "Public read active companies by slug"
    ON public.companies FOR SELECT
    USING (active = true);

-- 2. Super Admins podem realizar qualquer operação em companies
CREATE POLICY "Super Admins manage all companies"
    ON public.companies FOR ALL
    USING (public.is_super_admin());

-- 3. Donos (owners) podem atualizar os dados da sua própria barbearia
CREATE POLICY "Owners update own company"
    ON public.companies FOR UPDATE
    USING (id = public.current_user_company_id());

-- ---- TABELA: SERVICES ----
-- 1. Público/Clientes podem visualizar serviços de barbearias ativas
CREATE POLICY "Public read active services"
    ON public.services FOR SELECT
    USING (active = true);

-- 2. Admin do Tenant / Barbeiros podem gerenciar os serviços da sua barbearia
CREATE POLICY "Tenants manage their services"
    ON public.services FOR ALL
    USING (company_id = public.current_user_company_id() OR public.is_super_admin());

-- ---- TABELA: BARBERS ----
-- 1. Público/Clientes podem visualizar barbeiros ativos da barbearia
CREATE POLICY "Public read active barbers"
    ON public.barbers FOR SELECT
    USING (active = true);

-- 2. Dono da barbearia gerencia os profissionais da sua empresa
CREATE POLICY "Tenants manage their barbers"
    ON public.barbers FOR ALL
    USING (company_id = public.current_user_company_id() OR public.is_super_admin());

-- ---- TABELA: APPOINTMENTS ----
-- 1. Qualquer cliente pode inserir um agendamento para a barbearia selecionada
CREATE POLICY "Anyone can create appointment"
    ON public.appointments FOR INSERT
    WITH CHECK (true);

-- 2. Donos e Barbeiros só visualizam e alteram agendamentos da sua respectiva barbearia
CREATE POLICY "Tenants access their company appointments"
    ON public.appointments FOR ALL
    USING (company_id = public.current_user_company_id() OR public.is_super_admin());

-- ---- TABELA: CASH_FLOW ----
-- 1. Isolamento estrito: Apenas Donos e Super Admins acessam o fluxo de caixa da barbearia
CREATE POLICY "Tenants access their own cash flow"
    ON public.cash_flow FOR ALL
    USING (company_id = public.current_user_company_id() OR public.is_super_admin());

-- ---- TABELA: PRODUCTS ----
CREATE POLICY "Public read active products"
    ON public.products FOR SELECT
    USING (active = true);

CREATE POLICY "Tenants manage their products"
    ON public.products FOR ALL
    USING (company_id = public.current_user_company_id() OR public.is_super_admin());

-- ---- TABELA: CLIENTS ----
CREATE POLICY "Tenants manage their clients"
    ON public.clients FOR ALL
    USING (company_id = public.current_user_company_id() OR public.is_super_admin());

-- ============================================================================
-- 14. DADOS INICIAIS (SEED DATA) COM 3 TENANTS PARA TESTE IMEDIATO
-- ============================================================================
INSERT INTO public.companies (id, slug, name, tagline, unit, city, country, phone, primary_color, plan, active, monthly_fee)
VALUES 
    ('a0000000-0000-0000-0000-000000000001', 'mister-navalha', 'MISTER NAVALHA', 'Barbearia clássica & cuidados masculinos de alta performance', 'CENTRO', 'Guarda', 'Portugal', '+351 925 112 334', '#d4a338', 'imperio', true, 99.00),
    ('a0000000-0000-0000-0000-000000000002', 'seu-elias', 'BARBEARIA SEU ELIAS', 'Tradição, toalha quente e cortes impecáveis desde 2013', 'PRIME', 'Porto', 'Portugal', '+351 933 888 123', '#f5ab2b', 'pro', true, 59.00),
    ('a0000000-0000-0000-0000-000000000003', 'sherlocks', 'SHERLOCKS BARBER SHOP', 'Cortes modernos, barboterapia e ambiente vintage exclusivo', 'BAIXA', 'Lisboa', 'Portugal', '+351 919 444 777', '#c99738', 'starter', true, 29.00)
ON CONFLICT (slug) DO NOTHING;
