// "Spin the menu": a ring of real Curly's food photos (from their Instagram),
// each on a curved card. Drag or flick to spin; it settles with a dish facing
// you and reports which one, so the page can show its name. Scrolling past
// nudges it round too. Idle, it turns on its own.
import {
  CanvasTexture,
  CylinderGeometry,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  TextureLoader,
  Timer,
  WebGLRenderer,
} from "three";

type Options = { images: string[]; onFront: (index: number) => void };

// Rounded-corner mask so each card reads as a photo, not a slab.
function roundMask() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 340;
  const g = c.getContext("2d")!;
  g.fillStyle = "#000";
  g.fillRect(0, 0, 256, 340);
  g.fillStyle = "#fff";
  g.beginPath();
  g.roundRect(0, 0, 256, 340, 18);
  g.fill();
  return new CanvasTexture(c);
}

export function createSpin(canvas: HTMLCanvasElement, { images, onFront }: Options) {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch {
    return null;
  }
  const small = matchMedia("(max-width: 959px)").matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 2 : 2));
  renderer.outputColorSpace = SRGBColorSpace;

  const scene = new Scene();
  const camera = new PerspectiveCamera(32, 1, 0.1, 50);

  // ----- Ring of curved cards -----
  const N = images.length;
  const R = 3.1;
  const step = (Math.PI * 2) / N;
  const arc = step * 0.86; // gap between cards
  const H = (R * arc * 4) / 3; // 3:4 photos
  const ring = new Group();
  const mask = roundMask();
  const loader = new TextureLoader();
  const mats: MeshBasicMaterial[] = [];

  images.forEach((src, i) => {
    // An open cylinder slice, centred on angle 0, facing outwards.
    const geo = new CylinderGeometry(R, R, H, 24, 1, true, -arc / 2, arc);
    const front = new MeshBasicMaterial({ color: 0xffffff, alphaMap: mask, transparent: true });
    const back = new MeshBasicMaterial({ color: 0xb93a0f, alphaMap: mask, transparent: true, side: 1 }); // BackSide
    loader.load(src, (t) => {
      t.colorSpace = SRGBColorSpace;
      t.anisotropy = renderer.capabilities.getMaxAnisotropy();
      front.map = t;
      front.needsUpdate = true;
    });
    mats.push(front);
    const card = new Group();
    card.add(new Mesh(geo, front), new Mesh(geo, back));
    card.rotation.y = i * step;
    ring.add(card);
  });
  ring.rotation.x = 0.06;
  scene.add(ring);

  // ----- Size: frame the front card plus its neighbours -----
  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Pull back on narrow screens so the side cards still peek in.
    const dist = R + (w / h < 1.1 ? 7.4 : 5.6);
    camera.position.set(0, 0.6, dist);
    camera.lookAt(0, -0.05, R * 0.4);
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  // ----- Rotation state -----
  // angle: current; target: where it's heading. Card i faces the camera when angle = -i*step.
  let angle = 0;
  let target = 0;
  let velocity = 0;
  let dragging = false;
  let lastX = 0;
  let lastT = 0;
  let idleFor = 0;
  let scrollOffset = 0;
  let front = -1;

  const snap = () => (target = Math.round(target / step) * step);

  canvas.addEventListener("pointerdown", (e) => {
    dragging = true;
    lastX = e.clientX;
    lastT = performance.now();
    velocity = 0;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const now = performance.now();
    const dx = e.clientX - lastX;
    const delta = (dx / canvas.clientWidth) * 2.6;
    target += delta;
    velocity = delta / Math.max(1, now - lastT);
    lastX = e.clientX;
    lastT = now;
    idleFor = 0;
  });
  const release = () => {
    if (!dragging) return;
    dragging = false;
    target += velocity * 260; // flick
    snap();
  };
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);

  // ----- Loop: runs only while on screen -----
  let visible = true;
  let raf = 0;
  const timer = new Timer();

  const frame = (now?: number) => {
    timer.update(now);
    const dt = Math.min(timer.getDelta(), 0.05);
    if (!dragging) {
      idleFor += dt;
      // After a pause, glide on to the next dish every few seconds.
      if (idleFor > 3.2) {
        target -= step;
        idleFor = 0;
      }
    }
    angle += (target + scrollOffset - angle) * Math.min(1, dt * (dragging ? 18 : 5));
    ring.rotation.y = angle;

    // Cards turning away dim a little, like they're leaving the light.
    ring.children.forEach((card, i) => {
      const a = MathUtils.euclideanModulo(i * step + angle + Math.PI, Math.PI * 2) - Math.PI;
      const lit = MathUtils.clamp(1 - Math.abs(a) / 1.9, 0.35, 1);
      mats[i].color.setScalar(lit);
    });

    const idx = MathUtils.euclideanModulo(Math.round(-angle / step), N);
    if (idx !== front) {
      front = idx;
      onFront(idx);
    }
    renderer.render(scene, camera);
    if (visible && !document.hidden) raf = requestAnimationFrame(frame);
  };
  const play = () => {
    cancelAnimationFrame(raf);
    timer.update();
    raf = requestAnimationFrame(frame);
  };
  const io = new IntersectionObserver((entries) => {
    visible = entries.some((e) => e.isIntersecting);
    if (visible) play();
    else cancelAnimationFrame(raf);
  });
  io.observe(canvas);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else if (visible) play();
  });
  play();

  return {
    // 0..1 progress through the hero; scrolling turns the ring about one card.
    setScroll(p: number) {
      scrollOffset = -p * step * 1.5;
    },
    next() {
      target -= step;
      idleFor = 0;
    },
    prev() {
      target += step;
      idleFor = 0;
    },
  };
}
