const PARAGRAPH_BREAK = /\n\s*\n/;

/** Splits plain text into paragraphs at blank lines, dropping empty ones. */
export function toParagraphs(text: string | null | undefined): string[] {
	return (text ?? "")
		.split(PARAGRAPH_BREAK)
		.map((paragraph) => paragraph.trim())
		.filter(Boolean);
}

export type HeadlinePart = { text: string; kind: "plain" | "accent" | "marker" };

const MARK = /(\*[^*]+\*|_[^_]+_)/g;

/**
 * Headlines are plain strings in the admin. Editors mark the brand accent word
 * with *stars* (Inter 900 italic) and a red marker underline with _underscores_.
 */
export function headlineParts(text: string | null | undefined): HeadlinePart[] {
	return (text ?? "")
		.split(MARK)
		.filter(Boolean)
		.map((part) => {
			if (part.startsWith("*") && part.endsWith("*")) return { text: part.slice(1, -1), kind: "accent" };
			if (part.startsWith("_") && part.endsWith("_")) return { text: part.slice(1, -1), kind: "marker" };
			return { text: part, kind: "plain" };
		});
}

/** The headline without its marks, for SEO and alt text. */
export function plainHeadline(text: string | null | undefined): string {
	return (text ?? "").replace(/[*_]/g, "");
}
