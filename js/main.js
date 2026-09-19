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
     LE FIL — deux brins qui s'entrelacent sur toute la hauteur
     ========================================================= */
  const fil = (() => {
    const hote = document.querySelector('[data-fil]');
    if (!hote) return null;

    const SVG = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('class', 'fil__toile');
    hote.appendChild(svg);

    const groupeFond = document.createElementNS(SVG, 'g');
    groupeFond.setAttribute('class', 'fil__brins fil__brins--fond');
    const groupeVif = document.createElementNS(SVG, 'g');
    groupeVif.setAttribute('class', 'fil__brins fil__brins--vif');
    svg.append(groupeFond, groupeVif);

    const voyageur = document.createElement('i');
    voyageur.className = 'fil__voyageur';
    voyageur.innerHTML =
      '<svg viewBox="0 0 200 200" aria-hidden="true"><use href="#etoile"/></svg>';
    hote.appendChild(voyageur);

    let L = 54, A = 15, P = 150, H = 0, centre = 27, perles = [];

    /* Un brin est une sinusoïde. On l'interrompt à un croisement sur deux,
       là où l'autre brin doit passer devant : le vide suffit à dire
       « celui-ci passe dessous ». Pas de calque de fond à assortir. */
    const brin = (sens, dessous) => {
      const pas = 4, trou = P * 0.075;
      const morceaux = [];
      let cour = [];
      for (let y = -P; y <= H + P; y += pas) {
        const croisement = Math.round(y / (P / 2));
        const cache = (((croisement % 2) + 2) % 2 === (dessous ? 0 : 1))
          && Math.abs(y - croisement * (P / 2)) < trou;
        if (cache) {
          if (cour.length > 1) morceaux.push(cour);
          cour = [];
          continue;
        }
        cour.push([centre + sens * A * Math.sin((y / P) * Math.PI * 2), y]);
      }
      if (cour.length > 1) morceaux.push(cour);
      return morceaux
        .map(m => 'M ' + m.map(([x, y]) => x.toFixed(1) + ' ' + y.toFixed(1)).join(' L '))
        .join(' ');
    };

    const dessiner = () => {
      const petit = window.innerWidth < 900;
      L = petit ? 24 : 54;
      A = petit ? 7 : 15;
      P = petit ? 110 : 152;
      centre = L / 2;
      H = window.innerHeight;
      hote.style.width = L + 'px';
      svg.setAttribute('viewBox', `0 0 ${L} ${H}`);
      svg.setAttribute('width', L);
      svg.setAttribute('height', H);

      [groupeFond, groupeVif].forEach(g => {
        g.textContent = '';
        [[1, false], [-1, true]].forEach(([sens, dessous]) => {
          const p = document.createElementNS(SVG, 'path');
          p.setAttribute('d', brin(sens, dessous));
          g.appendChild(p);
        });
      });
      poserPerles();
    };

    /* une perle d'argent par section, aimantée sur un croisement des brins */
    const poserPerles = () => {
      perles.forEach(p => p.el.remove());
      perles = [];
      const hDoc = document.documentElement.scrollHeight;
      document.querySelectorAll('[data-perle]').forEach(section => {
        const ratio = Math.min(0.99, Math.max(0.012,
          (section.offsetTop + section.offsetHeight * 0.18) / hDoc));
        const yCroix = Math.round((ratio * H) / (P / 2)) * (P / 2);
        const el = document.createElement('i');
        el.className = 'fil__perle';
        el.style.top = yCroix + 'px';
        el.style.left = centre + 'px';
        el.title = section.dataset.perle || '';
        hote.appendChild(el);
        perles.push({ el, ratio: yCroix / H });
      });
    };

    const barre = document.querySelector('[data-progression] span');

    const avancer = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const p = h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0;
      groupeVif.style.clipPath = `inset(0 0 ${((1 - p) * 100).toFixed(2)}% 0)`;
      const y = p * H;
      voyageur.style.transform =
        `translate3d(${(centre + A * Math.sin((y / P) * Math.PI * 2)).toFixed(1)}px, ${y.toFixed(1)}px, 0)`
        + ` rotate(${(y * 0.3).toFixed(1)}deg)`;
      voyageur.classList.toggle('est-visible', p > 0.003 && p < 0.997);
      perles.forEach(perle => perle.el.classList.toggle('est-enfilee', p >= perle.ratio - 0.004));
      if (barre) barre.style.width = (p * 100) + '%';
    };

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
