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
  clean = clean.split(':')[0]; // Remove porta se houver
  if (clean.startsWith('www.')) {
    clean = clean.substring(4); // Remove 'www.'
  }
  return clean;
}

/**
 * Domínios padrão do SaaS onde o acesso por subcaminho (/:slug) é mantido.
 */
const DEFAULT_SAAS_DOMAINS = new Set([
  'probarbearias.vercel.app',
  'localhost',
  '127.0.0.1',
  '0.0.0.0'
]);

/**
 * Mapeamento em memória ultra-rápido (Edge Memory Cache)
 * Domínio personalizado -> Slug da empresa
 */
const KNOWN_CUSTOM_DOMAINS: Record<string, string> = {
  'misternavalha.com': 'mister-navalha',
  'misternavalha.pt': 'mister-navalha',
  'barbeariarogerx.pt': 'rogerx-barbershop',
  'rogerxbarbershop.pt': 'rogerx-barbershop',
  'sherlocksbarber.pt': 'sherlocks'
};

/**
 * Consulta resiliente para resolver o slug da empresa com timeout estrito no Vercel Edge
 */
async function getCompanySlugByDomain(hostname: string): Promise<string | null> {
  const normalized = normalizeHostname(hostname);
  if (!normalized) return null;

  // 1. Verificação instantânea em memória Edge
  if (KNOWN_CUSTOM_DOMAINS[normalized]) {
    return KNOWN_CUSTOM_DOMAINS[normalized];
  }

  // 2. Consulta externa com AbortController para prevenir estouro de tempo limite no Edge
  try {
    const firestoreUrl = process.env.NEXT_PUBLIC_FIRESTORE_API_URL || process.env.FIRESTORE_REST_ENDPOINT;
    if (firestoreUrl) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 600); // 600ms timeout estrito

      const res = await fetch(`${firestoreUrl}/barbershops?custom_domain=${encodeURIComponent(normalized)}`, {
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        next: { revalidate: 60 }
      }).finally(() => clearTimeout(timeoutId));

      if (res.ok) {
        const data = await res.json();
        if (data && data.slug) {
          return data.slug;
        }
      }
    }
  } catch (err) {
    // Falha silenciosa no Edge Fetching para garantir fallback sem erro 500
    console.warn('[Vercel Edge Middleware] Dynamic domain lookup warning:', err);
  }

  return null;
}

export async function middleware(request: NextRequest) {
  // BLOCO GLOBAL TRY/CATCH: NUNCA PERMITE QUE ERROS NÃO TRATADOS PRODUZAM STATUS 500 NO VERCEL
  try {
    const { pathname, search } = request.nextUrl;

    // 1. Ignorar arquivos estáticos, rotas internas do Next.js e requisições de API
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api') ||
      pathname.startsWith('/static') ||
      pathname === '/favicon.ico' ||
      pathname === '/robots.txt' ||
      pathname === '/manifest.json' ||
      pathname.includes('.') // ex: .png, .jpg, .svg, .css, .js
    ) {
      return NextResponse.next();
    }

    // 2. Capturar o hostname da requisição de forma segura
    const rawHost =
      request.headers.get('x-custom-domain') ||
      request.headers.get('x-forwarded-host') ||
      request.headers.get('host') ||
      request.nextUrl.hostname;

    const hostname = normalizeHostname(rawHost);

    // 3. Verificar se é o domínio padrão do SaaS ou ambiente local/Cloud Run
    const isDefaultSaasDomain =
      DEFAULT_SAAS_DOMAINS.has(hostname) ||
      hostname.endsWith('.vercel.app') ||
      hostname.endsWith('.run.app') ||
      (process.env.NEXT_PUBLIC_SAAS_DOMAIN && hostname === normalizeHostname(process.env.NEXT_PUBLIC_SAAS_DOMAIN));

    // Se for o domínio principal do SaaS, mantém navegação normal por subcaminho (/:slug)
    if (isDefaultSaasDomain) {
      return NextResponse.next();
    }

    // 4. Mapear e reescrever domínios personalizados (ex: 'misternavalha.com' -> '/mister-navalha')
    const companySlug = await getCompanySlugByDomain(hostname);

    if (companySlug) {
      // Prevenir loops infinitos se o caminho já iniciar com o slug correspondente
      if (pathname.startsWith(`/${companySlug}`)) {
        return NextResponse.next();
      }

      // Rewrite invisível mantendo o domínio personalizado intacto na barra de endereços
      const rewriteUrl = new URL(`/${companySlug}${pathname}${search}`, request.url);
      const response = NextResponse.rewrite(rewriteUrl);
      
      // Injetar cabeçalhos de contexto do tenant
      response.headers.set('x-custom-domain-tenant', companySlug);
      response.headers.set('x-original-hostname', hostname);
      return response;
    }

    // Fallback seguro caso o domínio personalizado não seja encontrado
    return NextResponse.next();
  } catch (error) {
    // FALLBACK DE SEGURANÇA TOTAL: Em caso de erro inesperado no Edge, retorna NextResponse.next()
    console.error('[Vercel Edge Middleware Exception Handler]:', error);
    return NextResponse.next();
  }
}

/**
 * Configuração do Matcher de Rotas
 * Aplica o middleware somente em páginas públicas e previne execuções desnecessárias em assets estáticos
 */
export const config = {
  matcher: [
    /*
     * Aplica o middleware em todas as requisições exceto:
     * - API (/api/*)
     * - Arquivos estáticos do Next.js (/_next/static/*, /_next/image/*)
     * - Todos os arquivos com extensões (.ico, .png, .jpg, .svg, .css, .js, .json, .woff, .ttf)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot|json)$).*)',
  ],
};
