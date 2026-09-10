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

export const OFFICIAL_PWA_ICON = "https://iili.io/n34KhGf.jpg";

export function updateTenantHeadAndPWA(shop: SaaSBarbershop) {
  if (!shop || typeof document === 'undefined') return;

  const shopName = shop.name || "Roger'X Barber";
  const tagline = shop.tagline || 'Agendamento Online de Barbearia';

  // 1. Page Title
  document.title = `${shopName} - Agendamento Online`;

  // 2. Absolute Icon URL strictly enforced for iOS Safari
  const iconUrl = OFFICIAL_PWA_ICON;

  // Helper to upsert link tags
  const setLinkTag = (rel: string, href: string, sizes?: string) => {
    const selector = sizes 
      ? `link[rel='${rel}'][sizes='${sizes}']` 
      : `link[rel='${rel}']:not([sizes])`;
    let el = document.querySelector(selector) as HTMLLinkElement;
    if (!el) {
      el = document.createElement('link');
      el.rel = rel;
      if (sizes) el.setAttribute('sizes', sizes);
      document.head.appendChild(el);
    }
    el.href = href;
  };

  // Specific 180x180 and fallback Apple Touch Icons required by iOS Safari for home screen icon
  setLinkTag('apple-touch-icon', iconUrl, '180x180');
  setLinkTag('apple-touch-icon', iconUrl);
  setLinkTag('apple-touch-icon-precomposed', iconUrl, '180x180');
  setLinkTag('apple-touch-icon-precomposed', iconUrl);
  setLinkTag('icon', iconUrl);
  setLinkTag('shortcut icon', iconUrl);

  // 3. Metatags for iOS Mobile & Fullscreen Standalone
  const metas = [
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
    { name: 'apple-mobile-web-app-title', content: shopName },
    { name: 'application-name', content: shopName },
    { name: 'theme-color', content: '#000000' }
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

  // Open Graph Image
  let ogImage = document.querySelector("meta[property='og:image']") as HTMLMetaElement;
  if (!ogImage) {
    ogImage = document.createElement('meta');
    ogImage.setAttribute('property', 'og:image');
    document.head.appendChild(ogImage);
  }
  ogImage.content = iconUrl;

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
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      {
        src: OFFICIAL_PWA_ICON,
        sizes: "192x192",
        type: "image/jpeg",
        purpose: "any maskable"
      },
      {
        src: OFFICIAL_PWA_ICON,
        sizes: "512x512",
        type: "image/jpeg",
        purpose: "any maskable"
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

