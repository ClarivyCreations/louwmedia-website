/**
 * Client cases (blocks/Cases.astro): the Lijst | Grid switch. GSAP Flip records
 * where every photo is, the layout switches, and each photo moves and grows (or
 * shrinks) from its old place to its new one; the text fades back in after.
 */
import gsap from "gsap";
import { Flip } from "gsap/Flip";

gsap.registerPlugin(Flip);
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.querySelectorAll<HTMLElement>("[data-cases]").forEach((section) => {
	const buttons = [...section.querySelectorAll<HTMLButtonElement>("[data-set-view]")];
	const media = () => [...section.querySelectorAll<HTMLElement>(".ca__media")];
	const text = () => [...section.querySelectorAll<HTMLElement>(".ca__t, .ca__c, .ca__client, .ca__k, .ca__y")];
	let busy = false;

	const setView = (view: string) => {
		if (busy || section.dataset.view === view) return;
		buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.setView === view)));
		if (reduce) {
			section.dataset.view = view;
			return;
		}
		busy = true;
		const state = Flip.getState(media(), { props: "borderRadius" });
		gsap.set(text(), { autoAlpha: 0 });
		section.dataset.view = view;
		Flip.from(state, {
			duration: 0.8,
			ease: "power3.inOut",
			stagger: 0.03,
			absolute: false,
			nested: true,
			onComplete: () => {
				busy = false;
				window.dispatchEvent(new Event("resize")); // let ScrollTrigger re-measure the page
			},
		});
		gsap.to(text(), { autoAlpha: 1, duration: 0.45, stagger: 0.01, delay: 0.5, ease: "power1.out" });
	};

	buttons.forEach((b) => b.addEventListener("click", () => setView(b.dataset.setView!)));
});
