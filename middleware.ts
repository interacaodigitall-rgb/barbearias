// @ts-nocheck
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Normaliza o hostname removendo porta, www e letras maiúsculas.
 * Exemplo: 'www.MisterNavalha.com:3000' -> 'misternavalha.com'
 */
function normalizeHostname(hostname: string | null): string {
  if (!hostname) return '';
  let clean = hostname.toLowerCase().trim();
  // Remove porta se houver (ex: localhost:3000)
  clean = clean.split(':')[0];
  // Trata e remove o prefixo 'www.'
  if (clean.startsWith('www.')) {
    clean = clean.substring(4);
  }
  return clean;
}

/**
 * Domínios padrão da plataforma SaaS onde o acesso por subcaminho (/:slug) é mantido.
 */
const DEFAULT_SAAS_DOMAINS = new Set([
  'probarbearias.vercel.app',
  'localhost',
  '127.0.0.1',
  '0.0.0.0'
]);

/**
 * Mapeamento estático e em memória de domínios personalizados para slugs de barbearia.
 * Em ambiente de produção com Firestore/Supabase, este mapa é consultado dinamicamente via cache ou API.
 */
const KNOWN_CUSTOM_DOMAINS: Record<string, string> = {
  'misternavalha.com': 'mister-navalha',
  'misternavalha.pt': 'mister-navalha',
  'barbeariarogerx.pt': 'rogerx-barbershop',
  'rogerxbarbershop.pt': 'rogerx-barbershop',
  'sherlocksbarber.pt': 'sherlocks'
};

/**
 * Consulta dinâmica a barbearias pelo domínio personalizado.
 * Suporta Firestore/Supabase ou fallback de cache em memória.
 */
async function getCompanySlugByDomain(hostname: string): Promise<string | null> {
  const normalized = normalizeHostname(hostname);
  if (!normalized) return null;

  // 1. Verificação no mapeamento direto
  if (KNOWN_CUSTOM_DOMAINS[normalized]) {
    return KNOWN_CUSTOM_DOMAINS[normalized];
  }

  // 2. Integração dinâmica com Firestore / Supabase (se variáveis de ambiente estiverem configuradas)
  try {
    const firestoreUrl = process.env.NEXT_PUBLIC_FIRESTORE_API_URL || process.env.FIRESTORE_REST_ENDPOINT;
    if (firestoreUrl) {
      const res = await fetch(`${firestoreUrl}/barbershops?custom_domain=${encodeURIComponent(normalized)}`, {
        headers: { 'Content-Type': 'application/json' },
        next: { revalidate: 60 } // Cache do Next.js de 60s
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.slug) {
          return data.slug;
        }
      }
    }
  } catch (error) {
    console.error('[Middleware] Erro ao buscar domínio personalizado no Firestore:', error);
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Ignorar arquivos estáticos, rotas internas do Next.js, API e favicons
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') || // ex: logo.png, favicon.ico, manifest.json
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Capturar o hostname dos cabeçalhos da requisição
  // Tenta primeiramente 'x-forwarded-host' para garantir o domínio real atrás de proxies (Vercel, Cloud Run, Cloudflare)
  const rawHost = request.headers.get('x-forwarded-host') || request.headers.get('host') || request.nextUrl.hostname;
  const hostname = normalizeHostname(rawHost);

  // Verificar se o domínio é o padrão do SaaS ou ambiente de desenvolvimento local/Cloud Run
  const isDefaultSaasDomain =
    DEFAULT_SAAS_DOMAINS.has(hostname) ||
    hostname.endsWith('.vercel.app') ||
    hostname.endsWith('.run.app') ||
    (process.env.NEXT_PUBLIC_SAAS_DOMAIN && hostname === normalizeHostname(process.env.NEXT_PUBLIC_SAAS_DOMAIN));

  // 1. Se for o domínio padrão do SaaS, mantém a navegação normal por subcaminho (ex: /mister-navalha)
  if (isDefaultSaasDomain) {
    return NextResponse.next();
  }

  // 2. Se for um domínio personalizado (ex: 'misternavalha.com' ou 'www.misternavalha.com'):
  const companySlug = await getCompanySlugByDomain(hostname);

  if (companySlug) {
    // Se a requisição já estiver direcionada para a rota slug correspondente, evita loop de rewrite
    if (pathname.startsWith(`/${companySlug}`)) {
      return NextResponse.next();
    }

    // Reescreve internamente para a rota `/${companySlug}${pathname}` sem alterar a URL no navegador do usuário
    const rewriteUrl = new URL(`/${companySlug}${pathname}${search}`, request.url);
    
    // Adiciona o cabeçalho 'x-custom-domain-tenant' para que a aplicação saiba qual tenant foi resolvido
    const response = NextResponse.rewrite(rewriteUrl);
    response.headers.set('x-custom-domain-tenant', companySlug);
    response.headers.set('x-original-hostname', hostname);
    return response;
  }

  // Fallback caso o domínio personalizado não seja encontrado no Firestore/Supabase
  return NextResponse.next();
}

/**
 * Configuração de Matcher do Middleware Next.js
 * Aplica o middleware em todas as páginas exceto assets estáticos
 */
export const config = {
  matcher: [
    /*
     * Match todas as rotas exceto:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. todos os arquivos com extensão (ex: favicon.ico, images)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|.*\\..*).*)',
  ],
};
