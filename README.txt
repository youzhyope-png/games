PROJECT TAJINN — adding real games
==================================

Each game lives in its own folder here:

    games/
      neon-drift/
        index.html
        (whatever else that game needs)

Then open index.html, find the GAMES array near the top of the
<script> block, and point that game's gameUrl at the folder:

    BEFORE:  gameUrl: "COMING_SOON"
    AFTER:   gameUrl: "games/neon-drift/index.html"

That's the only edit. The player view checks gameUrl: anything other
than "COMING_SOON" gets loaded into the real player frame instead of
the "coming soon" placeholder. Cards, search, categories, favorites,
and recently-played all keep working untouched.

To add a brand new game rather than replacing a placeholder, copy any
existing entry in the GAMES array and change the fields. Every id must
be unique — it's used for the URL and for generating the thumbnail art.
