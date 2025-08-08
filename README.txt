PixelsSpin — Web Starter
================================

Files
-----
- index.html  — markup with audio + overlays
- style.css   — pixel-styled layout; tweak --reels-y and --spin-y if needed
- main.js     — spin logic, payouts, settings (mute), win popup, localStorage
- assets/     — put your images/mp3s here (see list below)

Required assets (exact names)
-----------------------------
Images:
- assets/slot_frame_bg.png
- assets/treasure_pile.png
- assets/win_popup.png
- assets/cherry.png
- assets/lemon.png
- assets/seven.png
- assets/bar.png

Audio:
- assets/coin_sound.mp3
- assets/slot_machine_realistic_effect.mp3
- assets/victory_jingle.mp3

Run
---
- Open index.html directly, or run a local server:
  python3 -m http.server 8080

Tuning
------
- Adjust reel/button vertical anchors in CSS variables in style.css:
  :root { --reels-y: 45vh; --spin-y: calc(var(--reels-y) + 12vh); }

- Or tweak runtime calculation in main.js (layoutFromFrame() ratios).

Persistence
-----------
- Coins and mute state saved in localStorage (coins capped at 100,000).
