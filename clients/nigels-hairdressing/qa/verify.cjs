#!/usr/bin/env node
/*
 * Nigel's Hairdressing — fidelity check.
 *
 * Compares the BUILT site (--impl) against the approved reference
 * (reference/index.html) in a real browser, at desktop and mobile widths:
 *   1. Copy        – every text probe exists, is visible/hidden the same way
 *   2. Type        – font family, size, weight, style, line-height, tracking, case, colour
 *   3. Colour      – section backgrounds and text colours
 *   4. Images      – right photos, size, crop (object-position), circle mask, sepia filter
 *   5. Links       – same set of hrefs (tel:, Instagram, CG Design, anchors)
 *   6. Motion      – hero hair-strand draw + sway animations: durations, delays, easing, keyframes
 *   7. Interaction – hover on photos / price cards / buttons, FAQ open + icon rotation, sticky header
 *   8. Accessibility – reduced-motion behaviour, fonts actually loaded
 *   9. Pixels      – full-page screenshot diff (animations frozen) with a % threshold
 *
 * Usage:
 *   npm i -D playwright && npx playwright install chromium
 *   node qa/verify.cjs --impl http://localhost:4321
 *   (optional) --ref <path-or-url>   default: ../reference/index.html
 *              --out <dir>           default: ./qa/report
 *              --skip-font-check     only if the machine has no internet for Google Fonts
 *
 * Exit code 0 = PASS, 1 = FAIL. A Markdown report and diff images land in --out.
 */
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

// ---------- args ----------
const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const flag = (k) => args.includes(k);
const IMPL = arg('--impl');
if (!IMPL) { console.error('Missing --impl <url>'); process.exit(2); }
const refArg = arg('--ref', path.join(__dirname, '..', 'reference', 'index.html'));
const REF = /^https?:|^file:/.test(refArg) ? refArg : pathToFileURL(path.resolve(refArg)).href;
const OUT = path.resolve(arg('--out', path.join(process.cwd(), 'qa', 'report')));
const SKIP_FONTS = flag('--skip-font-check');
fs.mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900, maxDiff: 0.02 },
  { name: 'mobile', width: 390, height: 844, maxDiff: 0.03 },
];

// Text probes: exact visible copy that must exist and be styled identically.
const PROBES = [
  'Nigel\'s Hairdressing', 'Recent work', 'Services', 'About Nigel', 'FAQ', 'Book a visit',
  'Mobile hairdresser · Wigan & Rochdale', 'home.', 'Call 07801 235104', 'View prices',
  '37 years', 'Salon trained in Manchester', 'Fully mobile', 'Mon – Sat', '10am – 7pm', 'Cut & blow £30', 'Ladies, in your own home',
  'And a real way with curly hair',
  '@nigelshairdressing', 'Blunt bob', 'Butterfly face-framing layers', 'Violet ombré', 'Half & half colour', 'Classic graduated bob',
  'Your look, next', 'Layers, 90s cuts, bobs, pixies & more', 'Get in touch →',
  'Honest prices. No salon fuss.', '01 · Ladies', '02 · Men\'s', '03 · Colour', 'Cut & blow', 'Tints & foils', '£30', '£17', 'Root tint', '£40', 'Foil highlights / lowlights', 'from £50',
  'Meet Nigel', 'some of the best in the business.', 'Trained by', 'Pierre Alexandre',
  'Good to know', 'Where do you cover?', 'Who is Nigel?', 'What do you specialise in?', 'How was the pink & amethyst colour done?', 'How do I book?', 'Do you work with curly hair?', 'Can you do colour at home?',
  'Book a home visit', 'Ready for a fresh cut?', 'Monday – Saturday, 10am – 7pm', 'Website by',
];
// Long paragraphs: must exist verbatim (whitespace-normalised).
const PARAGRAPHS = [
  'Thirty-seven years of salon-trained cutting and colour, learned in Manchester city centre from some of the best in the business. Nigel brings the whole salon to your front door.',
  'From sharp short bobs and soft face-framing layers to low-maintenance pixies and clean scissor cuts. Nigel tailors every style to fit your features, hair type and daily routine. Got an idea in mind? Get in touch and let\'s talk through what will work best for you.',
  'Every appointment happens in your own home. Not sure what you need? Give Nigel a ring and talk it through.',
  'Precision cuts finished with a blow-dry, tailored to your hair type — curly hair included.',
  'Sharp short hair work and texturising, done properly without leaving the house.',
  'Root touch-ups, foils, and bold semi-permanent shades on pre-lightened ends.',
  'Nigel Ashtonhurst has been cutting hair for 37 years. He specialises in precision cutting, short hair work and texturising techniques, and works especially well with curly hair. His knowledge goes far beyond the cut, too — after 37 years, there\'s very little about hair he doesn\'t know.',
  'The late Manchester hairdressing icon whose clients included David Bowie and Rod Stewart. Credited with pioneering unisex salons and foils, he opened his own school of hairdressing in Manchester in 1973.',
  'Wigan and Rochdale. Call to check your area and find a time that suits.',
  'Hello, my name is Nigel Ashtonhurst, a mobile hairdresser located in Rochdale and Wigan. I\'ve been a hairdresser for the past 37 years. I\'m salon trained in Manchester city centre and learned from some of the best in the business.',
  'Precision haircutting, short hair work and texturising techniques — and I work well with curly hair.',
  'This colour was achieved using a half-and-half technique. I used JOICO Colour Intensity semi-permanent Hot Pink and JOICO Colour Intensity semi-permanent Amethyst Purple on previously pre-lightened ends.',
  'This colour range works extremely well to brighten up blondes who are looking for something completely different for a few weeks.',
  'Call 07801 235104, Monday to Saturday between 10am and 7pm, and we\'ll sort a time.',
  'Yes — curly hair is one of Nigel\'s specialities.',
  'Yes — root tints from £40 and foil highlights or lowlights from £50, plus semi-permanent shades like the pink & amethyst above when you fancy something different.',
];
const IMAGES = ['blunt-bob', 'butterfly-layers', 'violet-ombre', 'half-and-half-colour', 'classic-graduated-bob'];
const SECTIONS = ['top', 'specialities', 'work', 'services', 'about', 'faq', 'book'];

