/**
 * Reels carousel (blocks/Reels.astro): the active reel sits in the middle at
 * full size and plays muted; the others shrink and dim the further they are
 * from it. Arrows, a swipe, a click on a side reel or the arrow keys move it.
 * It loops: the reels form a ring, so you can keep going in either direction.
 * Only the active video loads and plays, and only while the section is in view.
 */
import gsap from "gsap";

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const SCALE = [1, 0.6, 0.46, 0.4]; // by distance from the middle (Max: side reels smaller)
const FADE = [1, 0.5, 0.28, 0.18];

const fmt = (t: number) => `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

document.querySelectorAll<HTMLElement>("[data-reels]").forEach((section) => {
	const stage = section.querySelector<HTMLElement>("[data-stage]")!;
	const cards = [...section.querySelectorAll<HTMLElement>("[data-card]")];
	const prev = section.querySelector<HTMLButtonElement>("[data-prev]")!;
	const next = section.querySelector<HTMLButtonElement>("[data-next]")!;
	const capTitle = section.querySelector<HTMLElement>("[data-cap-title]")!;
	const capMeta = section.querySelector<HTMLElement>("[data-cap-meta]")!;
	const count = JSON.parse(section.querySelector("[data-count]")?.textContent || '"00"');
	let active = Math.floor((cards.length - 1) / 2);
	let swiped = false;
	let inView = false;

	const n = cards.length;
	const lastD = new Map<HTMLElement, number>();
	// distance from the active reel around the ring: -n/2 … n/2
	const ringD = (i: number) => {
		let d = (((i - active) % n) + n) % n;
		if (d > n / 2) d -= n;
		return d;
	};
	const scaleAt = (d: number) => SCALE[Math.min(Math.abs(d), SCALE.length - 1)];
	const fadeAt = (d: number) => FADE[Math.min(Math.abs(d), FADE.length - 1)];

	function layout(animate: boolean) {
		const w = cards[0].offsetWidth;
		const gap = window.innerWidth < 700 ? 14 : 24;
		cards.forEach((card, i) => {
			const d = ringD(i);
			// distance from the middle: half the big one, then each smaller one in turn
			let x = 0;
			for (let k = 1; k <= Math.abs(d); k++) {
				x += (k === 1 ? w / 2 : (w * scaleAt(k - 1)) / 2) + gap + (w * scaleAt(k)) / 2;
			}
			const props = { x: Math.sign(d) * x, scale: scaleAt(d), autoAlpha: fadeAt(d), zIndex: 10 - Math.abs(d) };
			const before = lastD.get(card);
			lastD.set(card, d);
			if (!animate || reduce) gsap.set(card, props);
			else if (before !== undefined && Math.abs(d - before) > 1) {
				// wrapped from one end of the row to the other: appear there instead of flying across
				gsap.set(card, { ...props, autoAlpha: 0 });
				gsap.to(card, { autoAlpha: props.autoAlpha, duration: 0.5, delay: 0.15, overwrite: true });
			} else gsap.to(card, { ...props, duration: 0.8, ease: "expo.out", overwrite: true });
			card.toggleAttribute("data-on", d === 0);
			card.setAttribute("aria-hidden", String(d !== 0));
		});
		gsap.set(cards, { transformOrigin: "50% 50%" });
		capTitle.textContent = cards[active].dataset.title ?? "";
		const meta = cards[active].dataset.meta;
		capMeta.textContent = `${meta ? `${meta} · ` : ""}${String(active + 1).padStart(2, "0")} / ${count}`;
		play();
	}

	function play() {
		cards.forEach((card, i) => {
			const video = card.querySelector<HTMLVideoElement>("video");
			if (!video) return;
			if (i === active && inView) {
				if (!video.src && video.dataset.src) {
					video.src = video.dataset.src;
					video.addEventListener("playing", () => gsap.to(video, { opacity: 1, duration: 0.3 }), { once: true });
					gsap.set(video, { opacity: 0 }); // the poster shows until the first frame
				}
				video.play().catch(() => {});
			} else video.pause();
		});
	}

	const go = (i: number) => {
		const to = ((i % n) + n) % n;
		if (to === active) return;
		active = to;
		layout(true);
	};

	cards.forEach((card, i) => {
		card.addEventListener("click", () => {
			if (swiped) return void (swiped = false); // the click that ends a swipe
			go(i);
		});
		const video = card.querySelector<HTMLVideoElement>("video");
		const time = card.querySelector<HTMLElement>("[data-time]");
		video?.addEventListener("timeupdate", () => time && (time.textContent = fmt(video.currentTime)));
	});
	prev.addEventListener("click", () => go(active - 1));
	next.addEventListener("click", () => go(active + 1));
	section.addEventListener("keydown", (e) => {
		if (e.key === "ArrowLeft") go(active - 1);
		if (e.key === "ArrowRight") go(active + 1);
	});

	// swipe or drag sideways
	let startX: number | null = null;
	stage.addEventListener("pointerdown", (e) => (startX = e.clientX));
	stage.addEventListener("pointerup", (e) => {
		if (startX === null) return;
		const dx = e.clientX - startX;
		startX = null;
		if (Math.abs(dx) > 40) {
			swiped = true;
			setTimeout(() => (swiped = false), 300);
			go(active + (dx < 0 ? 1 : -1));
		}
	});

	new IntersectionObserver(([entry]) => {
		inView = entry.isIntersecting;
		play();
	}, { threshold: 0.25 }).observe(stage);

	layout(false);
	window.addEventListener("resize", () => layout(false));
});
