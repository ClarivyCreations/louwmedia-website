/**
 * Contact form (blocks/HeroContact.astro): checks the required fields in
 * Dutch, posts the form to /api/contact and then swaps the fields for the
 * thank-you message. Is sending not set up, or does it fail, it says so and
 * points to the email address, so no request gets lost unnoticed.
 */
const MESSAGES: Record<string, string> = {
	name: "Vul je naam in.",
	email: "Vul een geldig e-mailadres in.",
	message: "Vertel kort wat je wilt maken.",
};

document.querySelectorAll<HTMLFormElement>("[data-contact-form]").forEach((form) => {
	const body = form.querySelector<HTMLElement>("[data-form-body]")!;
	const done = form.querySelector<HTMLElement>("[data-form-done]")!;
	const error = form.querySelector<HTMLElement>("[data-form-error]")!;
	const button = form.querySelector<HTMLButtonElement>("button[type=submit]")!;
	const mail = document.querySelector<HTMLAnchorElement>(".ch__big a[href^='mailto:']");

	const fields = [...form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input[required], textarea[required]")];
	const showError = (html: string) => {
		error.innerHTML = html;
		error.hidden = false;
	};
	const fallback = () =>
		mail ? ` Mail dan even naar <a href="${mail.href}">${mail.textContent}</a>.` : "";

	// clear a field's error once it is filled in properly
	fields.forEach((f) =>
		f.addEventListener("input", () => {
			if (f.getAttribute("aria-invalid") === "true" && f.checkValidity()) f.removeAttribute("aria-invalid");
		}),
	);

	form.addEventListener("submit", async (e) => {
		e.preventDefault();
		error.hidden = true;
		const invalid = fields.filter((f) => !f.value.trim() || !f.checkValidity());
		fields.forEach((f) => (invalid.includes(f) ? f.setAttribute("aria-invalid", "true") : f.removeAttribute("aria-invalid")));
		if (invalid.length) {
			showError(invalid.map((f) => MESSAGES[f.name] ?? "Vul dit veld in.").join(" "));
			invalid[0].focus();
			return;
		}

		button.setAttribute("aria-busy", "true");
		try {
			const res = await fetch(form.action, {
				method: "POST",
				headers: { Accept: "application/json" },
				body: new FormData(form),
			});
			const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
			if (!res.ok || !data.ok) throw new Error(data.error || "failed");
			body.hidden = true;
			done.hidden = false;
			done.focus();
		} catch (err) {
			const notSet = err instanceof Error && err.message === "not-configured";
			showError((notSet ? "Versturen via het formulier werkt nog niet." : "Versturen lukte niet.") + fallback());
		} finally {
			button.removeAttribute("aria-busy");
		}
	});
});
