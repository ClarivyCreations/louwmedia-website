/**
 * Louwmedia motion: preloader, hero intros and scroll reveals (GSAP).
 *
 * Order on the first page of a visit:
 *   1. preloader: white screen, logo mark slides in, letters rise one by one
 *   2. letters leave, the white screen fades away
 *   3. hero intro, depending on the hero block on the page:
 *      - data-hero="split": the slanted photos slide in from the left to their place,
 *        then the header, the headline lines and the rest
 *      - data-hero="video": a thin strip grows into a card, then into the full
 *        screen (after the Rietdekker Bouman hero), then the text
 * Later pages in the same visit skip the preloader, and with it the video's
 * strip-to-full-screen intro; every page view still gets the short entrance of
 * its hero (header, headline lines, text, photos) and all scroll reveals (Max).
 * With prefers-reduced-motion everything is shown at once.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { drawScribbles, prepScribbles } from "./scribbles";
import "./reels";
import "./cases";
import "./faq";
import "./lazy-video";
import "./clips";
import "./quotes";
import "./arc";
import "./contact";
import { showreel } from "./showreel";

gsap.registerPlugin(ScrollTrigger);

const root = document.documentElement;
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const $ = <T extends Element = HTMLElement>(sel: string, scope: ParentNode = document) => scope.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string, scope: ParentNode = document) => [...scope.querySelectorAll<T>(sel)];

/* ---------- Split a heading into lines, keeping <em> and marker spans whole ---------- */
const originals = new WeakMap<HTMLElement, string>();

export function splitLines(el: HTMLElement): HTMLElement[] {
	if (el.dataset.split) return $$(":scope > .rl > span", el);
	originals.set(el, el.innerHTML);
	const units: Node[] = [];
	for (const node of [...el.childNodes]) {
		if (node.nodeType === Node.TEXT_NODE) {
			for (const part of (node.textContent ?? "").split(/(\s+)/)) {
				if (!part) continue;
				if (/^\s+$/.test(part)) units.push(document.createTextNode(" "));
				else {
					const w = document.createElement("span");
					w.textContent = part;
					units.push(w);
				}
			}
		} else units.push(node);
	}
	el.textContent = "";
	units.forEach((u) => el.appendChild(u));
	const rows: Node[][] = [];
	let top: number | null = null;
	for (const u of units) {
		if (u.nodeType === Node.TEXT_NODE) {
			rows.at(-1)?.push(u);
			continue;
		}
		const t = (u as HTMLElement).offsetTop;
		if (top === null || Math.abs(t - top) > 4) {
			rows.push([]);
			top = t;
		}
		rows.at(-1)!.push(u);
	}
	el.textContent = "";
	const inners = rows.map((row) => {
		const outer = document.createElement("span");
		outer.className = "rl";
		const inner = document.createElement("span");
		row.forEach((n) => inner.appendChild(n));
		outer.appendChild(inner);
		el.appendChild(outer);
		return inner;
	});
	el.dataset.split = "1";
	return inners;
}

/**
 * Once the lines have risen, put the heading back as normal text: no masks
 * cutting off marker strokes, and it wraps again when the window changes size.
 */
function unmask(lines: HTMLElement[]) {
	const el = lines[0]?.closest<HTMLElement>("[data-split]");
	const html = el ? originals.get(el) : undefined;
	if (!el || html === undefined) return;
	el.innerHTML = html;
	el.removeAttribute("data-split");
	drawScribbles(el); // the marker or circle is drawn once its line is up
}

/* ---------- 1. Preloader ---------- */
function preloader(): gsap.core.Timeline | null {
	const el = $("[data-preloader]");
	if (!el || !root.classList.contains("is-preload")) return null;
	const chars = $$(".pl__ch", el);
	const mark = $(".pl__mark", el);
	const dot = $(".pl__dot", el);
	const ring = $(".pl__ring", el);
	const meta = $(".pl__meta", el);
	const count = $("[data-preload-count]", el);
	const counter = { v: 0 };

	gsap.set(chars, { y: 104 });
	gsap.set(mark, { x: -124 });
	gsap.set([dot, ring], { scale: 0, transformOrigin: "50% 50%" });
	gsap.set(meta, { autoAlpha: 0 });

	const tl = gsap.timeline();
	tl.to(meta, { autoAlpha: 1, duration: 0.3 }, 0)
		.to(counter, {
			v: 100,
			duration: 1.5,
			ease: "power2.inOut",
			onUpdate: () => {
				if (count) count.textContent = String(Math.round(counter.v)).padStart(2, "0");
			},
		}, 0)
		.to(mark, { x: 0, duration: 0.8, ease: "expo.out" }, 0.1)
		.to(dot, { scale: 1, duration: 0.45, ease: "back.out(3)" }, 0.55)
		.to(ring, { scale: 1, duration: 0.7, ease: "expo.out" }, 0.62)
		.to(chars, { y: 0, duration: 0.9, stagger: 0.05, ease: "expo.out" }, 0.28)
		// hold, then leave: letters up and out, mark back to the left
		.to(chars, { y: -104, duration: 0.55, stagger: 0.03, ease: "expo.in" }, "+=0.35")
		.to(mark, { x: -124, duration: 0.55, ease: "expo.in" }, "<0.08")
		.to(meta, { autoAlpha: 0, duration: 0.3 }, "<");
	return tl;
}

