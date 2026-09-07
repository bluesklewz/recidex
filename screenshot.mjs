import puppeteer from 'puppeteer-core';
import { mkdir, readdir } from 'node:fs/promises';

const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';
const width = Number(process.argv[4] || 1440);
const height = Number(process.argv[5] || 900);

const outDir = './temporary screenshots';
await mkdir(outDir, { recursive: true });
const existing = await readdir(outDir).catch(() => []);
const nums = existing.map(f => Number((f.match(/screenshot-(\d+)/) || [])[1])).filter(Number.isFinite);
const n = (nums.length ? Math.max(...nums) : 0) + 1;
const name = `screenshot-${n}${label ? '-' + label : ''}.png`;

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--force-color-profile=srgb'] });
const page = await browser.newPage();
await page.setViewport({ width, height, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
await new Promise(r => setTimeout(r, 700));
await page.screenshot({ path: `${outDir}/${name}` });
await browser.close();
console.log(`${outDir}/${name}`);