// ---------- in-page helpers (stringified into the page) ----------
const PAGE_HELPERS = `
window.__norm = s => (s||'').replace(/[\\u2018\\u2019]/g,"'").replace(/\\s+/g,' ').trim();
window.__find = (text) => {
  const t = __norm(text).toLowerCase();
  let best = null;
  for (const el of document.body.querySelectorAll('*')) {
    if (['SCRIPT','STYLE','svg','path'].includes(el.tagName)) continue;
    const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join(' ');
    if (__norm(el.textContent).toLowerCase() !== t && __norm(own).toLowerCase() !== t) continue;
    if (!best || best.contains(el)) best = el;   // deepest match
    else if (!el.contains(best) && best.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_PRECEDING) best = el;
  }
  return best;
};
window.__bg = (el) => {
  while (el && el !== document.documentElement) {
    const c = getComputedStyle(el).backgroundColor;
    if (c && !/rgba\\(.*,\\s*0\\)$/.test(c) && c !== 'transparent') return c;
    el = el.parentElement;
  }
  return getComputedStyle(document.body).backgroundColor;
};
window.__style = (el) => {
  const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
  return {
    family: cs.fontFamily.split(',')[0].replace(/["']/g,'').trim().toLowerCase(),
    size: parseFloat(cs.fontSize), weight: cs.fontWeight, style: cs.fontStyle,
    lineHeight: cs.lineHeight === 'normal' ? 'normal' : parseFloat(cs.lineHeight),
    letterSpacing: cs.letterSpacing === 'normal' ? 0 : parseFloat(cs.letterSpacing),
    transform: cs.textTransform, color: cs.color, bg: __bg(el),
    visible: r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none',
  };
};
window.__freeze = () => {
  for (const a of document.getAnimations()) {
    try {
      const t = a.effect.getComputedTiming();
      if (t.iterations === Infinity) { a.pause(); a.currentTime = 0; } else a.finish();
    } catch (e) {}
  }
};
`;

async function openPage(browser, url, vp, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1, reducedMotion: opts.reducedMotion || 'no-preference' });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.addScriptTag({ content: PAGE_HELPERS });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  return { ctx, page };
}

