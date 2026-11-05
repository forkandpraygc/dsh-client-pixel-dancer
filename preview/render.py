"""Rasterize recorded canvas operations from preview/render.mjs with Pillow.

This mirrors what the browser will do closely enough to judge the sprite:
rectangles, radial-gradient glows, and alpha ellipses on a chosen backdrop.
"""
import json
import math
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageColor, ImageDraw

SCALE = int(sys.argv[2]) if len(sys.argv) > 2 else 4


def parse_color(text):
    text = text.strip()
    m = re.match(r"rgba?\(([^)]+)\)$", text)
    if m:
        parts = [p.strip() for p in m.group(1).split(",")]
        r, g, b = (int(float(parts[i])) for i in range(3))
        a = float(parts[3]) if len(parts) > 3 else 1.0
        return (r, g, b, int(round(a * 255)))
    if text.startswith("#"):
        h = text[1:]
        if len(h) == 3:
            h = "".join(c * 2 for c in h)
        r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
        return (r, g, b, 255)
    r, g, b = ImageColor.getrgb(text)[:3]
    return (r, g, b, 255)


def draw_rect(img, x, y, w, h, color):
    if w <= 0 or h <= 0:
        return
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    d.rectangle(
        [x * SCALE, y * SCALE, (x + w) * SCALE - 1, (y + h) * SCALE - 1],
        fill=color,
    )
    img.alpha_composite(overlay)


def draw_ellipse(img, x, y, rx, ry, color):
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    d.ellipse(
        [
            (x - rx) * SCALE,
            (y - ry) * SCALE,
            (x + rx) * SCALE,
            (y + ry) * SCALE,
        ],
        fill=color,
    )
    img.alpha_composite(overlay)


def draw_radial(img, shape, style):
    w, h = img.size
    yy, xx = np.mgrid[0:h, 0:w]
    cx, cy = shape["x1"] * SCALE, shape["y1"] * SCALE
    radius = max(shape["r1"] * SCALE, 1)
    dist = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / radius
    stops = [(float(o), parse_color(c)) for o, c in style["stops"]]
    stops.sort(key=lambda s: s[0])
    r = np.zeros_like(dist)
    g = np.zeros_like(dist)
    b = np.zeros_like(dist)
    a = np.zeros_like(dist)
    for (o0, c0), (o1, c1) in zip(stops, stops[1:]):
        mask = (dist >= o0) & (dist <= max(o1, 1e-6))
        span = max(o1 - o0, 1e-6)
        local = np.clip((dist - o0) / span, 0, 1)
        for i, arr in enumerate((r, g, b, a)):
            arr[mask] = c0[i] + (c1[i] - c0[i]) * local[mask]
    alpha = np.clip(a / 255.0, 0, 1)
    rgba = np.dstack([r, g, b, a]).astype(np.uint8)
    layer = Image.fromarray(rgba, "RGBA")
    img.alpha_composite(layer)


def render_frame(ops, size, background):
    img = Image.new("RGBA", size, background)
    for op in ops:
        if op["op"] == "clear":
            img = Image.new("RGBA", size, background)
        elif op["op"] == "rect":
            draw_rect(img, op["x"], op["y"], op["w"], op["h"], parse_color(op["color"]))
        elif op["op"] == "fill":
            style = op["style"]
            shape = op["shape"]
            if isinstance(style, dict) and style.get("__kind") == "radial":
                draw_radial(img, style, style)
            elif shape["kind"] == "ellipse":
                draw_ellipse(img, shape["x"], shape["y"], shape["rx"], shape["ry"], parse_color(style))
            elif shape["kind"] == "arc":
                draw_ellipse(img, shape["x"], shape["y"], shape["r"], shape["r"], parse_color(style))
    return img


def main():
    source = Path(sys.argv[1]) if len(sys.argv) > 1 else None
    payload = json.loads(source.read_text(encoding="utf-8")) if source else json.load(sys.stdin)
    grid_w = payload["w"] * SCALE
    grid_h = payload["h"] * SCALE
    dark = (30, 24, 38, 255)
    light = (251, 248, 255, 255)
    frames = payload["frames"]
    cols = 4
    rows = math.ceil(len(frames) / cols)
    pad = 14

    def sheet(bg):
        width = cols * grid_w + (cols + 1) * pad
        height = rows * grid_h + (rows + 1) * pad
        out = Image.new("RGBA", (width, height), (22, 18, 28, 255) if bg is dark else (239, 233, 244, 255))
        for i, frame in enumerate(frames):
            cell = render_frame(frame["ops"], (grid_w, grid_h), bg)
            x = pad + (i % cols) * (grid_w + pad)
            y = pad + (i // cols) * (grid_h + pad)
            out.alpha_composite(cell, (x, y))
        return out

    here = Path(__file__).parent
    sheet(dark).convert("RGB").save(here / "sheet-dark.png")
    sheet(light).convert("RGB").save(here / "sheet-light.png")
    print("wrote sheet-dark.png, sheet-light.png")


if __name__ == "__main__":
    main()

