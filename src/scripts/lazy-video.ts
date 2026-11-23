/**
 * Muted videos marked data-card-video (the reel in a "Wat je krijgt" card):
 * the file only loads once the video comes into view, it plays while visible
 * and pauses when it scrolls away. The poster image shows until it runs.
 */
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const videos = [...document.querySelectorAll<HTMLVideoElement>("video[data-card-video]")];

if (!reduce && videos.length) {
	const io = new IntersectionObserver(
		(entries) => {
			entries.forEach(({ target, isIntersecting }) => {
				const v = target as HTMLVideoElement;
				if (isIntersecting) {
					if (!v.src && v.dataset.src) {
						v.src = v.dataset.src;
						v.style.opacity = "0";
						v.addEventListener("playing", () => (v.style.opacity = "1"), { once: true });
					}
					v.play().catch(() => {});
				} else v.pause();
			});
		},
		{ threshold: 0.2 },
	);
	videos.forEach((v) => {
		v.style.transition = "opacity 0.4s";
		io.observe(v);
	});
}

// a module, so its top-level names stay its own
export {};
