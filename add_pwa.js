const fs = require('fs');
let c = fs.readFileSync('src/pages/Home.tsx', 'utf8');

const target = 'to={slug ? `/${slug}/booking` : `/${activeShop.slug}/booking`}\n               className="hidden sm:inline-flex items-center gap-2 bg-[#252321] hover:bg-[#1a1817] text-[#f5ab2b] font-black px-5 py-2.5 text-xs uppercase tracking-widest transition-all shadow-md hover:shadow-lg"';

const replacement = `
            <button
              onClick={handleInstallPwa}
              className="hidden md:inline-flex items-center gap-1.5 bg-[#f5ab2b]/10 hover:bg-[#f5ab2b]/20 text-[#f5ab2b] border border-[#f5ab2b]/30 font-bold px-4 py-2.5 text-xs uppercase tracking-wider rounded-xl transition-all"
              title="Baixar App PWA"
            >
              <Smartphone size={14} />
              Baixar App PWA
            </button>
            <Link 
               to={slug ? \`/\${slug}/booking\` : \`/\${activeShop.slug}/booking\`}
               className="hidden sm:inline-flex items-center gap-2 bg-[#252321] hover:bg-[#1a1817] text-[#f5ab2b] font-black px-5 py-2.5 text-xs uppercase tracking-widest transition-all shadow-md hover:shadow-lg"`;

if (c.includes(target)) {
  c = c.replace(target, replacement);
  fs.writeFileSync('src/pages/Home.tsx', c, 'utf8');
  console.log('Successfully added PWA button via script');
} else {
  console.log('Target not found');
}