/* ---------- 3a. Hero with slanted photos ---------- */
function introSplit(section: HTMLElement, tl: gsap.core.Timeline, at: number | string) {
	const photos = $$("[data-intro=photo]", section);
	const title = $("h1", section)!;
	const lines = splitLines(title);
	const rest = $$("[data-intro=rest]", section);
	const note = $("[data-intro=note]", section);
	const header = $("[data-intro=header]");

	// Each photo starts just left of the screen, so it travels across the page to its place.
	photos.forEach((p) => {
		const r = p.getBoundingClientRect();
		gsap.set(p, { x: -(r.right + 120) });
	});
	gsap.set(lines, { yPercent: 112 });
	gsap.set(rest, { autoAlpha: 0, y: 18 });
	if (header) gsap.set(header, { autoAlpha: 0, y: -14 });
	if (note) gsap.set(note, { autoAlpha: 0, clipPath: "inset(0 100% 0 0)" });

	tl.addLabel("hero", at)
		.to(photos, { x: 0, duration: 1.55, stagger: 0.14, ease: "expo.out" }, "hero")
		.to(header, { autoAlpha: 1, y: 0, duration: 0.7, ease: "power2.out" }, "hero+=0.75")
		.to(lines, { yPercent: 0, duration: 1, stagger: 0.1, ease: "power4.out", onComplete: () => unmask(lines) }, "hero+=0.8")
		.to(rest, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.08, ease: "power2.out" }, "hero+=1.05")
		.to(note, { autoAlpha: 1, clipPath: "inset(0 0% 0 0)", duration: 0.7, ease: "power2.out" }, "hero+=1.5")
		.add(() => photos.forEach((p) => gsap.set(p, { clearProps: "x" })));
}

/* ---------- 3b. Hero with a full video (after Rietdekker Bouman) ---------- */
function introVideo(section: HTMLElement, tl: gsap.core.Timeline, at: number | string) {
	const frame = $(".hv__frame", section)!;
	const media = $("[data-intro=media]", section)!;
	const inner = $$(".hv__video, .hv__poster", media);
	const shade = $("[data-intro=shade]", section);
	const ui = $("[data-intro=ui]", section);
	const lines = splitLines($("h1", section)!);
	const rest = $$("[data-intro=rest]", section);
	const header = $("[data-intro=header]");

	const W = frame.clientWidth;
	const H = frame.clientHeight;
	const mobile = W < 600;
	const strip = { w: mobile ? 44 : 64, h: H * (mobile ? 0.32 : 0.36) };
	const card = { w: Math.min(mobile ? 200 : 300, W * 0.7), h: H * (mobile ? 0.42 : 0.46) };
	const box = { ...strip, r: 4 };
	const apply = () => {
		const t = Math.max(0, (H - box.h) / 2);
		const l = Math.max(0, (W - box.w) / 2);
		media.style.clipPath = `inset(${t}px ${l}px ${t}px ${l}px round ${box.r}px)`;
	};
	apply();
	gsap.set(inner, { scale: 1.35 });
	gsap.set([shade, ui], { autoAlpha: 0 });
	gsap.set(lines, { yPercent: 112 });
	gsap.set(rest, { autoAlpha: 0, y: 18 });
	if (header) gsap.set(header, { autoAlpha: 0, y: -14 });

	tl.addLabel("hero", at)
		.to(box, { w: card.w, h: card.h, r: 6, duration: 0.8, ease: "power3.inOut", onUpdate: apply }, "hero")
		.to(inner, { scale: 1.18, duration: 0.8, ease: "power3.inOut" }, "hero")
		.to(box, { w: W, h: H, r: 0, duration: 1.15, ease: "expo.inOut", onUpdate: apply }, "hero+=0.92")
		.to(inner, { scale: 1, duration: 1.15, ease: "expo.inOut" }, "<")
		.to(shade, { autoAlpha: 1, duration: 0.6, ease: "power1.out" }, "-=0.45")
		.to(ui, { autoAlpha: 1, duration: 0.5 }, "<0.1")
		.to(header, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out" }, "-=0.35")
		.to(lines, { yPercent: 0, duration: 0.9, stagger: 0.1, ease: "power4.out", onComplete: () => unmask(lines) }, "-=0.45")
		.to(rest, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.08, ease: "power2.out" }, "-=0.55")
		.add(() => {
			media.style.clipPath = "";
		});
}

