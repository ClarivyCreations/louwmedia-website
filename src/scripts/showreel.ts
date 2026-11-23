/**
 * Showreel hero (ShowreelHero.astro, data-showreel), Max 2026-11-20.
 * - The small card plays a short muted loop (the first seconds, data-loop-end).
 * - Desktop: the section pins; while scrolling the words slide apart and the
 *   card grows from its place between the words to the full content width.
 * - A click on the card plays the whole showreel with sound in the card itself,
 *   at its current size (Max); again pauses; the end or scrolling away goes
 *   back to the muted loop.
 * showreel() is called from motion.ts before the other scroll triggers, so
 * their positions count this pin.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function previewLoop(video: HTMLVideoElement) {
	const end = Number(video.dataset.loopEnd) || 0;
	if (!end) return;
	video.addEventListener("timeupdate", () => {
		if (video.muted && video.currentTime >= end) video.currentTime = 0;
	});
	video.addEventListener("ended", () => {
		if (!video.muted) return; // the full reel with sound ends in player()
		video.currentTime = 0;
		video.play().catch(() => {});
	});
}

function player(section: HTMLElement) {
	const reel = section.querySelector<HTMLElement>("[data-showreel-open]");
	const video = section.querySelector<HTMLVideoElement>(".sr__video");
	if (!reel || !video) return;
	let full = false; // playing the whole reel with sound
	const set = (on: boolean) => {
		reel.classList.toggle("is-playing", on && !video.paused);
		reel.setAttribute("aria-pressed", String(on && !video.paused));
	};
	const toPreview = () => {
		full = false;
		video.muted = true;
		video.currentTime = 0;
		video.play().catch(() => {});
		set(false);
	};
	reel.addEventListener("click", () => {
		if (!full) {
			full = true;
			video.currentTime = 0;
			video.muted = false;
			// it was already running muted, so no "play" event follows: mark it here
			video.play().then(() => set(true)).catch(() => {});
			set(true);
		} else if (video.paused) video.play().catch(() => {});
		else video.pause();
	});
	video.addEventListener("play", () => set(full));
	video.addEventListener("pause", () => set(false));
	video.addEventListener("ended", () => full && toPreview());
	// scrolled out of view while playing with sound: stop the sound, back to the muted loop
	new IntersectionObserver(([e]) => {
		if (!e.isIntersecting && full) toPreview();
	}).observe(reel);
}

function grow(section: HTMLElement) {
	const slot = section.querySelector<HTMLElement>("[data-showreel-slot]");
	const reel = section.querySelector<HTMLElement>(".sr__reel");
	const box = section.querySelector<HTMLElement>(".sr__in");
	if (!slot || !reel || !box) return;

	// The card leaves its slot so it can grow over the whole section.
	section.appendChild(reel);
	const rel = (el: HTMLElement) => {
		const s = section.getBoundingClientRect();
		const r = el.getBoundingClientRect();
		return { left: r.left - s.left, top: r.top - s.top, width: r.width, height: r.height };
	};
	const from = () => rel(slot);
	const to = () => {
		const b = box.getBoundingClientRect();
		const s = section.getBoundingClientRect();
		const pad = parseFloat(getComputedStyle(box).paddingLeft) || 0;
		// as big as it gets: the content width, with the same gap above and below (Max);
		// the header may sit over it
		const gap = Math.max(pad, 20);
		return { left: b.left - s.left + pad, top: gap, width: b.width - pad * 2, height: s.height - gap * 2 };
	};
	const words = [section.querySelector(".sr__line--1"), section.querySelector(".sr__l2")];
	const fades = section.querySelectorAll(".sr__note, .sr__foot, [data-small], .sr__rec");
	const big = reel.querySelector("[data-big]");
	const play = reel.querySelector(".sr__play");

	const tl = gsap.timeline({
		scrollTrigger: { trigger: section, start: "top top", end: "+=110%", scrub: 0.6, pin: true, invalidateOnRefresh: true },
	});
	tl.fromTo(
		reel,
		{ left: () => from().left, top: () => from().top, width: () => from().width, height: () => from().height, rotate: -3 },
		{ left: () => to().left, top: () => to().top, width: () => to().width, height: () => to().height, rotate: 0, ease: "power2.inOut" },
		0,
	)
		.to(words[0], { xPercent: -70, ease: "power2.in" }, 0)
		.to(words[1], { xPercent: 70, ease: "power2.in" }, 0)
		// gone before the card reaches the sides, so no grey letters stay beside it (Max)
		.to(words, { opacity: 0, duration: 0.5, ease: "power1.in" }, 0)
		.to(fades, { autoAlpha: 0, duration: 0.3 }, 0)
		.to(play, { scale: 1.3, duration: 1 }, 0)
		.to(big, { autoAlpha: 1, duration: 0.3 }, 0.7);
}

export function showreel() {
	document.querySelectorAll<HTMLElement>("[data-showreel]").forEach((section) => {
		const preview = section.querySelector<HTMLVideoElement>(".sr__video");
		if (preview) previewLoop(preview);
		player(section);
		if (!reduce && window.matchMedia("(min-width: 900px)").matches) grow(section);
	});
}
