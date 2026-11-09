# charlotte song — personal site

Plain HTML/CSS/JS. No build step, no dependencies.

## Edit
- **content.js** holds all the text: about paragraphs, every folder item (role, dates, bullets, tags), and your links. Anything in `[brackets]` is a placeholder and shows up dashed on the page until you replace it.
- Add `resume.pdf` to this folder. The resume buttons link to `/resume.pdf`.
- New logo: drop a PNG in `assets/logos/` and point `logo:` at it. For an item without a logo, set `icon: "note" | "star" | "cloud"` (dot-matrix icons are defined in `ICONS` in main.js).
- A new folder is just another entry in `folders` (layouts handle 2–6 items).

## Preview locally
```
python3 -m http.server 8000
```
Then open http://localhost:8000.

## Deploy to Vercel
1. Push this folder to a GitHub repo.
2. vercel.com → Add New → Project → import the repo.
3. Framework preset: **Other**. No build command, output directory `./`.
4. Deploy. Add a custom domain under Settings → Domains.

## What's where
- `dots.js`: your cloud image as a 400×226 dot grid (the hero redraws it live)
- `bunny.js`: the 111 dots of one bunny, traced from the about slide
- `main.js`: hero physics, dither bands, bunny ring, desktop/folders, file windows
- `styles.css`: palette (`--blue: #6188C5` from your slides), Sniglet + Nunito + JetBrains Mono
