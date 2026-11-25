// Which edition this is. tools/build.mjs replaces this file with editions/<edition>/site.json.
// The defaults here are the adult edition, so site/ runs as it is (python3 -m http.server).
self.EDITION = {
  "name": "Music Academy",
  "slug": "music-academy",
  "audience": "adult",
  "instruments": ["piano", "guitar"],
  "support": "https://www.paypal.me/Pakdad"
};