/* ---------- 3c. Short hero entrance, on every page view ---------- */
// The slanted-photo hero, and the video hero when the preloader did not run:
// the header drops in, the headline lines rise, the rest fades up and the
// photos drift in a little from the left while they fade in, slowly (Max).
function introSimple(section: HTMLElement, tl: gsap.core.Timeline, at: number | string) {
	// data-split="off": the hero animates its own lines (the showreel hero, whose card sits in the h1)
	const title = section.dataset.split === "off" ? null : $("h1", section);
	const lines = title ? splitLines(title) : [];
	const rest = $$("[data-intro=rest]", section);
	const photos = $$("[data-intro=photo]", section);
	const note = $("[data-intro=note]", section);
	const media = $("[data-intro=media]", section);
	const fades = $$("[data-intro=shade], [data-intro=ui]", section);
	const header = $("[data-intro=header]");

	gsap.set(lines, { yPercent: 112 });
	gsap.set(rest, { autoAlpha: 0, y: 18 });
	gsap.set(photos, { autoAlpha: 0, x: -40 });
	if (note) gsap.set(note, { autoAlpha: 0, clipPath: "inset(0 100% 0 0)" });
	if (media) gsap.set(media, { autoAlpha: 0, scale: 1.06 });
	gsap.set(fades, { autoAlpha: 0 });
	if (header) gsap.set(header, { autoAlpha: 0, y: -14 });

	tl.addLabel("hero", at)
		.to(media, { autoAlpha: 1, scale: 1, duration: 1.2, ease: "expo.out" }, "hero")
		.to(fades, { autoAlpha: 1, duration: 0.6, ease: "power1.out" }, "hero+=0.1")
		.to(photos, { autoAlpha: 1, x: 0, duration: 1.8, stagger: 0.15, ease: "power3.out" }, "hero")
		.to(header, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out" }, "hero")
		.to(lines, { yPercent: 0, duration: 1, stagger: 0.1, ease: "power4.out", onComplete: () => unmask(lines) }, "hero+=0.1")
		.to(rest, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.08, ease: "power2.out" }, "hero+=0.4")
		.to(note, { autoAlpha: 1, clipPath: "inset(0 0% 0 0)", duration: 0.7, ease: "power2.out" }, "hero+=0.9")
		.add(() => {
			gsap.set([...photos, ...(media ? [media] : [])], { clearProps: "transform,opacity,visibility" });
		});
}

/* ---------- Timecode in the video hero ---------- */
function timecode() {
	const out = $("[data-timecode]");
	const video = $<HTMLVideoElement>(".hv__video");
	if (!out || !video) return;
	const two = (n: number) => String(Math.floor(n)).padStart(2, "0");
	const tick = () => {
		const t = video.currentTime;
		out.textContent = `${two(t / 3600)}:${two((t / 60) % 60)}:${two(t % 60)}:${two((t % 1) * 25)}`;
		requestAnimationFrame(tick);
	};
	tick();
}

