// A cast-iron kettlebell under red and white studio light.
// Built from two primitives (a lathe for the bell, a tube for the handle),
// so there's no model file to download. Spins slowly, turns with the page
// as you scroll, and can be flicked round with a finger or mouse.
import {
  ACESFilmicToneMapping,
  CatmullRomCurve3,
  Clock,
  DirectionalLight,
  Group,
  LatheGeometry,
  Mesh,
  MeshPhysicalMaterial,
  PerspectiveCamera,
  PMREMGenerator,
  PointLight,
  Scene,
  TubeGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

type Options = { reduce: boolean };

export function createKettlebell(canvas: HTMLCanvasElement, { reduce }: Options) {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch {
    return null;
  }
  const small = matchMedia("(max-width: 899px)").matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.45;

  const camera = new PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0.3, 7.9);
  camera.lookAt(0, 0, 0);

  // ----- Model -----
  const iron = new MeshPhysicalMaterial({
    color: 0x221a2a,
    metalness: 0.6,
    roughness: 0.34,
    clearcoat: 0.7,
    clearcoatRoughness: 0.22,
  });

  // Bell profile: flat base, wide belly, shoulders closing up to the handle.
  const profile = [
    [0, 0], [0.56, 0], [0.64, 0.02], [0.8, 0.12], [0.93, 0.32], [1.0, 0.6], [1.01, 0.85],
    [0.97, 1.1], [0.87, 1.35], [0.69, 1.58], [0.44, 1.74], [0.2, 1.8], [0, 1.81],
  ].map(([x, y]) => new Vector2(x, y));
  const body = new Mesh(new LatheGeometry(profile, 96), iron);

  const handlePath = new CatmullRomCurve3([
    new Vector3(-0.62, 1.42, 0),
    new Vector3(-0.7, 1.9, 0),
    new Vector3(-0.64, 2.34, 0),
    new Vector3(-0.42, 2.6, 0),
    new Vector3(0, 2.69, 0),
    new Vector3(0.42, 2.6, 0),
    new Vector3(0.64, 2.34, 0),
    new Vector3(0.7, 1.9, 0),
    new Vector3(0.62, 1.42, 0),
  ]);
  const handle = new Mesh(new TubeGeometry(handlePath, 120, 0.135, 28, false), iron);

  const bell = new Group();
  bell.add(body, handle);
  bell.position.y = -1.35;
  const pivot = new Group();
  pivot.add(bell);
  pivot.rotation.x = 0.12;
  scene.add(pivot);

  // ----- Light: red on one side, cool white on the other, plus a key -----
  const red = new PointLight(0xff2a2a, 110, 0, 2);
  red.position.set(-3.2, 1.2, 2.6);
  const cool = new PointLight(0xdfe6ff, 70, 0, 2);
  cool.position.set(3.4, 0.4, 1.2);
  const rim = new PointLight(0xff3b30, 70, 0, 2);
  rim.position.set(0.5, 2.6, -3);
  const key = new DirectionalLight(0xffffff, 1.1);
  key.position.set(1, 4, 5);
  scene.add(red, cool, rim, key);

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

  // ----- Input: flick to spin -----
  let spin = 0; // extra angular velocity from dragging
  let dragX: number | null = null;
  canvas.addEventListener("pointerdown", (e) => {
    dragX = e.clientX;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (dragX === null) return;
    const dx = e.clientX - dragX;
    dragX = e.clientX;
    spin += dx * 0.004;
    if (reduce) frame();
  });
  const endDrag = () => (dragX = null);
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  // ----- Loop: runs only while visible -----
  let progress = 0.5;
  let angle = 0;
  let visible = false;
  let raf = 0;
  const clock = new Clock();

  const frame = () => {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    if (!reduce) angle += dt * 0.35;
    angle += spin;
    spin *= 0.92;
    pivot.rotation.y = angle + progress * Math.PI * 1.4;
    pivot.rotation.x = 0.12 + (progress - 0.5) * 0.35;
    pivot.position.y = reduce ? 0 : Math.sin(t * 1.1) * 0.06;
    renderer.render(scene, camera);
    if (visible && !reduce) raf = requestAnimationFrame(frame);
  };
  const play = () => {
    cancelAnimationFrame(raf);
    clock.getDelta();
    frame();
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

  return {
    setProgress(p: number) {
      progress = p;
      if (reduce) frame(); // no loop under reduced motion; redraw on demand
    },
  };
}
