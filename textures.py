# -*- coding: utf-8 -*-
"""Fabrique les textures des pierres du configurateur (couleur + rugosité)."""
import numpy as np, os
from PIL import Image

N = 256
OUT = "/home/claude/mjy/assets/tex/"
os.makedirs(OUT, exist_ok=True)


def bruit(beta=2.2, graine=0):
    """Bruit fractal périodique (donc raccordable) via filtrage de Fourier."""
    r = np.random.default_rng(graine)
    f = np.fft.fftfreq(N)
    fx, fy = np.meshgrid(f, f)
    rad = np.sqrt(fx ** 2 + fy ** 2)
    rad[0, 0] = 1
    champ = np.fft.fft2(r.normal(size=(N, N))) / (rad ** beta)
    champ[0, 0] = 0
    img = np.real(np.fft.ifft2(champ))
    img -= img.min()
    return img / (img.max() + 1e-9)


def veines(beta=1.5, graine=1, nettete=9):
    n = bruit(beta, graine)
    v = 1 - np.abs(2 * n - 1)
    return np.clip(v ** nettete, 0, 1)


def stries(beta=2.0, graine=2, etirement=18):
    """Bruit étiré horizontalement : rayures de métal poli."""
    n = bruit(beta, graine)
    p = Image.fromarray((n * 255).astype(np.uint8))
    p = p.resize((max(4, N // etirement), N), Image.BILINEAR).resize((N, N), Image.BILINEAR)
    return np.asarray(p, dtype=np.float32) / 255


def melange(c1, c2, t):
    c1 = np.array(c1, dtype=np.float32)
    c2 = np.array(c2, dtype=np.float32)
    return c1[None, None, :] + (c2 - c1)[None, None, :] * t[:, :, None]


def poser(base, couleur, masque):
    c = np.array(couleur, dtype=np.float32)[None, None, :]
    return base * (1 - masque[:, :, None]) + c * masque[:, :, None]


def ecrire(nom, couleur, rugosite):
    Image.fromarray(np.clip(couleur, 0, 255).astype(np.uint8)).save(
        OUT + nom + ".jpg", quality=86, optimize=True)
    Image.fromarray(np.clip(rugosite * 255, 0, 255).astype(np.uint8)).convert("L").save(
        OUT + nom + "-r.jpg", quality=80, optimize=True)
    print(nom)


# ---------------------------------------------------------------- pierres
def pierre(nom, clair, sombre, teinte_veine, force_veine=0.75, beta=2.6, rug=(0.38, 0.32), graine=0, grain=0.05):
    fond = bruit(beta, graine)
    base = melange(sombre, clair, fond)
    v = veines(1.45, graine + 31, 7) * force_veine
    base = poser(base, teinte_veine, v)
    mouchet = bruit(1.1, graine + 77)
    base = base * (1 - grain + grain * 2 * mouchet[:, :, None])
    r = rug[0] + rug[1] * (1 - fond) + 0.12 * v
    ecrire(nom, base, r)


pierre("turquoise", (110, 196, 206), (34, 124, 140), (74, 56, 38), 0.8, 2.4, (0.42, 0.26), 3)
pierre("larimar", (233, 244, 246), (78, 156, 178), (255, 255, 255), 0.45, 3.0, (0.34, 0.24), 11)
pierre("amazonite", (206, 228, 216), (108, 166, 146), (240, 246, 240), 0.5, 2.8, (0.40, 0.24), 19)
pierre("magnesite", (242, 238, 230), (198, 190, 176), (128, 120, 108), 0.7, 2.6, (0.46, 0.26), 23)
pierre("onyx", (44, 48, 52), (12, 14, 16), (64, 68, 72), 0.3, 2.9, (0.12, 0.14), 29)
pierre("quartz", (158, 134, 118), (78, 62, 54), (110, 88, 74), 0.35, 2.9, (0.14, 0.16), 37)


# ---------------------------------------------------------------- métaux
def metal(nom, sombre, clair, graine=0, rug=(0.16, 0.18)):
    poli = stries(2.0, graine, 20)
    bosses = bruit(3.0, graine + 5)
    t = np.clip(poli * 0.7 + bosses * 0.5, 0, 1)
    base = melange(sombre, clair, t)
    fines = stries(1.2, graine + 9, 40)
    base = base * (0.94 + 0.12 * fines[:, :, None])
    r = rug[0] + rug[1] * (1 - fines) * 0.8 + 0.06 * (1 - bosses)
    ecrire(nom, base, r)


metal("argent", (150, 158, 162), (246, 249, 249), 41)
metal("or", (150, 108, 40), (246, 216, 150), 47)
metal("hematite", (74, 80, 86), (188, 196, 202), 53, (0.12, 0.14))


# ---------------------------------------------------------------- perles
def perle(nom, corps, reflet1, reflet2, graine=0, force=0.55):
    fond = bruit(3.2, graine)
    base = melange(corps, reflet1, fond * force)
    orient = bruit(2.4, graine + 13)
    base = poser(base, reflet2, orient * 0.38 * force)      # l'orient de la perle
    voile = bruit(3.4, graine + 21)                         # nuages doux, pas de cernes
    base = base * (0.90 + 0.20 * voile[:, :, None])
    fin = bruit(1.3, graine + 29)
    base = base * (0.975 + 0.05 * fin[:, :, None])
    r = 0.03 + 0.05 * voile
    ecrire(nom, base, r)


perle("tahiti", (42, 54, 48), (96, 126, 112), (72, 58, 92), 59, 0.85)
perle("tahiti_or", (172, 130, 60), (238, 206, 140), (196, 140, 96), 67, 0.62)
perle("nacre", (238, 230, 218), (255, 252, 246), (214, 208, 226), 71, 0.6)
