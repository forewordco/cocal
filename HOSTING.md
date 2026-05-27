# Hosting your Summer Co-Parenting Calendar

Your calendar is a single file: **`index.html`**. It needs no server, no build step, and no dependencies — just upload it to any static host. Here are three free options, easiest first.

## Option 1 — Netlify Drop (no account math, ~30 seconds)
1. Go to **app.netlify.com/drop**
2. Drag the `index.html` file (or the folder containing it) onto the page.
3. Netlify gives you a live URL instantly (e.g. `your-name.netlify.app`).
4. To use a memorable address, create a free Netlify account and rename the site in Site settings.

## Option 2 — Cloudflare Pages
1. Create a free account at **pages.cloudflare.com**.
2. Choose "Upload assets," drag in `index.html`, and deploy.
3. You get a `*.pages.dev` URL.

## Option 3 — GitHub Pages (best if you want version history)
1. Create a new GitHub repository.
2. Upload `index.html` to it.
3. In the repo's **Settings → Pages**, set the source to your main branch.
4. Your site appears at `https://yourusername.github.io/repo-name/`.

## A custom domain (optional)
All three hosts let you connect a domain you own (e.g. from Namecheap or Cloudflare) for free — look for "custom domain" in the site settings. Expect to pay ~$10/year for the domain itself.

---

## Important: how saving works
The calendar saves your edits and changelog **in the browser you're using** (via localStorage). That means:

- Your changes persist when you close and reopen the page **on the same device + browser**.
- They do **not** sync to your phone, to Allie, or to other browsers automatically.
- Clearing your browser data will erase local edits (the page reloads with the original schedule).

If you ever want a version where you and Allie both see the same live schedule from any device, that's a bigger build — it needs a backend database and a login. I can spec that out separately if it becomes useful. For a personal planning view that you control, the current setup is simpler and has no ongoing cost.

## "Add to calendar"
The **⤓ Add to calendar (.ics)** button downloads a standard calendar file containing every day's entry as an all-day event (parent + any pickup/dropoff time in the title, notes in the description). Open that file to import the whole summer into Apple Calendar, Google Calendar, or Outlook in one step. Re-export and re-import any time you make changes.
