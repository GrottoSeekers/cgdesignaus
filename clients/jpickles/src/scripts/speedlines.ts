// Hero background: speed lines streaking past, like the trails behind the runner in
// James's logo. One instanced mesh, all movement in the vertex shader, so phones cope.
// Scrolling fast pushes the lines faster; a mouse tilts them slightly by depth.
import {
  WebGLRenderer, Scene, OrthographicCamera, PlaneGeometry, InstancedMesh, ShaderMaterial,
  InstancedBufferAttribute, AdditiveBlending, Matrix4, Color,
} from "three";

type Opts = { reduce: boolean };

const vert = /* glsl */ `
  attribute vec4 aLine;   // x start (0..1), y (0..1), length (px), speed (px/s)
  attribute vec2 aLook;   // alpha, depth (0 far .. 1 near)
  attribute vec3 aColor;
  uniform float uTime;
  uniform vec2 uSize;
  uniform vec2 uPointer;
  varying vec2 vUv;
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    vUv = uv;
    float len = aLine.z;
    float span = uSize.x + len * 2.0;
    // Travel right to left and wrap.
    float x = mod(aLine.x * span - aLine.w * uTime, span) - len;
    float y = aLine.y * uSize.y + uPointer.y * 18.0 * aLook.y;
    x += uPointer.x * 24.0 * aLook.y;
    float thick = mix(0.6, 2.2, aLook.y);
    vec3 p = vec3(x + position.x * len + len * 0.5, y + position.y * thick, 0.0);
    vAlpha = aLook.x;
    vColor = aColor;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const frag = /* glsl */ `
  varying vec2 vUv;
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    // Bright head on the left, tail fading out to the right.
    float tail = pow(1.0 - vUv.x, 1.6);
    float head = smoothstep(0.0, 0.04, vUv.x);
    gl_FragColor = vec4(vColor, vAlpha * tail * head);
  }
`;

export function createSpeedLines(canvas: HTMLCanvasElement, { reduce }: Opts) {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
  } catch {
    return null;
  }
  const small = matchMedia("(max-width: 899px)").matches;
  const COUNT = small ? 70 : 150;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, small ? 1.5 : 1.75));
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const camera = new OrthographicCamera(0, 1, 1, 0, -10, 10);
  const geo = new PlaneGeometry(1, 1);

  const aLine = new Float32Array(COUNT * 4);
  const aLook = new Float32Array(COUNT * 2);
  const aColor = new Float32Array(COUNT * 3);
  const bone = new Color("#f4f1ea");
  const gold = new Color("#c9a45c");
  for (let i = 0; i < COUNT; i++) {
    const depth = Math.random() ** 1.6;
    // Lines cluster through the middle band of the hero, like the logo's trails.
    const y = 0.5 + (Math.random() + Math.random() + Math.random() - 1.5) * 0.42;
    aLine.set([Math.random(), y, 120 + depth * 520 + Math.random() * 180, 60 + depth * 520], i * 4);
    aLook.set([0.05 + depth * 0.32, depth], i * 2);
    const c = Math.random() < 0.22 ? gold : bone;
    aColor.set([c.r, c.g, c.b], i * 3);
  }

  const mat = new ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uSize: { value: [1, 1] }, uPointer: { value: [0, 0] } },
  });

  const mesh = new InstancedMesh(geo, mat, COUNT);
  const identity = new Matrix4();
  for (let i = 0; i < COUNT; i++) mesh.setMatrixAt(i, identity);
  geo.setAttribute("aLine", new InstancedBufferAttribute(aLine, 4));
  geo.setAttribute("aLook", new InstancedBufferAttribute(aLook, 2));
  geo.setAttribute("aColor", new InstancedBufferAttribute(aColor, 3));
  mesh.frustumCulled = false;
  scene.add(mesh);

  const resize = () => {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.right = w;
    camera.top = h;
    camera.updateProjectionMatrix();
    mat.uniforms.uSize.value = [w, h];
    if (!running) renderer.render(scene, camera);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  // Mouse tilt (eased). Touch devices skip it.
  const target = [0, 0];
  if (matchMedia("(hover: hover) and (pointer: fine)").matches && !reduce) {
    addEventListener("pointermove", (e) => {
      target[0] = (e.clientX / innerWidth - 0.5) * 2;
      target[1] = -(e.clientY / innerHeight - 0.5) * 2;
    }, { passive: true });
  }

  let running = false;
  let raf = 0;
  let last = performance.now();
  let t = 8; // start mid-stream so lines are already spread out
  let boost = 0;
  let boostNow = 0;

  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    boostNow += (boost - boostNow) * 0.08;
    boost *= 0.94;
    // Always moving. With Reduce Motion on it drifts slowly and ignores scroll bursts.
    t += reduce ? dt * 0.35 : dt * (1 + boostNow * 2.5);
    mat.uniforms.uTime.value = t;
    const p = mat.uniforms.uPointer.value as number[];
    p[0] += (target[0] - p[0]) * 0.05;
    p[1] += (target[1] - p[1]) * 0.05;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  };

  resize();
  mat.uniforms.uTime.value = t;
  renderer.render(scene, camera);

  const api = {
    play() {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    },
    pause() {
      running = false;
      cancelAnimationFrame(raf);
    },
    setBoost(v: number) { boost = Math.max(boost, v); },
  };
  document.addEventListener("visibilitychange", () => (document.hidden ? api.pause() : api.play()));
  return api;
}
