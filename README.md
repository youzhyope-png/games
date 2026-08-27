# Project Tajinn

A dark neon-green gaming hub. No build step, no dependencies, no server —
plain HTML, CSS and JavaScript.

## Run it

Open `index.html` in any browser. That's it. Works from `file://`, a USB
stick, or any static host (GitHub Pages, Netlify, Vercel).

## Files

```
index.html            page structure only — ~115 lines
css/style.css         all styling, design tokens at the top
js/games.js           THE GAME LIST — edit this to add or change games
js/background.js      the 11-layer animated background
js/app.js             views, routing, search, filters, favorites
games/                real game files go here
single-file/          the whole site as one .html, if you'd rather have that
```

The scripts are plain (not ES modules) and load in this order:
`games.js` → `background.js` → `app.js`. `games.js` defines the data
`app.js` reads, and `background.js` defines `startBackground()`, which
`app.js` calls on boot. Keep that order and everything works from
`file://` with no server.

## Adding a game

**1. Put the files in `games/`:**

```
games/my-game/index.html
```

**2. Point the entry at it** in `js/games.js`:

```js
gameUrl: "COMING_SOON"                    // before
gameUrl: "games/my-game/index.html"       // after
```

That's the only edit. `viewPlay()` in `app.js` checks `gameUrl` — anything
other than `"COMING_SOON"` loads into the real player frame instead of the
placeholder. Cards, search, categories, favorites and recently-played all
keep working untouched.

**To add a brand new game** rather than replacing a placeholder, copy any
entry in the `GAMES` array and change the fields. Every `id` must be unique —
it's used for the URL and to seed that game's generated thumbnail art.

```js
{
  id:"my-game",                  // unique; also seeds the thumbnail
  title:"My Game",
  category:"Arcade",             // must be one of CATEGORIES
  tags:["fast","score"],
  playCount:12000,
  featured:false,
  isNew:true,
  gameUrl:"games/my-game/index.html",
  description:"One or two sentences."
}
```

## Changing the look

Every color, font and radius is a CSS custom property in the `:root` block
at the top of `css/style.css`. Change them there and the whole site follows —
you shouldn't need to touch anything further down for a re-theme.

## Notes

- Thumbnails are generated SVG, seeded from each game's `id`. No image files,
  and the same game always draws the same tile.
- Favorites and recently-played live in `localStorage`, per browser.
- The background is skipped entirely under `prefers-reduced-motion`.
- The only external request is the Google Fonts stylesheet. If it's blocked,
  the page falls back to system fonts and everything else still works.
