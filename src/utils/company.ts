/**
 * Louwmedia's own details (Max 2026-11-21: one place in the CMS for email,
 * phone, address, socials): the single item "louwmedia" in the collection
 * "Bedrijfsgegevens" (gegevens). Footer, contact hero, FAQ contact lines and
 * the structured data all read it from here.
 *
 * A value in [brackets] is a placeholder: it shows as text but never becomes
 * a link or goes into the structured data.
 */
import { getEmDashEntry } from "emdash";

export type Company = {
	name: string;
	email?: string;
	phone?: string;
	phoneNote?: string;
	street?: string;
	postalCode?: string;
	city?: string;
	area?: string;
	kvk?: string;
	shareImage?: unknown;
	socials: { label: string; url: string }[];
	cacheHint?: unknown;
};

/** filled in and not a [placeholder] */
export const isReal = (v?: string | null): v is string => Boolean(v && v.trim() && !v.trim().startsWith("["));
export const mailHref = (email?: string | null) => (isReal(email) ? `mailto:${email.trim()}` : undefined);
export const telHref = (phone?: string | null) => {
	if (!isReal(phone)) return undefined;
	const digits = phone.replace(/[^\d+]/g, "");
	// Dutch numbers: 06… → +316…
	return `tel:${digits.startsWith("0") ? `+31${digits.slice(1)}` : digits}`;
};

export async function getCompany(): Promise<Company> {
	const { entry, cacheHint } = await getEmDashEntry("gegevens", "louwmedia");
	const d = (entry?.data ?? {}) as Record<string, unknown>;
	const s = (k: string) => (typeof d[k] === "string" && (d[k] as string).trim() ? (d[k] as string).trim() : undefined);
	const socials: { label: string; url: string }[] = [];
	for (const [label, key] of [
		["Instagram", "instagram"],
		["TikTok", "tiktok"],
		["LinkedIn", "linkedin"],
		["YouTube", "youtube"],
	] as const) {
		const url = s(key);
		if (url) socials.push({ label, url });
	}
	return {
		name: s("title") ?? "Louwmedia",
		email: s("email"),
		phone: s("phone"),
		phoneNote: s("phone_note"),
		street: s("street"),
		postalCode: s("postal_code"),
		city: s("city"),
		area: s("area"),
		kvk: s("kvk"),
		shareImage: d.share_image ?? undefined,
		socials,
		cacheHint,
	};
}
