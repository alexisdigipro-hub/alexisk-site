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
