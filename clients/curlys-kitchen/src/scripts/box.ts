// A Curly's takeaway box: kraft card, their logo on the lid, and inside
// steak strips, chips, peppers and a drizzle of the sauce. Steam rises
// once the lid lifts. Everything is built from primitives and canvas
// textures, so there's no model file to download.
//
// The lid peeks open on load (state.intro 0 -> 1) and opens fully as you
// scroll past the hero (setProgress). Drag or flick to spin it.
import {
  ACESFilmicToneMapping,
  AmbientLight,
  BoxGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  CircleGeometry,
  Color,
  DirectionalLight,
  Group,
  InstancedMesh,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  PointLight,
  RepeatWrapping,
  Scene,
  SRGBColorSpace,
  Sprite,
  SpriteMaterial,
  Timer,
  TextureLoader,
  TubeGeometry,
  Vector3,
  WebGLRenderer,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

// Seeded random so the food lands the same way every visit.
let seed = 7;
const rand = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};
const range = (a: number, b: number) => a + rand() * (b - a);

function kraftTexture(base: string, dark: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d")!;
  g.fillStyle = base;
  g.fillRect(0, 0, 512, 512);
  // Speckles
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = Math.random() < 0.5 ? dark : "rgba(255,240,215,0.5)";
    g.globalAlpha = Math.random() * 0.35;
    const s = Math.random() * 2.2;
    g.fillRect(Math.random() * 512, Math.random() * 512, s, s);
  }
  // Fibres
  g.strokeStyle = dark;
  for (let i = 0; i < 240; i++) {
    g.globalAlpha = Math.random() * 0.18;
    g.lineWidth = Math.random() * 1.2;
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + range(-12, 12), y + range(-6, 6), x + range(-22, 22), y + range(-10, 10));
    g.stroke();
  }
  g.globalAlpha = 1;
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.wrapS = t.wrapT = RepeatWrapping;
  return t;
}

function softDot(inner: string, outer: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, inner);
  grd.addColorStop(1, outer);
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

