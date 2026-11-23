/**
 * Scribbles that draw themselves: the pen route (a thick stroke in an SVG mask)
 * grows from 0 to its full length over the marker texture.
 * - prepScribbles(): hide every scribble before the intro and the line reveals
 *   take their snapshot of the headings (motion.ts restores that HTML later).
 * - drawScribbles(scope): draw the scribbles in a heading once its lines are up.
 * - hover: each time the pointer enters a word with a scribble, the next one of
 *   its kind (2 or 3 rotate) is drawn while the old one fades out.
 */
import gsap from "gsap";
import { scribbleSvg, scribblesOf, type ScribbleKind } from "../utils/scribbles";

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const DRAW = {
	line: { duration: 0.75, ease: "power2.inOut" },
	circle: { duration: 1.05, ease: "power1.inOut" },
} as const;

const pens = (scope: ParentNode) => [...scope.querySelectorAll<SVGPathElement>(".scrib__pen")];
const kindOf = (host: Element) => (host.getAttribute("data-scribble") as ScribbleKind) || "line";

function hide(pen: SVGPathElement) {
	const len = Math.ceil(pen.getTotalLength()) + 2;
	pen.style.strokeDasharray = `${len} ${len}`;
	pen.style.strokeDashoffset = String(len);
}

function draw(pen: SVGPathElement, kind: ScribbleKind, delay = 0) {
	hide(pen);
	return gsap.to(pen, { strokeDashoffset: 0, ...DRAW[kind], delay });
}

export function prepScribbles() {
	if (reduce) return;
	pens(document).forEach(hide);
}

export function drawScribbles(scope: ParentNode, delay = 0.15) {
	if (reduce) return;
	const hosts = scope instanceof Element && scope.matches("[data-scribble]") ? [scope] : [...scope.querySelectorAll("[data-scribble]")];
	hosts.forEach((host) => {
		const svg = host.querySelector(".scrib__svg:last-of-type");
		const pen = svg?.querySelector<SVGPathElement>(".scrib__pen");
		if (pen && !host.hasAttribute("data-drawn")) {
			host.setAttribute("data-drawn", "");
			draw(pen, kindOf(host), delay);
		}
	});
}

function next(host: HTMLElement) {
	const mark = host.querySelector<HTMLElement>(".scrib__mark");
	if (!mark) return;
	const kind = kindOf(host);
	const set = scribblesOf(kind);
	const current = mark.querySelector(".scrib__svg:last-of-type")?.getAttribute("data-key");
	const at = set.findIndex((s) => s.key === current);
	const s = set[(at + 1) % set.length];
	const old = [...mark.querySelectorAll<SVGSVGElement>(".scrib__svg")];
	mark.insertAdjacentHTML("beforeend", scribbleSvg(s));
	host.setAttribute("data-drawn", "");
	if (reduce) {
		old.forEach((o) => o.remove());
		return;
	}
	gsap.killTweensOf(old);
	gsap.to(old, { autoAlpha: 0, duration: 0.25, ease: "power1.out", onComplete: () => old.forEach((o) => o.remove()) });
	const pen = mark.querySelector<SVGPathElement>(".scrib__svg:last-of-type .scrib__pen");
	if (pen) draw(pen, kind);
}

// One listener for the whole page: headings get rebuilt by the line reveals.
if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
	document.addEventListener("mouseover", (e) => {
		const host = (e.target as Element).closest?.<HTMLElement>("[data-scribble]");
		if (!host) return;
		const from = e.relatedTarget as Node | null;
		if (from && host.contains(from)) return; // still inside the same word
		next(host);
	});
}
