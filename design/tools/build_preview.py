"""Turn the canvas artboard (Main.dc.html) into a plain, standalone HTML page."""
import re
import sys

src_path, out_path = sys.argv[1], sys.argv[2]
s = open(src_path, encoding="utf-8").read()

BLOBS = {
    "c672c38fbf7ed4eea3a8046a92efa2a0": "images/logo-full.png",
    "b4ddd19e778c1f4bd19119b427eb3398": "images/nigels-desktop-base.webp",
    "32213e4bf1e13d120de0de35fc57e376": "images/nigels-hero-base.webp",
    "b148cb6997895c05f9ed1ef1b03792ed": "images/nirmata-hero.webp",
    "2ac68ae8cddc0a7ef7ca18ff8c3a051a": "images/nirmata-menu.webp",
    "e5a2a7246d4ae279916e338912e11e9a": "images/nigels-after-mobile.webp",
    "b70edc437575d04860fadb81c11d00ef": "images/rochses-hero.webp",
    "1c3305c61ffa84674c6f457deb595d55": "images/rochses-signup.webp",
    "617d37e53e9b65bbae2dc4e3b68f23b1": "images/nigels-after.webp",
    "d5d9069c2be1e4be8286755e8a607845": "images/nigels-before.webp",
}

helmet = re.search(r"<helmet>(.*?)</helmet>", s, re.S).group(1)
body = re.search(r"<x-dc>\s*<helmet>.*?</helmet>(.*)</x-dc>", s, re.S).group(1)


def swap(pattern, repl):
    global body
    new, n = re.subn(pattern, lambda m: repl, body, count=1, flags=re.S)
    if n != 1:
        raise SystemExit("block not found: " + pattern[:60])
    body = new


SECTIONS = [("client", "Work"), ("before-after", "Redesign"), ("pricing", "Pricing"),
            ("process", "Process"), ("faq", "FAQ"), ("contact", "Contact")]

# Header links
swap(r'<sc-for list="\{\{navLinks\}\}".*?</sc-for>',
     "\n".join(f'<a href="#{i}" class="nav-link{" active" if i == "client" else ""}" data-section="{i}">{l}</a>'
               for i, l in SECTIONS if i != "contact"))

# Dot rail
swap(r'<sc-for list="\{\{sections\}\}".*?</sc-for>',
     "\n".join(f'<a href="#{i}" class="dot{" active" if i == "client" else ""}" data-section="{i}"><span class="dot-marker"></span><span class="dot-label">{l}</span></a>'
               for i, l in SECTIONS))

# Work showcase (3 clients, static grid)
ARROW = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"></path></svg>'
CLIENTS = [
    dict(name="NIR-MA-TA", kicker="Espresso cart · Lombok", blurb="A full menu, live pricing and an order builder, in Indonesian and English.",
         href="https://www.nir-ma-ta.com", link="Visit nir-ma-ta.com", dur="20s", delay="0s", offset="56px",
         shots=[("images/nirmata-hero.webp", "NIR-MA-TA homepage"), ("images/nirmata-menu.webp", "NIR-MA-TA menu with prices")]),
    dict(name="Nigel's Hairdressing", kicker="Mobile hairdresser · Wigan &amp; Rochdale", blurb="Rebuilt from a dated Wix template: recent work, clear prices and one-tap booking.",
         href="https://www.nigelshairdressingwiganandrochdale.com", link="Visit the live site", dur="34s", delay="0s", offset="0px",
         shots=[("images/nigels-after-mobile.webp", "Nigel's Hairdressing full mobile homepage")]),
    dict(name="Rochses", kicker="Womenswear label · Launching soon", blurb="A coming-soon site collecting priority access ahead of the first collection.",
         href="https://rochses.com", link="Preview rochses.com", dur="18s", delay="-6s", offset="56px",
         shots=[("images/rochses-hero.webp", "Rochses coming-soon homepage"), ("images/rochses-signup.webp", "Rochses priority access signup")]),
]
cards = []
for c in CLIENTS:
    imgs = "".join(f'<img src="{p}" alt="{a}" loading="lazy" style="display: block; width: 100%; height: auto">' for p, a in c["shots"])
    cards.append(f'''<div class="work-card" style="display: flex; flex-direction: column; align-items: center; margin-top: {c["offset"]}">
<a href="{c["href"]}" target="_blank" rel="noopener" class="device" aria-label="Visit {c["name"]}" style="display: block; width: 276px; max-width: 100%; padding: 10px; border-radius: 46px; background: #14111a; box-shadow: 0 50px 80px -40px rgba(47,17,71,0.45), inset 0 0 0 1px rgba(255,255,255,0.08)">
<span style="position: relative; display: block; height: 540px; border-radius: 36px; overflow: hidden; background: #ffffff">
<span aria-hidden="true" style="position: absolute; z-index: 2; top: 10px; left: 50%; width: 84px; height: 24px; margin-left: -42px; border-radius: 999px; background: #14111a"></span>
<span class="scroll-col" style="display: block; animation-duration: {c["dur"]}; animation-delay: {c["delay"]}">{imgs}</span>
</span>
</a>
<div style="width: 100%; max-width: 320px; margin-top: 32px; text-align: center">
<span style="font-size: 0.74rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(20,17,26,0.55)">{c["kicker"]}</span>
<h3 style="font-size: 1.5rem; margin: 6px 0 8px">{c["name"]}</h3>
<p style="font-size: 0.92rem; color: rgba(20,17,26,0.68); margin-bottom: 6px">{c["blurb"]}</p>
<a href="{c["href"]}" target="_blank" rel="noopener" class="visit">{c["link"]} {ARROW}</a>
</div>
</div>''')
swap(r'<div class="\{\{showcaseCls\}\}".*?</sc-for>\s*</div>',
     '<div class="showcase showcase-grid" style="gap: 40px; align-items: start; grid-template-columns: repeat(3, minmax(0, 1fr)); margin: 0 auto">\n'
     + "\n".join(cards) + "\n</div>")
