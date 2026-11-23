/**
 * S23a · Photo ring (blocks/PhotoArc.astro): the ring turns slowly and keeps
 * going, anticlockwise, so photos come up on the right, pass over the top and
 * leave on the left. Only while the section is in view.
 * Each photo is fully visible up to 75° from the top and fades out by 110°
 * (the same fade the page renders with). Reduced motion: it stands still.
 */
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const SPEED = -2.5; // degrees per second; negative = right to left over the top (Max: slowly)
const fade = (a: number) => Math.max(0, Math.min(1, 1 - (Math.abs(a) - 75) / 35));
const wrap = (a: number) => ((((a + 180) % 360) + 360) % 360) - 180;

if (!reduce)
	document.querySelectorAll<HTMLElement>("[data-arc]").forEach((section) => {
		const ring = section.querySelector<HTMLElement>("[data-arc-ring]");
		const tiles = [...section.querySelectorAll<HTMLElement>("[data-a]")].map((el) => ({ el, a: Number(el.dataset.a) }));
		if (!ring || !tiles.length) return;
		let turn = 0;
		let last = 0;
		let raf = 0;

		const frame = (now: number) => {
			// cap the step, so a tab coming back does not jump
			const dt = last ? Math.min(now - last, 100) / 1000 : 0;
			last = now;
			turn = wrap(turn + SPEED * dt);
			ring.style.setProperty("--turn", `${turn}deg`);
			tiles.forEach((t) => (t.el.style.opacity = String(fade(wrap(t.a + turn)))));
			raf = requestAnimationFrame(frame);
		};

		new IntersectionObserver(([e]) => {
			if (e.isIntersecting && !raf) {
				last = 0;
				raf = requestAnimationFrame(frame);
			} else if (!e.isIntersecting && raf) {
				cancelAnimationFrame(raf);
				raf = 0;
			}
		}).observe(section);
	});

// a module, so its top-level names stay its own
export {};