/* ---------- Scroll reveals ---------- */
/* ---------- How it works: the playhead runs along the timeline while scrolling ---------- */
function processes() {
	$$("[data-process]").forEach((tl) => {
		const steps = $$("[data-step]", tl);
		const clips = steps.map((s) => $(".pr__clip", s)!);
		const head = $("[data-playhead]", tl);
		if (!head || !clips.length) return;
		const upright = window.matchMedia("(max-width: 699px)");
		const place = (p: number) => {
			const box = tl.getBoundingClientRect();
			const rs = clips.map((c) => c.getBoundingClientRect());
			let at: number;
			let active = 0;
			if (upright.matches) {
				// mobile: a short line across the timecodes and clip bars, moving down
				const y0 = rs[0].top - box.top;
				const y1 = rs.at(-1)!.bottom - box.top;
				at = y0 + (y1 - y0) * p;
				head.style.transform = `translate(0, ${at}px)`;
				head.style.width = `${rs[0].right - box.left}px`;
				head.style.height = "";
				rs.forEach((r, i) => r.top - box.top <= at && (active = i));
			} else {
				// desktop: a vertical line over the clips, moving right
				const x0 = rs[0].left - box.left;
				const x1 = rs.at(-1)!.right - box.left;
				at = x0 + (x1 - x0) * p;
				head.style.transform = `translate(${at}px, ${rs[0].top - box.top - 18}px)`;
				head.style.height = `${rs[0].height + 36}px`;
				head.style.width = "";
				rs.forEach((r, i) => r.left - box.left <= at && (active = i));
			}
			steps.forEach((s, i) => s.toggleAttribute("data-on", i === active));
		};
		const state = { p: 0 };
		place(0);
		if (reduce) return;
		gsap.to(state, {
			p: 1,
			ease: "none",
			onUpdate: () => place(state.p),
			scrollTrigger: { trigger: tl, start: "top 85%", end: "bottom 20%", scrub: 0.5, onRefresh: () => place(state.p) },
		});
		upright.addEventListener("change", () => place(state.p));
	});
}

