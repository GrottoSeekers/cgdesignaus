// /admin: Ryan signs in and manages workouts and photos.
// Auth, database and file storage are Supabase. Security lives in the
// database rules (supabase/setup.sql); this page is only the interface.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  BUCKET,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  hasBackend,
  isSiteFile,
  mediaUrl,
  movesList,
  type PhotoSlot,
  type SitePhoto,
  type Workout,
} from "../lib/content";

const $ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => el.querySelector<T>(s)!;
const $$ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) =>
  Array.from(el.querySelectorAll<T>(s));

const MAX_VIDEO_MB = 50;
const PHOTO_SLOTS: { slot: PhotoSlot; title: string; note: string; fallback: string }[] = [
  { slot: "hero", title: "Main photo", note: "Top of the page, next to “Get fit.”", fallback: "/media/ryan-hero-720.webp" },
  { slot: "training", title: "Training plan tile", note: "The big tile in “One plan”.", fallback: "/media/gym-thursday.webp" },
  { slot: "portrait", title: "Your portrait", note: "Under your story and the “Ryan, 24/7” tile.", fallback: "/media/ryan-portrait.webp" },
];

/* ---------- Views ---------- */
function show(view: "offline" | "signin" | "reset" | "app") {
  $$("[data-view]").forEach((el) => (el.hidden = el.dataset.view !== view));
  $("[data-signed-in]").hidden = view !== "app";
}

function say(el: HTMLElement, text: string, kind: "" | "error" | "ok" = "") {
  el.textContent = text;
  el.classList.toggle("is-error", kind === "error");
  el.classList.toggle("is-ok", kind === "ok");
}

const friendly = (e: unknown) => {
  const m = e instanceof Error ? e.message : String(e);
  if (/invalid login/i.test(m)) return "That email and password don't match.";
  if (/payload too large|exceeded the maximum/i.test(m)) return `That file is too big. The limit is ${MAX_VIDEO_MB} MB.`;
  if (/failed to fetch|network/i.test(m)) return "No connection. Check your signal and try again.";
  return m;
};

if (!hasBackend) {
  show("offline");
} else {
  start(createClient(SUPABASE_URL, SUPABASE_ANON_KEY));
}

