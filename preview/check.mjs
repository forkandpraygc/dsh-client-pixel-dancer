/**
 * Structural checks for the pixel-dancer client bundle, runnable without a browser.
 * Loads the real lib/client.js through a fake module loader, exercises the slot
 * registration, and paints a few frames through a recording canvas context.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(path.join(here, '..', 'lib', 'client.js'), 'utf8');

let factory;
const registered = [];
const injected = [];
let mountedComponent;

globalThis.window = {
  __ModuleLoader__: {
    load(def) {
      assert.equal(def.id, 'dsh-client-pixel-dancer', 'bundle id must equal the package name');
      factory = def.factory;
    },
  },
};

new Function('window', source)(globalThis.window);
assert.equal(typeof factory, 'function', 'bundle must register a factory');

const reactStub = {
  useRef: () => ({ current: null }),
  useEffect: () => {},
  createElement: (type, props, ...children) => ({ type, props, children }),
};
const mod = factory((id) => {
  if (id === 'react') return reactStub;
  throw new Error(`unexpected require(${id})`);
});

assert.equal(typeof mod.apply, 'function', 'exports.apply must be a function');
assert.deepEqual(mod.inject, ['slots'], 'exports.inject must require the slots service');
assert.equal(typeof mod.drawScene, 'function', 'drawScene should be exposed for previews');

const ctx = {
  slots: {
    inject(name, callback) {
      injected.push(name);
      assert.equal(name, 'shell.overlay');
      callback();
      return () => {};
    },
    register(options, component) {
      registered.push(options);
      mountedComponent = component;
      return () => {};
    },
  },
};
mod.apply(ctx);
assert.deepEqual(injected, ['shell.overlay']);
assert.equal(registered.length, 1);
assert.equal(registered[0].name, 'shell.overlay');
assert.equal(registered[0].id, 'pixel-dancer');
assert.equal(typeof mountedComponent, 'function', 'registered occupant must be a component');

// The component renders a fixed, pointer-transparent canvas wrapper.
const tree = mountedComponent();
assert.equal(tree.props.className, 'dsh-pixel-dancer');
assert.equal(tree.props['aria-hidden'], 'true');
assert.equal(tree.props.style.pointerEvents, 'none');
assert.equal(tree.props.style.position, 'fixed');
const canvas = tree.children[0];
assert.equal(canvas.type, 'canvas');
assert.equal(canvas.props.width, mod.W * mod.PIXEL);
assert.equal(canvas.props.height, mod.H * mod.PIXEL);

// Painting must stay within the sprite grid and never throw.
class Recorder {
  constructor() { this.ops = []; this.style = '#000'; this.path = null; }
  set fillStyle(v) { this.style = v; }
  get fillStyle() { return this.style; }
  set imageSmoothingEnabled(_v) {}
  setTransform() {}
  clearRect() { this.ops.push(['clear']); }
  beginPath() { this.path = null; }
  arc(x, y, r) { this.path = { x, y, r }; }
  ellipse(x, y, rx, ry) { this.path = { x, y, rx, ry }; }
  fill() { this.ops.push(['fill', this.path, this.style]); }
  fillRect(x, y, w, h) { this.ops.push(['rect', { x, y, w, h }, this.style]); }
  createRadialGradient() { return { addColorStop() {} }; }
}

let rects = 0;
for (let i = 0; i < 40; i += 1) {
  const rec = new Recorder();
  mod.drawScene(rec, i * 0.037);
  for (const [kind, geom] of rec.ops) {
    if (kind !== 'rect') continue;
    rects += 1;
    assert.ok(Number.isFinite(geom.x) && Number.isFinite(geom.y), 'rect coordinates must be finite');
    assert.ok(geom.w > 0 && geom.h > 0, 'rect size must be positive');
    assert.ok(geom.x >= -2 && geom.y >= -8, `rect out of grid: ${JSON.stringify(geom)}`);
    assert.ok(geom.x + geom.w <= mod.W + 2, `rect out of grid: ${JSON.stringify(geom)}`);
    assert.ok(geom.y + geom.h <= mod.H + 4, `rect out of grid: ${JSON.stringify(geom)}`);
  }
}

console.log(`ok: ${rects} rects checked across 40 frames`);

