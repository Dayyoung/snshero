import React from 'react';
import ReactDOMServer from 'react-dom/server';
import fs from 'fs';
import path from 'path';

// Setup browser globals
(global as any).window = {
  AudioContext: class {
    createOscillator() {
      return {
        connect: () => {},
        start: () => {},
        stop: () => {},
        frequency: {
          setValueAtTime: () => {},
          exponentialRampToValueAtTime: () => {},
        },
      };
    }
    createGain() {
      return {
        connect: () => {},
        gain: {
          setValueAtTime: () => {},
          linearRampToValueAtTime: () => {},
          exponentialRampToValueAtTime: () => {},
        },
      };
    }
    currentTime = 0;
    destination = {};
  },
  webkitAudioContext: class {},
  addEventListener: () => {},
  removeEventListener: () => {},
  innerWidth: 390,
  innerHeight: 844,
  location: { reload: () => {} },
  navigator: { userAgent: 'Mozilla/5.0' },
};

(global as any).document = {
  addEventListener: () => {},
  removeEventListener: () => {},
  createElement: (tag: string) => ({
    tagName: tag.toUpperCase(),
    getContext: () => ({
      fillRect: () => {},
      clearRect: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      arc: () => {},
      arcTo: () => {},
      ellipse: () => {},
      fill: () => {},
      stroke: () => {},
      fillText: () => {},
      strokeText: () => {},
      measureText: () => ({ width: 10, actualBoundingBoxAscent: 5, actualBoundingBoxDescent: 5 }),
      drawImage: () => {},
      save: () => {},
      restore: () => {},
      translate: () => {},
      rotate: () => {},
      scale: () => {},
      setLineDash: () => {},
      roundRect: () => {},
      createLinearGradient: () => ({ addColorStop: () => {} }),
      createRadialGradient: () => ({ addColorStop: () => {} }),
      shadowColor: '',
      shadowBlur: 0,
      globalAlpha: 1,
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      lineCap: 'round',
      lineJoin: 'round',
      font: '',
      textAlign: 'center',
      textBaseline: 'middle',
    }),
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 390, height: 600, right: 390, bottom: 600 }),
    style: {},
  }),
};

(global as any).localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
};

(global as any).requestAnimationFrame = () => 1;
(global as any).cancelAnimationFrame = () => {};
(global as any).Image = class {
  src = '';
  onload = () => {};
  width = 100;
  height = 100;
};

const pokiDir = path.resolve(process.cwd(), 'src/components/poki');
const files = fs.readdirSync(pokiDir).filter(f => f.endsWith('.tsx')).sort();

console.log(`Starting comprehensive SSR render audit on all ${files.length} Poki game components...`);

const dummyDeck = [
  { id: 'hero-1', name: '빛의 기사', element: 'light', attack: 150, hp: 120, defense: 80, speed: 70, level: 1 },
  { id: 'hero-2', name: '어둠의 자객', element: 'dark', attack: 180, hp: 90, defense: 60, speed: 95, level: 1 },
];

const mockProps = {
  deck: dummyDeck,
  language: 'ko',
  lowSpecMode: false,
  playSfx: () => {},
  onExit: () => {},
  onBack: () => {},
  onClose: () => {},
  onReward: () => {},
};

async function runAudit() {
  let passed = 0;
  let failed = 0;
  const errors: { file: string; error: string; stack?: string }[] = [];

  for (const fn of files) {
    const compName = fn.replace('.tsx', '');
    try {
      const fullPath = path.join(pokiDir, fn);
      const mod = await import(fullPath);
      const Comp = mod[compName] || mod.default;
      if (!Comp) {
        throw new Error(`Component ${compName} not found in exports of ${fn}`);
      }

      const el = React.createElement(Comp, mockProps as any);
      const html = ReactDOMServer.renderToString(el);
      if (html && html.length > 0) {
        passed++;
        process.stdout.write('.');
      } else {
        throw new Error(`Empty rendered HTML output for ${compName}`);
      }
    } catch (err: any) {
      failed++;
      process.stdout.write('F');
      errors.push({ file: fn, error: err.message, stack: err.stack });
    }
  }

  console.log('\n');
  console.log(`=== 110 Games SSR Render Audit Result ===`);
  console.log(`Passed: ${passed} / ${files.length}`);
  console.log(`Failed: ${failed} / ${files.length}`);

  if (errors.length > 0) {
    console.error('\nFAILURES DETECTED:');
    for (const e of errors) {
      console.error(`- [${e.file}]: ${e.error}`);
    }
    process.exit(1);
  } else {
    console.log('\n🎉 ALL 110 POKI GAME COMPONENTS SUCCESSFULLY RENDERED WITHOUT ANY ERRORS! 🎉');
  }
}

runAudit();
