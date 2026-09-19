/* =========================================================
   M'jy — L'Atelier : configurateur de bracelet en 3D
   three.js est embarqué dans js/vendor (aucun CDN requis)
   ========================================================= */
import * as THREE from './vendor/three.module.js';

/* ---------------- Matières ---------------- */
const PIERRES = {
  turquoise: { nom: 'Turquoise', hex: 0x3a97a6, rug: 0.56, met: 0.0, forme: 'rondelle', prix: 2.6, note: 'Turquoise véritable, veines brunes' },
  larimar:   { nom: 'Larimar',   hex: 0x86c3cc, rug: 0.50, met: 0.0, forme: 'rondelle', prix: 5, note: 'Pierre des Caraïbes, bleu laiteux' },
  amazonite: { nom: 'Amazonite', hex: 0x8dbcab, rug: 0.52,  met: 0.0, forme: 'rondelle', prix: 3, note: 'Vert d’eau opaque' },
  magnesite: { nom: 'Magnésite', hex: 0xe6e1d6, rug: 0.62,  met: 0.0, forme: 'rondelle', prix: 2, note: 'Blanc mat, veines grises' },
  nacre:     { nom: 'Nacre',     hex: 0xf1e9dd, rug: 0.12, met: 0.0, forme: 'perle', prix: 3.2, iris: 0.6, note: 'Nacre blanche irisée' },
  hematite:  { nom: 'Hématite',  hex: 0x7b8185, rug: 0.21, met: 1.0, forme: 'facette', prix: 2.4, note: 'Gris acier facetté' },
  onyx:      { nom: 'Onyx',      hex: 0x15181a, rug: 0.19, met: 0.0, forme: 'rondelle', prix: 2.4, note: 'Noir profond poli' },
  quartz:    { nom: 'Quartz fumé', hex: 0x71605a, rug: 0.20, met: 0.0, forme: 'facette', prix: 3.4, note: 'Brun translucide' },
  argent:    { nom: 'Argent 925', hex: 0xd9dee0, rug: 0.24, met: 1.0, forme: 'anneau', prix: 1.2, note: 'Anneau martelé, argent massif' },
  or:        { nom: 'Plaqué or', hex: 0xd6a74e, rug: 0.26, met: 1.0, forme: 'anneau', prix: 4, note: 'Anneau doré à l’or fin' },
  tahiti:    { nom: 'Perle de Tahiti', hex: 0x2b342f, rug: 0.05, met: 0.0, forme: 'perle', prix: 18, iris: 1, note: 'Perle baroque, reflets paon' },
  tahiti_or: { nom: 'Perle dorée', hex: 0xc9a46c, rug: 0.05, met: 0.0, forme: 'perle', prix: 17, iris: 0.9, note: 'Perle des Philippines, reflet doré' }
};

const FILS = [
  { id: 'noir',     nom: 'Coton ciré noir', hex: 0x15181b },
  { id: 'encre',    nom: 'Bleu encre',      hex: 0x1d2b3a },
  { id: 'lagon',    nom: 'Lagon',           hex: 0x1fb7d4 },
  { id: 'sable',    nom: 'Sable',           hex: 0xc8bba4 },
  { id: 'ecru',     nom: 'Écru',            hex: 0xefe7d8 },
  { id: 'perle',    nom: 'Gris perle',      hex: 0x9aa0a2 },
  { id: 'cuir',     nom: 'Cuir brun',       hex: 0x4a3324 },
  { id: 'bordeaux', nom: 'Bordeaux',        hex: 0x5e1f28 },
  { id: 'chaine',   nom: 'Chaîne argent 925', hex: 0xd9dee0, metal: true }
];

const COMPOSITIONS = [
  { id: 'alternee',   nom: 'Alternée' },
  { id: 'symetrique', nom: 'Symétrique' },
  { id: 'degrade',    nom: 'Dégradé' },
  { id: 'libre',      nom: 'Libre' }
];

const MONTAGES = [
  { id: 'serre', nom: 'Serré' },
  { id: 'noue',  nom: 'Noué' }
];

