import type { PageContentBlock } from "../../emdash-env";
import { plainHeadline } from "./text";

// Every block that can open a page and carries the page's lead line.
const HERO_TYPES = ["lm_hero_split", "lm_hero_video", "lm_hero_compact", "lm_hero_contact", "lm_showreel", "lm_shootday_clips", "lm_shootday_hero"] as const;
type HeroBlock = Extract<PageContentBlock, { _type: (typeof HERO_TYPES)[number] }>;
type ImageValue = { src?: string; previewUrl?: string; provider?: string; id?: string; meta?: Record<string, unknown> };

function absoluteUrl(value: string, origin: string): string | undefined {
	try {
		return new URL(value, origin).href;
	} catch {
		return undefined;
	}
}

export function absoluteImageUrl(image: ImageValue, origin: string): string | undefined {
	if (image.src) return absoluteUrl(image.src, origin);
	if ((image.provider ?? "local") !== "local") {
		return image.previewUrl ? absoluteUrl(image.previewUrl, origin) : undefined;
	}
	const storageKey = typeof image.meta?.storageKey === "string" ? image.meta.storageKey : image.id;
	return storageKey ? `${origin}/_emdash/api/media/file/${storageKey}` : undefined;
}

/** SEO fallbacks from the page's hero (its intro, else its headline, and its first
 *  picture) when its SEO panel is empty. The first hero-like block on the page counts. */
export function heroSeoDefaults(blocks: PageContentBlock[] | undefined, origin: string) {
	const hero = blocks?.find((b): b is HeroBlock => (HERO_TYPES as readonly string[]).includes(b._type));
	if (!hero) return { defaultDescription: undefined, defaultOgImage: undefined };
	const h = hero as Partial<Record<"intro" | "headline" | "line_1" | "line_2", string | null>> &
		Partial<Record<"image_1" | "poster", ImageValue | null>>;
	const headline = h.headline ?? [h.line_1, h.line_2].filter(Boolean).join(" ");
	const image = h.image_1 ?? h.poster ?? undefined;
	return {
		defaultDescription: h.intro?.trim() || (headline ? plainHeadline(headline) : undefined) || undefined,
		defaultOgImage: image ? absoluteImageUrl(image, origin) : undefined,
	};
}
