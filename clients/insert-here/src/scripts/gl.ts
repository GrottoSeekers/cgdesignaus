import {
  LinearFilter,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  SRGBColorSpace,
  Scene,
  ShaderMaterial,
  type Texture,
  TextureLoader,
  Vector2,
  DoubleSide,
  VideoTexture,
  WebGLRenderer,
} from "three";

/* ------------------------------------------------------------------ */
/* Shared shader bits                                                  */
/* ------------------------------------------------------------------ */

const NOISE = /* glsl */ `
  vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec2 mod289(vec2 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);}
  float snoise(vec2 v){
    const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
    vec2 i=floor(v+dot(v,C.yy)); vec2 x0=v-i+dot(i,C.xx);
    vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);
    vec4 x12=x0.xyxy+C.xxzz; x12.xy-=i1; i=mod289(i);
    vec3 p=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));
    vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0); m=m*m; m=m*m;
    vec3 x=2.0*fract(p*C.www)-1.0; vec3 h=abs(x)-0.5; vec3 ox=floor(x+0.5); vec3 a0=x-ox;
    m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);
    vec3 g; g.x=a0.x*x0.x+h.x*x0.y; g.yz=a0.yz*x12.xz+h.yz*x12.yw;
    return 130.0*dot(m,g);
  }
`;

const COVER = /* glsl */ `
  vec2 cover(vec2 uv, vec2 plane, vec2 img){
    vec2 r = vec2(
      min((plane.x / plane.y) / (img.x / img.y), 1.0),
      min((plane.y / plane.x) / (img.y / img.x), 1.0)
    );
    return vec2(uv.x * r.x + (1.0 - r.x) * 0.5, uv.y * r.y + (1.0 - r.y) * 0.5);
  }
`;


const mediaSize = (t: Texture) => {
  const im = t.image as HTMLImageElement & HTMLVideoElement;
  return new Vector2(im?.videoWidth || im?.naturalWidth || im?.width || 1, im?.videoHeight || im?.naturalHeight || im?.height || 1);
};

/* ------------------------------------------------------------------ */
/* Hero: ambient image / video sequence with displacement dissolve     */
/* ------------------------------------------------------------------ */

export type HeroSlide = { type: "image" | "video"; src: string; poster?: string };

