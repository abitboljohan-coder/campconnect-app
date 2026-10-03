import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile

SR = 48000
DUR = 44.0
N = int(SR * DUR)
BPM = 120
BEAT = 60 / BPM
BAR = BEAT * 4
rng = np.random.default_rng(7)


def buf():
    return np.zeros((N, 2), np.float32)


def place(dst, sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N:
        return
    s = sig[: N - i]
    l = np.cos((pan + 1) * np.pi / 4)
    r = np.sin((pan + 1) * np.pi / 4)
    if s.ndim == 1:
        dst[i:i + len(s), 0] += s * gain * l * 1.414
        dst[i:i + len(s), 1] += s * gain * r * 1.414
    else:
        dst[i:i + len(s)] += s * gain


def lp(x, f, order=2):
    return sosfilt(butter(order, f, 'low', fs=SR, output='sos'), x, axis=0)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, 'high', fs=SR, output='sos'), x, axis=0)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], 'band', fs=SR, output='sos'), x, axis=0)


def mtof(m):
    return 440 * 2 ** ((m - 69) / 12)


def env_adsr(n, a, d, s, r, sus_len):
    t = np.arange(n) / SR
    e = np.ones(n) * s
    e[t < a] = t[t < a] / a
    m = (t >= a) & (t < a + d)
    e[m] = 1 - (1 - s) * (t[m] - a) / d
    rel = t >= sus_len
    e[rel] = s * np.exp(-(t[rel] - sus_len) / r)
    return e


# ---------- instruments ----------
def pad_note(m, length):
    n = int((length + 1.5) * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for det in (-0.08, 0.0, 0.07):
        f = mtof(m + det)
        ph = rng.random() * 6.28
        for h in range(1, 9):
            out += np.sin(2 * np.pi * f * h * t + ph * h) / h ** 1.15
    out *= env_adsr(n, 0.6, 0.4, 0.8, 0.6, length)
    return out / 9


def pluck(m, length=1.2, bright=0.5):
    f = mtof(m)
    P = int(SR / f)
    n = int(length * SR)
    y = np.zeros(n + P + 1)
    y[:P] = lp(rng.uniform(-1, 1, P), 2000 + 6000 * bright)
    k = P
    dec = 0.996
    while k < n:
        e = min(k + P, n)
        seg = np.arange(k, e)
        y[seg] = dec * 0.5 * (y[seg - P] + y[seg - P - 1])
        k = e
    y = y[:n]
    # add soft sine body (marimba-ish warmth)
    t = np.arange(n) / SR
    y = 0.7 * y + 0.35 * np.sin(2 * np.pi * f * t) * np.exp(-t * 6)
    y *= np.minimum(1, t / 0.002)
    return y


def bass_note(m, length):
    n = int((length + 0.1) * SR)
    t = np.arange(n) / SR
    f = mtof(m)
    s = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t) + 0.12 * np.sin(6 * np.pi * f * t)
    s = np.tanh(1.6 * s)
    e = np.minimum(1, t / 0.008) * np.exp(-t * 1.2)
    e[t > length] *= np.exp(-(t[t > length] - length) / 0.03)
    return lp(s * e, 900)


def kick():
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    f = 45 + 95 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * np.exp(-t * 7)
    click = hp(rng.uniform(-1, 1, n), 3000) * np.exp(-t * 250) * 0.25
    return np.tanh(1.4 * (s + click))


def clap():
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    nz = bp(rng.uniform(-1, 1, n), 900, 4500)
    e = np.zeros(n)
    for o in (0, 0.011, 0.022):
        tt = t - o
        e += np.where(tt >= 0, np.exp(-np.maximum(tt, 0) * 120), 0)
    e += np.exp(-t * 18) * 0.35
    return nz * e * 0.9


def snap():
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    return bp(rng.uniform(-1, 1, n), 2000, 7000) * np.exp(-t * 70)


def hat(open_=False):
    n = int((0.25 if open_ else 0.06) * SR)
    t = np.arange(n) / SR
    return hp(rng.uniform(-1, 1, n), 8000, 4) * np.exp(-t * (14 if open_ else 80))


def shaker():
    n = int(0.09 * SR)
    t = np.arange(n) / SR
    e = np.sin(np.pi * np.minimum(t / 0.09, 1)) ** 2
    return bp(rng.uniform(-1, 1, n), 5000, 12000) * e