// ---------- comparison helpers ----------
const results = [];
const record = (vp, area, name, ok, detail = '') => results.push({ vp, area, name, ok, detail });
const near = (a, b, tol) => typeof a === 'number' && typeof b === 'number' ? Math.abs(a - b) <= tol : a === b;
const rgb = (s) => (s || '').replace(/\s+/g, '');
function cmpStyle(vp, label, r, i) {
  if (!r) { record(vp, 'copy', label, false, 'missing in REFERENCE (update probe list)'); return; }
  if (!i) { record(vp, 'copy', label, false, 'text not found in build'); return; }
  const bad = [];
  if (r.visible !== i.visible) bad.push(`visible ${i.visible} ≠ ${r.visible}`);
  if (r.visible) {
    if (r.family !== i.family) bad.push(`font ${i.family} ≠ ${r.family}`);
    if (!near(r.size, i.size, 1)) bad.push(`size ${i.size} ≠ ${r.size}`);
    if (String(r.weight) !== String(i.weight)) bad.push(`weight ${i.weight} ≠ ${r.weight}`);
    if (r.style !== i.style) bad.push(`style ${i.style} ≠ ${r.style}`);
    if (!near(r.lineHeight, i.lineHeight, 2)) bad.push(`line-height ${i.lineHeight} ≠ ${r.lineHeight}`);
    if (!near(r.letterSpacing, i.letterSpacing, 0.5)) bad.push(`tracking ${i.letterSpacing} ≠ ${r.letterSpacing}`);
    if (r.transform !== i.transform) bad.push(`case ${i.transform} ≠ ${r.transform}`);
    if (rgb(r.color) !== rgb(i.color)) bad.push(`colour ${i.color} ≠ ${r.color}`);
    if (rgb(r.bg) !== rgb(i.bg)) bad.push(`background ${i.bg} ≠ ${r.bg}`);
  }
  record(vp, 'type', label, bad.length === 0, bad.join('; '));
}

