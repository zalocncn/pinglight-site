# pinglight-site

Marketing site for **Pinglight** — an honest Bluetooth awareness radar for iOS.
See what's broadcasting.

Live: https://pinglight.app

## Shape

Fully static — no build step, no framework, no third-party bytes.

```
index.html        Landing: hero, stats, three reading sections, sticky phone
                  rail paging through 5 real app screens, price card, footer.
privacy.html      The app collects nothing; this says so precisely.
terms.html        Custom EULA (Apple-required provisions + no-detection-
                  guarantee clause).
styles.css        All styling. System monospace stack — zero font files.
app.js            The phone rail. Scroll-driven on desktop, timed on mobile,
                  manual forever once touched. CSP-clean (no inline anything).
screens/          1290×2796 simulator screenshots from ../pinglight/docs/screens.
vercel.json       cleanUrls + strict CSP (default-src 'none'), HSTS, etc.
favicon.svg,      Radar mark. PNGs rendered from the same geometry
icon-*.png        (scratch script, PIL).
```

## Security posture

Mirrors pocketvetogame.com: `default-src 'none'`, `script-src 'self'`,
`style-src 'self'`, no external requests of any kind, no inline scripts or
styles, HSTS preload, X-Frame-Options DENY. The site makes the same promise
the app does.

## Copy law (from the app's README)

1. Never claim detection of recording, listening, spying, or tracking —
   "broadcast consistent with …" only.
2. Every identification language carries a confidence level.
3. Limits are stated on the landing page, not buried.

## Deploy

Vercel project `pinglight-site`. `vercel --prod` from the repo root.

## TODO

- Replace the `href="#"` App Store pill in index.html once the app is live
  in App Store Connect (marked with a TODO comment).
