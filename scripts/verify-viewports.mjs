import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('scratch/screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: 'Small Mobile', width: 320, height: 568 },
  { name: 'Standard Mobile 360', width: 360, height: 640 },
  { name: 'Standard Mobile 375', width: 375, height: 667 },
  { name: 'Large Mobile 390', width: 390, height: 844 },
  { name: 'Large Mobile 430', width: 430, height: 932 },
  { name: 'Small Tablet', width: 600, height: 800 },
  { name: 'Tablet 768', width: 768, height: 1024 },
  { name: 'Large Tablet 1024', width: 1024, height: 768 },
  { name: 'Laptop 1280', width: 1280, height: 800 },
  { name: 'Desktop 1440', width: 1440, height: 900 },
  { name: 'Large Desktop 1920', width: 1920, height: 1080 }
];

const PAGES_TO_TEST = [
  { path: '/', name: 'Home', capture: true },
  { path: '/rooms', name: 'Rooms', capture: true },
  { path: '/login', name: 'Login', capture: true },
  { path: '/register', name: 'Register', capture: false },
  { path: '/dashboard', name: 'Guest Sanctuary', capture: false },
  { path: '/staff/dashboard', name: 'Staff Operations', capture: true },
  { path: '/staff/housekeeping', name: 'Housekeeping', capture: false },
  { path: '/manager/dashboard', name: 'Manager Executive', capture: true },
  { path: '/admin/dashboard', name: 'Admin Governance', capture: false }
];

async function launchBrowser() {
  try {
    return await chromium.launch({ headless: true });
  } catch (err) {
    console.log('Falling back to system edge/chrome channel...');
    try {
      return await chromium.launch({ headless: true, channel: 'msedge' });
    } catch (e2) {
      return await chromium.launch({ headless: true, channel: 'chrome' });
    }
  }
}

async function run() {
  console.log('--- Starting Roomly Responsive Design Viewport Verification ---');

  const browser = await launchBrowser();
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = [];
  let totalErrors = 0;

  for (const vp of VIEWPORTS) {
    console.log(`\nTesting Viewport: ${vp.name} (${vp.width}x${vp.height})...`);
    await page.setViewportSize({ width: vp.width, height: vp.height });

    for (const p of PAGES_TO_TEST) {
      const url = `http://localhost:5173${p.path}`;
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 5000 });
        await page.waitForTimeout(300);

        // Check horizontal overflow
        const overflowData = await page.evaluate(() => {
          const docEl = document.documentElement;
          const body = document.body;
          const scrollW = Math.max(docEl.scrollWidth, body.scrollWidth);
          const clientW = window.innerWidth;
          const hasOverflow = scrollW > clientW;

          const offending = [];
          if (hasOverflow) {
            const allEls = document.querySelectorAll('*');
            for (const el of allEls) {
              const rect = el.getBoundingClientRect();
              if (rect.right > clientW + 1) {
                offending.push({
                  tag: el.tagName,
                  className: el.className,
                  right: Math.round(rect.right),
                  width: Math.round(rect.width)
                });
                if (offending.length >= 3) break;
              }
            }
          }

          return {
            scrollW,
            clientW,
            hasOverflow,
            offending
          };
        });

        if (overflowData.hasOverflow) {
          console.error(`  ❌ [${vp.width}px] ${p.name}: OVERFLOW DETECTED! scrollWidth=${overflowData.scrollW} > clientWidth=${overflowData.clientW}`, overflowData.offending);
          totalErrors++;
          results.push({
            viewport: vp.width,
            page: p.name,
            status: 'FAIL',
            details: overflowData
          });
        } else {
          results.push({
            viewport: vp.width,
            page: p.name,
            status: 'PASS',
            scrollWidth: overflowData.scrollW
          });
        }

        // Capture screenshot on 320px, 768px, 1440px
        if (p.capture && (vp.width === 320 || vp.width === 768 || vp.width === 1440)) {
          const shotPath = path.join(SCREENSHOT_DIR, `${p.name.toLowerCase().replace(/\s+/g, '_')}_${vp.width}px.png`);
          await page.screenshot({ path: shotPath, fullPage: false });
        }
      } catch (err) {
        console.warn(`  ⚠️ Could not test ${p.name} on ${vp.width}px: ${err.message}`);
      }
    }
  }

  await browser.close();

  console.log('\n=============================================');
  console.log(`Viewport Verification Completed! Total Errors: ${totalErrors}`);
  console.log(`Passed: ${results.filter(r => r.status === 'PASS').length} / ${results.length}`);
  console.log('=============================================\n');

  if (totalErrors > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
