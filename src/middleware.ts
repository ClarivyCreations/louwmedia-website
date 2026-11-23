/**
 * Site middleware (runs after EmDash's own).
 *
 * Sitemap: the pages collection's "/{slug}" pattern gives the home page the URL
 * /home in EmDash's sitemap, but it lives at / (pages/home.astro redirects).
 * A sitemap should list the real address, so /home becomes / here.
 */
import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
	const response = await next();

	if (context.url.pathname === "/sitemap-pages.xml" && response.ok) {
		const xml = await response.text();
		// whatever the site URL is: <loc>https://…/home</loc> → <loc>https://…/</loc>
		const fixed = xml.replace(/(<loc>https?:\/\/[^<\/]+)\/home<\/loc>/g, "$1/</loc>");
		return new Response(fixed, { status: response.status, headers: response.headers });
	}
	return response;
});
