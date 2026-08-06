const fs = require('fs');
let content = fs.readFileSync('src/cardDatabase.ts', 'utf8');

// The card lines end with either `}` or `,` and a newline.
// They usually look like: `stats: [1, 4, 1, 5] },` or `stats: [1, 4, 1, 5],` (if there's more properties)

content = content.replace(/stats:\s*\[([^\]]+)\]([^\n}]+)?(})?,?/g, (match, statsInner, afterStats, closingBrace) => {
  // if it already contains imageUrl, remove it
  let cleanMatch = match.replace(/,\s*imageUrl:\s*'[^']+'/, '');
  cleanMatch = cleanMatch.replace(/,\s*imageUrl:\s*"[^"]+"/, '');
  
  // now append imageUrl
  if (cleanMatch.includes('}')) {
    return cleanMatch.replace(/}/, `, imageUrl: 'https://i.ibb.co/5gvvLB16/card100.png' }`);
  } else {
    // it probably ends with a comma
    return cleanMatch.replace(/,$/, `, imageUrl: 'https://i.ibb.co/5gvvLB16/card100.png',`);
  }
});

// Since the user might have weird formatting around card 100:
// 100: { ..., stats: [9, 10, 4, 2],
//   imageUrl: 'https://i.ibb.co/5gvvLB16/card100.png'
// },
// Let's just do a simpler replace. It's better to just replace `stats: [a, b, c, d]` with `stats: [a, b, c, d], imageUrl: 'https://i.ibb.co/5gvvLB16/card100.png'`
// Wait, `imageUrl` would be added multiple times if we run this again, so we need to be careful.

let fixedContent = fs.readFileSync('src/cardDatabase.ts', 'utf8');
// remove all lines containing only imageUrl
fixedContent = fixedContent.replace(/\s*imageUrl:\s*['"][^'"]+['"],?/g, '');
// add it after stats
fixedContent = fixedContent.replace(/stats:\s*\[([^\]]+)\]/g, "stats: [$1], imageUrl: 'https://i.ibb.co/5gvvLB16/card100.png'");

fs.writeFileSync('src/cardDatabase.ts', fixedContent);
console.log('Update finished!');
