/* The specimen stage: one photograph, one ring-number map, one full-frame quad.
 * Each pixel knows which ring it belongs to (img/rings.png). The front is the ring
 * being read; older rings stay in colour, newer ones go cold, and the front itself
 * glows. No geometry is built: nothing here draws a tree. */

const VERT = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = vec2(aPos.x * .5 + .5, .5 - aPos.y * .5);
  gl_Position = vec4(aPos, 0., 1.);
}`;

const FRAG = `#version 300 es
precision highp float;
uniform sampler2D uPhoto;
uniform sampler2D uRings;
uniform float uFront;
uniform float uTmax;
uniform float uGlow;
uniform float uLamp;
uniform vec2 uLampAt;
in vec2 vUv;
out vec4 o;
const float M = 384.;
float code(ivec2 p) {
  p = clamp(p, ivec2(0), ivec2(383));
  vec3 c = texelFetch(uRings, p, 0).rgb * 255.;
  return (floor(c.r + .5) * 16. + floor(c.g + .5) / 16.) / 4095. * uTmax;
}
float ring(vec2 uv) {
  vec2 p = uv * M - .5;
  vec2 i = floor(p), f = p - i;
  ivec2 q = ivec2(i);
  float t = mix(mix(code(q), code(q + ivec2(1, 0)), f.x), mix(code(q + ivec2(0, 1)), code(q + ivec2(1, 1)), f.x), f.y);
  return t - .5;
}
void main() {
  vec3 ph = texture(uPhoto, vUv).rgb;
  float t = ring(vUv);
  float d = t - uFront;
  float w = max(fwidth(t), .0001);
  float read = 1. - smoothstep(0., .3, d);
  float lum = dot(ph, vec3(.299, .587, .114));
  vec3 cold = mix(vec3(lum), ph, .22) * vec3(.12, .135, .12);
  float edge = abs(fract(t + .5) - .5);
  cold += vec3(.78, .88, .49) * (1. - smoothstep(0., max(w * 1.1, .03), edge)) * .2;
  vec3 col = mix(cold, ph, read);
  float g = exp(-pow((d - .06) / .17, 2.)) + exp(-pow((d + .22) / .42, 2.)) * .22;
  col += vec3(.78, .88, .49) * g * .85 * uGlow;
  float l = distance(vUv, uLampAt);
  col *= 1. + uLamp * (.26 * exp(-l * l * 6.) - .06);
  o = vec4(col, 1.);
}`;

export function createStage(host, o) {
  const canvas = host.querySelector('canvas');
  const small = matchMedia('(max-width: 899px)');
  const cap = () => Math.min(window.devicePixelRatio || 1, small.matches ? 1.5 : 2);
  const tiers = [1, .82, .66, .5];            // multiples of the cap, lowered when frames run long
  let gl, prog, loc, texPhoto, texRings, vao;
  let tier = 0, ema = 16, slow = 0, fast = 0, w = 0;
  let raf = 0, last = 0, visible = true, lost = false, dirty = true;
  const imgs = {};
  const s = { front: o.start, target: o.start, lamp: 0, lampT: 0, lx: .5, ly: .5, tx: .5, ty: .5 };

  const api = {
    ok: false,
    setFront(f) { s.target = f; wake(); },
    jump(f) { s.target = s.front = f; wake(); },
    setLamp(u, v) { s.tx = u; s.ty = v; s.lampT = 1; wake(); },
    fadeLamp() { s.lampT = 0; wake(); },
    setVisible(v) { visible = v; if (v) wake(); else stop(); },
    get front() { return s.front; },
  };

  function compile(type, src) {
    const sh = gl.createShader(type); gl.shaderSource(sh, src); gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
    return sh;
  }
  function tex(img, linear) {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (linear) { gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); }
    else { gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); }
    return t;
  }
  function build() {
    prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);
    loc = {};
    for (const n of ['uPhoto', 'uRings', 'uFront', 'uTmax', 'uGlow', 'uLamp', 'uLampAt']) loc[n] = gl.getUniformLocation(prog, n);
    vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(prog, 'aPos'); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0); texPhoto = tex(imgs.photo, true);
    gl.activeTexture(gl.TEXTURE1); texRings = tex(imgs.rings, false);
    gl.uniform1i(loc.uPhoto, 0); gl.uniform1i(loc.uRings, 1); gl.uniform1f(loc.uTmax, o.tmax);
  }
  function size() {
    const css = host.clientWidth; if (!css) return;
    const px = Math.max(256, Math.round(css * cap() * tiers[tier]));
    if (canvas.width !== px) { canvas.width = canvas.height = px; }
    canvas.dataset.tier = tier;
    w = css; gl.viewport(0, 0, canvas.width, canvas.height); dirty = true;
  }
  function draw() {
    gl.uniform1f(loc.uFront, s.front);
    gl.uniform1f(loc.uGlow, Math.min(1, Math.max(0, (o.start - s.front) / .8)) * Math.min(1, s.front / 1.2));
    gl.uniform1f(loc.uLamp, s.lamp);
    gl.uniform2f(loc.uLampAt, s.lx, s.ly);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    o.onFront && o.onFront(s.front);
  }
  function govern(ms) {
    ema = ema * .9 + Math.min(ms, 50) * .1;     // a one-off stall counts as slow, not as unbounded
    if (ema > 21 && tier < tiers.length - 1) { if (++slow > 20) { tier++; slow = 0; ema = 16; size(); } } else slow = 0;
    if (ema < 9 && tier > 0) { if (++fast > 240) { tier--; fast = 0; size(); } } else fast = 0;
  }
  function frame(t) {
    raf = 0;
    if (lost || !visible || document.hidden) { last = 0; return; }
    const dt = last ? Math.min(.05, (t - last) / 1000) : .016; const ms = last ? t - last : 16; last = t;
    const k = 1 - Math.exp(-dt * 12);
    let moving = false;
    if (s.front !== s.target) { s.front += (s.target - s.front) * k; if (Math.abs(s.target - s.front) < .003) s.front = s.target; else moving = true; }
    if (s.lamp !== s.lampT) { s.lamp += (s.lampT - s.lamp) * k; if (Math.abs(s.lampT - s.lamp) < .004) s.lamp = s.lampT; else moving = true; }
    if (s.lamp > 0 || s.lampT > 0) { const dx = s.tx - s.lx, dy = s.ty - s.ly; if (Math.abs(dx) + Math.abs(dy) > .002) { s.lx += dx * k; s.ly += dy * k; moving = true; } }
    draw(); dirty = false;
    if (moving) { govern(ms); raf = requestAnimationFrame(frame); } else last = 0;
  }
  function wake() { if (!api.ok || raf || lost || !visible || document.hidden) return; raf = requestAnimationFrame(frame); }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } last = 0; }

  function load(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; }); }
  function pick() { const need = host.clientWidth * cap(), p = o.photos; if (need <= 660) return p[0]; if (need <= 920 || small.matches) return p[1]; return need <= 1450 ? p[2] : p[3]; }

  async function init() {
    gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'default' });
    if (!gl) { o.onFail && o.onFail(); return; }
    try {
      const [photo, rings] = await Promise.all([load(pick()), load(o.rings)]);
      imgs.photo = photo; imgs.rings = rings;
      build(); size(); api.ok = true; draw(); host.classList.add('live');
      o.onReady && o.onReady();
    } catch (e) { api.ok = false; o.onFail && o.onFail(); }
  }

  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); lost = true; stop(); host.classList.remove('live'); });
  canvas.addEventListener('webglcontextrestored', () => { lost = false; try { build(); size(); draw(); host.classList.add('live'); } catch (e) { o.onFail && o.onFail(); } });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else wake(); });
  new ResizeObserver(() => { if (api.ok && !lost) { size(); draw(); } }).observe(host);

  void init();
  return api;
}