swap(r'<sc-if value="\{\{showNav\}\}".*?</sc-if>', "")

# Before & after slider
body = body.replace('class="{{baFrameCls}}"', 'class="ba-frame auto" id="ba-frame"')
body = body.replace('value="{{baPos}}" onChange="{{onSlide}}" onInput="{{onSlide}}"', 'value="46" id="ba-range"')
body = body.replace('left: {{baPos}}%;', 'left: 46%;').replace('class="ba-handle"', 'class="ba-handle" id="ba-handle"')
body = body.replace('clip-path: inset(0 {{baRight}}% 0 0)', 'clip-path: inset(0 54% 0 0)').replace('class="ba-before"', 'class="ba-before" id="ba-before"')

# Quote builder
QP = [("about", "About", 90), ("services", "Services / Menu", 140), ("gallery", "Gallery", 110), ("blog", "Blog", 200), ("booking-page", "Booking page", 130)]
QE = [("seo", "Local SEO", 280, False, "Google Business optimisation and local keyword targeting"),
      ("booking", "Online bookings", 400, False, "Real-time appointment, table, or callout booking"),
      ("store", "Online store", 800, False, "Product catalogue and checkout"),
      ("maintenance", "Maintenance", 60, True, "Hosting, security updates, and small content changes")]
swap(r'<sc-for list="\{\{quotePages\}\}".*?</sc-for>',
     "\n".join(f'<button type="button" class="chip" aria-pressed="false" data-price="{p}">{l} <span style="opacity: 0.7">+${p}</span></button>' for _, l, p in QP))
swap(r'<sc-for list="\{\{quoteExtras\}\}".*?</sc-for>',
     "\n".join(f'<button type="button" class="chip" aria-pressed="false" data-price="{p}"{" data-recurring=\"1\"" if r else ""} title="{d}">{l} <span style="opacity: 0.7">+${p}{"/mo" if r else ""}</span></button>' for _, l, p, r, d in QE))
body = body.replace('onClick="{{toggleQuote}}" aria-expanded="{{quoteOpenAttr}}"', 'id="quote-toggle" aria-expanded="false"')
body = body.replace('class="{{quoteChevronCls}}"', 'class="quote-chev"')
body = body.replace('class="{{quoteBodyCls}}"', 'class="quote-body" id="quote-body"')
body = body.replace('{{quoteTotal}}', '<span data-quote-total>$250</span>')
body = body.replace('{{quoteRrp}}', '<span data-quote-rrp>$500</span>')
body = body.replace('{{quoteMonthly}}', '<span data-quote-monthly>One-off, no lock-in</span>')

