/**
 * POST /api/contact: the contact form (blocks/HeroContact.astro, scripts/contact.ts).
 *
 * Delivery is NOT set up yet (Max 2026-11-21: decided at hosting time, e.g. an
 * email provider plugin for EmDash). Until then:
 * - in development the request is checked and written to the server log, and
 *   the form shows its thank-you message, so the flow can be tried out;
 * - in production it answers "not-configured" and the form asks people to
 *   mail instead. So nothing is accepted that then goes nowhere.
 * Hook the delivery in at deliver() below.
 */
import type { APIRoute } from "astro";

type Request = { name: string; company: string; email: string; phone: string; topic: string; message: string };

const MAX = { name: 120, company: 160, email: 200, phone: 40, topic: 300, message: 5000 };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const json = (status: number, body: Record<string, unknown>) =>
	new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

async function deliver(req: Request): Promise<boolean> {
	if (import.meta.env.DEV) {
		console.info("[contact] new request (not delivered, development only):", req);
		return true;
	}
	return false;
}

export const POST: APIRoute = async ({ request }) => {
	let form: FormData;
	try {
		form = await request.formData();
	} catch {
		return json(400, { ok: false, error: "invalid" });
	}
	const get = (k: keyof typeof MAX) => String(form.get(k) ?? "").trim().slice(0, MAX[k]);

	// spam trap filled in: pretend it worked, keep nothing
	if (String(form.get("website") ?? "").trim()) return json(200, { ok: true });

	const req: Request = {
		name: get("name"),
		company: get("company"),
		email: get("email"),
		phone: get("phone"),
		// more than one may be picked
		topic: form
			.getAll("topic")
			.map((t) => String(t).trim())
			.filter(Boolean)
			.join(", ")
			.slice(0, MAX.topic),
		message: get("message"),
	};
	if (!req.name || !EMAIL.test(req.email) || !req.message) return json(422, { ok: false, error: "invalid" });

	const delivered = await deliver(req);
	return delivered ? json(200, { ok: true }) : json(503, { ok: false, error: "not-configured" });
};
