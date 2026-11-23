# Louwmedia website

Astro 7 met EmDash 1.5 als CMS. De site draait lokaal op Node, met SQLite (`data.db`) voor de content en `uploads/` voor de media.
Alle ontwerpkeuzes per sectie staan in `CLAUDE.md`. Claude Code leest dat bestand vanzelf als je in deze map werkt.

## Lokaal draaien

```bash
npm install
cp .env.example .env          # en vul EMDASH_ENCRYPTION_KEY in: npx emdash secrets generate
npx emdash seed seed/seed.json  # eenmalig: alle pagina's, cases, teksten en beelden
npm run dev                   # http://localhost:4321, beheer op /_emdash/admin
```

`seed/seed.json` bevat de volledige content van de site, met alle foto's en video's in `seed/media/`. Bij de eerste keer zet `npx emdash seed` die in een lokale database (`data.db`) en in `uploads/`. Die twee staan niet in git. Wil je opnieuw beginnen, verwijder dan `data.db` en `uploads/` en draai de seed nog een keer. Inloggen in het beheer gaat lokaal via de dev-link die `npm run dev` in de terminal laat zien.

## Waar je wat vindt

- `src/styles/global.css`: de tokens (kleuren, typografie, afstanden) en de gedeelde klassen.
- `src/components/`: kleine onderdelen, zoals knoppen, pijlen, de playknop en tags.
- `src/components/blocks/`: de secties die je in het CMS op een pagina zet.
- `src/components/header/`: de header met de mega-menu's.
- `src/scripts/`: de animaties (GSAP), de header en de clips.
- `astro.config.mjs`: de fonts. Het zijn alle vier Google Fonts: Inter, Hanken Grotesk, Geist Mono en Permanent Marker.

## Nog placeholder

- Het contactformulier verstuurt nog niets (`deliver()` in `src/pages/api/contact.ts`).
- Het telefoonnummer, de postcode, het KvK-nummer en de sociale links in Bedrijfsgegevens zijn placeholders.
- De casetitels, reviews en juridische teksten zijn ook nog placeholders.
