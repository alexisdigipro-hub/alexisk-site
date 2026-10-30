# alexisk.gr

Portfolio of Alex Konstantinidis (aka Alex Kayne), director.

- Films live in `data/works.json`; thumbnails in `img/<id>.jpg` (1600w) and `img/<id>-s.jpg` (720w).
- `python3 build.py` turns `template.html` + the data into `index.html`.
- Push to `main`, then Pull/Deploy in Plesk (Websites & Domains > alexisk.gr > Git).

## themadlions.com's work (since 30 Oct 2026)
Alex: "what is on themadlions.com, on alexisk.gr too, and new projects there come here by themselves".
- The films in themadlions.com's admin (Supabase `site_works`, read with its public key) are added after Alex's own
  films in `data/works.json`, skipping a video already here and Behind the Scenes. Titles are tidied ("| Official Music
  Video (4K)" goes, "Artist – Song" becomes "Artist · Song"); Music Videos stay Music Videos, Films become a Films filter,
  everything else (commercials, corporate, events, intros) is Commercials. Thumbnails come from YouTube / Vimeo.
- `python3 build.py --sync` reads them fresh into `data/themadlions.json` and builds; `.github/workflows/sync.yml` does
  it every three hours and pushes only when something changed (Plesk's webhook deploys the push).
- `app.js` reads the same list in the visitor's browser and adds a film added since the last build, at once.
- To keep one of them off alexisk.gr, hide it in themadlions.com's admin, or ask for a skip list.

## Admin (since 30 Oct 2026)
Alex: "a backend like themadlions, to set the order I see the projects in; 25 on the home page, the rest with Show all work".
- https://alexisk.gr/admin/ : sign in with a THEMADLIONS Hub account (hub administrators only). Drag a film to move it
  (on a phone hold it first), the arrow puts it first, the eye hides it. Saved at once in the hub's Supabase table
  `alexisk_site` (one row: `ord` and `hidden`, ids as in `admin/films.json`; SQL in themadlions-projects
  supabase/alexisk_site.sql, already applied).
- The page reads it on every visit (`tml.js` arrange, used by `app.js`), and `build.py --sync` writes it to
  `data/order.json` and builds it into `index.html` every three hours. A film not placed yet (new on themadlions.com)
  comes first; hidden films stay in the page as `.tile.gone` so showing one again is instant.
- The home page shows the first 25 (`SHOW` in tml.js and build.py), the rest behind Show all work.
- `admin/films.json` (every film, written by build.py) is what the admin lists, plus themadlions.com's newest live.
