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

export function updateTenantHeadAndPWA(shop: SaaSBarbershop) {
  if (!shop) return;

  const logo = shop.logoUrl || "https://i.postimg.cc/wM0yfhrM/Gemini-Generated-Image-474jdt474jdt474j.jpg";
  const shopName = shop.name;
  const tagline = shop.tagline || 'Agendamento Online de Barbearia';
  const primaryColor = shop.primaryColor || '#d4a338';

  // 1. Page Title
  document.title = `${shopName} - Agendamento Online`;

  // 2. Favicons & Apple Touch Icons
  const rels = ['icon', 'shortcut icon', 'apple-touch-icon'];
  rels.forEach(rel => {
    let link: HTMLLinkElement | null = document.querySelector(`link[rel='${rel}']`);
    if (!link) {
      link = document.createElement('link');
      link.rel = rel;
      document.head.appendChild(link);
    }
    link.href = logo;
  });

  // 3. Apple & Theme Metas
  let appNameMeta = document.querySelector("meta[name='application-name']") as HTMLMetaElement;
  if (!appNameMeta) {
    appNameMeta = document.createElement('meta');
    appNameMeta.name = 'application-name';
    document.head.appendChild(appNameMeta);
  }
  appNameMeta.content = shopName;

  let appleMeta = document.querySelector("meta[name='apple-mobile-web-app-title']") as HTMLMetaElement;
  if (!appleMeta) {
    appleMeta = document.createElement('meta');
    appleMeta.name = 'apple-mobile-web-app-title';
    document.head.appendChild(appleMeta);
  }
  appleMeta.content = shopName;

  let appleCapableMeta = document.querySelector("meta[name='apple-mobile-web-app-capable']") as HTMLMetaElement;
  if (!appleCapableMeta) {
    appleCapableMeta = document.createElement('meta');
    appleCapableMeta.name = 'apple-mobile-web-app-capable';
    document.head.appendChild(appleCapableMeta);
  }
  appleCapableMeta.content = 'yes';

  let appleStatusMeta = document.querySelector("meta[name='apple-mobile-web-app-status-bar-style']") as HTMLMetaElement;
  if (!appleStatusMeta) {
    appleStatusMeta = document.createElement('meta');
    appleStatusMeta.name = 'apple-mobile-web-app-status-bar-style';
    document.head.appendChild(appleStatusMeta);
  }
  appleStatusMeta.content = 'black-translucent';

  let themeMeta = document.querySelector("meta[name='theme-color']") as HTMLMetaElement;
  if (!themeMeta) {
    themeMeta = document.createElement('meta');
    themeMeta.name = 'theme-color';
    document.head.appendChild(themeMeta);
  }
  themeMeta.content = primaryColor;

  // 4. Dynamic Web App Manifest
  const manifestObj = {
    name: shopName,
    short_name: shopName,
    description: `${shopName} - ${tagline}`,
    start_url: `/${shop.slug}`,
    scope: `/${shop.slug}`,
    display: "standalone",
    orientation: "portrait",
    background_color: "#0f0f10",
    theme_color: primaryColor,
    icons: [
      {
        src: logo,
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: logo,
        sizes: "512x512",
        type: "image/png",
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

