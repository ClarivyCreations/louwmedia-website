/**
 * S10c · Review carousel (blocks/Quote.astro, lm_quote with "more" reviews).
 * The arrows, a swipe or the arrow keys move
 * it; it loops. The new photo wipes in on the brand slant (from the right going
 * forward, from the left going back), the text fades over and the marker word
 * draws itself again. Reduced motion: it just switches.
 */
import { drawScribbles } from "./scribbles";

document.querySelectorAll<HTMLElement>("[data-quotes]").forEach((root) => {
	const photos = [...root.querySelectorAll<HTMLElement>("[data-quote-photo]")];
	const slides = [...root.querySelectorAll<HTMLElement>("[data-quote-slide]")];
	const n = slides.length;
	if (n < 2) return;
	let cur = 0;

	// the wiped-in photo becomes the only one showing
	const settle = (inc: HTMLElement) => {
		photos.forEach((p) => p.classList.toggle("is-current", p === inc));
		inc.classList.remove("is-in", "from-left");
	};

	const go = (step: 1 | -1) => {
		const next = (cur + step + n) % n;
		const inc = photos[next];
		if (inc) {
			// a wipe still running (fast clicks) becomes the photo underneath
			photos.forEach((p) => {
				if (p.classList.contains("is-in")) p.classList.add("is-current");
				p.classList.remove("is-in", "from-left");
			});
			inc.classList.toggle("from-left", step < 0);
			void inc.offsetWidth; // restart the wipe
			inc.classList.add("is-in");
			if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) settle(inc);
			else
				inc.addEventListener(
					"animationend",
					() => {
						if (photos[cur] === inc) settle(inc);
					},
					{ once: true },
				);
		}
		slides.forEach((s, i) => {
			const on = i === next;
			s.classList.toggle("is-current", on);
			s.toggleAttribute("inert", !on);
			if (on) s.removeAttribute("aria-hidden");
			else s.setAttribute("aria-hidden", "true");
		});
		cur = next;
		drawScribbles(slides[next], 0.45);
	};

	root.querySelectorAll("[data-prev]").forEach((b) => b.addEventListener("click", () => go(-1)));
	root.querySelectorAll("[data-next]").forEach((b) => b.addEventListener("click", () => go(1)));

	root.addEventListener("keydown", (e) => {
		if (e.key === "ArrowLeft") go(-1);
		else if (e.key === "ArrowRight") go(1);
	});

	// swipe on touch screens
	let x0 = 0;
	let y0 = 0;
	root.addEventListener(
		"touchstart",
		(e) => {
			x0 = e.touches[0].clientX;
			y0 = e.touches[0].clientY;
		},
		{ passive: true },
	);
	root.addEventListener(
		"touchend",
		(e) => {
			const dx = e.changedTouches[0].clientX - x0;
			const dy = e.changedTouches[0].clientY - y0;
			if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
		},
		{ passive: true },
	);
});
