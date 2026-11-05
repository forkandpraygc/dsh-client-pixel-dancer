import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const bundle = fs.readFileSync(path.join(here, '..', 'lib', 'client.js'), 'utf8');

class Recorder {
  constructor() {
    this.ops = [];
    this._fillStyle = '#000000';
    this.path = null;
    this.transform = [1, 0, 0, 1, 0, 0];
  }
  set fillStyle(value) { this._fillStyle = value; }
  get fillStyle() { return this._fillStyle; }
  set imageSmoothingEnabled(_value) {}
  setTransform(a, b, c, d, e, f) { this.transform = [a, b, c, d, e, f]; }
  clearRect() { this.ops.push({ op: 'clear' }); }
  beginPath() { this.path = null; }
  arc(x, y, r) { this.path = { kind: 'arc', x, y, r }; }
  ellipse(x, y, rx, ry) { this.path = { kind: 'ellipse', x, y, rx, ry }; }
  fill() {
    if (this.path) this.ops.push({ op: 'fill', shape: this.path, style: this._fillStyle });
    this.path = null;
  }
  fillRect(x, y, w, h) { this.ops.push({ op: 'rect', x, y, w, h, color: this._fillStyle }); }
  createRadialGradient(x0, y0, r0, x1, y1, r1) {
    const stops = [];
    return {
      addColorStop(offset, color) { stops.push([offset, color]); },
      __kind: 'radial',
      x0, y0, r0, x1, y1, r1, stops,
    };
  }
}

let mod;
globalThis.window = {
  __ModuleLoader__: {
    load(def) {
      mod = def.factory((id) => {
        if (id === 'react') return {};
        throw new Error('unexpected require: ' + id);
      });
    },
  },
};

new Function('window', bundle)(globalThis.window);

const outPath = process.argv[2];
const times = process.argv.slice(3).map(Number);
const frames = times.map((t) => {
  const rec = new Recorder();
  mod.drawScene(rec, t);
  return { t, ops: rec.ops };
});

const payload = JSON.stringify({ w: mod.W, h: mod.H, pixel: mod.PIXEL, frames });
if (outPath) fs.writeFileSync(outPath, payload, 'utf8');
else process.stdout.write(payload);

