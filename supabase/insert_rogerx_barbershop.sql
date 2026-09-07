-- ============================================================================
-- SCRIPT DE INSERÇÃO: ROGER'X BARBERSHOP (TENANT, BARBEIROS E SERVIÇOS)
-- Banco de Dados: PostgreSQL / Supabase Multi-Tenant
-- ============================================================================

DO $$
DECLARE
    v_company_id UUID;
BEGIN
    -- 1. INSERIR OU ATUALIZAR A EMPRESA (TENANT MASTER)
    INSERT INTO public.companies (
        slug,
        name,
        tagline,
        unit,
        city,
        country,
        address,
        phone,
        plan,
        active,
        monthly_fee,
        primary_color,
        story_text,
        quiet_service_enabled
    )
    VALUES (
        'rogerx-barbershop',
        'Roger''X BarberShop',
        'Barber | Tattoos | Piercings | Formação de Barbeiros',
        'Belas',
        'Belas',
        'Portugal',
        'Belas, Sintra, Portugal',
        '+351 910 000 123',
        'pro',
        true,
        59.00,
        '#d4a338',
        'Especialistas em arte capilar, cortes contemporâneos, barboterapia, tattoos, piercings e formação de barbeiros profissionais em Belas, Portugal. Atendimento de Segunda a Sábado, das 9h às 20h.',
        true
    )
    ON CONFLICT (slug) DO UPDATE
    SET 
        name = EXCLUDED.name,
        tagline = EXCLUDED.tagline,
        unit = EXCLUDED.unit,
        city = EXCLUDED.city,
        address = EXCLUDED.address,
        story_text = EXCLUDED.story_text,
        plan = EXCLUDED.plan,
        updated_at = NOW()
    RETURNING id INTO v_company_id;

    RAISE NOTICE 'Roger''X BarberShop cadastrada com sucesso! Company ID: %', v_company_id;

    -- 2. INSERIR EQUIPE DE PROFISSIONAIS (BARBEIROS)
    -- Limpa registros prévios do tenant caso necessário para idempotência
    DELETE FROM public.barbers WHERE company_id = v_company_id;

    INSERT INTO public.barbers (
        company_id,
        name,
        bio,
        rating,
        active,
        branch,
        compensation_type,
        compensation_value
    )
    VALUES
        (v_company_id, 'Roger', 'Master Barber & Fundador. Especialista em visagismo, arte capilar e formação profissional.', 5.0, true, 'PT', 'percentage', 60.00),
        (v_company_id, 'Vítor Bitrekas', 'Barbeiro especialista em degradês de precisão milimétrica e barboterapia.', 5.0, true, 'PT', 'percentage', 50.00),
        (v_company_id, 'Fernando', 'Barbeiro profissional com domínio em cortes clássicos e corte com pigmentação.', 5.0, true, 'PT', 'percentage', 50.00),
        (v_company_id, 'Barbudo', 'Barbeiro mestre em barboterapia com toalha quente e cuidados faciais tradicionais.', 5.0, true, 'PT', 'percentage', 50.00);

    RAISE NOTICE '4 Barbeiros inseridos com sucesso para a empresa %', v_company_id;

    -- 3. INSERIR CATÁLOGO DE SERVIÇOS E PREÇOS (11 SERVIÇOS REAIS)
    DELETE FROM public.services WHERE company_id = v_company_id;

    INSERT INTO public.services (
        company_id,
        name,
        description,
        price,
        duration_minutes,
        active
    )
    VALUES
        (v_company_id, 'Corte', 'Corte de cabelo tradicional ou contemporâneo com acabamento na navalha e finalização.', 13.00, 30, true),
        (v_company_id, 'Barba', 'Alinhamento, toalha quente, navalha e hidratação com óleo essencial para barba.', 10.00, 20, true),
        (v_company_id, 'Corte e Barba', 'Combo completo com corte estilizado e tratamento completo de barba na navalha.', 20.00, 60, true),
        (v_company_id, 'Barboterapia', 'Tratamento de alto padrão com toalha quente, vapor de ozônio, esfoliação facial e massagem.', 20.00, 40, true),
        (v_company_id, 'Limpeza de Pele', 'Higienização facial profunda, remoção de impurezas, cravos e máscara restauradora.', 15.00, 30, true),
        (v_company_id, 'Coloração', 'Procedimento químico completo de descoloração, platinado uniforme ou tingimento capilar.', 30.00, 125, true),
        (v_company_id, 'Arte Capilar', 'Freestyle, riscos, desenhos geométricos e arte com lâmina afiada.', 5.00, 20, true),
        (v_company_id, 'Design de Sobrancelha', 'Alinhamento facial, limpeza e desenho milimétrico na navalha ou pinça.', 5.00, 15, true),
        (v_company_id, 'Rapar', 'Corte rente na máquina zero ou raspado com lâmina e loção pós-barba refrescante.', 5.00, 15, true),
        (v_company_id, 'Pack de Serviços', 'Experiência VIP completa: corte, barba alinhada, tratamento facial e sobrancelha.', 30.00, 80, true),
        (v_company_id, 'Corte com Pigmentação', 'Corte degradê de alta definição acompanhado de pigmentação para realçar contornos.', 18.00, 40, true);

    RAISE NOTICE '11 Serviços inseridos com sucesso para a Roger''X BarberShop!';
END $$;
