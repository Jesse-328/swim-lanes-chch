# 🌊 Swim Lanes Ōtautahi

Find the quietest lane swimming across all Christchurch Recreation & Sport pools.

Built for lane swimmers who want calm water — not a crowded pool.

---

## What it does

- Shows all 7 CCC pools ranked by lane availability
- Filter by pool, day (full year), and time of day
- **Update button** — fetches live data from the CCC website on demand
- Tap any pool for a full timeslot breakdown
- Best pool recommendation with quietness score
- Works on mobile like an app (add to home screen)

---

## Deploy in 5 minutes

### Step 1 — Push to GitHub

You should already have this repo on GitHub. If not:

```bash
cd swim-lanes-chch
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/swim-lanes-chch.git
git push -u origin main
```

### Step 2 — Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New → Project**
3. Find `swim-lanes-chch` in your repo list and click **Import**
4. Leave all settings as default — Vercel will auto-detect Vite
5. Click **Deploy**

That's it. In about 60 seconds you'll get a URL like:
```
https://swim-lanes-chch.vercel.app
```

### Step 3 — Share it

Send that URL to anyone. On iPhone, they can tap **Share → Add to Home Screen** and it works like a native app.

---

## How the Update button works

Tapping **Update lanes** calls the serverless function at `/api/lanes.js`.

That function:
1. Fetches the CCC lane availability page server-side (no CORS issues)
2. Parses any lane tables it finds in the HTML
3. Returns the data to your app with a timestamp

If the CCC site is down or changes structure, the app falls back to the estimated weekly patterns gracefully.

---

## Tech stack

| Layer | Tool |
|-------|------|
| Frontend | React + Vite |
| Hosting | Vercel (free tier) |
| Serverless API | Vercel Functions (`/api/lanes.js`) |
| Data | CCC Rec & Sport website + estimated weekly patterns |
| Fonts | Playfair Display + DM Sans (Google Fonts) |

---

## Local development

```bash
npm install
npm run dev
```

The API function won't run locally without the Vercel CLI. To test it locally:

```bash
npm install -g vercel
vercel dev
```

---

## Data notes

Lane counts for **Parakiore** are sourced from actual CCC published data (June 2026).
Other pools use estimated patterns based on typical CCC schedules — they're a good guide but always check with the pool directly.

📞 CCC Rec & Sport: **03 941 6446**
🔗 [recandsport.ccc.govt.nz/swim/lane-availability](https://recandsport.ccc.govt.nz/swim/lane-availability/)

---

## Adding to iPhone home screen

1. Open the URL in Safari
2. Tap the Share button (box with arrow)
3. Tap **Add to Home Screen**
4. Tap **Add**

It'll appear as an app icon with no browser chrome.
