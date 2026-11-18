/**
 * Phase 6 screenshot capture (headless Chrome via puppeteer-core).
 * 430x932 CSS px at deviceScaleFactor 2 = 860x1864 PNGs; the viewport grows to the full content height.
 * Writes <OUT>/midnight-<id>.png and <OUT>/grove-<id>.png, the same names as the mockups.
 *
 * Setup (once):  cd briefs/tools && npm i --no-save --no-package-lock puppeteer-core   (node_modules is git-ignored)
 * Run:   node capture-phase6.mjs                 # all 85 screens x 2 themes
 *        node capture-phase6.mjs 55-safety-reporting 56-ncmec-policy   # just these
 * Env:   OUT (default ~/fitness-shots/phase6, outside the repo), BASE (default http://127.0.0.1:8787/dev-preview), CHROME (path to Chrome)
 * Needs: a web export built with EXPO_PUBLIC_SCREEN_PREVIEW=1, served by spa-server.py.
 * Don't commit the PNGs unless Kevin asks.
 */
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const OUT = process.env.OUT || path.join(process.env.HOME || '.', 'fitness-shots', 'phase6');
const BASE = process.env.BASE || 'http://127.0.0.1:8787/dev-preview';
const CHROME = process.env.CHROME ||
  (process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : '/usr/bin/google-chrome');
const WIDTH = 430;
const MIN_H = 932;

const SCREENS = [
  '01-become-a-coach',
  '02-apply-intro',
  '03-age-attestation',
  '03b-age-attestation-on',
  '04-certification',
  '05-identity-check',
  '06-coach-terms',
  '06b-coach-terms-on',
  '06c-coach-terms-nudge',
  '07-apply-pending',
  '08-apply-approved',
  '09-apply-need-info',
  '10-minors-intro',
  '11-abuse-training',
  '12-abuse-training-attest',
  '12b-abuse-training-attest-on',
  '13-minors-pending',
  '14-minors-approved',
  '15-minors-not-approved',
  '15b-minors-name-match',
  '16-studio-locked',
  '17-studio-clients',
  '17b-studio-clients-deletion-banner',
  '18-studio-clients-empty',
  '19-client-adult',
  '20-client-adult-photos',
  '21-client-teen',
  '22-end-relationship',
  '23-plan-week',
  '24-plan-day',
  '25-plan-add-exercise',
  '26-plan-empty',
  '27-tempo-editor',
  '28-tempo-per-set',
  '29-activity',
  '30-activity-tempo-hidden',
  '31-activity-empty',
  '32-coach-picks',
  '33-coach-picks-add',
  '34-coach-picks-full',
  '35-coach-picks-empty',
  '36-library-browse',
  '37-library-my-exercises',
  '38-library-empty',
  '39-library-detail',
  '40-library-edit-cues',
  '41-create-basics',
  '42-create-tracking',
  '43-create-demo',
  '44-record-demo',
  '45-trim-demo',
  '46-demo-pending',
  '47-client-view-custom',
  '48-report-video',
  '49-report-reasons',
  '50-video-removed-notice',
  '51-block-user',
  '52-blocked-list',
  '53-dmca-request',
  '53b-dmca-request-signed',
  '54-dmca-received',
  '55-safety-reporting',
  '56-ncmec-policy',
  '57-uploads-suspended',
  '58-ask-coach-delete',
  '59-ask-coach-delete-confirm',
  '60-ask-coach-delete-sent',
  '61-coach-deletion-request',
  '62-coach-deletion-confirm',
  '62b-coach-deletion-confirm-filled',
  '62c-coach-deletion-confirm-ready',
  '63-coach-deletion-done',
  '64-access-ended',
  '65-coach-settings-no-export',
  '66-deletion-reminder',
  '66b-deletion-reminder-push',
  '67-deletion-overdue',
  '68-account-suspended',
  '68b-suspension-push',
  '69-parent-coaching-ended',
  '70-teen-registry-disclosure',
  '70b-parent-registry-disclosure',
  '70c-cert-verified-teen',
  '70d-cert-verified-parent',
  '70e-parent-approval-pending',
];

const SCHEMES = [
  { scheme: 'dark', family: 'aurora', preset: 'midnight', prefix: 'midnight' },
  { scheme: 'light', family: 'aurora', preset: 'grove', prefix: 'grove' },
];

function urlFor(id, s) {
  return `${BASE}?screen=${encodeURIComponent(id)}&scheme=${s.scheme}&family=${s.family}&preset=${s.preset}&full=1`;
}

async function measureHeight(page) {
  return page.evaluate(() => {
    const MIN = 932;
    const vwH = window.innerHeight;
    const skipIfTallerThan = vwH * 0.85;

    function isOutOfFlow(el) {
      let n = el;
      while (n && n !== document.documentElement) {
        const st = getComputedStyle(n);
        if (st.position === 'absolute' || st.position === 'fixed' || st.position === 'sticky') {
          return true;
        }
        n = n.parentElement;
      }
      return false;
    }

    function skip(el) {
      if (!el || !el.getBoundingClientRect) return true;
      const tag = el.tagName;
      if (tag === 'SVG' || tag === 'PATH' || tag === 'DEFS' || tag === 'LINEARGRADIENT' || tag === 'STOP') return true;
      if (el.getAttribute && (el.getAttribute('data-vignette') != null || el.classList?.contains('vignette'))) return true;
      if (isOutOfFlow(el)) return true;
      const r = el.getBoundingClientRect();
      if (r.height >= skipIfTallerThan && r.top <= 2) return true;
      return false;
    }

    let maxBottom = 0;
    const walk = (el) => {
      if (!el) return;
      if (!skip(el)) {
        const r = el.getBoundingClientRect();
        const bottom = r.bottom + window.scrollY;
        if (Number.isFinite(bottom) && bottom > maxBottom) maxBottom = bottom;
      }
      for (const c of el.children) walk(c);
    };
    walk(document.body);
    return Math.max(MIN, Math.ceil(maxBottom));
  });
}

async function waitReady(page) {
  await page.waitForFunction(() => {
    const root = document.getElementById('root') || document.getElementById('main') || document.body;
    return root && root.innerText && root.innerText.trim().length > 8;
  }, { timeout: 20000 });
  await new Promise((r) => setTimeout(r, 250));
}

async function captureOne(page, id, s) {
  const dest = path.join(OUT, `${s.prefix}-${id}.png`);
  await page.setViewport({ width: WIDTH, height: MIN_H, deviceScaleFactor: 2 });
  await page.goto(urlFor(id, s), { waitUntil: 'networkidle0', timeout: 45000 });
  await waitReady(page);
  const h = await measureHeight(page);
  await page.setViewport({ width: WIDTH, height: h, deviceScaleFactor: 2 });
  await new Promise((r) => setTimeout(r, 120));
  await page.screenshot({ path: dest, fullPage: false, type: 'png' });
  return { dest, h };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const only = process.argv.slice(2);
  const screens = only.length ? only : SCREENS;
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars'],
  });
  const page = await browser.newPage();
  let ok = 0;
  let fail = 0;
  for (const s of SCHEMES) {
    for (const id of screens) {
      try {
        const r = await captureOne(page, id, s);
        ok += 1;
        console.log(`ok ${s.prefix}-${id} h=${r.h}`);
      } catch (e) {
        fail += 1;
        console.error(`FAIL ${s.prefix}-${id}: ${e.message || e}`);
      }
    }
  }
  await browser.close();
  console.log(`done ok=${ok} fail=${fail} total=${ok + fail}`);
  if (fail) process.exit(1);
}

main();
