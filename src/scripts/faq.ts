/**
 * FAQ (blocks/Faq.astro): one answer open at a time, opening and closing with
 * the same easing as the accordions in the mobile menu.
 */
import gsap from "gsap";

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.querySelectorAll<HTMLElement>("[data-faq]").forEach((section) => {
	const qs = [...section.querySelectorAll<HTMLButtonElement>("[data-faq-q]")];
	const panel = (q: HTMLButtonElement) => document.getElementById(q.getAttribute("aria-controls")!)!;

	const set = (q: HTMLButtonElement, open: boolean) => {
		if ((q.getAttribute("aria-expanded") === "true") === open) return;
		q.setAttribute("aria-expanded", String(open));
		const a = panel(q);
		gsap.killTweensOf(a);
		if (reduce) {
			a.hidden = !open;
			return;
		}
		if (open) {
			a.hidden = false;
			gsap.fromTo(a, { height: 0, autoAlpha: 0 }, { height: "auto", autoAlpha: 1, duration: 0.65, ease: "expo.out" });
		} else {
			gsap.to(a, {
				height: 0,
				autoAlpha: 0,
				duration: 0.45,
				ease: "power3.inOut",
				onComplete: () => {
					a.hidden = true;
					gsap.set(a, { clearProps: "height,opacity,visibility" });
				},
			});
		}
	};

	qs.forEach((q) =>
		q.addEventListener("click", () => {
			const open = q.getAttribute("aria-expanded") !== "true";
			if (open) qs.filter((o) => o !== q).forEach((o) => set(o, false));
			set(q, open);
		}),
	);
});