function start(sb: SupabaseClient) {
  /* ---------- Auth ---------- */
  let recovering = false;
  sb.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY") {
      recovering = true;
      show("reset");
      return;
    }
    if (recovering) return;
    if (session) {
      show("app");
      loadWorkouts();
      renderPhotos();
    } else {
      show("signin");
    }
  });

  $<HTMLFormElement>("[data-signin-form]").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const msg = $("[data-signin-msg]");
    const data = new FormData(form);
    say(msg, "Signing in…");
    const { error } = await sb.auth.signInWithPassword({
      email: String(data.get("email")).trim(),
      password: String(data.get("password")),
    });
    if (error) say(msg, friendly(error), "error");
    else say(msg, "");
  });

  $("[data-forgot]").addEventListener("click", async () => {
    const email = $<HTMLInputElement>("[data-signin-form] input[name=email]").value.trim();
    const msg = $("[data-signin-msg]");
    if (!email) return say(msg, "Type your email above first, then tap Forgot password.", "error");
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/admin` });
    if (error) say(msg, friendly(error), "error");
    else say(msg, "Check your email for a link to set a new password.", "ok");
  });

  $<HTMLFormElement>("[data-reset-form]").addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = $("[data-reset-msg]");
    const password = String(new FormData(e.currentTarget as HTMLFormElement).get("password"));
    const { error } = await sb.auth.updateUser({ password });
    if (error) return say(msg, friendly(error), "error");
    recovering = false;
    history.replaceState(null, "", "/admin");
    show("app");
    loadWorkouts();
    renderPhotos();
  });

  $("[data-sign-out]").addEventListener("click", () => sb.auth.signOut());

  /* ---------- Tabs ---------- */
  $$<HTMLButtonElement>("[data-tab-btn]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tabBtn!;
      $$<HTMLButtonElement>("[data-tab-btn]").forEach((b) => b.setAttribute("aria-selected", String(b === btn)));
      $$("[data-tab-panel]").forEach((p) => (p.hidden = p.dataset.tabPanel !== tab));
    })
  );

  /* ---------- Storage helpers ---------- */
  const upload = async (path: string, file: Blob, contentType: string) => {
    const { error } = await sb.storage.from(BUCKET).upload(path, file, { contentType, upsert: true, cacheControl: "31536000" });
    if (error) throw error;
    return path;
  };
  const removeFiles = async (paths: (string | null | undefined)[]) => {
    const mine = paths.filter((p): p is string => !!p && !isSiteFile(p));
    if (mine.length) await sb.storage.from(BUCKET).remove(mine);
  };
  const ext = (file: File, fallback: string) => (file.name.split(".").pop() || fallback).toLowerCase().replace(/[^a-z0-9]/g, "") || fallback;

  /* ---------- Workouts ---------- */
  let workouts: Workout[] = [];
  const list = $("[data-workout-list]");
  const listMsg = $("[data-list-msg]");

  async function loadWorkouts() {
    const { data, error } = await sb.from("workouts").select("*").order("position").order("created_at", { ascending: false });
    if (error) return say(listMsg, friendly(error), "error");
    workouts = data as Workout[];
    renderList();
  }

  function renderList() {
    list.replaceChildren();
    if (!workouts.length) {
      const li = document.createElement("li");
      li.className = "a-empty";
      li.textContent = "No workouts yet. Tap “Add workout” to post your first.";
      list.append(li);
      return;
    }
    workouts.forEach((w, i) => {
      const li = document.createElement("li");
      li.className = `a-item${w.published ? "" : " is-hidden"}`;

      const thumb = document.createElement(w.poster_path ? "img" : "video") as HTMLImageElement | HTMLVideoElement;
      thumb.className = "a-thumb";
      if (thumb instanceof HTMLImageElement) {
        thumb.src = mediaUrl(w.poster_path!);
        thumb.alt = "";
        thumb.loading = "lazy";
      } else {
        thumb.src = `${mediaUrl(w.video_path)}#t=1`;
        thumb.muted = true;
        thumb.preload = "metadata";
      }

      const body = document.createElement("div");
      const h3 = document.createElement("h3");
      h3.textContent = w.name;
      const badge = document.createElement("span");
      badge.className = `a-badge${w.published ? " is-live" : ""}`;
      badge.textContent = w.published ? "Live" : "Hidden";
      h3.append(badge);
      const p = document.createElement("p");
      p.textContent = [w.note, `${movesList(w.moves).length} moves`].filter(Boolean).join(" · ");
      body.append(h3, p);

      const actions = document.createElement("div");
      actions.className = "a-actions";
      const button = (label: string, fn: () => void, opts: { disabled?: boolean; danger?: boolean; aria?: string } = {}) => {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = label;
        if (opts.aria) b.setAttribute("aria-label", opts.aria);
        if (opts.disabled) b.disabled = true;
        if (opts.danger) b.className = "is-danger";
        b.addEventListener("click", fn);
        actions.append(b);
      };
      button("↑", () => move(i, -1), { disabled: i === 0, aria: `Move ${w.name} up` });
      button("↓", () => move(i, 1), { disabled: i === workouts.length - 1, aria: `Move ${w.name} down` });
      button("Edit", () => openForm(w));
      button(w.published ? "Hide" : "Show", () => togglePublished(w));
      button("Delete", () => remove(w), { danger: true });

      li.append(thumb, body, actions);
      list.append(li);
    });
  }

  async function move(i: number, dir: -1 | 1) {
    const a = workouts[i];
    const b = workouts[i + dir];
    if (!a || !b) return;
    // Renumber the whole list so positions are always unique and in order.
    const order = [...workouts];
    order[i] = b;
    order[i + dir] = a;
    say(listMsg, "Saving order…");
    const results = await Promise.all(
      order.map((w, idx) => sb.from("workouts").update({ position: idx + 1 }).eq("id", w.id))
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) return say(listMsg, friendly(failed.error), "error");
    say(listMsg, "Order saved.", "ok");
    loadWorkouts();
  }

  async function togglePublished(w: Workout) {
    const { error } = await sb.from("workouts").update({ published: !w.published }).eq("id", w.id);
    if (error) return say(listMsg, friendly(error), "error");
    say(listMsg, w.published ? `“${w.name}” is hidden from the site.` : `“${w.name}” is live on the site.`, "ok");
    loadWorkouts();
  }

  async function remove(w: Workout) {
    if (!confirm(`Delete “${w.name}”? This can't be undone.`)) return;
    const { error } = await sb.from("workouts").delete().eq("id", w.id);
    if (error) return say(listMsg, friendly(error), "error");
    await removeFiles([w.video_path, w.poster_path]).catch(() => {});
    say(listMsg, `“${w.name}” deleted.`, "ok");
    loadWorkouts();
  }

  /* ---------- Add / edit dialog ---------- */
  const dialog = $<HTMLDialogElement>("[data-workout-dialog]");
  const form = $<HTMLFormElement>("[data-workout-form]");
  const formMsg = $("[data-wd-msg]");
  const saveBtn = $<HTMLButtonElement>("[data-wd-save]");
  const videoInput = $<HTMLInputElement>("input[name=video]", form);
  let editing: Workout | null = null;

  function openForm(w: Workout | null) {
    editing = w;
    form.reset();
    say(formMsg, "");
    $("[data-wd-title]").textContent = w ? "Edit workout" : "Add workout";
    $("[data-video-label]").textContent = w ? `Replace video (optional, up to ${MAX_VIDEO_MB} MB)` : `Video (up to ${MAX_VIDEO_MB} MB)`;
    $("[data-video-hint]").textContent = w ? "Leave empty to keep the current video." : "Pick a short clip from your phone.";
    videoInput.required = !w;
    const set = (name: string, value: string) => ((form.elements.namedItem(name) as HTMLInputElement).value = value);
    if (w) {
      set("name", w.name);
      set("note", w.note);
      set("moves", w.moves);
      set("instagram_url", w.instagram_url ?? "");
      (form.elements.namedItem("published") as HTMLInputElement).checked = w.published;
    }
    saveBtn.disabled = false;
    dialog.showModal();
  }

  $("[data-new-workout]").addEventListener("click", () => openForm(null));
  $("[data-wd-cancel]").addEventListener("click", () => dialog.close());

  videoInput.addEventListener("change", () => {
    const f = videoInput.files?.[0];
    if (f && f.size > MAX_VIDEO_MB * 1024 * 1024) {
      say(formMsg, `That video is ${(f.size / 1048576).toFixed(0)} MB. The limit is ${MAX_VIDEO_MB} MB: trim it, or share it at a lower quality.`, "error");
      videoInput.value = "";
    } else say(formMsg, "");
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const name = String(data.get("name")).trim();
    const ig = String(data.get("instagram_url") || "").trim();
    if (ig && !/^https:\/\/(www\.)?instagram\.com\//.test(ig)) {
      return say(formMsg, "The Instagram link should start with https://www.instagram.com/", "error");
    }
    const file = videoInput.files?.[0] ?? null;
    if (!editing && !file) return say(formMsg, "Pick a video first.", "error");

    saveBtn.disabled = true;
    try {
      const row: Partial<Workout> = {
        name,
        note: String(data.get("note") || "").trim(),
        moves: movesList(String(data.get("moves") || "")).join("\n"),
        instagram_url: ig || null,
        published: data.get("published") === "on",
      };
      const old = editing ? { video: editing.video_path, poster: editing.poster_path } : null;

      if (file) {
        const id = crypto.randomUUID();
        say(formMsg, "Uploading video… keep this page open.");
        row.video_path = await upload(`workouts/${id}/video.${ext(file, "mp4")}`, file, file.type || "video/mp4");
        say(formMsg, "Making a cover image…");
        const poster = await posterFrom(file).catch(() => null);
        row.poster_path = poster ? await upload(`workouts/${id}/poster.jpg`, poster, "image/jpeg") : null;
      }

      say(formMsg, "Saving…");
      if (editing) {
        const { error } = await sb.from("workouts").update(row).eq("id", editing.id);
        if (error) throw error;
        if (file && old) await removeFiles([old.video, old.poster]).catch(() => {});
      } else {
        // New workouts go to the top.
        row.position = (workouts[0]?.position ?? 1) - 1;
        const { error } = await sb.from("workouts").insert(row);
        if (error) throw error;
      }
      dialog.close();
      say(listMsg, `“${name}” saved. It's on the site now.`, "ok");
      loadWorkouts();
    } catch (err) {
      say(formMsg, friendly(err), "error");
      saveBtn.disabled = false;
    }
  });

  /* ---------- Photos ---------- */
  async function renderPhotos() {
    const grid = $("[data-photo-grid]");
    const { data } = await sb.from("site_photos").select("*");
    const current = new Map((data as SitePhoto[] | null)?.map((p) => [p.slot, p]) ?? []);
    grid.replaceChildren(
      ...PHOTO_SLOTS.map(({ slot, title, note, fallback }) => {
        const saved = current.get(slot);
        const card = document.createElement("div");
        card.className = "a-photo";
        const img = document.createElement("img");
        img.alt = "";
        img.src = saved ? `${mediaUrl(saved.path)}?v=${encodeURIComponent(saved.updated_at)}` : fallback;
        const body = document.createElement("div");
        const h3 = document.createElement("h3");
        h3.textContent = title;
        const p = document.createElement("p");
        p.className = "a-muted";
        p.textContent = note;
        const msg = document.createElement("p");
        msg.className = "a-msg";
        msg.setAttribute("role", "status");
        const actions = document.createElement("div");
        actions.className = "a-actions";

        const label = document.createElement("label");
        label.className = "a-upload";
        label.textContent = "Replace photo";
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        label.append(input);
        actions.append(label);

        input.addEventListener("change", async () => {
          const file = input.files?.[0];
          if (!file) return;
          try {
            say(msg, "Resizing…");
            const jpeg = await resizePhoto(file, 1600);
            say(msg, "Uploading…");
            const path = await upload(`photos/${slot}-${Date.now()}.jpg`, jpeg, "image/jpeg");
            const { error } = await sb.from("site_photos").upsert({ slot, path, updated_at: new Date().toISOString() });
            if (error) throw error;
            if (saved) await removeFiles([saved.path]).catch(() => {});
            renderPhotos();
          } catch (err) {
            say(msg, friendly(err), "error");
          }
        });

        if (saved) {
          const reset = document.createElement("button");
          reset.type = "button";
          reset.textContent = "Use original";
          reset.addEventListener("click", async () => {
            if (!confirm(`Put the original ${title.toLowerCase()} back?`)) return;
            const { error } = await sb.from("site_photos").delete().eq("slot", slot);
            if (error) return say(msg, friendly(error), "error");
            await removeFiles([saved.path]).catch(() => {});
            renderPhotos();
          });
          actions.append(reset);
        }

        body.append(h3, p, actions, msg);
        card.append(img, body);
        return card;
      })
    );
  }
}