# FAQ
FAQS = [
    ("How long does it take?", "Under a week once we have your details, photos and go-ahead."),
    ("Do I own the site?", "Yes — 100% yours on final payment, on your own domain."),
    ("What if I don't have photos or text?", "We write the copy and source the images for you. It's included in every package."),
    ("Can I make changes after launch?", "Send us what you'd like changed and we'll quote it, or it's included on the $60/month maintenance plan."),
    ("Do you handle domains and hosting?", "Yes — we register domains at cost, or build on the domain and hosting you already have."),
    ("Do you only work with Australian businesses?", "Not at all. As you can see from our work, we're worldwide — we've worked with clients in Indonesia and the UK, with more to come. Everything happens over WhatsApp, email and video."),
]
items = []
for i, (q, a) in enumerate(FAQS):
    items.append(f'''<div class="faq-item{" open" if i == 0 else ""}">
<button type="button" class="faq-q" aria-expanded="{"true" if i == 0 else "false"}" id="faq-q-{i}">
<span class="faq-num">{i + 1:02d}</span>
<span style="flex: 1; font-weight: 700; font-size: 1.08rem; text-align: left">{q}</span>
<span class="faq-plus" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"></path></svg></span>
</button>
<div class="faq-a"><div style="overflow: hidden"><p style="padding: 0 24px 22px 74px; color: rgba(20,17,26,0.72); font-size: 0.96rem">{a}</p></div></div>
</div>''')
swap(r'<sc-for list="\{\{faqs\}\}".*?</sc-for>', "\n".join(items))

# Contact service chips
swap(r'<sc-for list="\{\{services\}\}".*?</sc-for>',
     "\n".join(f'<button type="button" class="svc" aria-pressed="false">{l}</button>' for l in ["New site", "Redesign", "Not sure yet"]))

body = body.replace('<nav class="{{snavCls}}"', '<nav class="snav" id="snav"')

# Pricing tiers (phone: tap a block to show its details)
for tid in ["essentials", "growth", "complete"]:
    sel = tid == "growth"
    body = body.replace('{{tierCls.%s}}" onClick="{{pickTier.%s}}"' % (tid, tid),
                        '%s" data-tier="%s"' % ("sel" if sel else "", tid))
    body = body.replace('class="tier-panel {{panelCls.%s}}"' % tid,
                        'class="tier-panel%s" data-panel="%s"' % (" show" if sel else "", tid))

# Images
for bid, path in BLOBS.items():
    body = body.replace("/_blob/" + bid, path)
    helmet = helmet.replace("/_blob/" + bid, path)

left = re.findall(r"\{\{|<sc-|/_blob/", body)
if left:
    raise SystemExit("unconverted template bits: %r" % left[:5])

body = body.replace('<form class="contact-form"', '<form class="contact-form" id="lead-form"')
body = body.replace('<button type="button" class="btn btn-primary send-btn"', '<button type="submit" class="btn btn-primary send-btn"')
body = body.replace('<p style="font-size: 0.9rem; color: rgba(20,17,26,0.6)">Takes about a minute.</p>',
                    '<p style="font-size: 0.9rem; color: rgba(20,17,26,0.6)">Takes about a minute.</p>\n<p class="form-note" id="form-note" hidden>Preview only: this form isn\'t connected yet, so nothing was sent.</p>')

# Narrow phones: grid tracks must never be wider than the screen
body = re.sub(r"minmax\((\d+)px, 1fr\)", r"minmax(min(\1px, 100%), 1fr)", body)


def strip_blocks(css, opener):
    """Remove every `opener { ... }` block (brace-matched)."""
    out, i = "", 0
    while True:
        j = css.find(opener, i)
        if j < 0:
            return out + css[i:]
        out += css[i:j]
        k = css.index("{", j)
        depth = 0
        for n in range(k, len(css)):
            if css[n] == "{":
                depth += 1
            elif css[n] == "}":
                depth -= 1
                if depth == 0:
                    i = n + 1
                    break


