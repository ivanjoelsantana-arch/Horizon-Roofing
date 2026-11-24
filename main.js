(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const root = document.documentElement;
  const body = document.body;

  /* ---------------- Smooth scroll (Lenis, if it loaded) ---------------- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new window.Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 4) });
    lenis.stop();
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        const el = id.length > 1 && document.querySelector(id);
        if (!el && id !== '#top') return;
        e.preventDefault();
        lenis.scrollTo(id === '#top' ? 0 : el, { offset: -70 });
      });
    });
  }

  /* ---------------- Loader ---------------- */
  const loader = document.getElementById('loader');
  const num = document.getElementById('ld-num');
  const bar = document.getElementById('ld-bar');
  const mark = loader.querySelector('.mark');
  const MIN = reduce ? 200 : 2900;   // minimum time so the animation can play
  const MAX = 6000;                  // never hold a visitor longer than this
  const start = performance.now();
  let loaded = false;
  window.addEventListener('load', () => { loaded = true; });
  setTimeout(() => { mark.classList.add('logo-on'); }, reduce ? 0 : 1700);

  let done = false;
  function tick(now) {
    if (done) return;
    const t = now - start;
    // time-based ease-out curve; holds at 90 until the page has loaded (or MAX passes)
    const p = Math.min(1, t / MIN);
    let v = (1 - Math.pow(1 - p, 3)) * 100;
    if (!loaded && t < MAX) v = Math.min(v, 90);
    num.textContent = String(Math.round(v)).padStart(3, '0');
    bar.style.transform = `scaleX(${v / 100})`;
    if (v >= 100) return finish();
    requestAnimationFrame(tick);
  }
  function finish() {
    if (done) return;
    done = true;
    setTimeout(() => {
      loader.classList.add('out');
      root.classList.remove('loading');
      body.classList.add('ready');
      if (lenis) lenis.start();
      setTimeout(() => loader.classList.add('gone'), 1300);
    }, reduce ? 0 : 250);
  }
  requestAnimationFrame(tick);
  setTimeout(finish, MAX + 800); // failsafe if frames are paused (background tab)

  /* ---------------- Nav + mobile bar ---------------- */
  const nav = document.getElementById('nav');
  const mbar = document.getElementById('mbar');
  const heroMedia = document.getElementById('heroMedia');
  const stdImg = document.getElementById('stdImg');
  let ticking = false;
  const navProg = document.getElementById('navProg');
  const work = document.getElementById('work');
  const workPin = document.getElementById('workPin');
  const workStrip = document.getElementById('workStrip');
  const workBar = document.getElementById('workBar');
  const workCur = document.getElementById('workCur');
  const workCount = workStrip.children.length;
  const steps = document.getElementById('steps');
  const stepEls = [...steps.querySelectorAll('.step')];
  const pinMQ = window.matchMedia('(min-width: 861px)');
  let pinned = false, pinTravel = 0;
  function setupPin() {
    pinned = !reduce && pinMQ.matches;
    work.classList.toggle('pinned', pinned);
    if (pinned) {
      pinTravel = Math.max(0, workStrip.scrollWidth - window.innerWidth);
      workPin.style.height = `${pinTravel + window.innerHeight}px`;
    } else {
      workPin.style.height = '';
      workStrip.style.transform = '';
    }
  }
  setupPin();
  window.addEventListener('resize', setupPin);
  window.addEventListener('load', setupPin);
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  function setWorkProgress(p) {
    workBar.style.transform = `scaleX(${p})`;
    workCur.textContent = String(Math.min(workCount, 1 + Math.floor(p * workCount * 0.999))).padStart(2, '0');
  }
  if (!pinned) workStrip.addEventListener('scroll', () => {
    const max = workStrip.scrollWidth - workStrip.clientWidth;
    setWorkProgress(max > 0 ? workStrip.scrollLeft / max : 0);
  }, { passive: true });

  function onScroll() {
    const y = window.scrollY;
    const vh = window.innerHeight;
    nav.classList.toggle('scrolled', y > 40);
    mbar.classList.toggle('show', y > vh * 0.7);
    navProg.style.transform = `scaleX(${clamp01(y / (document.documentElement.scrollHeight - vh))})`;
    if (pinned) {
      const r = workPin.getBoundingClientRect();
      const p = clamp01(-r.top / Math.max(1, workPin.offsetHeight - vh));
      workStrip.style.transform = `translate3d(${(-p * pinTravel).toFixed(1)}px,0,0)`;
      setWorkProgress(p);
    }
    {
      const r = steps.getBoundingClientRect();
      const p = reduce ? 1 : clamp01((vh * 0.75 - r.top) / (r.height + vh * 0.2));
      steps.style.setProperty('--p', p.toFixed(3));
      stepEls.forEach((el, i) => el.classList.toggle('lit', p >= (i / stepEls.length) * 0.98 + 0.02 || reduce));
    }
    if (!reduce) {
      // Scroll effect 1: gentle hero parallax
      if (y < window.innerHeight * 1.2) heroMedia.style.transform = `translate3d(0, ${y * 0.28}px, 0)`;
      // Scroll effect 2: standard photo drift
      if (stdImg) {
        const r = stdImg.parentElement.getBoundingClientRect();
        if (r.bottom > 0 && r.top < window.innerHeight) {
          const p = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
          stdImg.style.transform = `translate3d(0, ${(-6 + p * 12).toFixed(2)}%, 0)`;
        }
      }
    }
    ticking = false;
  }
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---------------- Reveal (sparingly) ---------------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
  document.querySelectorAll('.reveal, .wipe').forEach((el) => io.observe(el));

  /* ---------------- Split headline reveal ---------------- */
  if (!reduce) {
    const splitIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('split-in'); splitIO.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -12% 0px' });
    document.querySelectorAll('main h2').forEach((h) => {
      let i = 0;
      const walk = (node) => {
        [...node.childNodes].forEach((n) => {
          if (n.nodeType === 3) {
            const frag = document.createDocumentFragment();
            n.textContent.split(/(\s+)/).forEach((part) => {
              if (!part) return;
              if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
              const w = document.createElement('span'); w.className = 'w';
              const inner = document.createElement('span'); inner.textContent = part; inner.style.setProperty('--i', i++);
              w.appendChild(inner); frag.appendChild(w);
            });
            n.replaceWith(frag);
          } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
        });
      };
      h.setAttribute('aria-label', h.textContent.replace(/\s+/g, ' ').trim());
      walk(h);
      splitIO.observe(h);
    });
  }

  /* ---------------- Ribbons: velocity-reactive marquee ---------------- */
  const marquees = [...document.querySelectorAll('.mq')].map((el) => {
    const inner = el.querySelector('.mq-in');
    const g = inner.querySelector('.mq-g');
    return { el, inner, g, x: 0, w: 0, speed: +el.dataset.speed || 60, dir: +el.dataset.dir || -1 };
  });
  function fillMarquees() {
    marquees.forEach((m) => {
      [...m.inner.children].slice(1).forEach((c) => c.remove());
      m.w = m.g.getBoundingClientRect().width;
      const copies = Math.max(2, Math.ceil(window.innerWidth * 1.2 / Math.max(1, m.w)) + 1);
      for (let i = 1; i < copies; i++) { const c = m.g.cloneNode(true); c.setAttribute('aria-hidden', 'true'); m.inner.appendChild(c); }
    });
  }
  fillMarquees();
  window.addEventListener('resize', fillMarquees);
  document.fonts && document.fonts.ready.then(fillMarquees);
  let lastY = window.scrollY, scrollVel = 0, scrollDir = 1, mqT = performance.now();
  function mqLoop(now) {
    const dt = Math.min(64, now - mqT) / 1000; mqT = now;
    const y = window.scrollY; const dy = y - lastY; lastY = y;
    if (dy !== 0) scrollDir = dy > 0 ? 1 : -1;
    scrollVel += (dy - scrollVel) * 0.12;
    const boost = 1 + Math.min(8, Math.abs(scrollVel) * 0.35);
    marquees.forEach((m) => {
      if (!m.w) return;
      if (!reduce) m.x += m.dir * scrollDir * m.speed * boost * dt;
      while (m.x <= -m.w) m.x += m.w;
      while (m.x > 0) m.x -= m.w;
      m.inner.style.transform = `translate3d(${m.x.toFixed(2)}px,0,0)`;
    });
    requestAnimationFrame(mqLoop);
  }
  requestAnimationFrame(mqLoop);

  /* ---------------- Magnetic buttons + service previews ---------------- */
  if (fine && !reduce) {
    document.querySelectorAll('.btn, .rev-controls button, .svc-row .go, .nav-phone').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        el.style.translate = `${(dx * 0.22).toFixed(1)}px ${(dy * 0.3).toFixed(1)}px`;
      });
      el.addEventListener('pointerleave', () => { el.style.translate = ''; });
    });

    /* Services: floating image preview that follows the cursor */
    const float = document.getElementById('svcFloat');
    const rows = [...document.querySelectorAll('.svc-row')];
    const imgs = rows.map((row) => { const im = document.createElement('img'); im.src = row.querySelector('.thumb').src; im.alt = ''; float.appendChild(im); return im; });
    let fx = 0, fy = 0, tx = 0, ty = 0, frot = 0, active = false;
    rows.forEach((row, i) => {
      row.addEventListener('pointerenter', () => { active = true; float.classList.add('show'); imgs.forEach((im, j) => im.classList.toggle('on', j === i)); });
      row.addEventListener('pointerleave', () => { active = false; float.classList.remove('show'); });
    });
    window.addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    (function floatLoop() {
      const px = fx; fx += (tx - fx) * 0.12; fy += (ty - fy) * 0.12;
      frot += ((fx - px) * 0.35 - frot) * 0.1;
      if (active || float.classList.contains('show')) float.style.transform = `translate3d(${(fx - 160).toFixed(1)}px,${(fy - 200).toFixed(1)}px,0) rotate(${Math.max(-10, Math.min(10, frot)).toFixed(2)}deg)`;
      requestAnimationFrame(floatLoop);
    })();
  }

  /* ---------------- Reviews carousel ---------------- */
  const REVIEWS = [
    { n: 'Joshua Dool', c: 'oklch(0.5 0.08 180)', tag: 'Great price', t: 'Fantastic experience from start to finish. The crew worked quickly, professionally, and did an excellent job. The roof looks absolutely perfect. What impressed me just as much was how they left the property. Everything was cleaned up incredibly well, you’d hardly know a roofing crew had been there. … I actually used to own a roofing company myself, so I know what good workmanship and a well-run crew look like. These guys did it right.' },
    { n: 'Sharski', c: 'oklch(0.5 0.13 25)', tag: 'Reasonable price · CA$10–12K', t: 'This company is awesome Kendle put my faith back into contractors. Seriously. I messaged for a quote they were at my place in an hour. Kendle kept me updated with any and all issues before going forward with the work. I highly recommend this company if you want an honest job done I couldn’t be happier. Thanks Kendle' },
    { n: 'Robert Hall', c: 'oklch(0.48 0.13 300)', tag: 'Great price · CA$6,000–8,000', t: 'Kendel was pleasant to deal with, quote was accurate, clean up thorough. He also identified another problem (with the furnace exhaust) and he followed up to make sure the new roof wasn’t disturbed when the chimney work was finished.' },
    { n: 'Trent Pontalti', c: 'oklch(0.45 0.1 300)', t: 'Kendle was a pleasure to do business with. He is truly an expert roofer and does quality work in a timely manner. Best of all he is honest and trustworthy. I whole heartedly recommend him to anyone who needs roofing work completed.' },
    { n: 'Andrew Brookman', c: 'oklch(0.45 0.06 140)', t: 'Had Kendle replace our large skylight. He gave us a great quote on the job. Outstanding work. Fully flashed and re shingled the area in question and the job looks great. Fully recommend Horizon, and will use them again.' },
    { n: 'Melanie Morrissette', c: 'oklch(0.55 0.09 60)', sub: 'Local Guide', t: 'Kendle was quick to answer my request and completed the job in no time. He even took pictures and shared them with me for my file. Thank you 🙏' },
    { n: 'Peter Halim', c: 'oklch(0.42 0.14 285)', t: 'Kendle and his team did an amazing job on our standing metal seam roof and insulated flat roof. We enjoyed working with him as he was honest, highly knowledgeable, a clear communicator (patient), and very hard working. I wouldn’t hesitate recommending him to my family and friends.' },
    { n: 'Nicole Kazakoff', c: 'oklch(0.52 0.08 30)', t: 'What a nice guy to deal with! Kendle is extremely thorough. Outstanding communication! All details of our job were discussed beforehand, leaving no surprises. He was even able to forsee a few issues and came prepared with extra materials, just in case. Now that’s service!!! The work turned out great. Big thanks Kendle and Kim! We are really happy and will definitely call you in the future for any other roofing needs:)' },
    { n: 'Keith Gotte', c: 'oklch(0.62 0.13 85)', t: 'Kendle has worked on several of our projects and continually goes above and beyond. His dedication to safety, professionalism, and production quality is exceptional, and the pride he takes in his work shows in every detail. Kendle is someone you can fully trust to deliver reliable results, and I highly recommend his company for any project.' },
    { n: 'D W', c: 'oklch(0.4 0.07 160)', t: 'Highly recommend Kendle and his crew. The job on our complex gable roof was professionally handled, on budget and on time. Meticulous clean up! Absolutely no issues with this company!' },
    { n: 'Dayna Sixsmith', c: 'oklch(0.5 0.1 330)', sub: 'Local Guide', t: 'Kendle went out of his way to repair our skylights when we needed him urgently. Exceptional service. And the skylights look fantastic. Highly recommend!' },
    { n: 'Shannon Kaustinen', c: 'oklch(0.55 0.15 5)', t: 'We highly recommend Kendle and his team at Horizon. They are trusted, professionals and skilled at what they do. Detailed photos, documentation, reports, etc. The neighbors (underscore “plural”) went out of their way to complement them on their job, clean up, efficiency and professionalism.' },
    { n: 'Scott Drinkwater', c: 'oklch(0.5 0.06 230)', t: 'We were really impressed! The team at Horizon roofing and metal works were fast, professional, and took the time to fix more than what was required. Honest workmanship and excellent communication from start to finish, we would highly recommend this company!' },
    { n: 'Hardave Gill', c: 'oklch(0.48 0.12 255)', t: 'Had our shed shingles replaced. Professional service. No surprises. Great communication. Timely work. Would recommend to others.' },
    { n: 'Chris Missler', c: 'oklch(0.55 0.12 250)', t: 'Kendle as promised delivered a great product and alleviated any of my concerns and his crew works very hard ....great company!' },
    { n: 'Sean Preussner', c: 'oklch(0.6 0.14 50)', sub: 'Local Guide', t: 'Very Happy with their work and professionalism.' },
  ];

  const star = '<svg><use href="#i-star"/></svg>';
  const esc = (s) => s.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  const card = (r) => `
    <article class="rcard">
      <div class="row"><span class="stars" aria-label="5 stars">${star.repeat(5)}</span><svg class="g-mark" aria-label="Google"><use href="#i-g"/></svg></div>
      ${r.tag ? `<span class="tag">${esc(r.tag)}</span>` : ''}
      <p>&ldquo;${esc(r.t)}&rdquo;</p>
      <div class="who"><span class="avatar" style="background:${r.c}">${esc(r.n[0])}</span><div><b>${esc(r.n)}</b><span>${r.sub ? esc(r.sub) + ' · ' : ''}Verified Google review</span></div></div>
    </article>`;

  const track = document.getElementById('track');
  const carousel = document.getElementById('carousel');
  const html = REVIEWS.map(card).join('');
  track.innerHTML = html + html; // two copies for a seamless loop
  track.querySelectorAll('.rcard').forEach((el, i) => { if (i >= REVIEWS.length) el.setAttribute('aria-hidden', 'true'); });

  const AUTO = reduce ? 0 : -0.45; // px per frame
  let x = 0, vel = AUTO, half = 0;
  let dragging = false, lastX = 0, lastT = 0, dragVel = 0, hover = false, impulse = 0, inView = true;
  const measure = () => { half = track.scrollWidth / 2; };
  measure();
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);

  const wrapX = () => {
    if (!half) return;
    while (x <= -half) x += half;
    while (x > 0) x -= half;
  };

  function loop() {
    if (inView && !dragging) {
      const target = hover ? 0 : AUTO;
      vel += (target - vel) * 0.04;
      if (impulse) { x += impulse; impulse *= 0.9; if (Math.abs(impulse) < 0.05) impulse = 0; }
      x += vel;
      wrapX();
      track.style.transform = `translate3d(${x}px,0,0)`;
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  new IntersectionObserver(([e]) => { inView = e.isIntersecting; }).observe(carousel);

  carousel.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') hover = true; });
  carousel.addEventListener('pointerleave', () => { hover = false; });
  carousel.addEventListener('pointerdown', (e) => {
    dragging = true; lastX = e.clientX; lastT = performance.now(); dragVel = 0; impulse = 0;
    carousel.classList.add('dragging');
    carousel.setPointerCapture(e.pointerId);
  });
  carousel.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const now = performance.now();
    const dx = e.clientX - lastX;
    x += dx; wrapX();
    track.style.transform = `translate3d(${x}px,0,0)`;
    const dt = Math.max(1, now - lastT);
    dragVel = (dx / dt) * 16; // px per frame
    lastX = e.clientX; lastT = now;
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    carousel.classList.remove('dragging');
    impulse = Math.max(-60, Math.min(60, dragVel)); // fling with momentum
    vel = 0;
  };
  carousel.addEventListener('pointerup', endDrag);
  carousel.addEventListener('pointercancel', endDrag);

  const step = () => (track.firstElementChild ? track.firstElementChild.getBoundingClientRect().width + 20 : 400);
  document.getElementById('revNext').addEventListener('click', () => { impulse = -step() * 0.1; vel = 0; });
  document.getElementById('revPrev').addEventListener('click', () => { impulse = step() * 0.1; vel = 0; });

  /* ---------------- Quote form ---------------- */
  // No backend on a static site: compose an email to Kendle with the details.
  // Swap this for a form service (Formspree, Netlify Forms, etc.) when hosting.
  const form = document.getElementById('quoteForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const req = [...form.querySelectorAll('[required]')];
    let ok = true;
    req.forEach((f) => {
      const bad = !f.value.trim();
      f.style.borderColor = bad ? 'oklch(0.65 0.18 25)' : '';
      if (bad) ok = false;
    });
    if (!ok) { req.find((f) => !f.value.trim()).focus(); return; }
    const d = Object.fromEntries(new FormData(form));
    const subject = `Roof assessment request: ${d.service} in ${d.area}`;
    const lines = [
      `Name: ${d.first} ${d.last || ''}`.trim(),
      `Phone: ${d.phone}`,
      d.email ? `Email: ${d.email}` : '',
      `Service: ${d.service}`,
      `Area: ${d.area}`,
      '',
      d.message,
    ].filter((l, i) => l !== '' || i === 5);
    window.location.href = `mailto:kendle@horizonroofingandmetalworks.ca?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
    form.classList.add('sent');
  });
})();