async function probeAll(page) {
  return page.evaluate(({ PROBES, PARAGRAPHS, IMAGES, SECTIONS }) => {
    const out = { probes: {}, paragraphs: {}, images: {}, sections: {}, links: [] };
    for (const t of PROBES) { const el = __find(t); out.probes[t] = el ? __style(el) : null; }
    const bodyText = __norm(document.body.innerText + ' ' + [...document.querySelectorAll('details p')].map(p => p.textContent).join(' '));
    for (const p of PARAGRAPHS) out.paragraphs[p] = bodyText.includes(__norm(p));
    for (const stem of IMAGES) {
      const img = [...document.images].find(im => (im.currentSrc || im.src).includes(stem));
      if (!img) { out.images[stem] = null; continue; }
      const cs = getComputedStyle(img); const r = img.getBoundingClientRect();
      let clip = img.parentElement; while (clip && getComputedStyle(clip).overflow !== 'hidden') clip = clip.parentElement;
      const cr = clip ? clip.getBoundingClientRect() : r;
      const rad = clip ? parseFloat(getComputedStyle(clip).borderTopLeftRadius) : 0;
      out.images[stem] = { loaded: img.complete && img.naturalWidth > 0, w: Math.round(cr.width), h: Math.round(cr.height),
        fit: cs.objectFit, pos: cs.objectPosition, filter: cs.filter, circle: rad >= cr.width / 2 - 1, alt: !!img.alt };
    }
    for (const id of SECTIONS) { const s = document.getElementById(id); out.sections[id] = s ? __bg(s) : null; }
    out.links = [...new Set([...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')))].sort();
    out.height = document.documentElement.scrollHeight;
    return out;
  }, { PROBES, PARAGRAPHS, IMAGES, SECTIONS });
}

async function motionProbe(page) {
  return page.evaluate(() => {
    const hero = document.getElementById('top');
    const anims = hero ? hero.querySelector('svg') && [...hero.querySelectorAll('svg, svg *')].flatMap(el => el.getAnimations()) : [];
    const norm = (a) => {
      const t = a.effect.getTiming();
      const kf = a.effect.getKeyframes().map(k => ({ o: Math.round(k.offset * 100), t: (k.transform || '').replace(/\s+/g, ''), d: k.strokeDashoffset ?? '', e: (k.easing || '').replace(/\s+/g, '') }));
      return { name: a.animationName || '', dur: t.duration, delay: t.delay, iter: t.iterations, easing: t.easing, fill: t.fill, dir: t.direction, kf: JSON.stringify(kf) };
    };
    const list = (anims || []).map(norm);
    const strands = hero ? [...hero.querySelectorAll('svg path')].map(p => {
      const cs = getComputedStyle(p); return { stroke: cs.stroke, w: parseFloat(cs.strokeWidth), op: cs.opacity, d: p.getAttribute('d') };
    }) : [];
    return { anims: list.sort((a, b) => (a.delay - b.delay) || (a.dur - b.dur)), strands };
  });
}

async function interactionProbe(page) {
  const out = {};
  const get = (fn, arg) => page.evaluate(fn, arg);
  // photo hover
  const img = page.locator('img[src*="blunt-bob"], img[srcset*="blunt-bob"]').first();
  if (await img.count()) {
    out.photoBefore = await img.evaluate(e => ({ f: getComputedStyle(e).filter, t: getComputedStyle(e).transform }));
    await img.scrollIntoViewIfNeeded(); await img.hover(); await page.waitForTimeout(1100);
    out.photoAfter = await img.evaluate(e => ({ f: getComputedStyle(e).filter, t: getComputedStyle(e).transform }));
    await page.mouse.move(1, 1);
  }
  // price card hover
  const cardH = await get(() => { let el = __find('01 · Ladies'); while (el && parseFloat(getComputedStyle(el).borderTopLeftRadius) < 20) el = el.parentElement; if (!el) return null; el.setAttribute('data-qa-card', '1'); return true; });
  if (cardH) {
    const card = page.locator('[data-qa-card]'); await card.scrollIntoViewIfNeeded();
    out.cardBefore = await card.evaluate(e => getComputedStyle(e).transform);
    await card.hover(); await page.waitForTimeout(700);
    out.cardAfter = await card.evaluate(e => getComputedStyle(e).transform);
    out.cardRadius = await card.evaluate(e => getComputedStyle(e).borderTopLeftRadius);
    await page.mouse.move(1, 1);
  }
  // button hover
  const btnOk = await get(() => { const el = __find('View prices'); if (el) el.setAttribute('data-qa-btn', '1'); return !!el; });
  if (btnOk) {
    const b = page.locator('[data-qa-btn]'); await b.scrollIntoViewIfNeeded(); await b.hover(); await page.waitForTimeout(500);
    out.btnAfter = await b.evaluate(e => getComputedStyle(e).transform);
    out.btnRadius = await b.evaluate(e => getComputedStyle(e).borderTopLeftRadius);
    await page.mouse.move(1, 1);
  }
  // FAQ
  const vis = (t) => get((t) => { const el = __find(t); if (!el) return null; if (el.checkVisibility) return el.checkVisibility({ contentVisibilityAuto: true, visibilityProperty: true, opacityProperty: true }) && el.getBoundingClientRect().height > 0; const d = el.closest('details'); return !d || d.open; }, t);
  out.faqFirstOpen = await vis('Wigan and Rochdale. Call to check your area and find a time that suits.');
  out.faqSecondBefore = await vis('Yes — curly hair is one of Nigel\'s specialities.');
  const q = await get(() => { const el = __find('Do you work with curly hair?'); if (!el) return false; el.setAttribute('data-qa-q', '1'); return true; });
  if (q) {
    const s = page.locator('[data-qa-q]'); await s.scrollIntoViewIfNeeded(); await s.click(); await page.waitForTimeout(500);
    out.faqSecondAfter = await vis('Yes — curly hair is one of Nigel\'s specialities.');
    out.faqIcon = await get(() => { const el = __find('Do you work with curly hair?'); const plus = [...el.querySelectorAll('*'), ...el.parentElement.querySelectorAll('*')].find(x => x.textContent.trim() === '+' || x.tagName === 'svg'); return plus ? getComputedStyle(plus).transform : 'none-found'; });
  }
  // sticky header
  await page.evaluate(() => window.scrollTo(0, 2200)); await page.waitForTimeout(300);
  out.headerTop = await get(() => { const el = __find('Book a visit'); if (!el) return null; let h = el; while (h && !['sticky', 'fixed'].includes(getComputedStyle(h).position)) h = h.parentElement; return h ? Math.round(h.getBoundingClientRect().top) : 'not-sticky'; });
  return out;
}

async function screenshotDiff(browser, refPage, implPage, vpName, maxDiff) {
  for (const p of [refPage, implPage]) { await p.evaluate(() => window.scrollTo(0, 0)); await p.evaluate(() => __freeze()); await p.waitForTimeout(200); }
  const a = await refPage.screenshot({ fullPage: true, animations: 'disabled' });
  const b = await implPage.screenshot({ fullPage: true, animations: 'disabled' });
  fs.writeFileSync(path.join(OUT, `${vpName}-reference.png`), a);
  fs.writeFileSync(path.join(OUT, `${vpName}-build.png`), b);
  const ctx = await browser.newContext(); const pg = await ctx.newPage();
  const res = await pg.evaluate(async ({ a, b }) => {
    const load = (src) => new Promise(r => { const im = new Image(); im.onload = () => r(im); im.src = 'data:image/png;base64,' + src; });
    const [A, B] = await Promise.all([load(a), load(b)]);
    const w = Math.min(A.width, B.width), h = Math.min(A.height, B.height);
    const c = (im) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const x = cv.getContext('2d'); x.drawImage(im, 0, 0); return x.getImageData(0, 0, w, h); };
    const da = c(A), db = c(B); const out = document.createElement('canvas'); out.width = w; out.height = h; const ox = out.getContext('2d'); const od = ox.createImageData(w, h);
    let diff = 0;
    for (let i = 0; i < da.data.length; i += 4) {
      const d = Math.abs(da.data[i] - db.data[i]) + Math.abs(da.data[i + 1] - db.data[i + 1]) + Math.abs(da.data[i + 2] - db.data[i + 2]);
      const bad = d > 60; if (bad) diff++;
      const g = (da.data[i] + da.data[i + 1] + da.data[i + 2]) / 3 * 0.35 + 160;
      od.data[i] = bad ? 255 : g; od.data[i + 1] = bad ? 0 : g; od.data[i + 2] = bad ? 80 : g; od.data[i + 3] = 255;
    }
    ox.putImageData(od, 0, 0);
    return { ratio: diff / (w * h), refH: A.height, buildH: B.height, png: out.toDataURL('image/png').split(',')[1] };
  }, { a: a.toString('base64'), b: b.toString('base64') });
  fs.writeFileSync(path.join(OUT, `${vpName}-diff.png`), Buffer.from(res.png, 'base64'));
  await ctx.close();
  const hOk = Math.abs(res.refH - res.buildH) / res.refH <= 0.03;
  record(vpName, 'pixels', 'page height', hOk, `build ${res.buildH}px vs reference ${res.refH}px`);
  record(vpName, 'pixels', `full-page diff ≤ ${(maxDiff * 100).toFixed(1)}%`, res.ratio <= maxDiff, `${(res.ratio * 100).toFixed(2)}% of pixels differ — see ${vpName}-diff.png (pink = different)`);
}

(async () => {
  const browser = await chromium.launch();
  for (const vp of VIEWPORTS) {
    const R = await openPage(browser, REF, vp);
    const I = await openPage(browser, IMPL, vp);

    // fonts really loaded
    if (!SKIP_FONTS) {
      const f = await I.page.evaluate(() => ['400 40px "Gloock"', '400 16px "Hanken Grotesk"', '500 16px "Hanken Grotesk"', '600 16px "Hanken Grotesk"', '700 16px "Hanken Grotesk"']
        .map(s => [s, document.fonts.check(s) && [...document.fonts].some(ff => ff.status === 'loaded' && s.includes(ff.family.replace(/"/g, '')))]));
      for (const [s, ok] of f) record(vp.name, 'fonts', `${s} loaded`, ok);
    }

    // copy + type
    const r = await probeAll(R.page), i = await probeAll(I.page);
    for (const t of PROBES) cmpStyle(vp.name, t, r.probes[t], i.probes[t]);
    for (const p of PARAGRAPHS) record(vp.name, 'copy', p.slice(0, 60) + '…', i.paragraphs[p] === true, i.paragraphs[p] ? '' : 'paragraph missing or reworded');
    // sections
    for (const id of SECTIONS) record(vp.name, 'colour', `#${id} background`, i.sections[id] && rgb(i.sections[id]) === rgb(r.sections[id]), i.sections[id] ? `${i.sections[id]} vs ${r.sections[id]}` : `section id="${id}" missing`);
    // images
    for (const s of IMAGES) {
      const a = r.images[s], b = i.images[s];
      if (!b) { record(vp.name, 'images', s, false, 'image not found (keep the file stem in the filename)'); continue; }
      const bad = [];
      if (!b.loaded) bad.push('did not load');
      if (!near(a.w, b.w, 4) || !near(a.h, b.h, 4)) bad.push(`size ${b.w}×${b.h} ≠ ${a.w}×${a.h}`);
      if (a.fit !== b.fit) bad.push(`object-fit ${b.fit} ≠ ${a.fit}`);
      if (a.pos !== b.pos) bad.push(`crop/object-position ${b.pos} ≠ ${a.pos}`);
      if (a.filter !== b.filter) bad.push(`filter ${b.filter} ≠ ${a.filter}`);
      if (a.circle !== b.circle) bad.push('circle mask differs');
      if (!b.alt) bad.push('missing alt text');
      record(vp.name, 'images', s, bad.length === 0, bad.join('; '));
    }
    // links
    const missing = r.links.filter(l => !i.links.includes(l));
    record(vp.name, 'links', 'all reference links present', missing.length === 0, missing.length ? 'missing: ' + missing.join(', ') : '');

    if (vp.name === 'desktop') {
      // motion (fresh load, not frozen)
      const mr = await motionProbe(R.page), mi = await motionProbe(I.page);
      record('desktop', 'motion', 'hero hair-strand count', mr.strands.length === mi.strands.length, `${mi.strands.length} vs ${mr.strands.length}`);
      const sBad = mr.strands.map((s, k) => { const t = mi.strands[k]; return !t ? `strand ${k + 1} missing` : (rgb(s.stroke) !== rgb(t.stroke) || !near(s.w, t.w, 0.2) || s.op !== t.op || s.d !== t.d) ? `strand ${k + 1} differs (stroke/width/opacity/path)` : null; }).filter(Boolean);
      record('desktop', 'motion', 'hero hair-strand paths, colours, widths', sBad.length === 0, sBad.join('; '));
      record('desktop', 'motion', 'hero animation count', mr.anims.length === mi.anims.length, `${mi.anims.length} vs ${mr.anims.length}`);
      mr.anims.forEach((a, k) => {
        const b = mi.anims[k];
        const ok = b && a.dur === b.dur && a.delay === b.delay && a.iter === b.iter && a.easing.replace(/\s/g, '') === b.easing.replace(/\s/g, '') && a.fill === b.fill && a.kf === b.kf;
        record('desktop', 'motion', `hero animation #${k + 1} (${a.dur}ms, delay ${a.delay}ms, ${a.iter === Infinity ? 'loop' : 'once'})`, !!ok, b ? `build: ${b.dur}ms delay ${b.delay} ${b.easing} iter ${b.iter} kf ${b.kf}` : 'missing');
      });
      // interactions
      const ir = await interactionProbe(R.page), ii = await interactionProbe(I.page);
      for (const k of Object.keys(ir)) {
        const a = JSON.stringify(ir[k]), b = JSON.stringify(ii[k]);
        record('desktop', 'interaction', k, a === b && a !== 'null' && a !== undefined, a === b ? a : `build ${b} vs reference ${a}`);
      }
      // reduced motion
      const RR = await openPage(browser, REF, vp, { reducedMotion: 'reduce' });
      const IR = await openPage(browser, IMPL, vp, { reducedMotion: 'reduce' });
      const cr = (await motionProbe(RR.page)).anims.length, ci = (await motionProbe(IR.page)).anims.length;
      record('desktop', 'a11y', 'prefers-reduced-motion stops hero animation', cr === ci, `${ci} running vs ${cr}`);
      await RR.ctx.close(); await IR.ctx.close();
    }

    // pixels (fresh pages, frozen)
    await R.ctx.close(); await I.ctx.close();
    const R2 = await openPage(browser, REF, vp), I2 = await openPage(browser, IMPL, vp);
    await R2.page.waitForTimeout(3600); await I2.page.waitForTimeout(3600); // let the strands finish drawing
    await screenshotDiff(browser, R2.page, I2.page, vp.name, vp.maxDiff);
    await R2.ctx.close(); await I2.ctx.close();
  }
  await browser.close();

  // ---------- report ----------
  const failed = results.filter(r => !r.ok);
  const lines = [`# Fidelity report — ${failed.length ? 'FAIL' : 'PASS'}`, '', `Build: ${IMPL}`, `Reference: ${REF}`, '', `${results.length - failed.length}/${results.length} checks passed.`, '',
    '| Viewport | Area | Check | Result | Detail |', '|---|---|---|---|---|',
    ...results.sort((a, b) => a.ok - b.ok).map(r => `| ${r.vp} | ${r.area} | ${r.name.replace(/\|/g, '/')} | ${r.ok ? 'PASS' : '**FAIL**'} | ${(r.detail || '').replace(/\|/g, '/')} |`)];
  fs.writeFileSync(path.join(OUT, 'report.md'), lines.join('\n'));
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(results, null, 1));
  console.log(lines.slice(0, 6).join('\n'));
  for (const f of failed) console.log(`FAIL [${f.vp}/${f.area}] ${f.name} — ${f.detail}`);
  console.log(`\nFull report: ${path.join(OUT, 'report.md')}`);
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
