import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'node:fs';

const svg = readFileSync(new URL('./icon-source.svg', import.meta.url), 'utf8');
const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1024 } });
const png = resvg.render().asPng();
writeFileSync(new URL('../src-tauri/icon-source.png', import.meta.url), png);
console.log('wrote src-tauri/icon-source.png', png.length, 'bytes');
