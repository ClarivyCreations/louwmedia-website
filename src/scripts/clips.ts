/**
 * S23b · Shoot day in beeld (blocks/ShootdayClips.astro). While the section is
 * in view the moments take turns: each one runs for a few seconds (the red bar
 * under it fills), then the next wipes in from the right on the brand slant.
 * A click on a moment jumps there. Videos load once they are about to show and
 * play muted, without sound or a play button (Max 2026-11-22).
 * Reduced motion: no turns and no wipe, a click just switches.
 */
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const DURATION = 6000;

document.querySelectorAll<HTMLElement>("[data-clips]").forEach((root) => {
	const layers = [...root.querySelectorAll<HTMLElement>("[data-clip]")];
	const items = [...root.querySelectorAll<HTMLButtonElement>("[data-clips-go]")];
	const tag = root.querySelector<HTMLElement>("[data-clips-tag]");
	if (layers.length < 1) return;

	let cur = 0;
	let start = 0;
	let elapsed = 0;
	let inView = false;
	let raf = 0;

	const videoOf = (i: number) => layers[i]?.querySelector<HTMLVideoElement>("video") ?? null;
	const load = (i: number) => {
		const v = videoOf(i);
		if (v && !v.src && v.dataset.src) {
			v.src = v.dataset.src;
			v.addEventListener("playing", () => v.classList.add("is-on"), { once: true });
		}
		return v;
	};
	const runVideo = (i: number) => {
		const v = load(i);
		if (v && !reduce) v.play().catch(() => {});
	};

	const setTag = (i: number) => {
		const text = layers[i].dataset.time ?? "";
		const node = tag?.lastChild;
		if (node && node.nodeType === Node.TEXT_NODE) node.textContent = text;
	};

	const go = (n: number) => {
		n = (n + layers.length) % layers.length;
		if (n === cur) return;
		const prev = cur;
		const next = layers[n];
		cur = n;
		elapsed = 0;
		start = performance.now();

		next.classList.remove("is-in", "is-wiping");
		// the shown one under the incoming one, the rest below (stays under the shade and labels)
		layers.forEach((l, i) => (l.style.zIndex = i === n ? "2" : i === prev ? "1" : "0"));
		runVideo(n);
		const done = () => {
			layers.forEach((l, i) => {
				if (i !== cur) {
					l.classList.remove("is-in", "is-wiping", "is-current");
					videoOf(i)?.pause();
				}
			});
		};
		if (reduce) {
			next.classList.add("is-in");
			done();
		} else {
			void next.offsetWidth; // start from the closed shape
			next.classList.add("is-wiping", "is-in");
			// only the layer's own wipe, not a video fading in inside it
			const end = (e: TransitionEvent) => {
				if (e.target !== next || e.propertyName !== "clip-path") return;
				next.removeEventListener("transitionend", end);
				if (layers[cur] === next) done();
			};
			next.addEventListener("transitionend", end);
		}
		next.classList.add("is-current");
		layers[prev].classList.remove("is-current");

		items.forEach((b, i) => {
			b.classList.toggle("is-current", i === n);
			b.setAttribute("aria-pressed", i === n ? "true" : "false");
			b.style.setProperty("--p", "0");
		});
		setTag(n);
	};

	const tick = (now: number) => {
		raf = 0;
		if (!inView || reduce) return;
		elapsed = now - start;
		const p = Math.min(elapsed / DURATION, 1);
		items[cur]?.style.setProperty("--p", String(p));
		if (p > 0.6) load((cur + 1) % layers.length);
		if (p >= 1) go(cur + 1);
		raf = requestAnimationFrame(tick);
	};
	const loop = () => {
		if (!raf) raf = requestAnimationFrame(tick);
	};

	items.forEach((b, i) => b.addEventListener("click", () => (i === cur ? undefined : (go(i), loop()))));

	new IntersectionObserver(
		([e]) => {
			inView = e.isIntersecting;
			const v = videoOf(cur);
			if (inView) {
				start = performance.now() - elapsed;
				runVideo(cur);
				loop();
			} else {
				v?.pause();
			}
		},
		{ threshold: 0.35 },
	).observe(root);
});

// a module, so its top-level names stay its own
export {};
