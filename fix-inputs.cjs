const fs = require('fs');
const glob = require('glob'); // Not available by default, but we can use child_process.execSync('find src -type f -name "*.tsx"')

const { execSync } = require('child_process');

const files = execSync('find src -type f -name "*.tsx"').toString().trim().split('\n');

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // A general regex to find className inside <input, <select, <textarea
  // Actually, let's just make sure text-zinc-900 bg-white is present.
  
  // Alternatively, just fix the ones we know:
  content = content.replace(/className="([^"]*)"/g, (match, classes) => {
    // Check if this looks like a form input class string
    if (classes.includes('border') && classes.includes('rounded') && (classes.includes('p-') || classes.includes('px-'))) {
        
        // Remove existing text-zinc-* or bg-* or text-white if any (but be careful not to remove others like bg-zinc-900 if it's a dark mode input)
        // Let's only target the ones that look like light mode form fields (e.g. border-zinc-200 or border-zinc-300)
        if (classes.includes('border-zinc-200') || classes.includes('border-zinc-300')) {
            let newClasses = classes
                .replace(/text-zinc-\d+/g, '')
                .replace(/bg-zinc-\d+/g, '')
                .replace(/bg-white/g, '')
                .replace(/text-white/g, '')
                .replace(/placeholder:text-zinc-\d+/g, '')
                .replace(/placeholder-zinc-\d+/g, '')
                .replace(/\s+/g, ' ')
                .trim();
            
            newClasses += ' text-zinc-900 bg-white placeholder:text-zinc-400';
            return `className="${newClasses}"`;
        }
    }
    return match;
  });

  fs.writeFileSync(file, content, 'utf8');
}
