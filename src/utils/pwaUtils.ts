import { SaaSBarbershop } from '../models';

export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then(
        (reg) => {
          console.log('PWA ServiceWorker registrado com sucesso:', reg.scope);
        },
        (err) => {
          console.warn('Falha no registro do ServiceWorker:', err);
        }
      );
    });
  }
}

function getAbsoluteUrl(url: string): string {
  if (!url) return window.location.origin + '/logo-roger.png';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  try {
    return new URL(url, window.location.origin).href;
  } catch (e) {
    return window.location.origin + (url.startsWith('/') ? url : '/' + url);
  }
}

export function updateTenantHeadAndPWA(shop: SaaSBarbershop) {
  if (!shop) return;

  const rawLogo = shop.logoUrl || "/logo-roger.png";
  const absoluteLogo = getAbsoluteUrl(rawLogo);
  const shopName = shop.name || "Barbearia";
  const tagline = shop.tagline || 'Agendamento Online de Barbearia';
  const primaryColor = shop.primaryColor || '#d4a338';

  // 1. Page Title
  document.title = `${shopName} - Agendamento Online`;

  // 2. Favicons & Apple Touch Icons directly on <head>
  const rels = ['icon', 'shortcut icon', 'apple-touch-icon', 'apple-touch-icon-precomposed'];
  rels.forEach(rel => {
    let link: HTMLLinkElement | null = document.querySelector(`link[rel='${rel}']`);
    if (!link) {
      link = document.createElement('link');
      link.rel = rel;
      document.head.appendChild(link);
    }
    link.href = absoluteLogo;
  });

  // 3. Metatags for Mobile & Fullscreen Standalone
  const metas = [
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
    { name: 'apple-mobile-web-app-title', content: shopName },
    { name: 'application-name', content: shopName },
    { name: 'theme-color', content: primaryColor }
  ];

  metas.forEach(({ name, content }) => {
    let metaEl = document.querySelector(`meta[name='${name}']`) as HTMLMetaElement;
    if (!metaEl) {
      metaEl = document.createElement('meta');
      metaEl.name = name;
      document.head.appendChild(metaEl);
    }
    metaEl.content = content;
  });

  // 4. Dynamic Web App Manifest
  const startUrl = `/${shop.slug}`;
  const manifestObj = {
    name: shopName,
    short_name: shopName.length > 15 ? shopName.substring(0, 15) : shopName,
    description: `${shopName} - ${tagline}`,
    start_url: startUrl,
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0f0f10",
    theme_color: primaryColor,
    icons: [
      {
        src: absoluteLogo,
        sizes: "192x192",
        purpose: "any maskable"
      },
      {
        src: absoluteLogo,
        sizes: "512x512",
        purpose: "any maskable"
      },
      {
        src: absoluteLogo,
        sizes: "192x192",
        purpose: "any"
      },
      {
        src: absoluteLogo,
        sizes: "512x512",
        purpose: "any"
      }
    ]
  };

  try {
    const stringManifest = JSON.stringify(manifestObj);
    const blob = new Blob([stringManifest], { type: 'application/json' });
    const manifestUrl = URL.createObjectURL(blob);

    let manifestLink = document.querySelector("link[rel='manifest']") as HTMLLinkElement;
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      document.head.appendChild(manifestLink);
    }
    manifestLink.href = manifestUrl;
  } catch (err) {
    console.error('Error updating PWA manifest:', err);
  }
}

