# -*- coding: utf-8 -*-
"""Adapte des matières réelles (ambientCG, licence CC0) aux pierres M'jy.

Pour chaque pierre : couleur (<id>.jpg), rugosité (<id>-r.jpg), relief (<id>-n.jpg).
Les photos de marbre et d'onyx sont recolorées sur la teinte réelle de la pierre
visée : on garde le veinage et le relief, on change la couleur.
Fabrique aussi la corde du configurateur et la bande de corde du fil du site."""
import numpy as np
from PIL import Image, ImageFilter

SRC = "/tmp/acg/"
TEX = "/home/claude/mjy/assets/tex/"
IMG = "/home/claude/mjy/assets/img/"
T = 512  # une perle fait moins d'un centimètre : 512 px suffisent largement


def charger(asset, carte, taille=T):
    im = Image.open(f"{SRC}{asset}/{asset}_1K-JPG_{carte}.jpg")
    return im.convert("RGB").resize((taille, taille), Image.LANCZOS)


def luminance(im, bas=2, haut=98):
    a = np.asarray(im, dtype=np.float32)
    L = 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]
    lo, hi = np.percentile(L, bas), np.percentile(L, haut)
    return np.clip((L - lo) / (hi - lo + 1e-6), 0, 1)


def degrade(L, paliers):
    """Associe à chaque niveau de gris une couleur, par paliers interpolés."""
    ts = np.array([p[0] for p in paliers], np.float32)
    cs = np.array([p[1] for p in paliers], np.float32)
    out = np.zeros(L.shape + (3,), np.float32)
    for k in range(3):
        out[..., k] = np.interp(L, ts, cs[:, k])
    return out


def rugosite(asset, mini, maxi, veines=None, bonus=0.0):
    r = luminance(charger(asset, "Roughness"), 1, 99)
    r = mini + (maxi - mini) * r
    if veines is not None:
        r = r + veines * bonus
    return np.clip(r * 255, 0, 255)


def relief_depuis(L, force):
    """Relief calculé à partir d'une carte de hauteur (périodique)."""
    gx = (np.roll(L, -1, 1) - np.roll(L, 1, 1)) * force
    gy = (np.roll(L, -1, 0) - np.roll(L, 1, 0)) * force
    n = np.dstack([-gx, gy, np.ones_like(L)])
    n /= np.linalg.norm(n, axis=2, keepdims=True)
    return (n + 1) * 127.5


def fusion(n1, n2):
    a = n1 / 127.5 - 1; b = n2 / 127.5 - 1
    c = np.dstack([a[..., 0] + b[..., 0], a[..., 1] + b[..., 1], a[..., 2] * b[..., 2]])
    c /= np.linalg.norm(c, axis=2, keepdims=True)
    return np.clip((c + 1) * 127.5, 0, 255)


def relief(asset, force=1.0):
    """Carte de normales OpenGL, adoucie ou accentuée."""
    n = np.asarray(charger(asset, "NormalGL"), np.float32) / 127.5 - 1
    n[..., :2] *= force
    n /= np.linalg.norm(n, axis=2, keepdims=True) + 1e-6
    return np.clip((n + 1) * 127.5, 0, 255)


def ecrire(nom, couleur, rug, nrm=None):
    Image.fromarray(couleur.astype(np.uint8)).save(TEX + nom + ".jpg", quality=86, optimize=True)
    Image.fromarray(rug.astype(np.uint8)).convert("L").save(TEX + nom + "-r.jpg", quality=84, optimize=True)
    if nrm is not None:
        Image.fromarray(nrm.astype(np.uint8)).save(TEX + nom + "-n.jpg", quality=90, optimize=True)
    print(f"{nom:10s} couleur moyenne {couleur.reshape(-1, 3).mean(0).round(0)}  rugosité {rug.mean() / 255:.2f}")


