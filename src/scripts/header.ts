/**
 * Header behaviour: white bar once scrolled, the two mega menus (hover on
 * desktop, click or Enter for touch and keyboard, Escape and the scrim close),
 * the Diensten photo swap, the Werk playhead, and the mobile menu.
 */
import gsap from "gsap";

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const header = document.querySelector<HTMLElement>("[data-header]");

if (header) {
	const shell = header.querySelector<HTMLElement>(".sh__shell")!;
	const scrim = document.querySelector<HTMLElement>("[data-scrim]");
	const triggers = [...header.querySelectorAll<HTMLAnchorElement>("[data-mega-trigger]")];
	const panels = new Map([...header.querySelectorAll<HTMLElement>("[data-mega]")].map((p) => [p.dataset.mega!, p]));
	let current: string | null = null;
	let closeTimer: number | undefined;
	const hoverCapable = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

	// Scrolling down: the bar slides away at once. It switches to the full-width,
	// blurred state while out of sight, so on the way up it comes back in that state.
	let lastY = window.scrollY;
	let swapTimer: number | undefined;
	const onScroll = () => {
		const y = window.scrollY;
		const menuOpen = header.dataset.open !== "none";
		if (y <= 12) {
			window.clearTimeout(swapTimer);
			header.classList.remove("is-hidden", "is-scrolled");
		} else if (menuOpen) {
			header.classList.remove("is-hidden");
		} else if (y > lastY + 2) {
			if (!header.classList.contains("is-hidden")) {
				header.classList.add("is-hidden");
				window.clearTimeout(swapTimer);
				swapTimer = window.setTimeout(() => {
					if (header.classList.contains("is-hidden") && window.scrollY > 12) header.classList.add("is-scrolled");
				}, 600);
			}
		} else if (y < lastY - 4) {
			window.clearTimeout(swapTimer);
			header.classList.add("is-scrolled");
			header.classList.remove("is-hidden");
		}
		if (Math.abs(y - lastY) > 2) lastY = y;
	};
	onScroll();
	window.addEventListener("scroll", onScroll, { passive: true });
	header.addEventListener("focusin", () => header.classList.remove("is-hidden"));

	let closing: gsap.core.Tween | null = null;

	function open(name: string) {
		window.clearTimeout(closeTimer);
		if (current === name) return;
		const panel = panels.get(name);
		if (!panel) return;
		closing?.kill();
		closing = null;
		// Switching from the other panel: grow or shrink from its height instead of from 0.
		const prev = current ? panels.get(current)! : null;
		const fromH = prev && !prev.hidden ? prev.offsetHeight : 0;
		if (prev) {
			gsap.killTweensOf(prev);
			prev.hidden = true;
			gsap.set(prev, { clearProps: "height" });
		}
		current = name;
		header!.dataset.open = name;
		triggers.forEach((t) => t.setAttribute("aria-expanded", String(t.dataset.megaTrigger === name)));
		panel.hidden = false;
		if (reduce) return;
		gsap.killTweensOf(panel);
		gsap.fromTo(panel, { height: fromH }, { height: "auto", duration: fromH ? 0.6 : 0.75, ease: fromH ? "power3.inOut" : "expo.out" });
		const items = panel.querySelectorAll(".mrow, .mega__side, .mfil li, .cthumb, .tline, .mega__foot > *");
		gsap.fromTo(items, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.04, ease: "power3.out", delay: fromH ? 0.12 : 0.08 });
		if (name === "werk") movePlayhead(0);
	}

	function close() {
		if (!current) return;
		const panel = panels.get(current)!;
		current = null;
		triggers.forEach((t) => t.setAttribute("aria-expanded", "false"));
		const finish = () => {
			panel.hidden = true;
			gsap.set(panel, { clearProps: "height" });
			header!.dataset.open = "none"; // the bar keeps its colour until the panel is shut
			closing = null;
		};
		if (reduce) return finish();
		const items = panel.querySelectorAll(".mrow, .mega__side, .mfil li, .cthumb, .tline, .mega__foot > *");
		gsap.to(items, { autoAlpha: 0, y: -8, duration: 0.25, stagger: 0.015, ease: "power2.in" });
		closing = gsap.to(panel, { height: 0, duration: 0.55, ease: "power3.inOut", delay: 0.08, onComplete: finish });
	}

	const closeSoon = () => {
		window.clearTimeout(closeTimer);
		closeTimer = window.setTimeout(close, 160);
	};

	triggers.forEach((t) => {
		const name = t.dataset.megaTrigger!;
		if (hoverCapable) t.addEventListener("mouseenter", () => open(name));
		t.addEventListener("click", (e) => {
			if (current !== name) {
				e.preventDefault();
				open(name);
			}
		});
	});
	header.querySelectorAll(".sh__link:not([data-mega-trigger])").forEach((l) => {
		if (hoverCapable) l.addEventListener("mouseenter", closeSoon);
	});
	if (hoverCapable) {
		shell.addEventListener("mouseleave", closeSoon);
		shell.addEventListener("mouseenter", () => window.clearTimeout(closeTimer));
	}
	scrim?.addEventListener("click", close);
	document.addEventListener("keydown", (e) => {
		if (e.key === "Escape") close();
	});

	/* Diensten: the row under the pointer stays marked (the photo on the right is fixed) */
	const diensten = panels.get("diensten");
	if (diensten) {
		const rows = [...diensten.querySelectorAll<HTMLElement>(".mrow")];
		const pick = (i: number) => rows.forEach((r, k) => r.toggleAttribute("data-active", k === i));
		rows.forEach((r, i) => {
			r.addEventListener("mouseenter", () => pick(i));
			r.addEventListener("focus", () => pick(i));
		});
	}

	/* Werk: the case under the pointer lights its clip and moves the playhead */
	const werk = panels.get("werk");
	const clips = werk ? [...werk.querySelectorAll<HTMLElement>(".tline__clip")] : [];
	const head = werk?.querySelector<HTMLElement>("[data-playhead]");
	function movePlayhead(i: number) {
		if (!head || !clips[i]) return;
		const track = clips[i].parentElement!.getBoundingClientRect();
		const clip = clips[i].getBoundingClientRect();
		head.style.transform = `translateX(${clip.left - track.left + clip.width * 0.62}px)`;
		clips.forEach((c, k) => c.toggleAttribute("data-active", k === i));
	}
	werk?.querySelectorAll<HTMLElement>(".cthumb").forEach((c, i) => {
		c.addEventListener("mouseenter", () => movePlayhead(i));
		c.addEventListener("focus", () => movePlayhead(i));
	});

	/* Mobile menu */
	const mobile = document.querySelector<HTMLElement>("[data-mobile]");
	const openBtn = header.querySelector<HTMLButtonElement>("[data-mobile-open]");
	const closeBtn = mobile?.querySelector<HTMLButtonElement>("[data-mobile-close]");
	if (mobile && openBtn && closeBtn) {
		// The panel grows out of the menu button and shrinks back into it.
		const fromButton = () => {
			const r = openBtn.getBoundingClientRect();
			return `inset(${r.top}px ${window.innerWidth - r.right}px ${window.innerHeight - r.bottom}px ${r.left}px round 4px)`;
		};
		const full = "inset(0px 0px 0px 0px round 0px)";
		const show = () => {
			mobile.hidden = false;
			openBtn.setAttribute("aria-expanded", "true");
			document.documentElement.style.overflow = "hidden";
			closeBtn.focus();
			if (reduce) return;
			gsap.fromTo(mobile, { clipPath: fromButton() }, { clipPath: full, duration: 0.85, ease: "expo.inOut" });
			gsap.fromTo(mobile.querySelectorAll(".mm__label, .mm__list > li, .mm__foot > *"), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.06, ease: "power3.out", delay: 0.4 });
		};
		const hide = () => {
			openBtn.setAttribute("aria-expanded", "false");
			document.documentElement.style.overflow = "";
			const finish = () => {
				mobile.hidden = true;
				openBtn.focus();
			};
			if (reduce) return finish();
			gsap.to(mobile.querySelectorAll(".mm__label, .mm__list > li, .mm__foot > *"), { autoAlpha: 0, duration: 0.2 });
			gsap.to(mobile, { clipPath: fromButton(), duration: 0.65, ease: "expo.inOut", onComplete: finish });
		};
		openBtn.addEventListener("click", show);
		closeBtn.addEventListener("click", hide);
		document.addEventListener("keydown", (e) => {
			if (e.key === "Escape" && !mobile.hidden) hide();
		});
		// Werk and Diensten fold open and shut with easing; one open at a time.
		const accs = [...mobile.querySelectorAll<HTMLButtonElement>("[data-acc]")];
		const setAcc = (btn: HTMLButtonElement, open: boolean) => {
			const subs = btn.nextElementSibling as HTMLElement;
			if ((btn.getAttribute("aria-expanded") === "true") === open) return;
			btn.setAttribute("aria-expanded", String(open));
			gsap.killTweensOf([subs, ...subs.children]);
			if (reduce) {
				subs.hidden = !open;
				return;
			}
			if (open) {
				subs.hidden = false;
				gsap.fromTo(subs, { height: 0 }, { height: "auto", duration: 0.7, ease: "expo.out" });
				gsap.fromTo(subs.children, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.05, ease: "power3.out", delay: 0.06 });
			} else {
				gsap.to(subs.children, { autoAlpha: 0, duration: 0.2, ease: "power1.in" });
				gsap.to(subs, {
					height: 0,
					duration: 0.5,
					ease: "power3.inOut",
					onComplete: () => {
						subs.hidden = true;
						gsap.set(subs, { clearProps: "height" });
					},
				});
			}
		};
		accs.forEach((btn) => {
			btn.addEventListener("click", () => {
				const open = btn.getAttribute("aria-expanded") !== "true";
				if (open) accs.filter((b) => b !== btn).forEach((b) => setAcc(b, false));
				setAcc(btn, open);
			});
		});
	}
}