function reveals() {
	if (reduce) return processes();
	$$("[data-reveal='lines']").forEach((el) => {
		if (el.closest("[data-hero]")) return;
		const parts = splitLines(el);
		gsap.from(parts, { yPercent: 108, duration: 1, stagger: 0.08, ease: "power4.out", onComplete: () => unmask(parts), scrollTrigger: { trigger: el, start: "top 86%" } });
	});
	$$("[data-reveal='']").forEach((el) => {
		gsap.from(el, { autoAlpha: 0, y: 24, duration: 0.8, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 90%" } });
	});
	$$("[data-reveal='photo']").forEach((el) => {
		const img = $("img", el);
		gsap.fromTo(el, { clipPath: `inset(14% 0 0 0 round 10px)` }, { clipPath: "inset(0% 0 0 0 round 10px)", duration: 1.3, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 85%" } });
		if (img) gsap.fromTo(img, { scale: 1.12 }, { scale: 1, duration: 1.6, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 85%" } });
	});
	// Diensten (from the current site): the section pins and each photo peels up
	// and out of the frame, showing the next one underneath; then the page moves on.
	$$("[data-services]").forEach((section) => {
		const slides = $$("[data-services-slide]", section);
		if (slides.length < 2) return;
		const tl = gsap.timeline({
			scrollTrigger: { trigger: section, start: "top top", end: () => "+=" + (slides.length - 1) * window.innerHeight * 0.9, scrub: true, pin: true, anticipatePin: 1, invalidateOnRefresh: true },
		});
		slides.slice(0, -1).forEach((slide) => tl.to(slide, { yPercent: -100, ease: "none" }));
		// A white section next (lm_process): the page fades from paper to white
		// while the photos peel away, so that section is on white when it arrives.
		const sections = $$("section");
		const next = sections[sections.indexOf(section) + 1];
		if (next?.dataset.pageBg === "white") {
			tl.fromTo(root, { "--page-bg": "#f3f3f3" }, { "--page-bg": "#ffffff", ease: "none", duration: tl.duration() }, 0);
		}
	});

	// Stacking service cards (ServicesStack.astro): while the next card slides over,
	// the one underneath tips back in 3D (narrower at the top), shrinks and darkens.
	$$("[data-services-stack]").forEach((section) => {
		const items = $$("[data-stack-item]", section);
		items.slice(0, -1).forEach((item, i) => {
			const card = $("[data-stack-card]", item)!;
			const next = items[i + 1];
			// tip back the whole way; once it is nearly covered it fades out completely (Max)
			gsap
				.timeline({
					scrollTrigger: { trigger: next, start: "top bottom", end: () => `top ${parseFloat(getComputedStyle(next).top) || 100}px`, scrub: true, invalidateOnRefresh: true },
				})
				.fromTo(card, { rotateX: 0, scale: 1, "--dim": 0 }, { rotateX: 14, scale: 0.9, "--dim": 0.35, ease: "none", duration: 1 }, 0)
				.fromTo(card, { autoAlpha: 1 }, { autoAlpha: 0, ease: "power1.in", duration: 0.3 }, 0.7);
		});
		// a white section next (lm_process): fade the page to white while the cards stack
		const sections = $$("section");
		const after = sections[sections.indexOf(section) + 1];
		if (after?.dataset.pageBg === "white") {
			gsap.fromTo(root, { "--page-bg": "#f3f3f3" }, { "--page-bg": "#ffffff", ease: "none", scrollTrigger: { trigger: section, start: "top top", end: "bottom 60%", scrub: true } });
		}
	});

	// Scribbles outside a line-revealed heading draw when they scroll into view.
	$$("[data-scribble]").forEach((el) => {
		if (el.closest("[data-reveal='lines'], [data-hero] h1")) return;
		ScrollTrigger.create({ trigger: el, start: "top 85%", once: true, onEnter: () => drawScribbles(el, 0.3) });
	});

	// A cut-out photo that lags a little behind the text (the camera in the closer, as on the old site).
	$$("[data-parallax]").forEach((el) => {
		gsap.fromTo(el, { y: 70 }, { y: -50, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
	});

	// Editor timeline (lm_edit): the playhead runs over the clips while scrolling, the
	// timecode counts along (25 fps, 24 s ruler) and the clip under it is selected.
	$$("[data-edit-timeline]").forEach((tl) => {
		const head = $("[data-edit-head]", tl);
		const tc = $("[data-edit-tc]", tl);
		const clips = $$("[data-edit-clip]", tl).map((c) => ({ el: c, from: parseFloat(c.style.left) / 100, to: (parseFloat(c.style.left) + parseFloat(c.style.width)) / 100 }));
		if (!head) return;
		const two = (n: number) => String(Math.floor(n)).padStart(2, "0");
		const set = (p: number) => {
			head.style.setProperty("--p", p.toFixed(4));
			const s = p * 24;
			if (tc) tc.textContent = `00:00:${two(s)}:${two((s % 1) * 25)}`;
			clips.forEach((c) => c.el.classList.toggle("is-sel", p >= c.from && p < c.to));
		};
		const state = { p: 0.06 };
		set(state.p);
		gsap.to(state, {
			p: 0.94,
			ease: "none",
			onUpdate: () => set(state.p),
			scrollTrigger: { trigger: tl, start: "top 85%", end: "bottom 25%", scrub: 0.6 },
		});
	});

	// Last: its trigger must come after the services pin, so it counts the pinned scroll.
	processes();
}

/* ---------- Boot ---------- */
async function boot() {
	const done = () => root.classList.remove("is-preload", "is-intro");
	const hero = $("[data-hero]");
	const heroImgs = hero ? $$<HTMLImageElement>("img", hero).slice(0, 2) : [];
	await Promise.race([
		Promise.all([document.fonts.ready, ...heroImgs.map((i) => i.decode().catch(() => {}))]),
		wait(2500),
	]);
	timecode();
	prepScribbles(); // before the headings are split: their snapshot keeps the scribbles hidden
	// Came in through the page transition: the hero entrance waits until the wipe is done (Max).
	const transition = (window as unknown as { __lmTransition?: { finished: Promise<void> } }).__lmTransition;
	if (transition) await Promise.race([transition.finished.catch(() => {}), wait(1500)]);

	if (reduce) {
		done();
		showreel();
		reveals();
		return;
	}

	const tl = gsap.timeline({ onComplete: () => ScrollTrigger.refresh() });
	(window as unknown as { __lmIntro: gsap.core.Timeline }).__lmIntro = tl; // for scrubbing while designing
	const pre = preloader();
	let heroAt: number | string = 0.15;
	if (pre) {
		tl.add(pre, 0);
		tl.to("[data-preloader]", { autoAlpha: 0, duration: 0.4, ease: "power1.out" }, ">-0.1");
		heroAt = ">-0.15";
		try {
			sessionStorage.setItem("lm-seen", "1");
		} catch {}
	}

	// The video hero's strip-to-full-screen intro belongs to the preloader (Max): only on
	// the first page of a visit. Every other page view, and the slanted-photo hero
	// always, gets the short entrance. introSplit (the long slide-in) stays unused.
	void introSplit;
	if (hero?.dataset.hero === "video" && pre) introVideo(hero, tl, heroAt);
	else if (hero) introSimple(hero, tl, heroAt);
	else tl.from("[data-intro=header]", { autoAlpha: 0, y: -14, duration: 0.6, ease: "power2.out" }, heroAt);

	// Start states are set: show the page under the (still white) preloader.
	root.classList.remove("is-intro");
	tl.add(() => root.classList.remove("is-preload"));
	showreel(); // pins the showreel hero; first, so later triggers count it
	reveals();
}

boot();