const CENTRES = [
  { id: 'aucun',     nom: 'Aucune' },
  { id: 'tahiti',    nom: 'Tahiti' },
  { id: 'tahiti_or', nom: 'Dorée' }
];

const PRIX_PLANCHER = 150;

/* Dimensions réelles des perles, en centimètres */
const FORME = {
  rondelle: { diam: 0.80, ep: 0.44 },
  anneau:   { diam: 0.68, ep: 0.30 },
  facette:  { diam: 0.62, ep: 0.44 },
  perle:    { diam: 1.05, ep: 1.05 }
};
const ECART_FERMOIR = 1.6;   // arc réservé au fermoir T
const EP_NOEUD = 0.30;       // place prise par les deux nœuds encadrant une perle

/* ---------------- État ---------------- */
const etat = {
  taille: 17,            // cm
  fil: 'noir',
  pierre: 'turquoise',   // pierre « au pinceau »
  seconde: 'argent',
  composition: 'alternee',
  montage: 'serre',
  nb: 0,                 // emplacements réellement retenus
  densite: 0.5,          // part de pierres dans le collier
  centre: 'tahiti',
  gravure: '',
  slots: []              // ids de pierres, index 0 = haut du bracelet
};

/* ---------------- Utilitaires ---------------- */
const $ = s => document.querySelector(s);
const hex6 = n => '#' + n.toString(16).padStart(6, '0');
const nbSlots = () => Math.max(18, Math.min(52, Math.round((etat.taille + 1.2 - 1.6) / 0.42)));

function epaisseur(id, sup) {
  return FORME[(PIERRES[id] || PIERRES.argent).forme].ep + sup;
}

/* Une perle de Tahiti prend deux fois plus de place qu'une rondelle :
   on recale le nombre d'emplacements sur la longueur réellement occupée. */
function ajuster() {
  const cible = etat.taille + 1.2 - ECART_FERMOIR;
  const sup = etat.montage === 'noue' ? EP_NOEUD : 0;
  for (let essai = 0; essai < 6; essai++) {
    const somme = etat.slots.reduce((a, id) => a + epaisseur(id, sup), 0);
    if (!somme || Math.abs(somme - cible) < 0.22) break;
    const nb = Math.max(5, Math.min(60, Math.round(etat.slots.length * cible / somme)));
    if (nb === etat.slots.length) break;
    etat.nb = nb;
    composer();
  }
}

function composer() {
  const n = etat.nb || nbSlots();
  const a = etat.pierre, b = etat.seconde;
  const s = new Array(n);
  if (etat.composition === 'alternee') {
    const pas = Math.max(1, Math.round(1 / Math.max(0.12, etat.densite)));
    for (let i = 0; i < n; i++) s[i] = (i % pas === 0) ? a : b;
  } else if (etat.composition === 'symetrique') {
    const moitie = Math.ceil(n / 2);
    const bloc = Math.max(1, Math.round(moitie * etat.densite * 0.9));
    for (let i = 0; i < moitie; i++) {
      const v = i < bloc ? a : b;
      s[(i) % n] = v;
      s[(n - i) % n] = v;
    }
  } else if (etat.composition === 'degrade') {
    for (let i = 0; i < n; i++) {
      const d = Math.abs(((i + n / 2) % n) - n / 2) / (n / 2); // 0 au centre bas, 1 en haut
      s[i] = d < etat.densite ? a : b;
    }
  } else { // libre : on garde l'existant, on complète si la taille a changé
    for (let i = 0; i < n; i++) s[i] = etat.slots[i] || (i % 2 ? b : a);
  }
  if (etat.centre !== 'aucun') {
    const c = Math.round(n / 2) % n;
    s[c] = etat.centre;
  }
  etat.slots = s;
}

function prix() {
  const total = etat.slots.reduce((somme, id) => somme + (PIERRES[id]?.prix || 0), 0);
  const fil = etat.fil === 'chaine' ? 38 : 0;
  const gravure = etat.gravure ? 25 : 0;
  const noeuds = etat.montage === 'noue' ? 22 : 0;
  const brut = 78 + total + fil + gravure + noeuds + (etat.taille - 16) * 3;
  return Math.max(PRIX_PLANCHER, Math.round(brut / 5) * 5);
}

