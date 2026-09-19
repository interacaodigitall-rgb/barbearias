/**
 * Vercel Edge Middleware Resiliente para SaaS Multi-Tenant (Vite / React / Vercel Edge Runtime)
 * Utiliza APIs Web Padrão (Request, Response, URL, Headers) sem importações do 'next/server',
 * garantindo compatibilidade nativa no Vercel e prevenindo erros 500 (MIDDLEWARE_INVOCATION_FAILED).
 */

function normalizeHostname(hostname: string | null): string {
  if (!hostname) return '';
  let clean = hostname.toLowerCase().trim();
  clean = clean.split(':')[0]; // Remove porta se houver (ex: localhost:3000)
  if (clean.startsWith('www.')) {
    clean = clean.substring(4); // Remove 'www.'
  }
  return clean;
}

const DEFAULT_SAAS_DOMAINS = new Set([
  'probarbearias.vercel.app',
  'localhost',
  '127.0.0.1',
  '0.0.0.0'
]);

const KNOWN_CUSTOM_DOMAINS: Record<string, string> = {
  'misternavalha.com': 'mister-navalha',
  'misternavalha.pt': 'mister-navalha',
  'barbeariarogerx.pt': 'rogerx-barbershop',
  'rogerxbarbershop.pt': 'rogerx-barbershop',
  'sherlocksbarber.pt': 'sherlocks'
};

export default async function middleware(request: Request): Promise<Response | undefined> {
  // BLOCO GLOBAL DE EXCEÇÃO: GARANTE QUE ERROS NÃO TRATADOS NUNCA GEREM STATUS 500 NO VERCEL
  try {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const search = url.search;

    // 1. Ignorar ativos estáticos, chamadas de API e arquivos de sistema
    if (
      pathname.startsWith('/api') ||
      pathname.startsWith('/assets') ||
      pathname === '/favicon.ico' ||
      pathname === '/robots.txt' ||
      pathname === '/manifest.json' ||
      pathname.includes('.')
    ) {
      return undefined; // Pass-through direto para o roteamento estático do Vercel
    }

    // 2. Extração segura do hostname a partir dos cabeçalhos de rede do Vercel
    const rawHost =
      request.headers.get('x-custom-domain') ||
      request.headers.get('x-forwarded-host') ||
      request.headers.get('host') ||
      url.hostname;

    const hostname = normalizeHostname(rawHost);

    // 3. Se for o domínio principal do SaaS ou ambiente local, mantém navegação normal SPA
    const isDefaultSaasDomain =
      DEFAULT_SAAS_DOMAINS.has(hostname) ||
      hostname.endsWith('.vercel.app') ||
      hostname.endsWith('.run.app') ||
      (process.env.NEXT_PUBLIC_SAAS_DOMAIN && hostname === normalizeHostname(process.env.NEXT_PUBLIC_SAAS_DOMAIN));

    if (isDefaultSaasDomain) {
      return undefined; // Pass-through seguro para index.html / subcaminho /:slug
    }

    // 4. Mapeamento para domínios personalizados (ex: 'misternavalha.com' -> '/mister-navalha')
    const companySlug = KNOWN_CUSTOM_DOMAINS[hostname];

    if (companySlug) {
      // Evitar loops se o caminho já possuir o slug do tenant
      if (pathname.startsWith(`/${companySlug}`)) {
        return undefined;
      }

      // Se acessar a raiz do domínio personalizado ('/'), redireciona suavemente para a rota do tenant
      if (pathname === '/' || pathname === '') {
        const targetUrl = new URL(`/${companySlug}${search}`, request.url);
        return Response.redirect(targetUrl, 307);
      }
    }

    return undefined; // Fallback seguro
  } catch (error) {
    // FALLBACK ABSOLUTO: Em qualquer exceção no Edge Runtime, retorna undefined para permitir o carregamento da página
    console.error('[Vercel Edge Middleware Error]:', error);
    return undefined;
  }
}

/**
 * Configuração de Matcher do Vercel Edge Runtime
 * Executa apenas em páginas públicas e ignora assets e extensões
 */
export const config = {
  matcher: [
    '/((?!api|assets|_next|favicon.ico|manifest.json|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot|json)$).*)',
  ],
};
