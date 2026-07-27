# Spirit Challenge

An open-source leaderboard for running a points-based challenge/spirit
program for a club, residence hall association, or any group. Members
submit completed challenges (with an optional photo and reflection), an
admin approves them in Airtable, and a public leaderboard tracks
individual and team points.

Built with Vue 3 + Tailwind, an Airtable base as the database, Cloudinary
for photo uploads, and Netlify (static hosting + serverless functions).
This README covers the web deploy.

## 1. Set up your Airtable base

1. Duplicate the template base: https://airtable.com/app3qw7XQ1GeeCIZe/shrFxIyD5EUIZH3y9
   - No template link yet, or want to build it by hand? See
     [`docs/airtable-schema.md`](docs/airtable-schema.md) for the exact
     tables and fields required.
2. Get your **Base ID**: open your duplicated base, click **Help -> API
   documentation**, and copy the ID starting with `app...`.
3. Get an **API key**: go to
   [airtable.com/create/tokens](https://airtable.com/create/tokens),
   create a Personal Access Token scoped to your base with
   `data.records:read` and `data.records:write` permissions.

## 2. Set up photo uploads (Cloudinary)

1. Create a free account at [cloudinary.com](https://cloudinary.com).
2. From your Cloudinary dashboard, note your **Cloud Name** and **API
   Key**.
3. Go to **Settings -> Upload -> Upload presets -> Add upload preset**, set
   **Signing Mode** to **Unsigned**, and name it `unsigned_upload` (or
   pick your own name — you'll set it as `CLOUDINARY_UPLOAD_PRESET` below
   if so).

## 3. Deploy

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/NoahLMM/spirit-leaderboard)

Clicking this button forks/connects the repo to a new Netlify site and
prompts you for the environment variables below — fill them in with the
values from steps 1–2, no code editing required.

| Variable | Required | What it is |
|---|---|---|
| `AIRTABLE_API_KEY` | Yes | From step 1 |
| `AIRTABLE_BASE_ID` | Yes | From step 1 |
| `CLOUDINARY_API_KEY` | Yes | From step 2 |
| `CLOUDINARY_CLOUD_NAME` | Yes | From step 2 |
| `CLOUDINARY_UPLOAD_PRESET` | No | Only if you named your preset something other than `unsigned_upload` |
| `VITE_SITE_TITLE` | No | Shown in the nav bar/browser tab/Home heading. Defaults to "Spirit Challenge" |
| `VITE_GROUP_LABEL` | No | What to call a member's group — Team, House, Chapter, etc. Defaults to "Team" |
| `VITE_EMAIL_DOMAIN` | No | Your org's email domain, e.g. `acme.org`, used only for placeholder/hint text |
| `VITE_FOOTER_TEXT` | No | An extra line shown in the footer |

To change any of these later, edit them under your Netlify site's **Site
configuration -> Environment variables**, then trigger a new deploy — no
code changes needed either way.

Prefer to swap the logo? Replace [`public/logo.svg`](public/logo.svg)
with your own file of the same name.

## 4. Run your season

This app has no admin panel — day-to-day management happens directly in
Airtable:

- **Add challenges**: add a row to the Challenges table. Check `Is
  Active` to make it live.
- **Approve submissions**: check the `Approved` box on a Submissions row
  once you've reviewed it — only approved submissions count toward points
  and show up publicly.
- **Add members**: add a row to the Members table with their name,
  email, and team.

See [`docs/airtable-schema.md`](docs/airtable-schema.md) for the full
field reference.

## Local development

```bash
npm install
cp .env.example .env   # fill in the values from steps 1–2 above
npx netlify dev         # runs Vite + the Netlify functions together
```

`npm run dev` (Vite alone) also works for frontend-only changes, but the
submit/upload flows need the Netlify functions, so `netlify dev` (via the
[Netlify CLI](https://docs.netlify.com/cli/get-started/)) is recommended
for full local testing.

## Mobile app (advanced)

A Capacitor project for iOS/Android lives in `ios/`/`android/`. This
isn't part of the guided setup above (it requires Xcode/Android Studio),
but if you want to build it after making changes:

```bash
npm run build
npx cap copy
npx cap sync
```

## License

MIT — see [LICENSE](LICENSE).
