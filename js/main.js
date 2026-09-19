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
    const delai = doux ? 120 : 1550;
    if (document.readyState === 'complete') setTimeout(ouvrir, delai);
    else window.addEventListener('load', () => setTimeout(ouvrir, delai));
    // filet de sécurité : jamais de rideau bloqué
    setTimeout(ouvrir, 4200);
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
  const zonesSombres = () =>
    [...document.querySelectorAll('.hero, .section--sombre, .section--nuit, .atelier, .pied')];

  const majEntete = () => {
    if (entete) entete.classList.toggle('est-posee', window.scrollY > 40);
    const y = 34;
    const sombre = zonesSombres().some(el => {
      const r = el.getBoundingClientRect();
      return r.top <= y && r.bottom >= y;
    });
    document.body.classList.toggle('fond-sombre', sombre);
  };

  /* ---------- Le fil : progression + perles ---------- */
  const fil = document.querySelector('[data-fil]');
  const remplissage = document.querySelector('[data-fil-remplissage]');
  const barre = document.querySelector('[data-progression] span');
  let perles = [];

  const poserPerles = () => {
    if (!fil) return;
    perles.forEach(p => p.el.remove());
    perles = [];
    const hDoc = document.documentElement.scrollHeight;
    document.querySelectorAll('[data-perle]').forEach(section => {
      const centre = section.offsetTop + section.offsetHeight * 0.18;
      const ratio = Math.min(0.985, Math.max(0.015, centre / hDoc));
      const el = document.createElement('i');
      el.className = 'fil__perle';
      el.style.top = (ratio * 100) + '%';
      el.title = section.dataset.perle || '';
      document.body.appendChild(el);
      perles.push({ el, ratio });
    });
  };

  const majFil = () => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    const p = h > 0 ? Math.min(1, window.scrollY / h) : 0;
    if (remplissage) remplissage.style.height = (p * 100) + '%';
    if (barre) barre.style.width = (p * 100) + '%';
    perles.forEach(perle => perle.el.classList.toggle('est-active', p >= perle.ratio - 0.005));
  };

  /* ---------- Boucle de défilement ---------- */
  let enAttente = false;
  const auDefilement = () => {
    if (enAttente) return;
    enAttente = true;
    requestAnimationFrame(() => {
      majEntete();
      majFil();
      parallaxe();
      enAttente = false;
    });
  };
  window.addEventListener('scroll', auDefilement, { passive: true });
  window.addEventListener('resize', () => { poserPerles(); auDefilement(); });

  /* ---------- Parallaxe discrète ---------- */
  const calques = [...document.querySelectorAll('[data-parallaxe]')];
  const parallaxe = () => {
    if (doux || !calques.length) return;
    calques.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > window.innerHeight + 200) return;
      const avance = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
      const force = parseFloat(el.dataset.parallaxe) || 18;
      el.style.transform = `translate3d(0, ${(-avance * force).toFixed(2)}px, 0)`;
    });
  };

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

  /* ---------- Année ---------- */
  document.querySelectorAll('[data-annee]').forEach(el => el.textContent = new Date().getFullYear());

  /* ---------- Démarrage ---------- */
  poserPerles();
  auDefilement();
  window.addEventListener('load', () => { poserPerles(); auDefilement(); });
})();