# Scroll-timeline CSS isn't supported in iOS Safari yet; the script below does it instead.
helmet = strip_blocks(helmet, "@supports (animation-timeline: view())")
helmet = strip_blocks(helmet, "@supports (animation-timeline: scroll())")
helmet = helmet.replace("body{margin:0}", "body{margin:0;background:#ffffff}")
extra_css = """
:root{color-scheme:light}
html{scroll-behavior:auto}
.cg .site-header{top:env(safe-area-inset-top,0px) !important}
.cg .form-note{margin:0;padding:10px 14px;border-radius:12px;background:#f3f0f8;color:#2f1147;font-size:.86rem;font-weight:600}
@media (max-width:760px){.cg #client .showcase{grid-template-columns:none !important}}
.cg .foot-word{font-size:clamp(3rem,14vw,15rem) !important}
/* scroll reveals (script-driven, works in every browser) */
.rv{opacity:0;transform:translateY(26px);transition:opacity .8s cubic-bezier(.16,1,.3,1),transform .8s cubic-bezier(.16,1,.3,1) !important}
.rv.rv-x{transform:translateX(36px)}
@media (max-width:640px){.rv.rv-x{transform:translateY(26px)}}
.rv.in{opacity:1;transform:none}
.cg .tiers.pre .rrp::after{transform:scaleX(0);transition:transform .7s .5s cubic-bezier(.65,0,.35,1)}
.cg .tiers.pre.go .rrp::after{transform:scaleX(1)}
.cg .ticks.pre .tick{opacity:0;transform:scale(.4);transition:opacity .4s,transform .5s cubic-bezier(.34,1.56,.64,1)}
.cg .ticks.pre.go .tick{opacity:1;transform:none}
.cg .timeline-fill{transform:scaleY(0)}
.cg .scroll-bar{transition:none}
"""