def pierre(nom, asset, paliers, rug, inverser=False, gamma=1.0, force_relief=1.0,
           detail=0.0, bonus_veines=0.0, relief_hauteur=0.0, epaissir=0):
    L = luminance(charger(asset, "Color"))
    if inverser:
        L = 1 - L
    if epaissir:  # à l'échelle d'une perle, un veinage trop fin disparaît
        L = np.asarray(Image.fromarray((L * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(epaissir))
                       .filter(ImageFilter.GaussianBlur(0.6)), np.float32) / 255
    L = L ** gamma
    col = degrade(L, paliers)
    if detail:  # micro-contraste : le grain de la pierre sous le veinage
        flou = np.asarray(Image.fromarray((L * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3)),
                          np.float32) / 255
        col *= (1 + (L - flou) * detail)[..., None]
    nrm = relief(asset, force_relief)
    if relief_hauteur:  # la matrice est en creux dans la pierre
        nrm = fusion(nrm, relief_depuis(np.clip(L * 4, 0, 1), relief_hauteur))
    rug_veines = (1 - np.clip(L * 5, 0, 1)) if relief_hauteur else L
    ecrire(nom, np.clip(col, 0, 255), rugosite(asset, *rug, veines=rug_veines, bonus=0.35 if relief_hauteur else bonus_veines), nrm)


# ------------------------------------------------------------------ pierres
# Turquoise : le marbre noir veiné de blanc, inversé. Le fond devient la
# turquoise, les veines claires deviennent la matrice brune de la vraie pierre.
pierre("turquoise", "Marble016", [
    (0.00, (38, 26, 17)), (0.10, (86, 66, 44)), (0.20, (18, 108, 120)),
    (0.50, (28, 142, 154)), (0.80, (54, 170, 178)), (1.00, (92, 196, 196))],
    rug=(0.40, 0.60), inverser=True, gamma=0.8, force_relief=0.5, detail=0.7, relief_hauteur=3.0, epaissir=5)

pierre("magnesite", "Marble021", [
    (0.00, (132, 128, 120)), (0.35, (206, 202, 192)), (0.70, (236, 233, 226)), (1.00, (248, 246, 241))],
    rug=(0.30, 0.46), force_relief=0.7, detail=0.5, epaissir=3)

pierre("larimar", "Marble012", [
    (0.00, (30, 96, 132)), (0.30, (70, 150, 184)), (0.60, (140, 198, 214)),
    (0.85, (214, 236, 240)), (1.00, (246, 251, 251))],
    rug=(0.24, 0.40), gamma=0.9, force_relief=0.9, detail=0.6)

pierre("amazonite", "Onyx004", [
    (0.00, (56, 122, 108)), (0.40, (104, 170, 152)), (0.75, (170, 214, 198)), (1.00, (232, 244, 236))],
    rug=(0.26, 0.42), gamma=1.2, force_relief=0.9, detail=0.6)

pierre("quartz", "Onyx012", [
    (0.00, (36, 27, 22)), (0.45, (86, 68, 57)), (0.80, (146, 124, 108)), (1.00, (190, 170, 152))],
    rug=(0.08, 0.20), gamma=1.1, force_relief=0.6, detail=0.4)

pierre("onyx", "Onyx013", [
    (0.00, (8, 9, 10)), (0.60, (18, 20, 22)), (0.90, (46, 50, 53)), (1.00, (84, 88, 90))],
    rug=(0.06, 0.16), gamma=1.6, force_relief=0.4, detail=0.3, epaissir=3)


# ------------------------------------------------------------------ métaux
def metal(nom, asset, sombre, clair, rug, force_relief=1.0):
    L = luminance(charger(asset, "Color"))
    col = degrade(L, [(0, sombre), (1, clair)])
    bosses = np.asarray(Image.fromarray((L * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2.2)),
                        np.float32) / 255
    nrm = fusion(relief(asset, force_relief), relief_depuis(bosses, 7.0))   # coups de marteau
    ecrire(nom, col, rugosite(asset, *rug), nrm)


metal("argent", "Metal041A", (168, 174, 178), (240, 243, 244), (0.10, 0.32), 1.3)   # martelé
metal("or", "Metal041A", (150, 104, 40), (244, 206, 128), (0.12, 0.32), 1.3)
metal("hematite", "Metal038", (64, 69, 74), (150, 156, 161), (0.14, 0.32), 1.0)


# ------------------------------------------------------------------ perles
# Les perles restent lisses : couleur et orient viennent de textures.py.
# On leur donne seulement un relief presque nul, pour que la nacre ondule.
for p in ():   # remplacé par perle() plus bas
    n = relief("Marble012", 0.12)
    Image.fromarray(n.astype(np.uint8)).save(TEX + p + "-n.jpg", quality=90, optimize=True)
    print(f"{p:10s} relief de nacre ajouté")


# ------------------------------------------------------------------ cordon 3D
# Coton ciré tressé : en niveaux de gris, teinté en direct par la couleur choisie.
L = luminance(charger("Rope002", "Color"))
gris = np.clip(90 + 165 * L, 0, 255)
ecrire("cordon", np.stack([gris] * 3, -1), rugosite("Rope002", 0.45, 0.85), relief("Rope002", 1.6))


# ------------------------------------------------------------------ corde du site
def bande(teinte, reflet, nom, lumi=1.0):
    """Une tranche de vraie corde, ombrée comme un cylindre, avec transparence."""
    src = Image.open(f"{SRC}Rope001/Rope001_1K-JPG_Color.jpg").convert("RGB")
    H = 104                                  # une torsade complète dans la hauteur
    tranche = src.crop((0, 300, 1024, 300 + H))
    L = luminance(tranche, 1, 99)
    y = np.linspace(0, 1, H)[:, None]
    profil = 0.30 + 0.70 * np.sin(np.pi * y) ** 0.55          # rondeur
    brillance = 0.55 * np.exp(-((y - 0.32) / 0.10) ** 2)       # reflet ciré
    base = np.array(teinte, np.float32)[None, None, :]
    col = base * (0.55 + 0.75 * L[..., None]) * profil[..., None] * lumi
    col += np.array(reflet, np.float32)[None, None, :] * (brillance * (0.4 + 0.6 * L))[..., None]
    alpha = np.clip(np.sin(np.pi * y) * 7, 0, 1) * np.ones_like(L)
    rgba = np.dstack([np.clip(col, 0, 255), alpha * 255]).astype(np.uint8)
    im = Image.fromarray(rgba, "RGBA").resize((512, 52), Image.LANCZOS)
    im.save(IMG + nom, optimize=True)
    print(nom, im.size)


bande((170, 152, 122), (255, 246, 226), "fil-brut.png")      # coton ciré naturel
bande((24, 170, 200), (214, 250, 255), "fil-vif.png", 1.05)  # le turquoise M'jy


# ------------------------------------------------------------------ perles (v2)
# Une perle n'est ni un miroir ni une bille mate : un corps coloré, des nuées
# d'orient (vert paon, aubergine, rosé), et une surface très légèrement ondulée.
def bruit_periodique(beta, graine, n=T):
    r = np.random.default_rng(graine)
    f = np.fft.fftfreq(n)
    fx, fy = np.meshgrid(f, f)
    rad = np.sqrt(fx ** 2 + fy ** 2); rad[0, 0] = 1
    c = np.fft.fft2(r.normal(size=(n, n))) / rad ** beta
    c[0, 0] = 0
    im = np.real(np.fft.ifft2(c))
    im -= im.min()
    return im / (im.max() + 1e-9)


def perle(nom, corps, orients, rug, graine):
    base = np.array(corps, np.float32)[None, None, :] * np.ones((T, T, 1), np.float32)
    for k, (teinte, force) in enumerate(orients):
        nuee = bruit_periodique(2.8, graine + k * 7)
        nuee = np.clip((nuee - 0.45) * 2.4, 0, 1) ** 1.4
        base = base * (1 - nuee[..., None] * force) + np.array(teinte, np.float32) * (nuee[..., None] * force)
    voile = bruit_periodique(3.3, graine + 50)
    base *= (0.88 + 0.24 * voile)[..., None]
    fin = bruit_periodique(1.2, graine + 60)
    base *= (0.975 + 0.05 * fin)[..., None]
    r = np.clip(rug[0] + (rug[1] - rug[0]) * voile, 0, 1) * 255
    ondes = bruit_periodique(2.2, graine + 70)
    ecrire(nom, np.clip(base, 0, 255), r, relief_depuis(ondes, 1.6))


perle("tahiti", (34, 42, 39),
      [((52, 88, 70), 0.75), ((78, 52, 80), 0.6), ((96, 108, 116), 0.45)], (0.14, 0.24), 11)
perle("tahiti_or", (176, 128, 58),
      [((222, 178, 104), 0.7), ((196, 134, 104), 0.35), ((150, 104, 44), 0.4)], (0.14, 0.24), 23)
perle("nacre", (232, 226, 216),
      [((250, 244, 236), 0.7), ((236, 214, 214), 0.35), ((214, 220, 232), 0.35)], (0.16, 0.26), 37)

# magnésite plus lumineuse, veines plus franches, polie
pierre("magnesite", "Marble021", [
    (0.00, (110, 106, 98)), (0.25, (190, 186, 176)), (0.60, (238, 235, 228)), (1.00, (252, 250, 246))],
    rug=(0.20, 0.36), force_relief=0.7, detail=0.6, epaissir=3)