function inventaire() {
  const c = {};
  etat.slots.forEach(id => c[id] = (c[id] || 0) + 1);
  return Object.entries(c).sort((x, y) => y[1] - x[1]);
}

function recapTexte() {
  const fil = FILS.find(f => f.id === etat.fil);
  const lignes = [
    'Ma création M’jy',
    `Tour de poignet : ${etat.taille} cm (${etat.slots.length} emplacements)`,
    `Lien : ${fil.nom}`,
    `Composition : ${COMPOSITIONS.find(c => c.id === etat.composition).nom}`,
    `Montage : ${MONTAGES.find(m => m.id === etat.montage).nom}`,
    'Pierres : ' + inventaire().map(([id, n]) => `${n} × ${PIERRES[id].nom}`).join(', ')
  ];
  if (etat.gravure) lignes.push(`Gravure sur le fermoir : « ${etat.gravure} »`);
  lignes.push(`Estimation : ${prix()} €`);
  return lignes.join('\n');
}

/* =========================================================
   Scène 3D
   ========================================================= */
const scene3D = (() => {
  const hote = $('[data-scene]');
  if (!hote) return null;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  } catch (e) { return null; }
  if (!renderer.getContext()) return null;

  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  hote.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
  camera.position.set(0, 0, 26);

  /* Environnement lumineux fabriqué à la volée (pas de fichier HDR) */
  const toile = document.createElement('canvas');
  toile.width = 512; toile.height = 256;
  const ctx = toile.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#f4fbff');
  grad.addColorStop(0.45, '#8fa6ad');
  grad.addColorStop(0.62, '#2a3b3f');
  grad.addColorStop(1, '#0a1211');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 512, 256);
  const halo = ctx.createRadialGradient(150, 60, 5, 150, 60, 130);
  halo.addColorStop(0, 'rgba(255,255,255,1)');
  halo.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = halo; ctx.fillRect(0, 0, 512, 256);
  const halo2 = ctx.createRadialGradient(400, 110, 5, 400, 110, 150);
  halo2.addColorStop(0, 'rgba(120,220,245,.85)');
  halo2.addColorStop(1, 'rgba(120,220,245,0)');
  ctx.fillStyle = halo2; ctx.fillRect(0, 0, 512, 256);

  const texEnv = new THREE.CanvasTexture(toile);
  texEnv.mapping = THREE.EquirectangularReflectionMapping;
  texEnv.colorSpace = THREE.SRGBColorSpace;
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromEquirectangular(texEnv).texture;
  pmrem.dispose(); texEnv.dispose();

  scene.add(new THREE.HemisphereLight(0xdff3f7, 0x0b1413, 0.5));
  const cle = new THREE.DirectionalLight(0xffffff, 2.1); cle.position.set(6, 9, 10); scene.add(cle);
  const contre = new THREE.DirectionalLight(0x5fd6ec, 1.1); contre.position.set(-8, -3, -6); scene.add(contre);

  const groupe = new THREE.Group();
  groupe.rotation.x = -0.52;
  scene.add(groupe);

  /* Géométries réutilisées (rayon 0.5 : l'échelle vaut donc le diamètre en cm) */
  const GEO = {
    perle: new THREE.SphereGeometry(0.5, 44, 30),
    rondelle: new THREE.SphereGeometry(0.5, 36, 24),
    facette: new THREE.IcosahedronGeometry(0.5, 0),
    anneau: new THREE.SphereGeometry(0.5, 32, 20),
    fermoirAnneau: new THREE.TorusGeometry(0.3, 0.045, 12, 44),
    fermoirBarre: new THREE.CylinderGeometry(0.048, 0.048, 0.66, 16),
    fermoirBout: new THREE.SphereGeometry(0.06, 14, 10),
    noeud: new THREE.TorusKnotGeometry(0.62, 0.3, 48, 10, 2, 3)
  };

  let cordon = null, fermoir = null;
  let perles = [];
  let survol = null, choisi = -1;

  /* textures des matières (assets/tex) */
  const chargeur = new THREE.TextureLoader();
  const cache = {};
  const texture = (id, suffixe) => {
    const cle = id + (suffixe || '');
    if (!cache[cle]) {
      const t = chargeur.load('/assets/tex/' + cle + '.jpg');
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = renderer.capabilities.getMaxAnisotropy();
      if (!suffixe) t.colorSpace = THREE.SRGBColorSpace;
      cache[cle] = t;
    }
    return cache[cle];
  };

  /* grain de pierre fabriqué à la volée */
  const grain = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 192;
    const g = c.getContext('2d');
    g.fillStyle = '#808080'; g.fillRect(0, 0, 192, 192);
    for (let i = 0; i < 2600; i++) {
      const x = Math.random() * 192, y = Math.random() * 192, r = Math.random() * 6 + 0.6;
      const v = 128 + (Math.random() - 0.5) * 170;
      g.fillStyle = `rgba(${v|0},${v|0},${v|0},.5)`;
      g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    }
    for (let i = 0; i < 26; i++) { // veines
      g.strokeStyle = 'rgba(60,60,60,.45)'; g.lineWidth = Math.random() * 2 + 0.4;
      g.beginPath(); g.moveTo(Math.random() * 192, Math.random() * 192);
      g.bezierCurveTo(Math.random()*192, Math.random()*192, Math.random()*192, Math.random()*192, Math.random()*192, Math.random()*192);
      g.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(2, 2);
    return t;
  })();

  const materiau = (def, id) => {
    const m = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      map: texture(id),
      roughnessMap: texture(id, '-r'),
      bumpMap: texture(id, '-r'),
      bumpScale: def.met ? 0.008 : (def.iris ? 0.006 : 0.028),
      roughness: 1,
      metalness: def.met,
      clearcoat: def.iris ? 0.45 : 0.12,
      clearcoatRoughness: 0.05,
      envMapIntensity: def.iris ? 0.62 : 1.3
    });
    if (def.iris) {
      m.iridescence = def.iris * 0.4;
      m.iridescenceIOR = 1.5;
      m.iridescenceThicknessRange = [220, 820];
      m.sheen = 0.25;
      m.sheenColor = new THREE.Color(0x9fdbe8);
    }
    return m;
  };

  function construire() {
    // nettoyage
    perles.forEach(p => { p.mesh.material.dispose(); groupe.remove(p.mesh); });
    perles = [];
    if (cordon) { cordon.geometry.dispose(); cordon.material.dispose(); groupe.remove(cordon); }
    if (fermoir) { fermoir.traverse(o => o.material?.dispose()); groupe.remove(fermoir); }

    const n = etat.slots.length;
    const C = etat.taille + 1.2;                  // circonférence portée, cm
    const R = C / (2 * Math.PI);
    const angle = s => Math.PI / 2 + (s / C) * Math.PI * 2;
    const poser = (mesh, s) => {
      const a = angle(s);
      mesh.position.set(Math.cos(a) * R, Math.sin(a) * R, 0);
      mesh.rotation.z = a;                        // axe X local = radial, axe Y = le fil
      return a;
    };

    /* le lien */
    const fil = FILS.find(f => f.id === etat.fil);
    cordon = new THREE.Mesh(
      new THREE.TorusGeometry(R, fil.metal ? 0.06 : 0.045, 12, 240),
      new THREE.MeshPhysicalMaterial({
        color: fil.hex,
        roughness: fil.metal ? 0.2 : 0.78,
        metalness: fil.metal ? 1 : 0.04,
        clearcoat: fil.metal ? 0.4 : 0.15,
        envMapIntensity: 1.1
      })
    );
    groupe.add(cordon);

    /* les perles, placées à la vraie longueur, épaules contre épaules */
    const noue = etat.montage === 'noue';
    const epaisseurs = etat.slots.map(id => epaisseur(id, noue ? EP_NOEUD : 0));
    const somme = epaisseurs.reduce((a, b) => a + b, 0);
    const k = (C - ECART_FERMOIR) / somme;        // ajustement fin pour boucler le tour
    const serrage = Math.min(1, k * 1.1);         // si le rang est chargé, les perles rapetissent un peu

    let s = ECART_FERMOIR / 2;
    for (let i = 0; i < n; i++) {
      const def = PIERRES[etat.slots[i]] || PIERRES.argent;
      const dim = FORME[def.forme];
      const ep = epaisseurs[i] * k;
      const mesh = new THREE.Mesh(GEO[def.forme] || GEO.rondelle, materiau(def, etat.slots[i]));
      const alea = ((i * 2654435761) % 997) / 997;            // stable d'un rendu à l'autre
      mesh.material.color.offsetHSL(0, 0, (alea - 0.5) * 0.10);   // aucune pierre n'est la jumelle d'une autre
      poser(mesh, s + ep / 2);
      mesh.rotation.y = alea * 6.28;
      mesh.position.z += (alea - 0.5) * 0.055;                // un rang monté main n'est jamais plat
      mesh.position.multiplyScalar(1 + (alea - 0.5) * 0.004);
      if (def.forme === 'facette') mesh.rotation.y = i * 1.7;
      const d = (def.forme === 'perle' ? dim.diam * (0.94 + ((i * 37) % 13) / 100) : dim.diam) * serrage;
      const sy = def.forme === 'perle' ? d : Math.min(ep * 0.99, dim.ep * 1.3);
      mesh.scale.set(d, sy, d);
      mesh.userData.index = i;
      groupe.add(mesh);
      perles.push({ mesh, def, scale: new THREE.Vector3(d, sy, d) });

      if (noue) {                                  // un nœud de chaque côté de la perle
        const matNoeud = new THREE.MeshPhysicalMaterial({
          color: fil.hex,
          roughness: fil.metal ? 0.25 : 0.82,
          metalness: fil.metal ? 1 : 0.04,
          bumpMap: grain, bumpScale: 0.03
        });
        const bord = Math.min(ep * 0.5 - 0.02, sy * 0.5 + 0.13);
        [s + ep / 2 - bord, s + ep / 2 + bord].forEach(pos => {
          const noeud = new THREE.Mesh(GEO.noeud, matNoeud);
          poser(noeud, pos);
          noeud.scale.setScalar(0.125 + 0.055 * serrage);
          noeud.rotation.y = alea * 5;
          groupe.add(noeud);
          perles.push({ mesh: noeud, def, scale: noeud.scale.clone(), fixe: true });
        });
      }
      s += ep;
    }

    /* le fermoir T signé */
    fermoir = new THREE.Group();
    const argent = new THREE.MeshPhysicalMaterial({
      color: 0xdfe4e5, roughness: 0.22, metalness: 1, envMapIntensity: 1.4
    });
    const anneau = new THREE.Mesh(GEO.fermoirAnneau, argent);
    poser(anneau, -ECART_FERMOIR * 0.3);
    fermoir.add(anneau);

    const barre = new THREE.Mesh(GEO.fermoirBarre, argent);
    const aBarre = poser(barre, ECART_FERMOIR * 0.3);
    barre.rotation.z = aBarre - Math.PI / 2;      // la barre traverse l'anneau, à plat
    fermoir.add(barre);

    [-1, 1].forEach(sens => {
      const bout = new THREE.Mesh(GEO.fermoirBout, argent);
      const a = angle(ECART_FERMOIR * 0.3);
      bout.position.set(
        Math.cos(a) * (R + sens * 0.33),
        Math.sin(a) * (R + sens * 0.33),
        0
      );
      fermoir.add(bout);
    });
    groupe.add(fermoir);

    // cadrage
    camera.position.z = R * 6.2 + 3.4;
    camera.updateProjectionMatrix();
  }

  /* ----- interactions ----- */
  const rayon = new THREE.Raycaster();
  const pointeur = new THREE.Vector2();
  let glisse = false, bougé = false, dernier = { x: 0, y: 0 }, vitesse = 0.0024, inertie = 0;
  let auto = true, repos = 0;

  const surface = renderer.domElement;

  const majPointeur = e => {
    const r = surface.getBoundingClientRect();
    pointeur.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointeur.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  };

  const doigts = new Map();
  let ecart0 = 0, zoom0 = 0;

  surface.addEventListener('pointerdown', e => {
    doigts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (doigts.size === 2) {                       // pincement : on approche
      const [a, b] = [...doigts.values()];
      ecart0 = Math.hypot(a.x - b.x, a.y - b.y);
      zoom0 = camera.position.z;
      glisse = false;
      return;
    }
    glisse = true; bougé = false; auto = false;
    dernier = { x: e.clientX, y: e.clientY };
    surface.setPointerCapture(e.pointerId);
  });

  surface.addEventListener('pointermove', e => {
    majPointeur(e);
    if (doigts.has(e.pointerId)) doigts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (doigts.size === 2 && ecart0) {
      const [a, b] = [...doigts.values()];
      const ecart = Math.hypot(a.x - b.x, a.y - b.y);
      camera.position.z = Math.max(8, Math.min(46, zoom0 * (ecart0 / Math.max(1, ecart))));
      return;
    }
    if (!glisse) return;
    const dx = e.clientX - dernier.x, dy = e.clientY - dernier.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) bougé = true;
    groupe.rotation.y += dx * 0.008;
    groupe.rotation.x = Math.max(-1.3, Math.min(1.3, groupe.rotation.x + dy * 0.006));
    inertie = dx * 0.008;
    dernier = { x: e.clientX, y: e.clientY };
  });

  const relacher = e => {
    if (e && e.pointerId !== undefined) doigts.delete(e.pointerId);
    if (doigts.size < 2) ecart0 = 0;
    if (glisse && !bougé) cliquerPerle();
    glisse = false; repos = 0;
    if (e && e.pointerId !== undefined && surface.hasPointerCapture?.(e.pointerId)) surface.releasePointerCapture(e.pointerId);
  };
  surface.addEventListener('pointerup', relacher);
  surface.addEventListener('pointercancel', relacher);
  surface.addEventListener('pointerleave', () => { survol = null; });

  surface.addEventListener('wheel', e => {
    e.preventDefault();
    camera.position.z = Math.max(8, Math.min(46, camera.position.z + e.deltaY * 0.02));
  }, { passive: false });

  function cliquerPerle() {
    rayon.setFromCamera(pointeur, camera);
    const touches = rayon.intersectObjects(perles.filter(p => !p.fixe).map(p => p.mesh), false);
    if (!touches.length) return;
    const i = touches[0].object.userData.index;
    etat.composition = 'libre';
    etat.slots[i] = etat.pierre;
    choisi = i;
    construire();
    majInterface();
    window.mjyMessage?.(`${PIERRES[etat.pierre].nom} posée sur l’emplacement ${i + 1}.`);
  }

  /* ----- boucle ----- */
  const horloge = new THREE.Clock();
  function dimensionner() {
    const w = hote.clientWidth, h = hote.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(dimensionner).observe(hote);

  function boucle() {
    requestAnimationFrame(boucle);
    const dt = horloge.getDelta();
    repos += dt;
    if (!glisse) {
      if (Math.abs(inertie) > 0.0002) { groupe.rotation.y += inertie; inertie *= 0.94; }
      if (repos > 2.4) { auto = true; }
      if (auto) groupe.rotation.y += vitesse;
    }

    // survol
    if (!glisse && perles.length) {
      rayon.setFromCamera(pointeur, camera);
      const t = rayon.intersectObjects(perles.filter(p => !p.fixe).map(p => p.mesh), false);
      const nouveau = t.length ? t[0].object.userData.index : null;
      if (nouveau !== survol) {
        survol = nouveau;
        const etiquette = $('[data-selection]');
        if (etiquette) {
          if (survol !== null) {
            etiquette.textContent = `${PIERRES[etat.slots[survol]].nom} — emplacement ${survol + 1}`;
            etiquette.classList.add('est-visible');
          } else etiquette.classList.remove('est-visible');
        }
        surface.style.cursor = survol !== null ? 'pointer' : 'grab';
      }
    }

    const t = horloge.getElapsedTime();
    perles.forEach((p, i) => {
      const actif = (i === survol) ? 1.07 : 1;
      p.mesh.scale.lerp(p.scale.clone().multiplyScalar(actif), 0.18);
      if (i === choisi) {
        p.mesh.material.emissive = new THREE.Color(0x1fb7d4);
        p.mesh.material.emissiveIntensity = (Math.sin(t * 3) * 0.5 + 0.5) * 0.35;
      }
    });

    renderer.render(scene, camera);
  }

  dimensionner();
  boucle();

  return {
    construire,
    apercu: () => { renderer.render(scene, camera); return renderer.domElement.toDataURL('image/png'); }
  };
})();

