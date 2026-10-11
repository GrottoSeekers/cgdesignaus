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
  };

  const mat = new ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy * 2.0, 0.0, 1.0); }`,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uTex0, uTex1;
      uniform vec2 uSize0, uSize1, uRes;
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
        vec2 a = zoom(cover(uv, uRes, uSize0), uZoom0) + d * uProgress;
        vec2 b = zoom(cover(uv, uRes, uSize1), uZoom1) - d * (1.0 - uProgress);
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