/* ---------- Media helpers (run on Ryan's phone before upload) ---------- */

/** A JPEG still from about a second into the video, used as the cover. */
function posterFrom(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.muted = true;
    v.playsInline = true;
    v.preload = "auto";
    v.src = url;
    const fail = () => {
      URL.revokeObjectURL(url);
      reject(new Error("no poster"));
    };
    const timer = setTimeout(fail, 15000);
    v.addEventListener("error", fail, { once: true });
    v.addEventListener(
      "loadedmetadata",
      () => {
        v.currentTime = Math.min(1, (v.duration || 2) / 3);
      },
      { once: true }
    );
    v.addEventListener(
      "seeked",
      () => {
        clearTimeout(timer);
        const w = 540;
        const h = Math.round((v.videoHeight / v.videoWidth) * w) || 960;
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        c.getContext("2d")!.drawImage(v, 0, 0, w, h);
        URL.revokeObjectURL(url);
        c.toBlob((b) => (b ? resolve(b) : reject(new Error("no poster"))), "image/jpeg", 0.82);
      },
      { once: true }
    );
  });
}

/** Shrink a photo so its longest side is at most `max` px, as JPEG. */
async function resizePhoto(file: File, max: number): Promise<Blob> {
  const img = await createImageBitmap(file, { imageOrientation: "from-image" }).catch(async () => {
    // Older Safari: fall back to an <img> element.
    const url = URL.createObjectURL(file);
    const el = new Image();
    el.src = url;
    await el.decode();
    return el;
  });
  const w0 = "naturalWidth" in img ? img.naturalWidth : img.width;
  const h0 = "naturalHeight" in img ? img.naturalHeight : img.height;
  const scale = Math.min(1, max / Math.max(w0, h0));
  const c = document.createElement("canvas");
  c.width = Math.round(w0 * scale);
  c.height = Math.round(h0 * scale);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return new Promise((resolve, reject) =>
    c.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't read that photo. Try a JPEG."))), "image/jpeg", 0.85)
  );
}
