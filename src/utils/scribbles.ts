/**
 * Drawable scribbles: the marker textures from the brand pack (Studio 2am),
 * red, each with a pen route. The route is a thick stroke used as an SVG mask
 * over the texture; growing the stroke "draws" the scribble. Routes were made
 * from the images so the pen covers all the ink by the end
 * (generator: tools/build-scribbles.py; it prints the data below to a JSON file).
 * On hover a word with a scribble gets the next one of its kind (scripts/scribbles.ts).
 */
export type ScribbleKind = "line" | "circle";
export type Scribble = { key: string; kind: ScribbleKind; src: string; w: number; h: number; d: string; sw: number };

export const SCRIBBLES: Scribble[] = [
	{"key": "line-1", "kind": "line", "src": "/assets/scribbles/line-1.png", "w": 700, "h": 113, "d": "M-22.6 31.6 L714.0 31.6 L714.0 81.4 L-22.6 81.4", "sw": 67.8},
	{"key": "line-2", "kind": "line", "src": "/assets/scribbles/line-2.png", "w": 900, "h": 133, "d": "M-26.6 66.5 L926.6 66.5", "sw": 139.7},
	{"key": "line-3", "kind": "line", "src": "/assets/scribbles/line-3.png", "w": 900, "h": 112, "d": "M-22.4 56.0 L922.4 56.0", "sw": 117.6},
	{"key": "circle-1", "kind": "circle", "src": "/assets/scribbles/circle-1.png", "w": 700, "h": 477, "d": "M455.6 56.9 L436.5 54.6 L417.1 55.9 L398.9 58.5 L381.5 63.1 L365.5 67.4 L350.5 72.1 L336.3 76.6 L322.7 81.6 L309.9 87.5 L297.0 92.1 L284.8 98.0 L273.1 105.0 L261.3 111.7 L249.3 118.4 L237.8 126.3 L225.3 134.0 L213.7 143.2 L200.8 152.6 L186.8 162.7 L172.4 174.2 L157.6 187.3 L141.4 202.1 L125.2 219.3 L110.1 239.0 L95.5 261.3 L84.5 285.9 L78.2 311.9 L77.3 338.4 L82.6 363.9 L94.0 387.1 L109.8 407.5 L130.5 423.6 L153.9 435.6 L178.7 443.8 L204.0 448.2 L228.6 450.1 L252.3 449.5 L274.8 447.1 L295.7 443.4 L315.3 438.4 L333.5 433.0 L350.5 427.4 L366.4 421.3 L381.6 415.4 L396.1 409.0 L409.9 402.2 L423.6 395.7 L437.1 388.9 L450.7 382.1 L464.5 374.9 L478.6 367.1 L493.2 358.7 L508.0 349.3 L523.8 339.1 L540.4 327.6 L557.5 314.3 L576.1 299.5 L595.0 282.1 L613.5 262.0 L628.9 239.0 L638.4 213.8 L641.7 187.6 L641.1 161.1 L632.9 136.2 L616.2 115.1 L593.0 99.0 L570.1 85.2 L546.8 74.3 L524.2 65.3 L500.2 60.6 L476.9 58.6 L455.6 56.9 L436.5 54.6 L417.1 55.9 L398.9 58.5 L381.5 63.1 L365.5 67.4 L350.5 72.1 L336.3 76.6 L322.7 81.6 L309.9 87.5 L297.0 92.1 L284.8 98.0", "sw": 176.9},
	{"key": "circle-2", "kind": "circle", "src": "/assets/scribbles/circle-2.png", "w": 800, "h": 532, "d": "M489.4 87.1 L475.0 81.1 L460.8 74.9 L446.2 69.7 L430.3 70.1 L414.7 73.5 L400.0 77.9 L386.0 82.2 L372.6 86.5 L359.6 91.0 L346.8 95.8 L334.0 100.5 L320.9 104.9 L307.4 109.8 L293.3 114.8 L278.5 120.5 L262.9 126.9 L245.9 134.1 L227.4 142.4 L207.0 152.0 L184.4 163.5 L160.2 177.7 L134.7 195.2 L108.3 216.5 L83.0 242.0 L61.3 271.6 L49.1 303.9 L48.7 336.1 L59.7 365.9 L81.2 390.6 L111.5 408.6 L147.9 418.5 L187.3 420.5 L224.3 417.7 L256.8 412.6 L284.6 406.8 L308.3 400.9 L328.6 395.2 L346.1 390.1 L361.5 385.5 L375.4 381.4 L388.2 377.2 L400.0 373.0 L411.1 368.9 L421.7 365.1 L432.0 361.4 L442.2 357.9 L452.3 354.1 L462.7 350.6 L473.7 347.2 L485.2 343.6 L497.5 339.5 L510.7 334.9 L525.3 329.8 L541.5 323.7 L559.5 316.4 L580.0 307.5 L603.8 296.6 L631.9 282.9 L663.8 265.1 L693.4 242.0 L714.7 214.5 L723.4 185.0 L719.4 156.4 L703.7 131.5 L676.8 112.9 L640.4 103.2 L601.6 100.8 L566.7 102.1 L541.1 100.9 L521.4 97.3 L504.8 92.3 L489.4 87.1 L475.0 81.1 L460.8 74.9 L446.2 69.7 L430.3 70.1 L414.7 73.5 L400.0 77.9 L386.0 82.2 L372.6 86.5 L359.6 91.0 L346.8 95.8 L334.0 100.5", "sw": 145.8},
	{"key": "circle-3", "kind": "circle", "src": "/assets/scribbles/circle-3.png", "w": 730, "h": 466, "d": "M467.2 55.1 L446.5 57.0 L428.0 58.6 L410.6 60.8 L394.5 63.1 L379.1 65.9 L364.5 68.6 L350.3 70.5 L336.2 72.3 L322.0 74.5 L307.8 77.1 L293.2 80.1 L278.2 83.5 L263.0 88.0 L247.6 93.7 L231.4 99.9 L213.7 106.5 L194.6 114.0 L174.7 123.4 L153.7 134.7 L131.7 148.3 L109.4 164.6 L88.1 184.3 L69.2 207.2 L53.4 233.0 L41.3 261.3 L36.0 290.9 L38.2 320.4 L48.4 348.1 L66.1 372.2 L89.7 391.6 L117.8 405.7 L148.5 414.3 L179.0 418.5 L208.0 419.5 L234.7 418.4 L258.9 416.0 L280.7 412.7 L300.4 409.0 L318.4 405.1 L334.9 401.1 L350.2 396.9 L364.5 392.9 L378.1 388.8 L391.3 384.8 L404.1 380.6 L416.7 376.5 L429.4 372.2 L442.2 367.6 L455.3 362.7 L468.8 357.3 L483.0 351.5 L497.9 344.9 L514.2 337.8 L531.5 329.4 L550.9 319.9 L570.8 308.1 L592.5 294.1 L614.9 277.2 L635.9 256.7 L654.2 233.0 L666.9 206.5 L672.0 178.8 L671.1 150.8 L661.8 124.8 L644.9 102.2 L622.8 83.9 L595.9 71.0 L568.4 61.9 L541.0 56.5 L514.7 54.0 L490.0 53.7 L467.2 55.1 L446.5 57.0 L428.0 58.6 L410.6 60.8 L394.5 63.1 L379.1 65.9 L364.5 68.6 L350.3 70.5 L336.2 72.3 L322.0 74.5 L307.8 77.1 L293.2 80.1", "sw": 122.0},
];

export const scribblesOf = (kind: ScribbleKind) => SCRIBBLES.filter((s) => s.kind === kind);

let uid = 0;
/** The SVG for one scribble; the same markup on the server and when swapping on hover. */
export function scribbleSvg(s: Scribble): string {
	const id = `scrib-${s.key}-${Date.now().toString(36)}-${uid++}`;
	return (
		`<svg class="scrib__svg" viewBox="0 0 ${s.w} ${s.h}" preserveAspectRatio="none" aria-hidden="true" focusable="false" data-key="${s.key}">` +
		`<mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${s.w}" height="${s.h}">` +
		`<path class="scrib__pen" d="${s.d}" fill="none" stroke="#fff" stroke-width="${s.sw}" stroke-linecap="round" stroke-linejoin="round"/>` +
		`</mask>` +
		`<image href="${s.src}" width="${s.w}" height="${s.h}" preserveAspectRatio="none" mask="url(#${id})"/>` +
		`</svg>`
	);
}
