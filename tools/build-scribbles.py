# Usage: python3 tools/build-scribbles.py . out.json  (needs Pillow; copy the JSON into src/utils/scribbles.ts)
"""Build the drawable scribbles: recolour to brand red, crop, and compute a mask
path (the pen route) that covers all the ink by the end of the stroke."""
import sys, os, math, json
from PIL import Image, ImageDraw
from PIL import ImageChops

root = sys.argv[1]
out_dir = os.path.join(root, "public/assets/scribbles")
B = os.path.join(root, "_brand-assets/Studio 2am - Marker")
RED = (0xFF, 0x2E, 0x17)

SRC = [
    ("line-1", "line", os.path.join(root, "public/assets/scribbles/stroke-red.png"), "zigzag"),
    ("line-2", "line", os.path.join(B, "Lines/LINE-29.png"), "sweep"),
    ("line-3", "line", os.path.join(B, "Lines/LINE-36.png"), "sweep"),
    ("circle-1", "circle", os.path.join(root, "public/assets/scribbles/circle-red.png"), "ring"),
    ("circle-2", "circle", os.path.join(B, "Shapes/Circles/CIRCLE-12.png"), "ring"),
    ("circle-3", "circle", os.path.join(B, "Shapes/Circles/CIRCLE-20.png"), "ring"),
]

def load(path, maxw):
    im = Image.open(path).convert("RGBA")
    a = im.getchannel("A").point(lambda v: 255 if v > 40 else 0)
    x0, y0, x1, y1 = a.getbbox()
    pad = 4
    im = im.crop((max(0, x0 - pad), max(0, y0 - pad), min(im.width, x1 + pad), min(im.height, y1 + pad)))
    if im.width > maxw:
        im = im.resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
    r, g, b = (Image.new("L", im.size, c) for c in RED)
    return Image.merge("RGBA", (r, g, b, im.getchannel("A")))

def coverage(alpha, pts, sw):
    m = Image.new("L", alpha.size, 0)
    d = ImageDraw.Draw(m)
    d.line(pts, fill=255, width=int(sw), joint="curve")
    r = sw / 2
    for p in (pts[0], pts[-1]):
        d.ellipse((p[0] - r, p[1] - r, p[0] + r, p[1] + r), fill=255)
    ink = alpha.point(lambda v: 255 if v > 60 else 0)
    total = ink.histogram()[255]
    both = ImageChops.multiply(ink, m).point(lambda v: 255 if v > 0 else 0).histogram()[255]
    return both / max(1, total)

def ring_points(alpha):
    w, h = alpha.size
    px = alpha.load()
    x0, y0, x1, y1 = alpha.point(lambda v: 255 if v > 60 else 0).getbbox()
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    radii, thick = [], []
    for k in range(72):
        th = math.radians(k * 5)
        rs = []
        for r in range(0, int(math.hypot(w, h) / 2)):
            x, y = int(cx + r * math.cos(th)), int(cy - r * math.sin(th))
            if 0 <= x < w and 0 <= y < h and px[x, y] > 60:
                rs.append(r)
        if rs:
            # the outer band: ink within 45% of the outermost ink on this ray
            rmax = max(rs)
            band = [r for r in rs if r > rmax * 0.55]
            band.sort(); radii.append(float(band[len(band) // 2]))
            thick.append(max(band) - min(band))
        else:
            radii.append(None); thick.append(0)
    # fill gaps
    for i, r in enumerate(radii):
        if r is None:
            radii[i] = next(radii[(i + j) % 72] for j in range(1, 72) if radii[(i + j) % 72] is not None)
    # smooth the route so the pen moves evenly (circular moving average)
    sm = [sum(radii[(i + j) % 72] for j in range(-3, 4)) / 7 for i in range(72)]
    return cx, cy, sm, thick

def build(key, kind, path, mode):
    im = load(path, 900 if kind == "line" else 800)
    alpha = im.getchannel("A")
    w, h = im.size
    if mode == "sweep":
        pts = [(-h * 0.2, h / 2), (w + h * 0.2, h / 2)]
        sw = h * 1.05
    elif mode == "zigzag":
        pts = [(-h * 0.2, h * 0.28), (w * 1.02, h * 0.28), (w * 1.02, h * 0.72), (-h * 0.2, h * 0.72)]
        sw = h * 0.6
    else:
        cx, cy, radii, thick = ring_points(alpha)
        start = 60  # upper right, then anticlockwise like a hand-drawn circle
        pts = []
        for s in range(0, 72 + 12):  # a bit more than one turn: the overlap
            k = (start // 5 + s) % 72
            th = math.radians(k * 5)
            r = radii[k]
            pts.append((cx + r * math.cos(th), cy - r * math.sin(th)))
        sw = max(thick) * 1.0
    # widen the pen until (almost) all the ink is revealed by the end
    c = coverage(alpha, pts, sw)
    while c < 0.995 and sw < max(w, h):
        sw *= 1.08
        c = coverage(alpha, pts, sw)
    name = f"{key}.png"
    im.save(os.path.join(out_dir, name), optimize=True)
    d = "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in pts)
    return {"key": key, "kind": kind, "src": f"/assets/scribbles/{name}", "w": w, "h": h, "d": d, "sw": round(sw, 1), "coverage": round(c, 4)}

res = [build(*s) for s in SRC]
for r in res:
    print(r["key"], r["w"], r["h"], "sw", r["sw"], "cov", r["coverage"], os.path.getsize(os.path.join(out_dir, r["key"] + ".png")) // 1024, "KB")
json.dump(res, open(sys.argv[2], "w"), indent=1)
