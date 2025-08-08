(() => {
  const $ = (sel) => document.querySelector(sel);

  // UI
  const coinsEl   = $("#coins");
  const spinBtn   = $("#spinBtn");
  const reelsEl   = $("#reels");
  const r1 = $("#reel1"), r2 = $("#reel2"), r3 = $("#reel3");
  const sSpin = $("#sSpin"), sCoin = $("#sCoin"), sWin = $("#sWin");
  const winOverlay  = $("#winOverlay");
  const settingsBtn = $("#settingsBtn");
  const settings    = $("#settings");
  const muteToggle  = $("#muteToggle");
  const closeSettings = $("#closeSettings");

  // Sparkle layer (fixed to the viewport so positioning is exact)
  let fxLayer = document.getElementById("fxLayer");
  if (!fxLayer) {
    fxLayer = document.createElement("div");
    fxLayer.id = "fxLayer";
    document.body.appendChild(fxLayer);
  }

  // Data
  const symbols = [
    { id: "cherry", src: "assets/cherry.png" },
    { id: "lemon",  src: "assets/lemon.png"  },
    { id: "seven",  src: "assets/seven.png"  },
    { id: "bar",    src: "assets/bar.png"    },
  ];
  const SPIN_COST   = 100;
  const PAY_JACKPOT = 2000;
  const PAY_TRIPLE  = 300;
  const PAY_DOUBLE  = 100;

  // State
  let coins = clamp(readInt("coins", 10000), 0, 100000);
  let muted = readInt("muted", 0) === 1;

  // Helpers
  function write(key, val) { localStorage.setItem(key, String(val)); }
  function readInt(key, def) {
    const v = localStorage.getItem(key);
    return v == null ? def : (parseInt(v, 10) || def);
  }
  function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }

  function updateCoins(delta) {
    coins = clamp(coins + delta, 0, 100000);
    coinsEl.textContent = coins;
    write("coins", coins);
    coinsEl.parentElement.animate(
      [{ transform: "scale(1)" }, { transform: "scale(1.2)" }, { transform: "scale(1)" }],
      { duration: 250 }
    );
  }

  function setMuted(m) {
    [sSpin, sCoin, sWin].forEach(a => a.muted = !!m);
    muted = !!m;
    write("muted", m ? 1 : 0);
  }

  function pickSymbol() {
    const roll = (Math.random() * 100) | 0;
    if (roll < 8) return "seven";               // tweak to taste
    if (roll < 45) return Math.random() < 0.5 ? "cherry" : "lemon";
    return ["cherry", "lemon", "bar"][(Math.random() * 3) | 0];
  }

  function symSrc(id) { return symbols.find(s => s.id === id).src; }

  // Init
  updateCoins(0);
  setMuted(muted);
  muteToggle.checked = muted;

  // Settings
  muteToggle.addEventListener("change", () => setMuted(muteToggle.checked));
  settingsBtn.addEventListener("click", () => settings.classList.remove("hidden"));
  closeSettings.addEventListener("click", () => settings.classList.add("hidden"));
  settings.addEventListener("click", (e) => { if (e.target === settings) settings.classList.add("hidden"); });

  // Spin
  let spinning = false;
  spinBtn.addEventListener("click", async () => {
    if (spinning) return;
    if (coins < SPIN_COST) return;

    spinning = true;
    updateCoins(-SPIN_COST);

    try { sSpin.currentTime = 0; sSpin.play().catch(() => {}); } catch {}

    const reels = [r1, r2, r3];
    const results = [];
    const spins = [900, 1500, 2200];

    // spin animation
    await Promise.all(
      reels.map((img, i) => new Promise((res) => {
        const start = performance.now();
        const tick = () => {
          const cand = symbols[(Math.random() * symbols.length) | 0];
          img.src = cand.src;

          if (performance.now() - start >= spins[i]) {
            const final = pickSymbol();
            img.src = symSrc(final);
            results[i] = final;
            res();
          } else {
            setTimeout(tick, 90);
          }
        };
        tick();
      }))
    );

    // evaluate
    const counts = {};
    results.forEach(r => counts[r] = (counts[r] || 0) + 1);
    const [maxSym, maxCount] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];

    let payout = 0;
    if (results.every(r => r === "seven")) {
      payout = PAY_JACKPOT;
      showWin();
      try { sWin.currentTime = 0; sWin.play().catch(() => {}); } catch {}
      showReelSparkles([0, 1, 2]);            // all three
    } else if (maxCount === 3) {
      payout = PAY_TRIPLE;
      try { sCoin.currentTime = 0; sCoin.play().catch(() => {}); } catch {}
      showReelSparkles(indicesOf(results, maxSym)); // 3 matches
    } else if (maxCount === 2) {
      payout = PAY_DOUBLE;
      try { sCoin.currentTime = 0; sCoin.play().catch(() => {}); } catch {}
      showReelSparkles(indicesOf(results, maxSym)); // 2 matches
    }
    if (payout > 0) updateCoins(payout);

    spinning = false;
  });

  function indicesOf(arr, val) {
    const out = [];
    arr.forEach((v, i) => { if (v === val) out.push(i); });
    return out;
  }

  function showWin() {
    winOverlay.classList.remove("hidden");
    winOverlay.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, fill: "forwards" });
    setTimeout(() => {
      winOverlay.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: "forwards" })
        .addEventListener("finish", () => winOverlay.classList.add("hidden"));
    }, 1000);
  }

  // ------- Sparkles exactly over winning reels --------
  function showReelSparkles(matchedIdx) {
    if (!matchedIdx || matchedIdx.length < 2) return; // no sparkles unless 2+ match

    const reelImgs = [r1, r2, r3];
    matchedIdx.forEach((idx) => {
      const img = reelImgs[idx];
      const rect = img.getBoundingClientRect();
      // size ~1.8x the reel width (tune to your taste)
      const size = Math.max(rect.width, rect.height) * 1.8;

      const spark = document.createElement("div");
      spark.className = "spark";
      spark.style.width  = `${size}px`;
      spark.style.height = `${size}px`;
      spark.style.left   = `${rect.left + rect.width / 2 - size / 2}px`;
      spark.style.top    = `${rect.top  + rect.height/ 2 - size / 2}px`;

      fxLayer.appendChild(spark);

      spark.animate(
        [
          { transform: "scale(0.75)", opacity: 0.0 },
          { transform: "scale(1.15)", opacity: 1.0, offset: 0.35 },
          { transform: "scale(1.00)", opacity: 0.0 }
        ],
        { duration: 850, easing: "ease-out" }
      ).addEventListener("finish", () => spark.remove());
    });
  }

  // ------- Rough placement of reels & spin button inside your frame -------
  function layoutFromFrame() {
    const bg = document.getElementById("bg");
    const rect = bg.getBoundingClientRect();

    // tweak these to match your artwork’s openings
    const reelsY = rect.top + rect.height * 0.46;
    const spinY  = rect.top + rect.height * 0.69;

    reelsEl.style.top = `${reelsY}px`;
    spinBtn.style.top = `${spinY}px`;
  }
  window.addEventListener("resize", layoutFromFrame);
  window.addEventListener("load", layoutFromFrame);
  layoutFromFrame();
})();
