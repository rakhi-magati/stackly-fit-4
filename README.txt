STACKLYFIT — Design 4 (Midnight Navy & Azure, real-time)
Pages: index, programs, sports, about (.html), login.html (login.html#signup opens sign-up)
Shared: styles.css, script.js, live.js | Auth: login.css, login.js
Run: open index.html (or VS Code Live Server). Google Fonts need internet.
Colours: navy #0B1730, azure #4C9AFF, cool white #F4F7FB, live green #22D39A, gold #FFB938 (edit :root in styles.css / login.css).

REAL-TIME (live.js)
- Top bar: open/closed status + live Hyderabad clock + "next class" countdown (hours 5 AM-11 PM; edit OPEN/CLOSE).
- Floor traffic gauge, hourly bar chart and "training now" count update every 2.5 s.
- Today's class schedule: Live now / Starts in mm:ss / Completed, spots left, progress bar, Book / cancel (saved in localStorage).
NOTE: traffic numbers and spots-left are SIMULATED from the clock for the demo. Replace occupancy() / SLOTS in live.js with your real API before launch.
Auth is front-end only (localStorage demo).