def riser(length):
    n = int(length * SR)
    t = np.arange(n) / SR
    x = rng.uniform(-1, 1, n)
    out = np.zeros(n)
    blk = 2048
    for i in range(0, n, blk):
        fr = 400 + (7000 - 400) * (i / n) ** 2
        out[i:i + blk] = bp(x[i:i + blk], fr * 0.7, min(fr * 1.4, 20000))
    return out * (t / length) ** 2.2 * 0.8


def impact():
    n = int(2.5 * SR)
    t = np.arange(n) / SR
    f = 38 + 60 * np.exp(-t * 10)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.2)
    shimmer = hp(rng.uniform(-1, 1, n), 6000) * np.exp(-t * 2.5) * 0.18
    return np.tanh(boom * 1.3) * 0.9 + shimmer


def whoosh(length=0.6, up=True):
    n = int(length * SR)
    t = np.arange(n) / SR
    x = rng.uniform(-1, 1, n)
    out = np.zeros(n)
    blk = 1024
    for i in range(0, n, blk):
        p = i / n
        fr = (500 + 4000 * p) if up else (4500 - 4000 * p)
        out[i:i + blk] = bp(x[i:i + blk], fr * 0.6, fr * 1.6)
    e = np.sin(np.pi * t / length) ** 2
    return out * e


def pop(f=1200):
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    fr = f * (1 + 0.6 * np.exp(-t * 60))
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 38) * 0.6


def reverb(x, rt=1.8, mix=0.25):
    n = int(rt * SR)
    t = np.arange(n) / SR
    out = np.zeros_like(x)
    for c in range(2):
        ir = rng.uniform(-1, 1, n) * np.exp(-t * 6.9 / rt)
        ir = lp(ir, 6000)
        ir /= np.sqrt(np.sum(ir ** 2))
        out[:, c] = fftconvolve(x[:, c], ir)[: len(x)]
    return x * (1 - mix) + out * mix * 1.6


# ---------- arrangement ----------
# progression D – A – Bm – G (I V vi IV), 1 bar each
chords = [
    [62, 66, 69, 74],  # D
    [61, 64, 69, 73],  # A
    [62, 66, 71, 74],  # Bm
    [62, 67, 71, 74],  # G
]
roots = [38, 33, 35, 31]
NBARS = int(DUR / BAR)

pad = buf(); plk = buf(); bass = buf(); drums = buf(); fx = buf()

def section(b):
    t = b * BAR
    if t < 4: return 'intro'
    if t < 8: return 'reveal'
    if t < 24: return 'main'
    if t < 26: return 'break'
    if t < 36: return 'main2'
    return 'outro'

for b in range(NBARS):
    t0 = b * BAR
    sec = section(b)
    ch = chords[b % 4]
    last = b == NBARS - 1
    # pad
    for m in ch:
        L = BAR * (2.2 if last else 1.0)
        place(pad, pad_note(m - 12, L), t0, 0.09 if sec not in ('intro',) else 0.07, pan=rng.uniform(-0.4, 0.4))
    # pluck arpeggio – 8th notes
    pattern = [0, 2, 1, 3, 2, 1, 3, 2]
    if not last:
        for i, p in enumerate(pattern):
            if sec == 'intro' and i % 2: continue
            if sec == 'break' and i % 2: continue
            m = ch[p] + 12
            g = 0.22 if sec in ('main', 'main2', 'outro') else 0.17
            place(plk, pluck(m, 1.0, 0.45), t0 + i * BEAT / 2, g, pan=(-0.35 if i % 2 else 0.35))
    else:
        for i, m in enumerate(ch):  # final strum
            place(plk, pluck(m + 12, 3.0, 0.4), t0 + i * 0.03, 0.22, pan=-0.3 + 0.2 * i)
    # bass
    if sec in ('main', 'main2', 'reveal') or (sec == 'outro' and not last):
        r = roots[b % 4]
        for i in range(8):
            if i in (0, 3, 4, 6):
                place(bass, bass_note(r + (12 if i == 6 else 0), BEAT * 0.45), t0 + i * BEAT / 2, 0.42)
    elif last:
        place(bass, bass_note(roots[b % 4], 2.5), t0, 0.42)
    # drums
    if sec in ('main', 'main2'):
        for i in range(4):
            place(drums, kick(), t0 + i * BEAT, 0.8)
        for i in (1, 3):
            place(drums, clap(), t0 + i * BEAT, 0.42, pan=0.05)
        for i in range(8):
            place(drums, hat(i % 2 == 1 and i == 7), t0 + i * BEAT / 2 + BEAT / 4 * 0, 0.10 if i % 2 else 0.06, pan=0.3)
        for i in range(16):
            place(drums, shaker(), t0 + i * BEAT / 4, 0.05 + 0.03 * (i % 2), pan=-0.4)
    elif sec == 'reveal':
        place(drums, kick(), t0, 0.7)
        place(drums, kick(), t0 + 2 * BEAT, 0.55)
        for i in range(8):
            place(drums, snap(), t0 + i * BEAT / 2, 0.05, pan=0.3)
        for i in (1, 3):
            place(drums, snap(), t0 + i * BEAT, 0.22)
    elif sec == 'outro' and not last:
        for i in range(4):
            place(drums, kick(), t0 + i * BEAT, 0.65)
        for i in (1, 3):
            place(drums, clap(), t0 + i * BEAT, 0.32)
        for i in range(16):
            place(drums, shaker(), t0 + i * BEAT / 4, 0.045, pan=-0.4)

