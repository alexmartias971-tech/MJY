/* =========================================================
   M'jy — comportements communs à toutes les pages
   ========================================================= */
(() => {
  const doux = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tactile = window.matchMedia('(hover: none)').matches;

  /* ---------- Rideau d'ouverture ---------- */
  const rideau = document.querySelector('[data-rideau]');
  const ouvrir = () => {
    document.body.classList.add('est-charge');
    if (rideau) rideau.classList.add('est-parti');
  };
  if (rideau) {
    const delai = doux ? 120 : 1900;
    if (document.readyState === 'complete') setTimeout(ouvrir, delai);
    else window.addEventListener('load', () => setTimeout(ouvrir, delai));
    setTimeout(ouvrir, 4600); // filet de sécurité
  }

  /* ---------- Menu ---------- */
  const bouton = document.querySelector('[data-menu]');
  if (bouton) {
    bouton.addEventListener('click', () => {
      const ouvert = document.body.classList.toggle('menu-ouvert');
      document.body.classList.toggle('fige', ouvert);
      bouton.setAttribute('aria-expanded', String(ouvert));
    });
    document.querySelectorAll('.nav a').forEach(a =>
      a.addEventListener('click', () => {
        document.body.classList.remove('menu-ouvert', 'fige');
        bouton.setAttribute('aria-expanded', 'false');
      })
    );
  }

  /* ---------- En-tête posée + fond sombre ---------- */
  const entete = document.querySelector('.entete');
  const etoileEntete = document.querySelector('.marque__etoile');
  const zones = () =>
    [...document.querySelectorAll('.hero, .section--sombre, .section--nuit, .atelier, .pied')];

  const majEntete = () => {
    if (entete) entete.classList.toggle('est-posee', window.scrollY > 40);
    const sombre = zones().some(el => {
      const r = el.getBoundingClientRect();
      return r.top <= 34 && r.bottom >= 34;
    });
    document.body.classList.toggle('fond-sombre', sombre);
    if (etoileEntete && !doux) etoileEntete.style.rotate = (window.scrollY * 0.06) + 'deg';
  };

  /* =========================================================
     LE FIL — une vraie corde de coton ciré qui descend la page.
     Une bande de corde tressée (photo de matière) est posée tranche
     par tranche le long d'un tracé souple ; à chaque section la corde
     fait une boucle et enfile une perle d'argent. Au fil de la
     lecture, la corde naturelle devient turquoise.
     ========================================================= */
  const fil = (() => {
    const hote = document.querySelector('[data-fil]');
    if (!hote) return null;

    const brut = document.createElement('canvas');
    const vif = document.createElement('canvas');
    brut.className = 'fil__toile';
    vif.className = 'fil__toile fil__toile--vif';
    const voyageur = document.createElement('i');
    voyageur.className = 'fil__voyageur';
    voyageur.innerHTML = '<svg viewBox="0 0 200 200" aria-hidden="true"><use href="#etoile"/></svg>';
    hote.append(brut, vif, voyageur);

    const charger = src => new Promise(ok => {
      const i = new Image();
      i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src;
    });
    const cordes = Promise.all([charger('/assets/img/fil-brut.png'), charger('/assets/img/fil-vif.png')]);

    let pts = [], yMax = [], H = 0, perles = [], dims = {};

    /* tout est proportionnel à la marge réelle : la corde occupe la gouttière */
    const reglages = () => {
      const env = document.querySelector('.enveloppe');
      const m = env ? parseFloat(getComputedStyle(env).paddingLeft) : 60;
      const petit = innerWidth < 900;
      return {
        L: Math.round(m), cx: m * 0.44, A: m * (petit ? 0.12 : 0.14),
        r: m * (petit ? 0.14 : 0.145), T: petit ? 6.5 : Math.min(11, 6 + m * 0.055)
      };
    };

    /* le tracé : une corde posée librement, pas une sinusoïde parfaite */
    const tracer = () => {
      const { cx, A, r } = dims;
      // trois ondulations superposées : la corde se pose, elle ne suit pas une règle
      const x = y => cx + A * (0.5 * Math.sin(y / 410 + 0.4) + 0.32 * Math.sin(y / 167 + 1.9)
        + 0.18 * Math.sin(y / 61 + 4.1));
      const boucles = [...document.querySelectorAll('[data-perle]')]
        .map(sec => ({ y: sec.offsetTop + Math.min(sec.offsetHeight * 0.2, 190), nom: sec.dataset.perle }))
        .sort((a, b) => a.y - b.y);
      pts = []; perles = [];
      let b = 0;
      for (let y = -12; y <= H + 12; y += 1.5) {
        pts.push([x(y), y]);
        if (b < boucles.length && y >= boucles[b].y) {
          const px = x(y), n = Math.ceil((2 * Math.PI * r) / 1.4);
          for (let k = 1; k <= n; k++) {           // un tour complet : la corde se croise
            const t = Math.PI - (2 * Math.PI * k) / n;
            pts.push([px + r + r * Math.cos(t), y + r * 1.2 * Math.sin(t)]);
          }
          perles.push({ y: y + r * 2.7, x: x(y + r * 2.7), nom: boucles[b].nom });
          b++;
        }
      }
      yMax = []; let m = -Infinity;
      pts.forEach(p => { m = Math.max(m, p[1]); yMax.push(m); });
    };

    /* pose la bande de corde le long du tracé, tranche par tranche */
    const peindre = (toile, bande) => {
      let dpr = Math.min(2, devicePixelRatio || 1);
      if (H * dpr > 32000) dpr = 32000 / H;            // limite des navigateurs
      toile.width = Math.round(dims.L * dpr);
      toile.height = Math.round(H * dpr);
      toile.style.width = dims.L + 'px';
      toile.style.height = H + 'px';
      const ctx = toile.getContext('2d');
      ctx.scale(dpr, dpr);
      const T = dims.T;

      // ombre portée de la corde sur la page
      ctx.save();
      ctx.globalAlpha = 0.3; ctx.filter = 'blur(2.2px)';
      ctx.strokeStyle = '#0b1211'; ctx.lineWidth = T * 0.85; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath();
      pts.forEach(([px, py], i) => (i ? ctx.lineTo(px + 1.3, py + 2.2) : ctx.moveTo(px + 1.3, py + 2.2)));
      ctx.stroke();
      ctx.restore();

      if (!bande) {                                    // secours si l'image manque
        ctx.strokeStyle = toile === vif ? '#1FB7D4' : '#aa987a';
        ctx.lineWidth = T * 0.7; ctx.lineCap = 'round';
        ctx.beginPath(); pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.stroke();
        return;
      }
      const sw = bande.width, sh = bande.height;
      const parPx = sh / T;                            // pixels de bande par pixel de corde
      let s = 0;
      for (let i = 1; i < pts.length; i++) {
        const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
        const d = Math.hypot(x1 - x0, y1 - y0);
        if (!d) continue;
        ctx.save();
        ctx.translate(x0, y0);
        ctx.rotate(Math.atan2(y1 - y0, x1 - x0));
        const sx = (s * parPx) % sw, w = d * parPx;
        if (sx + w <= sw) {
          ctx.drawImage(bande, sx, 0, w, sh, 0, -T / 2, d + 0.7, T);
        } else {                                       // raccord de la bande
          const w1 = sw - sx, d1 = (d * w1) / w;
          ctx.drawImage(bande, sx, 0, w1, sh, 0, -T / 2, d1 + 0.5, T);
          ctx.drawImage(bande, 0, 0, w - w1, sh, d1, -T / 2, d - d1 + 0.7, T);
        }
        ctx.restore();
        s += d;
      }
    };

    const poserPerles = () => {
      hote.querySelectorAll('.fil__perle').forEach(e => e.remove());
      perles.forEach(p => {
        const el = document.createElement('i');
        el.className = 'fil__perle';
        el.style.top = p.y + 'px';
        el.style.left = p.x + 'px';
        el.title = p.nom || '';
        hote.appendChild(el);
        p.el = el;
      });
    };

    let jeton = 0;
    const dessiner = () => {
      const moi = ++jeton;
      dims = reglages();
      hote.style.height = '0px';
      H = document.documentElement.scrollHeight;
      hote.style.height = H + 'px';
      hote.style.width = dims.L + 'px';
      tracer();
      poserPerles();
      cordes.then(([b, v]) => {
        if (moi !== jeton) return;                     // un redessin plus récent a pris la main
        peindre(brut, b);
        peindre(vif, v);
        avancer();
      });
    };

    const barre = document.querySelector('[data-progression] span');

    const avancer = () => {
      if (!H) return;
      const niveau = window.scrollY + innerHeight * 0.55;
      vif.style.clipPath = `inset(0 0 ${Math.max(0, H - niveau).toFixed(0)}px 0)`;

      // l'étoile avance au bout de la partie turquoise
      let lo = 0, hi = yMax.length - 1;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (yMax[mid] < niveau) lo = mid + 1; else hi = mid; }
      const p = pts[lo] || [dims.cx, niveau];
      voyageur.style.transform =
        `translate3d(${p[0].toFixed(1)}px, ${p[1].toFixed(1)}px, 0) rotate(${(niveau * 0.25).toFixed(1)}deg)`;
      const fin = document.documentElement.scrollHeight - innerHeight;
      voyageur.classList.toggle('est-visible', window.scrollY > 4 && window.scrollY < fin - 4);
      perles.forEach(pl => pl.el && pl.el.classList.toggle('est-enfilee', niveau >= pl.y));
      if (barre) barre.style.width = (fin > 0 ? Math.min(100, (window.scrollY / fin) * 100) : 0) + '%';
    };

    // la page grandit quand les images arrivent : on recoud la corde
    if ('ResizeObserver' in window) {
      let h0 = 0, att;
      new ResizeObserver(() => {
        const h = document.body.scrollHeight;
        if (Math.abs(h - h0) < 30) return;
        h0 = h; clearTimeout(att); att = setTimeout(dessiner, 180);
      }).observe(document.body);
    }

    return { dessiner, avancer, poserPerles };
  })();

  /* ---------- Parallaxe discrète ---------- */
  const calques = [...document.querySelectorAll('[data-parallaxe]')];
  const parallaxe = () => {
    if (doux || !calques.length) return;
    calques.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -220 || r.top > window.innerHeight + 220) return;
      const avance = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
      const force = parseFloat(el.dataset.parallaxe) || 18;
      const tourne = el.dataset.tourne
        ? ` rotate(${(avance * parseFloat(el.dataset.tourne)).toFixed(2)}deg)` : '';
      el.style.transform = `translate3d(0, ${(-avance * force).toFixed(2)}px, 0)${tourne}`;
    });
  };

  /* ---------- Boucle de défilement ---------- */
  let enAttente = false;
  const auDefilement = () => {
    if (enAttente) return;
    enAttente = true;
    requestAnimationFrame(() => {
      majEntete();
      fil && fil.avancer();
      parallaxe();
      enAttente = false;
    });
  };
  window.addEventListener('scroll', auDefilement, { passive: true });
  window.addEventListener('resize', () => { fil && fil.dessiner(); auDefilement(); });

  /* ---------- Révélations ---------- */
  const cibles = document.querySelectorAll('.reveler, .voile, .mots');
  if ('IntersectionObserver' in window && !doux) {
    const oeil = new IntersectionObserver((entrees, obs) => {
      entrees.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add('est-vue');
        obs.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    cibles.forEach(c => oeil.observe(c));
  } else {
    cibles.forEach(c => c.classList.add('est-vue'));
  }

  /* ---------- Curseur étoile ---------- */
  const curseur = document.querySelector('[data-curseur]');
  if (curseur && !tactile && !doux) {
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
    addEventListener('mousemove', e => {
      x = e.clientX; y = e.clientY;
      curseur.classList.add('est-visible');
    });
    addEventListener('mouseleave', () => curseur.classList.remove('est-visible'));
    const suivre = () => {
      cx += (x - cx) * 0.16;
      cy += (y - cy) * 0.16;
      curseur.style.transform = `translate3d(${cx}px, ${cy}px, 0) rotate(${(cx + cy) * 0.06}deg)`;
      requestAnimationFrame(suivre);
    };
    suivre();
    document.addEventListener('mouseover', e => {
      const actif = e.target.closest('a, button, input, select, textarea, [data-pointeur]');
      curseur.classList.toggle('sur-lien', !!actif);
    });
  }

  /* ---------- Messages ---------- */
  let minuteur;
  const boite = document.querySelector('[data-message]');
  window.mjyMessage = texte => {
    if (!boite) return;
    boite.textContent = texte;
    boite.classList.add('est-visible');
    clearTimeout(minuteur);
    minuteur = setTimeout(() => boite.classList.remove('est-visible'), 3800);
  };

  /* ---------- Formulaire de contact (sans serveur) ---------- */
  const form = document.querySelector('[data-formulaire]');
  if (form) {
    const lire = () => {
      const d = new FormData(form);
      return {
        nom: (d.get('nom') || '').toString().trim(),
        email: (d.get('email') || '').toString().trim(),
        envie: (d.get('envie') || '').toString(),
        message: (d.get('message') || '').toString().trim()
      };
    };
    const corps = v =>
      `Bonjour M'jy,\n\n${v.message}\n\nEnvie : ${v.envie}\nNom : ${v.nom}\nEmail : ${v.email}\n`;

    form.addEventListener('submit', e => {
      e.preventDefault();
      const v = lire();
      if (!v.nom || !v.message) { window.mjyMessage('Indiquez au moins votre prénom et votre message.'); return; }
      const sujet = encodeURIComponent(`Demande ${v.envie} — ${v.nom}`);
      location.href = `mailto:${form.dataset.email}?subject=${sujet}&body=${encodeURIComponent(corps(v))}`;
    });

    const wa = form.querySelector('[data-whatsapp]');
    if (wa) wa.addEventListener('click', () => {
      const v = lire();
      if (!v.message) { window.mjyMessage('Écrivez d’abord votre message.'); return; }
      open(`https://wa.me/${wa.dataset.whatsapp}?text=${encodeURIComponent(corps(v))}`, '_blank');
    });
  }

  document.querySelectorAll('[data-annee]').forEach(el => el.textContent = new Date().getFullYear());

  /* ---------- Démarrage ---------- */
  fil && fil.dessiner();
  auDefilement();
  window.addEventListener('load', () => { fil && fil.dessiner(); auDefilement(); });
})();