export function createHero(canvas: HTMLCanvasElement, slides: HeroSlide[], opts: { interval?: number; onChange?: (i: number) => void }) {
  const renderer = new WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = SRGBColorSpace;
  const scene = new Scene();
  const camera = new OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0, 1);

  const loader = new TextureLoader();
  const textures: Texture[] = slides.map((s) => {
    if (s.type === "video") {
      const v = document.createElement("video");
      Object.assign(v, { src: s.src, muted: true, loop: true, playsInline: true, crossOrigin: "anonymous", preload: "auto" });
      v.play().catch(() => {});
      const t = new VideoTexture(v);
      t.colorSpace = SRGBColorSpace;
      return t;
    }
    const t = loader.load(s.src, () => sync());
    t.colorSpace = SRGBColorSpace;
    t.minFilter = LinearFilter;
    t.generateMipmaps = false;
    return t;
  });

  const uniforms = {
    uTex0: { value: textures[0] },
    uTex1: { value: textures[1 % textures.length] },
    uSize0: { value: new Vector2(1, 1) },
    uSize1: { value: new Vector2(1, 1) },
    uRes: { value: new Vector2(1, 1) },
    uProgress: { value: 0 },
    uZoom0: { value: 0 },
    uZoom1: { value: 0 },
    uTime: { value: 0 },
    uMouse: { value: new Vector2(0, 0) },
  };

  const mat = new ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy * 2.0, 0.0, 1.0); }`,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uTex0, uTex1;
      uniform vec2 uSize0, uSize1, uRes, uMouse;
      uniform float uProgress, uZoom0, uZoom1, uTime;
      ${NOISE}
      ${COVER}
      vec2 zoom(vec2 uv, float z){ return (uv - 0.5) / (1.0 + z) + 0.5; }
      void main(){
        vec2 uv = vUv;
        float n = snoise(uv * vec2(2.2, 1.6) + uTime * 0.03) * 0.5 + 0.5;
        float edge = uProgress * 1.5 - 0.25;
        float m = smoothstep(edge - 0.22, edge + 0.22, n * 0.6 + (1.0 - uv.x) * 0.25 + uv.y * 0.15);
        vec2 d = vec2(snoise(uv * 3.0 + 7.0), snoise(uv * 3.0 + 13.0)) * 0.035;
        vec2 par = uMouse * 0.008;
        vec2 a = zoom(cover(uv, uRes, uSize0), uZoom0) + d * uProgress + par;
        vec2 b = zoom(cover(uv, uRes, uSize1), uZoom1) - d * (1.0 - uProgress) + par;
        vec3 ca = texture2D(uTex0, a).rgb;
        vec3 cb = texture2D(uTex1, b).rgb;
        vec3 col = mix(cb, ca, m);
        // soft bloom of light along the dissolve front
        float front = smoothstep(0.0, 0.5, m) * smoothstep(1.0, 0.5, m);
        col += front * 0.05;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  scene.add(new Mesh(new PlaneGeometry(1, 1), mat));

  let current = 0;
  let running = true;
  let timer: number | undefined;
  const sync = () => {
    uniforms.uSize0.value.copy(mediaSize(uniforms.uTex0.value));
    uniforms.uSize1.value.copy(mediaSize(uniforms.uTex1.value));
  };
  const resize = () => {
    const r = canvas.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    uniforms.uRes.value.set(r.width, r.height);
  };
  resize();
  window.addEventListener("resize", resize);

  // gsap is passed in by the caller so this module stays framework-agnostic
  let gsapRef: typeof import("gsap").gsap | null = null;
  const next = () => {
    if (!gsapRef || slides.length < 2) return;
    const to = (current + 1) % slides.length;
    uniforms.uTex1.value = textures[to];
    sync();
    uniforms.uZoom1.value = 0.08;
    gsapRef.to(uniforms.uZoom1, { value: 0, duration: opts.interval ?? 7, ease: "none" });
    gsapRef.fromTo(uniforms.uProgress, { value: 0 }, {
      value: 1, duration: 2.6, ease: "power2.inOut",
      onComplete: () => {
        current = to;
        uniforms.uTex0.value = textures[to];
        uniforms.uZoom0.value = uniforms.uZoom1.value;
        gsapRef!.killTweensOf(uniforms.uZoom1);
        gsapRef!.to(uniforms.uZoom0, { value: 0, duration: (opts.interval ?? 7) - 2.6, ease: "none" });
        uniforms.uProgress.value = 0;
        sync();
      },
    });
    opts.onChange?.(to);
  };

  const render = (t: number) => {
    if (!running) return;
    uniforms.uTime.value = t;
    renderer.render(scene, camera);
  };

  return {
    start(gsap: typeof import("gsap").gsap) {
      gsapRef = gsap;
      sync();
      uniforms.uZoom0.value = 0.1;
      gsap.to(uniforms.uZoom0, { value: 0, duration: (opts.interval ?? 7) + 1, ease: "none" });
      gsap.ticker.add(render);
      timer = window.setInterval(() => running && next(), (opts.interval ?? 7) * 1000);
    },
    setMouse(x: number, y: number) {
      gsapRef?.to(uniforms.uMouse.value, { x, y, duration: 1.4, ease: "power3.out" });
    },
    setActive(on: boolean) {
      running = on;
      textures.forEach((t) => {
        const v = t.image as HTMLVideoElement;
        if (v instanceof HTMLVideoElement) (on ? v.play().catch(() => {}) : v.pause());
      });
    },
    destroy() {
      clearInterval(timer);
      window.removeEventListener("resize", resize);
      renderer.dispose();
    },
  };
}

/* ------------------------------------------------------------------ */
/* Gallery: planes synced to DOM frames                                */
/* ------------------------------------------------------------------ */

export type FrameState = { reveal: number; parallax: number; hover: number; mouse: { x: number; y: number } };

export function createGallery(canvas: HTMLCanvasElement, frames: { el: HTMLElement; src: string; state: FrameState }[]) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  const scene = new Scene();
  const camera = new OrthographicCamera(0, 1, 0, 1, -10, 10);
  const geo = new PlaneGeometry(1, 1, 24, 24);
  const loader = new TextureLoader();

  const vertexShader = /* glsl */ `
    uniform float uVel;
    varying vec2 vUv;
    void main(){
      vUv = uv;
      vec3 p = position;
      p.y += sin(uv.x * 3.14159265) * uVel * 0.045;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }
  `;
  const fragmentShader = /* glsl */ `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uTex;
    uniform vec2 uPlane, uImg, uMouse;
    uniform float uReveal, uParallax, uHover, uVel, uTime;
    ${COVER}
    void main(){
      vec2 uv = cover(vUv, uPlane, uImg);
      // headroom for parallax + scale-down as it reveals
      float z = 1.0 / (1.14 + (1.0 - uReveal) * 0.22);
      uv = (uv - 0.5) * z + 0.5;
      uv.y += uParallax * 0.055;

      // hover: gentle magnify toward the pointer + a slow liquid ripple
      vec2 aspect = vec2(uPlane.x / uPlane.y, 1.0);
      vec2 toM = (vUv - uMouse) * aspect;
      float dist = length(toM);
      float lens = smoothstep(0.55, 0.0, dist) * uHover;
      uv -= (vUv - uMouse) * 0.06 * lens;
      uv += normalize(toM + 1e-5) / aspect * sin(dist * 26.0 - uTime * 3.2) * 0.0035 * lens;

      float shift = 0.0018 * uHover + abs(uVel) * 0.006;
      vec3 col = vec3(
        texture2D(uTex, uv + vec2(shift, 0.0)).r,
        texture2D(uTex, uv).g,
        texture2D(uTex, uv - vec2(shift, 0.0)).b
      );

      // image-mask reveal: wipes up from the bottom edge
      float a = 1.0 - smoothstep(uReveal - 0.004, uReveal, vUv.y);
      gl_FragColor = vec4(col * a, a);
    }
  `;

  const items = frames.map((f) => {
    const uniforms = {
      uTex: { value: null as Texture | null },
      uPlane: { value: new Vector2(1, 1) },
      uImg: { value: new Vector2(1, 1) },
      uMouse: { value: new Vector2(0.5, 0.5) },
      uReveal: { value: 0 },
      uParallax: { value: 0 },
      uHover: { value: 0 },
      uVel: { value: 0 },
      uTime: { value: 0 },
    };
    const tex = loader.load(f.src, (t) => uniforms.uImg.value.copy(mediaSize(t)));
    tex.colorSpace = SRGBColorSpace;
    tex.minFilter = LinearFilter;
    tex.generateMipmaps = false;
    uniforms.uTex.value = tex;
    const mesh = new Mesh(geo, new ShaderMaterial({ uniforms, vertexShader, fragmentShader, transparent: true, premultipliedAlpha: true, side: DoubleSide }));
    scene.add(mesh);
    return { ...f, mesh, uniforms };
  });

  let w = 0, h = 0;
  const resize = () => {
    w = window.innerWidth; h = window.innerHeight;
    renderer.setSize(w, h);
    camera.left = 0; camera.right = w; camera.top = 0; camera.bottom = h;
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener("resize", resize);

  return {
    render(time: number, velocity: number) {
      for (const it of items) {
        const r = it.el.getBoundingClientRect();
        const visible = r.bottom > -50 && r.top < h + 50;
        it.mesh.visible = visible;
        if (!visible) continue;
        // ortho camera with y pointing down: plane centred on the DOM rect
        it.mesh.position.set(r.left + r.width / 2, r.top + r.height / 2, 0);
        it.mesh.scale.set(r.width, -r.height, 1);
        const u = it.uniforms;
        u.uPlane.value.set(r.width, r.height);
        u.uReveal.value = it.state.reveal;
        u.uParallax.value = it.state.parallax;
        u.uHover.value = it.state.hover;
        u.uMouse.value.set(it.state.mouse.x, it.state.mouse.y);
        u.uVel.value = velocity;
        u.uTime.value = time;
      }
      renderer.render(scene, camera);
    },
    destroy() {
      window.removeEventListener("resize", resize);
      renderer.dispose();
    },
  };
}