/* =========================================================
   Interface du panneau
   ========================================================= */
function batirInterface() {
  /* fils */
  const zoneFils = $('[data-fils]');
  zoneFils.innerHTML = FILS.map(f => `
    <button class="pastille" type="button" data-fil="${f.id}" title="${f.nom}"
      aria-label="${f.nom}" aria-pressed="${f.id === etat.fil}"
      style="background:${f.metal
        ? `linear-gradient(135deg,#f2f5f5,${hex6(f.hex)},#8d9698)`
        : hex6(f.hex)}"></button>`).join('');

  /* pierres */
  const zonePierres = $('[data-pierres]');
  zonePierres.innerHTML = Object.entries(PIERRES).map(([id, p]) => `
    <button class="pierre" type="button" data-pierre="${id}" aria-pressed="${id === etat.pierre}" title="${p.note}">
      <i style="background-image:url('/assets/tex/${id}.jpg')"></i>
      ${p.nom}
    </button>`).join('');

  /* compositions */
  $('[data-compositions]').innerHTML = COMPOSITIONS.map(c =>
    `<button type="button" data-composition="${c.id}" aria-pressed="${c.id === etat.composition}">${c.nom}</button>`).join('');

  /* montage */
  $('[data-montages]').innerHTML = MONTAGES.map(m =>
    `<button type="button" data-montage="${m.id}" aria-pressed="${m.id === etat.montage}">${m.nom}</button>`).join('');

  /* pièce centrale */
  $('[data-centres]').innerHTML = CENTRES.map(c =>
    `<button type="button" data-centre="${c.id}" aria-pressed="${c.id === etat.centre}">${c.nom}</button>`).join('');
}

function majInterface() {
  document.querySelectorAll('[data-fil]').forEach(b =>
    b.setAttribute('aria-pressed', String(b.dataset.fil === etat.fil)));
  document.querySelectorAll('[data-pierre]').forEach(b =>
    b.setAttribute('aria-pressed', String(b.dataset.pierre === etat.pierre)));
  document.querySelectorAll('[data-composition]').forEach(b =>
    b.setAttribute('aria-pressed', String(b.dataset.composition === etat.composition)));
  document.querySelectorAll('[data-montage]').forEach(b =>
    b.setAttribute('aria-pressed', String(b.dataset.montage === etat.montage)));
  document.querySelectorAll('[data-centre]').forEach(b =>
    b.setAttribute('aria-pressed', String(b.dataset.centre === etat.centre)));

  $('[data-valeur-taille]').textContent = etat.taille.toFixed(1).replace('.0', '') + ' cm';
  $('[data-valeur-fil]').textContent = FILS.find(f => f.id === etat.fil).nom;
  $('[data-valeur-pierre]').textContent = PIERRES[etat.pierre].nom;
  $('[data-valeur-densite]').textContent = etat.slots.filter(id => id !== etat.seconde).length + ' pierres';
  $('[data-prix]').textContent = prix() + ' €';
  $('[data-recap]').innerHTML = inventaire()
    .map(([id, n]) => `<b>${n} ×</b> ${PIERRES[id].nom}`).join(' &nbsp;·&nbsp; ')
    + `<br>${etat.slots.length} emplacements sur ${FILS.find(f => f.id === etat.fil).nom.toLowerCase()}`
    + (etat.gravure ? `<br>Gravure : « ${etat.gravure} »` : '');
}

function rafraichir() {
  if (etat.composition !== 'libre') etat.nb = nbSlots();
  composer();
  if (etat.composition !== 'libre') ajuster();
  scene3D?.construire();
  majInterface();
}

/* ---------------- Écoutes ---------------- */
function brancher() {
  const panneau = $('[data-panneau]');

  panneau.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.fil) { etat.fil = b.dataset.fil; rafraichir(); }
    else if (b.dataset.pierre) {
      etat.pierre = b.dataset.pierre;
      if (etat.composition !== 'libre') rafraichir(); else majInterface();
    }
    else if (b.dataset.composition) { etat.composition = b.dataset.composition; rafraichir(); }
    else if (b.dataset.montage) { etat.montage = b.dataset.montage; rafraichir(); }
    else if (b.dataset.centre) { etat.centre = b.dataset.centre; rafraichir(); }
  });

  $('[data-taille]').addEventListener('input', e => {
    etat.taille = parseFloat(e.target.value);
    if (etat.composition === 'libre') etat.composition = 'alternee';
    rafraichir();
  });

  $('[data-densite]').addEventListener('input', e => {
    etat.densite = parseInt(e.target.value, 10) / 100;
    if (etat.composition === 'libre') etat.composition = 'alternee';
    rafraichir();
  });

  $('[data-gravure]').addEventListener('input', e => {
    etat.gravure = e.target.value.slice(0, 14);
    majInterface();
  });

  $('[data-hasard]').addEventListener('click', () => {
    const familles = [
      ['turquoise', 'argent', 'tahiti'],
      ['larimar', 'argent', 'tahiti'],
      ['onyx', 'argent', 'tahiti'],
      ['magnesite', 'hematite', 'tahiti_or'],
      ['amazonite', 'or', 'tahiti_or'],
      ['quartz', 'or', 'tahiti_or'],
      ['nacre', 'argent', 'tahiti']
    ];
    const f = familles[Math.floor(Math.random() * familles.length)];
    etat.pierre = f[0]; etat.seconde = f[1]; etat.centre = f[2];
    etat.composition = COMPOSITIONS[Math.floor(Math.random() * 3)].id;
    etat.densite = 0.3 + Math.random() * 0.5;
    etat.fil = FILS[Math.floor(Math.random() * FILS.length)].id;
    $('[data-densite]').value = Math.round(etat.densite * 100);
    rafraichir();
    window.mjyMessage?.('Une proposition de l’atelier. À vous de l’ajuster.');
  });

  $('[data-envoyer]').addEventListener('click', () => {
    const numero = $('[data-envoyer]').dataset.whatsapp;
    open(`https://wa.me/${numero}?text=${encodeURIComponent(recapTexte())}`, '_blank');
  });

  $('[data-copier]').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(recapTexte());
      window.mjyMessage?.('Récapitulatif copié. Collez-le dans un message.');
    } catch {
      window.mjyMessage?.('Copie impossible sur ce navigateur.');
    }
  });

  $('[data-telecharger]').addEventListener('click', () => {
    if (!scene3D) { window.mjyMessage?.('Aperçu 3D indisponible sur cet appareil.'); return; }
    const a = document.createElement('a');
    a.href = scene3D.apercu();
    a.download = 'ma-creation-mjy.png';
    a.click();
    window.mjyMessage?.('Aperçu enregistré.');
  });
}

/* ---------------- Démarrage ---------------- */
if ($('[data-panneau]')) {
  batirInterface();
  brancher();
  rafraichir();
  if (!scene3D) {
    const etatScene = $('[data-etat-scene]');
    if (etatScene) {
      etatScene.hidden = false;
      etatScene.textContent = "L'aperçu 3D n'a pas pu démarrer sur cet appareil. Les réglages restent utilisables : composez votre bracelet, puis envoyez le récapitulatif à l'atelier.";
    }
  }
}
