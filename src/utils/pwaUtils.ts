import { SaaSBarbershop } from '../models';

export function updateTenantHeadAndPWA(shop: SaaSBarbershop) {
  if (!shop) return;

  const logo = shop.logoUrl || "https://i.postimg.cc/wM0yfhrM/Gemini-Generated-Image-474jdt474jdt474j.jpg";
  const shopName = shop.name;
  const tagline = shop.tagline || 'Agendamento Online de Barbearia';

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

  // 3. Apple & App Titles
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

  // 4. Dynamic Web App Manifest
  const manifestObj = {
    name: shopName,
    short_name: shopName,
    description: `${shopName} - ${tagline}`,
    start_url: `/${shop.slug}`,
    display: "standalone",
    background_color: "#181615",
    theme_color: shop.primaryColor || "#d4a338",
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