script = r"""
<script>
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ids = ['client', 'before-after', 'pricing', 'process', 'faq', 'contact'];

  // Header pill + dot rail follow the section in view
  function setActive(id) {
    document.querySelectorAll('[data-section]').forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-section') === id);
    });
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    ids.forEach(function (id) { var el = document.getElementById(id); if (el) io.observe(el); });
  }

  // ---- Scroll effects (IntersectionObserver + scroll listener, works in iOS Safari) ----
  var vh = function () { return window.innerHeight || document.documentElement.clientHeight; };
  var inView = function (el) { var r = el.getBoundingClientRect(); return r.top < vh() * 0.92 && r.bottom > 0; };

  // Fade/slide items up as they arrive. Anything already on screen at load stays put.
  var itemSel = '.work-card, .ba-fact, .tier, .step, .perk, .faq-item, .way, .next-steps > li, .contact-form, .foot-word';
  var targets = [];
  document.querySelectorAll('.cg section:not(#hero) .wrap > *, .site-footer .wrap > *').forEach(function (el) {
    if (!el.querySelector(itemSel) && !el.matches(itemSel)) targets.push(el);
  });
  document.querySelectorAll(itemSel).forEach(function (el) { targets.push(el); });
  if (!reduce && 'IntersectionObserver' in window) {
    var rvIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        rvIO.unobserve(e.target);
        setTimeout(function () { e.target.classList.remove('rv', 'rv-x', 'in'); e.target.style.transitionDelay = ''; }, 1400);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    targets.forEach(function (el) {
      if (inView(el)) return;
      var sibs = el.parentElement ? Array.prototype.filter.call(el.parentElement.children, function (c) { return c.matches(itemSel); }) : [];
      var idx = sibs.indexOf(el);
      el.classList.add('rv');
      if (el.matches('.step')) el.classList.add('rv-x');
      if (idx > 0) el.style.transitionDelay = Math.min(idx, 5) * 0.09 + 's';
      rvIO.observe(el);
    });

    // Prices count down to the founding price, then the old price gets struck through
    var tiers = document.querySelector('.tiers');
    var counts = Array.prototype.map.call(document.querySelectorAll('.price-count'), function (el) {
      var to = Number(getComputedStyle(el).getPropertyValue('--p')) || Number(el.style.getPropertyValue('--p'));
      return { el: el, to: to };
    });
    if (tiers && !inView(tiers)) {
      tiers.classList.add('pre');
      document.querySelectorAll('.ticks').forEach(function (t) { t.classList.add('pre'); });
      counts.forEach(function (c) { c.el.style.setProperty('--p', c.to * 2); });
      var tIO = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        tIO.disconnect();
        var t0 = performance.now();
        (function run(now) {
          var t = Math.min(1, (now - t0) / 1400);
          var k = 1 - Math.pow(1 - t, 3);
          counts.forEach(function (c) { c.el.style.setProperty('--p', Math.round(c.to * 2 - c.to * k)); });
          if (t < 1) requestAnimationFrame(run);
        })(t0);
        tiers.classList.add('go');
        document.querySelectorAll('.ticks').forEach(function (t, i) {
          Array.prototype.forEach.call(t.querySelectorAll('.tick'), function (tk, j) { tk.style.transitionDelay = (0.5 + j * 0.12) + 's'; });
          t.classList.add('go');
        });
      }, { rootMargin: '0px 0px -20% 0px' });
      tIO.observe(tiers);
    }
  }

  // Reading-progress line under the header + "How it works" timeline fill
  var bar = document.querySelector('.scroll-bar');
  var fill = document.querySelector('.timeline-fill');
  var tl = document.querySelector('.timeline');
  function onScrollFx() {
    var root = document.scrollingElement || document.documentElement;
    var max = root.scrollHeight - vh();
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? root.scrollTop / max : 0) + ')';
    if (fill && tl) {
      var r = tl.getBoundingClientRect();
      var p = (vh() * 0.7 - r.top) / r.height;
      fill.style.transform = 'scaleY(' + (reduce ? 1 : Math.max(0, Math.min(1, p))) + ')';
    }
  }
  window.addEventListener('scroll', onScrollFx, { passive: true });
  window.addEventListener('resize', onScrollFx);
  onScrollFx();

  // Dot rail turns white while its middle sits over a dark section (hero, footer)
  var snav = document.getElementById('snav');
  function checkRail() {
    if (!snav) return;
    var mid = window.innerHeight / 2;
    var dark = Array.prototype.some.call(document.querySelectorAll('#hero, .site-footer'), function (el) {
      var r = el.getBoundingClientRect();
      return r.top <= mid && r.bottom >= mid;
    });
    snav.classList.toggle('on-dark', dark);
  }
  window.addEventListener('scroll', checkRail, { passive: true });
  window.addEventListener('resize', checkRail);
  checkRail();

  // In-page links glide to their section, then the section "lands"
  var raf, landTimer;
  function glideTo(target) {
    var root = document.scrollingElement || document.documentElement;
    var start = root.scrollTop;
    var end = Math.max(0, start + target.getBoundingClientRect().top - 78);
    var dist = end - start;
    function land() {
      target.classList.remove('landed'); void target.offsetWidth; target.classList.add('landed');
      clearTimeout(landTimer); landTimer = setTimeout(function () { target.classList.remove('landed'); }, 1400);
    }
    if (reduce || Math.abs(dist) < 4) { root.scrollTop = end; land(); return; }
    var dur = Math.min(1300, Math.max(650, Math.abs(dist) * 0.35));
    var ease = function (t) { return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2; };
    var t0 = performance.now();
    cancelAnimationFrame(raf);
    (function step(now) {
      var t = Math.min(1, (now - t0) / dur);
      root.scrollTop = start + dist * ease(t);
      if (t < 1) raf = requestAnimationFrame(step); else land();
    })(t0);
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    var target = id && document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    if (ids.indexOf(id) > -1) {
      setActive(id);
      document.querySelectorAll('.nav-link').forEach(function (n) { n.classList.remove('clicked'); });
      var link = document.querySelector('.nav-link[data-section="' + id + '"]');
      if (link) { void link.offsetWidth; link.classList.add('clicked'); }
    }
    glideTo(target);
  });

  // Before & after: demo sweep until the visitor drags (mouse or finger; vertical swipes still scroll)
  var range = document.getElementById('ba-range');
  var baFrame = document.getElementById('ba-frame');
  function setBa(v) {
    v = Math.max(0, Math.min(100, Math.round(v)));
    baFrame.classList.remove('auto');
    range.value = v;
    document.getElementById('ba-handle').style.left = v + '%';
    document.getElementById('ba-before').style.clipPath = 'inset(0 ' + (100 - v) + '% 0 0)';
  }
  if (range && baFrame) {
    range.addEventListener('input', function () { setBa(Number(range.value)); });
    var drag = null;
    var posFrom = function (e) { var r = baFrame.getBoundingClientRect(); return ((e.clientX - r.left) / r.width) * 100; };
    baFrame.addEventListener('pointerdown', function (e) {
      if (e.target.closest('a')) return;
      drag = { x: e.clientX, y: e.clientY, live: e.pointerType === 'mouse' };
      if (drag.live) { setBa(posFrom(e)); e.preventDefault(); }
    });
    window.addEventListener('pointermove', function (e) {
      if (!drag) return;
      if (!drag.live) {
        var dx = Math.abs(e.clientX - drag.x), dy = Math.abs(e.clientY - drag.y);
        if (dy > 8 && dy > dx) { drag = null; return; }
        if (dx > 6) drag.live = true; else return;
      }
      setBa(posFrom(e));
    }, { passive: true });
    var end = function () { drag = null; };
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  }

  // Pricing on phones: tap a package block to see what's in it
  document.querySelectorAll('.tier[data-tier]').forEach(function (t) {
    t.addEventListener('click', function () {
      var id = t.getAttribute('data-tier');
      document.querySelectorAll('.tier[data-tier]').forEach(function (o) { o.classList.toggle('sel', o === t); });
      document.querySelectorAll('.tier-panel').forEach(function (p) { p.classList.toggle('show', p.getAttribute('data-panel') === id); });
    });
  });

  // Quote builder
  var aud = function (n) { return '$' + Math.round(n).toLocaleString('en-AU'); };
  var qToggle = document.getElementById('quote-toggle');
  var qBody = document.getElementById('quote-body');
  if (qToggle) qToggle.addEventListener('click', function () {
    var open = !qBody.classList.contains('open');
    qBody.classList.toggle('open', open);
    qToggle.querySelector('.quote-chev').classList.toggle('open', open);
    qToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  function updateQuote() {
    var oneOff = 500, monthly = 0;
    document.querySelectorAll('.quote .chip.on').forEach(function (c) {
      var p = Number(c.getAttribute('data-price'));
      if (c.hasAttribute('data-recurring')) monthly += p; else oneOff += p;
    });
    document.querySelectorAll('[data-quote-total]').forEach(function (el) { el.textContent = aud(oneOff * 0.5); });
    document.querySelectorAll('[data-quote-rrp]').forEach(function (el) { el.textContent = aud(oneOff); });
    document.querySelectorAll('[data-quote-monthly]').forEach(function (el) {
      el.textContent = monthly ? 'One-off, plus ' + aud(monthly) + '/month maintenance' : 'One-off, no lock-in';
    });
  }
  document.querySelectorAll('.quote .chip').forEach(function (c) {
    c.addEventListener('click', function () {
      var on = !c.classList.contains('on');
      c.classList.toggle('on', on);
      c.setAttribute('aria-pressed', on ? 'true' : 'false');
      updateQuote();
    });
  });

  // FAQ accordion (one open at a time)
  var faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(function (item) {
    item.querySelector('.faq-q').addEventListener('click', function () {
      var wasOpen = item.classList.contains('open');
      faqItems.forEach(function (o) { o.classList.remove('open'); o.querySelector('.faq-q').setAttribute('aria-expanded', 'false'); });
      if (!wasOpen) { item.classList.add('open'); item.querySelector('.faq-q').setAttribute('aria-expanded', 'true'); }
    });
  });

  // Contact: service chips + preview-only submit
  var svcs = document.querySelectorAll('.svc');
  svcs.forEach(function (b) {
    b.addEventListener('click', function () {
      svcs.forEach(function (o) { o.classList.remove('on'); o.setAttribute('aria-pressed', 'false'); });
      b.classList.add('on'); b.setAttribute('aria-pressed', 'true');
    });
  });
  var form = document.getElementById('lead-form');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    document.getElementById('form-note').hidden = false;
  });
})();
</script>
"""

out = ("<title>CG Design &amp; Co. Homepage</title>\n"
       + helmet.strip().replace("</style>", extra_css + "</style>")
       + "\n" + body.strip() + "\n" + script)
open(out_path, "w", encoding="utf-8").write(out)
print("wrote", out_path, len(out), "bytes")

# Optional 3rd arg: a full standalone document (own doctype/head) for opening directly in a browser
if len(sys.argv) > 3:
    doc = ('<!doctype html>\n<html lang="en-AU">\n<head>\n<meta charset="utf-8">\n'
           '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
           '<meta name="robots" content="noindex">\n'
           + out.replace("<link href=\"https://fonts", "<link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n<link href=\"https://fonts", 1)
                .replace("\n<div class=\"cg\"", "\n</head>\n<body>\n<div class=\"cg\"", 1)
           + "\n</body>\n</html>\n")
    open(sys.argv[3], "w", encoding="utf-8").write(doc)
    print("wrote", sys.argv[3], len(doc), "bytes")