# sidechain-ish pump on pad + bass during groove
pump = np.ones(N)
tt = np.arange(N) / SR
for b in range(NBARS):
    if section(b) in ('main', 'main2', 'outro'):
        for i in range(4):
            s = int((b * BAR + i * BEAT) * SR); e = min(N, s + int(BEAT * SR))
            x = np.arange(e - s) / SR
            pump[s:e] = 1 - 0.45 * np.exp(-x * 9)
pad *= pump[:, None]

# intro filter on plucks (opens up)
music = reverb(pad, 2.5, 0.45) + reverb(plk, 1.6, 0.3) + bass + reverb(drums, 0.9, 0.12)
# low-pass sweep in intro: crossfade from filtered to full during 0-4s and during break 20-22
filt = lp(music, 1200)
w = np.ones(N)
w[tt < 4] = (tt[tt < 4] / 4) ** 2
br = (tt >= 24) & (tt < 26.5)
w[br] = 0.35 + 0.65 * ((tt[br] - 24) / 2.5) ** 2
music = music * w[:, None] + filt * (1 - w[:, None])

# transitions FX (part of music bed)
place(fx, riser(1.8), 4.0 - 1.8, 0.35)
place(fx, impact(), 4.0, 0.55)
place(fx, riser(1.5), 26.5 - 1.5, 0.25)
place(fx, riser(1.6), 35.5 - 1.6, 0.3)
place(fx, impact(), 35.5, 0.45)
music += reverb(fx, 1.5, 0.3)

# fade out tail
fade = np.ones(N); fs = int(42.6 * SR); fade[fs:] = np.linspace(1, 0, N - fs) ** 1.5
music *= fade[:, None]

# ---------- SFX (UI sound design, separate stem) ----------
sfx = buf()
cuts = [8.0, 11.5, 14.5, 18.0, 21.5, 24.0, 26.5, 29.5, 32.5]
for c in cuts:
    place(sfx, whoosh(0.5, True), c - 0.3, 0.22)
for t, f in [(0.55, 1400), (2.1, 1200), (9.8, 1500), (16.5, 1700), (19.75, 1500), (27.4, 1300), (30.4, 1300), (33.4, 1300),
             (37.8, 1100), (39.1, 1500)]:
    place(sfx, pop(f), t, 0.35, pan=rng.uniform(-0.2, 0.2))
sfx = reverb(sfx, 0.8, 0.2)
sfx_m = sfx.copy()
place(sfx_m, impact(), 4.0, 0.35)
place(sfx_m, impact(), 35.5, 0.3)

def norm(x, peak=0.89):
    return x / np.max(np.abs(x)) * peak

def soft_limit(x):
    return np.tanh(x * 1.1) / np.tanh(1.1)

full = soft_limit(norm(music, 0.8) + sfx * 0.6)
full = norm(full, 0.89)
wavfile.write('v2/mix_full.wav', SR, (full * 32767).astype(np.int16))
wavfile.write('v2/sfx_seul.wav', SR, (norm(soft_limit(sfx_m), 0.6) * 32767).astype(np.int16))
wavfile.write('v2/musique_seule.wav', SR, (norm(music, 0.89) * 32767).astype(np.int16))
print('done')