export function createBox(canvas: HTMLCanvasElement) {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch {
    return null;
  }
  const small = matchMedia("(max-width: 959px)").matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.75 : 2));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = SRGBColorSpace;

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;

  const camera = new PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 3.4, 6.6);
  camera.lookAt(0, 0.35, 0);

  // ----- Materials -----
  const kraft = new MeshStandardMaterial({ map: kraftTexture("#c99b69", "#7a5634"), roughness: 0.88, metalness: 0 });
  const kraftIn = new MeshStandardMaterial({ map: kraftTexture("#b98a5a", "#6b4a2c"), roughness: 0.92, metalness: 0 });

  // ----- Box base: floor and four walls, open at the top -----
  const W = 2.6;
  const D = 1.9;
  const H = 0.95;
  const T = 0.06;
  const r = 0.025;
  const base = new Group();
  const floor = new Mesh(new RoundedBoxGeometry(W, T, D, 2, r), kraftIn);
  floor.position.y = T / 2;
  const wallFB = new RoundedBoxGeometry(W, H, T, 2, r);
  const wallLR = new RoundedBoxGeometry(T, H, D, 2, r);
  const front = new Mesh(wallFB, kraft);
  front.position.set(0, H / 2, D / 2 - T / 2);
  const back = new Mesh(wallFB, kraft);
  back.position.set(0, H / 2, -D / 2 + T / 2);
  const left = new Mesh(wallLR, kraft);
  left.position.set(-W / 2 + T / 2, H / 2, 0);
  const right = new Mesh(wallLR, kraft);
  right.position.set(W / 2 - T / 2, H / 2, 0);
  base.add(floor, front, back, left, right);

  // ----- Food -----
  const food = new Group();
  const dummy = new Object3D();

  // Chips on the left
  const chipCount = small ? 46 : 64;
  const chips = new InstancedMesh(
    new RoundedBoxGeometry(0.11, 0.11, 0.62, 1, 0.025),
    new MeshStandardMaterial({ color: "#e9b04c", roughness: 0.55 }),
    chipCount
  );
  const chipColor = new Color();
  for (let i = 0; i < chipCount; i++) {
    const layer = i / chipCount;
    dummy.position.set(range(-1.05, 0.0), 0.12 + layer * 0.62 + range(0, 0.06), range(-0.55, 0.55));
    dummy.rotation.set(range(-0.25, 0.25), range(0, Math.PI), range(-0.2, 0.2));
    dummy.updateMatrix();
    chips.setMatrixAt(i, dummy.matrix);
    chips.setColorAt(i, chipColor.set("#e9b04c").offsetHSL(range(-0.015, 0.015), 0, range(-0.08, 0.06)));
  }
  food.add(chips);

  // Steak strips on the right, fanned
  const steakMat = new MeshPhysicalMaterial({ color: "#6a321c", roughness: 0.45, clearcoat: 0.6, clearcoatRoughness: 0.35 });
  const steakGeo = new RoundedBoxGeometry(0.24, 0.12, 0.92, 2, 0.05);
  for (let i = 0; i < 7; i++) {
    const s = new Mesh(steakGeo, steakMat);
    s.position.set(0.18 + i * 0.14, 0.7 + Math.sin(i * 0.9) * 0.03, range(-0.08, 0.08));
    s.rotation.set(range(-0.08, 0.08), 0.18 - i * 0.05, -0.18);
    food.add(s);
  }

  // Peppers scattered over the top
  const pepperCount = 22;
  const peppers = new InstancedMesh(new BoxGeometry(0.08, 0.035, 0.3), new MeshStandardMaterial({ color: "#ffffff", roughness: 0.4 }), pepperCount);
  const pepperCols = ["#c8322a", "#3f8a35", "#e8a21b"];
  for (let i = 0; i < pepperCount; i++) {
    dummy.position.set(range(-1.0, 1.05), range(0.8, 0.88), range(-0.6, 0.6));
    dummy.rotation.set(range(-0.3, 0.3), range(0, Math.PI), range(-0.3, 0.3));
    dummy.updateMatrix();
    peppers.setMatrixAt(i, dummy.matrix);
    peppers.setColorAt(i, chipColor.set(pepperCols[i % 3]));
  }
  food.add(peppers);

  // The sauce, drizzled across the steak
  const pts: Vector3[] = [];
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    pts.push(new Vector3(0.05 + t * 1.0, 0.86 + Math.sin(t * 9) * 0.02, Math.sin(t * Math.PI * 3) * 0.42));
  }
  const sauce = new Mesh(
    new TubeGeometry(new CatmullRomCurve3(pts), 120, 0.032, 10, false),
    new MeshPhysicalMaterial({ color: "#f4a259", roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.15 })
  );
  food.add(sauce);
  base.add(food);

  // ----- Lid, hinged along the back edge -----
  const lidPivot = new Group();
  lidPivot.position.set(0, H, -D / 2);
  const lid = new Group();
  const lidTop = new Mesh(new RoundedBoxGeometry(W + 0.06, T, D + 0.06, 2, r), kraft);
  lidTop.position.set(0, T / 2, D / 2);
  const lip = new Mesh(new RoundedBoxGeometry(W + 0.06, 0.16, T, 2, r), kraft);
  lip.position.set(0, -0.05, D + 0.03);
  lid.add(lidTop, lip);

  // Logo sticker on the lid
  const sticker = new Mesh(
    new CircleGeometry(0.62, 64),
    new MeshStandardMaterial({ color: "#ffffff", roughness: 0.6, transparent: true })
  );
  sticker.rotation.x = -Math.PI / 2;
  sticker.position.set(0, T + 0.003, D / 2);
  new TextureLoader().load("/media/logo-tex.webp", (tex) => {
    tex.colorSpace = SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    (sticker.material as MeshStandardMaterial).map = tex;
    (sticker.material as MeshStandardMaterial).needsUpdate = true;
  });
  lid.add(sticker);
  lidPivot.add(lid);

  const box = new Group();
  box.add(base, lidPivot);
  box.position.set(0, -0.35, 0.15);

  // Soft shadow on the "table"
  const shadow = new Mesh(
    new PlaneGeometry(4.2, 3.4),
    new MeshBasicMaterial({ map: softDot("rgba(60,15,0,0.55)", "rgba(60,15,0,0)"), transparent: true, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.001;
  box.add(shadow);

  const pivot = new Group();
  pivot.add(box);
  scene.add(pivot);

  // ----- Steam -----
  const steamTex = softDot("rgba(255,248,238,0.9)", "rgba(255,248,238,0)");
  const puffs: { s: Sprite; life: number; speed: number; x: number; z: number; drift: number }[] = [];
  const steam = new Group();
  for (let i = 0; i < (small ? 14 : 22); i++) {
    const s = new Sprite(new SpriteMaterial({ map: steamTex, transparent: true, depthWrite: false, opacity: 0 }));
    steam.add(s);
    puffs.push({ s, life: Math.random(), speed: range(0.18, 0.32), x: range(-0.9, 0.9), z: range(-0.5, 0.5), drift: range(-0.25, 0.25) });
  }
  box.add(steam);

  // ----- Light -----
  const amb = new AmbientLight(0xfff1e0, 0.35);
  const key = new DirectionalLight(0xfff4e6, 2.1);
  key.position.set(2.5, 5, 4);
  const rim = new PointLight(0xff6a2a, 40, 0, 2);
  rim.position.set(-3.2, 2.4, -2.4);
  const glow = new PointLight(0xffa060, 0, 4, 2); // warm light from the food when the lid opens
  glow.position.set(0, 1.4, 0.2);
  box.add(glow);
  scene.add(amb, key, rim);

  // ----- Size -----
  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  // ----- Input: drag or flick to spin (vertical swipes still scroll) -----
  let spin = 0;
  let dragX: number | null = null;
  canvas.addEventListener("pointerdown", (e) => {
    dragX = e.clientX;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (dragX === null) return;
    spin += (e.clientX - dragX) * 0.005;
    dragX = e.clientX;
  });
  const endDrag = () => (dragX = null);
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  // ----- Loop: runs only while on screen -----
  const state = { intro: 0 };
  let progress = 0;
  let angle = -0.5;
  let lidNow = 0;
  let visible = true;
  let raf = 0;
  const timer = new Timer();

  const frame = (now?: number) => {
    timer.update(now);
    const dt = Math.min(timer.getDelta(), 0.05);
    const t = timer.getElapsed();
    angle += dt * 0.22 + spin;
    spin *= 0.92;

    const open = MathUtils.clamp(state.intro * 0.42 + MathUtils.smoothstep(progress, 0.05, 0.6) * 1.5, 0, 1.95);
    lidNow += (open - lidNow) * Math.min(1, dt * 8);
    lidPivot.rotation.x = -lidNow;

    pivot.rotation.y = angle + progress * 0.9;
    pivot.rotation.x = progress * 0.25;
    pivot.position.y = Math.sin(t * 1.2) * 0.05;

    const steamAmt = MathUtils.clamp((lidNow - 0.2) / 0.6, 0, 1);
    glow.intensity = steamAmt * 6;
    puffs.forEach((p) => {
      p.life += dt * p.speed;
      if (p.life > 1) {
        p.life = 0;
        p.x = range(-0.9, 0.9);
        p.z = range(-0.5, 0.5);
      }
      const k = p.life;
      p.s.position.set(p.x + Math.sin(t + p.drift * 10) * 0.12 + p.drift * k, 0.95 + k * 1.9, p.z);
      const size = 0.5 + k * 1.1;
      p.s.scale.set(size, size, 1);
      (p.s.material as SpriteMaterial).opacity = Math.sin(k * Math.PI) * 0.28 * steamAmt;
    });

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
    state,
    setProgress(p: number) {
      progress = p;
    },
  };
}
