import { Game } from './core/game.js';
import { setupHUD } from './ui/hud.js';
import { SaveSystem } from './persistence/save-game.js';
import { BIKES } from './data/bikes.js';
import { TRACKS } from './data/tracks.js';
import { CrazySDK } from './integrations/crazygames.js';
import { initMenuBackground } from './ui/menu-bg.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Init CrazyGames SDK (no-ops on non-CG domains)
  await CrazySDK.init();

  // Start animated menu background
  initMenuBackground();
  CrazySDK.loadingStart();

  const container = document.getElementById('game-container');
  
  // Setup UI elements
  setupHUD();
  
  function playBtnClick() {
    if (game.audio) game.audio.playClick();
  }
  
  document.querySelectorAll("button").forEach(b => b.addEventListener("click", playBtnClick));
  
  // Initialize game
  const game = new Game(container);
  CrazySDK.loadingStop();

  // ── Audio mute handling ──
  // Check URL query param ?muteAudio=true (works standalone and with SDK)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('muteAudio') === 'true') {
    game.audio.mute();
  }

  // Respect CrazyGames mute setting (SDK-based)
  const cgSettings = CrazySDK.getSettings();
  if (cgSettings.muteAudio && game.audio) game.audio.mute();
  CrazySDK.onSettingsChange((s) => {
    if (s.muteAudio) game.audio.mute();
    else game.audio.unmute();
  });

  // Mute toggle UI (syncs both HUD and menu buttons)
  function updateMuteButtons() {
    const icon = game.audio.muted ? '🔇' : '🔊';
    const btnHud = document.getElementById('btn-mute');
    const btnMenu = document.getElementById('btn-mute-menu');
    if (btnHud) btnHud.textContent = icon;
    if (btnMenu) btnMenu.textContent = icon;
  }
  updateMuteButtons();

  function handleMuteClick() {
    game.audio.toggleMute();
    updateMuteButtons();
    // Persist mute preference
    const state = SaveSystem.load();
    state.settings = state.settings || {};
    state.settings.muted = game.audio.muted;
    SaveSystem.save(state);
  }

  document.getElementById('btn-mute')?.addEventListener('click', handleMuteClick);
  document.getElementById('btn-mute-menu')?.addEventListener('click', handleMuteClick);

  // Restore saved mute preference
  const savedState = SaveSystem.load();
  if (savedState.settings?.muted) {
    game.audio.mute();
    updateMuteButtons();
  }

  // ── CG Username display ──
  (async () => {
    const user = await CrazySDK.getUser();
    if (user?.username) {
      const el = document.getElementById('cg-user');
      if (el) {
        el.textContent = `👤 ${user.username}`;
        el.style.display = 'block';
      }
    }
  })();

  // ── Device-specific adjustments ──
  const sysInfo = CrazySDK.getSystemInfo();
  if (sysInfo?.device?.type === 'mobile') {
    // Reduce quality for mobile devices
    if (game.sceneManager?.renderer) {
      game.sceneManager.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    }
  }

  // ── Ad helper functions ──
  function muteForAd() { game.audio.mute(); }
  function unmuteAfterAd() {
    const state = SaveSystem.load();
    if (!state.settings?.muted) game.audio.unmute();
    updateMuteButtons();
  }

  // ── Banner management ──
  function showMenuBanners() {
    CrazySDK.requestBanner('banner-menu', 300, 250);
  }
  function showGameOverBanners() {
    CrazySDK.requestBanner('banner-gameover', 728, 90);
  }
  function clearGameBanners() {
    CrazySDK.clearAllBanners();
  }

  // Show banners on initial menu
  showMenuBanners();

  function updateMenuCoins() {
    const state = SaveSystem.load();
    document.getElementById('menu-coins').innerText = state.coins;
    document.getElementById('garage-coins').innerText = state.coins;
  }
  updateMenuCoins();

  // ── Camera toggle button (for mobile) ──
  document.getElementById('btn-camera')?.addEventListener('click', () => {
    window.dispatchEvent(new Event('toggle-camera'));
  });

  // Helper: show/hide touch controls
  function showTouchControls() {
    if (game.touchConfig) game.touchConfig.show();
  }
  function hideTouchControls() {
    if (game.touchConfig) game.touchConfig.hide();
  }

  // Setup UI event listeners
  document.getElementById('btn-start').addEventListener('click', () => {
    document.getElementById('menu-start').classList.remove('active');
    document.getElementById('menu-start').classList.add('hidden');
    
    document.getElementById('hud-playing').classList.remove('hidden');
    document.getElementById('hud-playing').classList.add('active');
    
    clearGameBanners();
    showTouchControls();

    // Refresh stats from whatever bike is selected
    const state = SaveSystem.load();
    game.applyBikeStats(state.currentBike);
    const tId = state.currentTrack || 'city';
    if (TRACKS[tId]) {
      if (game.sceneManager.applyTrackColors) game.sceneManager.applyTrackColors(TRACKS[tId]);
      if (game.roadManager.applyTrackColors) game.roadManager.applyTrackColors(TRACKS[tId]);
    }

    game.start();
    CrazySDK.gameplayStart();
  });
  
  document.getElementById('btn-restart').addEventListener('click', () => {
    document.getElementById('menu-gameover').classList.remove('active');
    document.getElementById('menu-gameover').classList.add('hidden');
    
    document.getElementById('hud-playing').classList.remove('hidden');
    document.getElementById('hud-playing').classList.add('active');
    
    clearGameBanners();
    document.getElementById('btn-double-coins').style.display = 'none';
    showTouchControls();

    game.reset();
    game.start();
    CrazySDK.gameplayStart();
  });

  document.getElementById('btn-to-main').addEventListener('click', () => {
    document.getElementById('menu-gameover').classList.remove('active');
    document.getElementById('menu-gameover').classList.add('hidden');
    document.getElementById('menu-start').classList.remove('hidden');
    document.getElementById('menu-start').classList.add('active');
    updateMenuCoins();
    game.reset();
    CrazySDK.gameplayStop();
    clearGameBanners();
    document.getElementById('btn-double-coins').style.display = 'none';
    hideTouchControls();
    showMenuBanners();
  });

  // ── Rewarded ad: double coins ──
  document.getElementById('btn-double-coins')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-double-coins');
    btn.disabled = true;
    btn.textContent = 'Loading ad...';
    const result = await CrazySDK.requestRewardedAd(muteForAd, unmuteAfterAd);
    if (result.success) {
      const bonus = window._lastSessionCoins || 0;
      const state = SaveSystem.load();
      state.coins += bonus;
      SaveSystem.save(state);
      document.getElementById('final-coins').textContent = bonus * 2;
      btn.textContent = '✅ DOUBLED!';
      btn.disabled = true;
      updateMenuCoins();
    } else {
      btn.textContent = '🎬 DOUBLE COINS';
      btn.disabled = false;
    }
  });

  document.getElementById('btn-garage').addEventListener('click', () => {
    document.getElementById('menu-start').classList.remove('active');
    document.getElementById('menu-start').classList.add('hidden');
    document.getElementById('menu-garage').classList.remove('hidden');
    document.getElementById('menu-garage').classList.add('active');
    clearGameBanners();
    game.setGarageMode(true);
    renderGarage();
    setTimeout(() => document.querySelectorAll(".btn-select, .btn-buy, .btn-upgrade").forEach(b => b.addEventListener("click", playBtnClick)), 50);
  });

  document.getElementById('btn-garage-back').addEventListener('click', () => {
    document.getElementById('menu-garage').classList.remove('active');
    document.getElementById('menu-garage').classList.add('hidden');
    document.getElementById('menu-start').classList.remove('hidden');
    document.getElementById('menu-start').classList.add('active');
    game.setGarageMode(false);
    updateMenuCoins();
    showMenuBanners();
  });

  document.getElementById('btn-missions').addEventListener('click', () => {
    document.getElementById('menu-start').classList.remove('active');
    document.getElementById('menu-start').classList.add('hidden');
    document.getElementById('menu-missions').classList.remove('hidden');
    document.getElementById('menu-missions').classList.add('active');
    renderMissions();
  });

  function renderMissions() {
    const state = SaveSystem.load();
    const container = document.getElementById('missions-list-container');
    container.innerHTML = '';

    const activeMissions = game.missionManager ? game.missionManager.getActiveMissions() : (state.activeMissions || []);
    if (activeMissions.length > 0) {
      activeMissions.forEach(m => {
        const progress = Math.floor(m.progress);
        const target = m.target;
        const pct = Math.min(100, Math.floor((progress / target) * 100));
        const done = m.completed;

        const div = document.createElement('div');
        div.style.cssText = 'background: rgba(0,0,0,0.5); border: 1px solid ' + (done ? '#00ff88' : '#ff00ff') + '; padding: 20px; border-radius: 10px; position: relative;';
        div.innerHTML = `
          <p style="font-size: 24px; color: ${done ? '#00ff88' : '#00ffff'}; margin: 0 0 10px 0; text-align: left;">${m.title}</p>
          <div style="width: 100%; height: 20px; background: rgba(255,255,255,0.1); border-radius: 10px; overflow: hidden; position: relative;">
            <div style="width: ${pct}%; height: 100%; background: ${done ? 'linear-gradient(90deg, #00ff88, #00cc66)' : 'linear-gradient(90deg, #ff00ff, #00ffff)'}; transition: width 0.3s;"></div>
            <div style="position: absolute; top:0; left:0; width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:white; font-size:14px; font-weight:bold; text-shadow: 1px 1px 2px #000;">${done ? 'COMPLETE!' : progress + ' / ' + target}</div>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top: 10px;">
            <p style="margin: 0; color: #ffcc00; font-size: 18px;">Reward: ${m.rewardCoins} Coins</p>
            ${done ? '<button class="btn-redeem" data-idref="' + m.idRef + '" style="background: linear-gradient(45deg, #00cc66, #00ff88); color: #000; border: none; padding: 10px 24px; border-radius: 8px; font-size: 18px; font-weight: bold; cursor: pointer;">REDEEM</button>' : '<span style="color: #888; font-size: 14px;">In Progress</span>'}
          </div>
        `;
        container.appendChild(div);
      });

      // Attach redeem handlers
      container.querySelectorAll('.btn-redeem').forEach(btn => {
        btn.addEventListener('click', (e) => {
          playBtnClick();
          const idRef = parseFloat(e.target.getAttribute('data-idref'));
          const reward = game.missionManager.redeemMission(idRef);
          if (reward > 0) {
            updateMenuCoins();
            renderMissions(); // re-render to show next tier mission
            CrazySDK.happytime();
          }
        });
      });
    } else {
      container.innerHTML = '<div style="color:white; font-size:24px;">No active missions</div>';
    }
  }

  document.getElementById('btn-missions-back').addEventListener('click', () => {
    document.getElementById('menu-missions').classList.remove('active');
    document.getElementById('menu-missions').classList.add('hidden');
    document.getElementById('menu-start').classList.remove('hidden');
    document.getElementById('menu-start').classList.add('active');
  });

  let currentGarageIndex = 0;

  function renderGarage() {
    const list = Object.values(BIKES);
    const state = SaveSystem.load();
    const bike = list[currentGarageIndex];

    const isUnlocked = state.unlockedBikes.includes(bike.id);
    const isSelected = state.currentBike === bike.id;

    const currentUpgrade = (state.upgrades && state.upgrades[bike.id]) ? state.upgrades[bike.id] : 0;
    const maxUpgrades = bike.maxUpgrades || 5;
    const upgradeCost = 200 + (currentUpgrade * 300);
    const canAffordUpgrade = state.coins >= upgradeCost && currentUpgrade < maxUpgrades;

    // Auto-update model via Game
    // We assume game has previewBike method
    game.previewBike(bike.id);

    const panel = document.getElementById('bike-info-panel');

    let btnHtml = '';
    if (isSelected) {
      btnHtml = `<button disabled style="background:#00ffaa; color:#000; width:100%; margin-top:20px; font-size:24px; padding:15px;">SELECTED</button>`;
    } else if (isUnlocked) {
      btnHtml = `<button class="btn-select" data-id="${bike.id}" style="width:100%; margin-top:20px; font-size:24px; padding:15px;">SELECT</button>`;
    } else {
      const canAfford = state.coins >= bike.cost;
      btnHtml = `<button class="btn-buy" data-id="${bike.id}" data-cost="${bike.cost}" ${!canAfford ? 'disabled' : ''} style="background:${canAfford ? '#00aaff' : '#555'}; width:100%; margin-top:20px; font-size:24px; padding:15px;">BUY (${bike.cost})</button>`;
    }

    let upgradeHtml = '';
    if (isUnlocked) {
      if (currentUpgrade < maxUpgrades) {
        upgradeHtml = `<button class="btn-upgrade" data-id="${bike.id}" data-cost="${upgradeCost}" ${!canAffordUpgrade ? 'disabled' : ''} style="margin-top:10px; width:100%; font-size:20px; background:${canAffordUpgrade ? '#ff00aa' : '#555'};">UPGRADE (${upgradeCost})</button>`;
      } else {
        upgradeHtml = `<button disabled style="margin-top:10px; width:100%; font-size:20px; background:#444;">MAX UPGRADED</button>`;
      }
    } else {
      upgradeHtml = `<div style="margin-top:10px; text-align:center; color:#888;">Unlock to Upgrade</div>`;
    }

    const panelHtml = `
      <h2 style="margin: 0 0 10px 0; color: #fff; font-size: 36px; text-transform: uppercase;">${bike.name}</h2>
      ${isUnlocked ? '<div style="color:#00ffaa; font-weight:bold; margin-bottom: 20px;">OWNED</div>' : '<div style="color:#ff5555; font-weight:bold; margin-bottom: 20px;">LOCKED</div>'}
      
      <div style="width: 100%; margin-bottom:15px;">
        <div style="display:flex; justify-content:space-between; color:rgba(255,255,255,0.7);">
          <span style="text-align: left;">TOP SPEED</span>
          <span>${Math.round(bike.topSpeed * (1 + currentUpgrade * 0.05))} km/h</span>
        </div>
        <div class="bar-bg" style="width: 100%; background:rgba(255,255,255,0.1);"><div class="bar-fill" style="width: ${Math.min(100, (bike.topSpeed * (1 + currentUpgrade * 0.05)) / 250 * 100)}%;"></div></div>
      </div>
      
      <div style="width: 100%; margin-bottom:15px;">
        <div style="display:flex; justify-content:space-between; color:rgba(255,255,255,0.7);">
          <span style="text-align: left;">ACCELERATION</span>
          <span>${(bike.acceleration * (1 + currentUpgrade * 0.05)).toFixed(1)}</span>
        </div>
        <div class="bar-bg" style="width: 100%; background:rgba(255,255,255,0.1);"><div class="bar-fill" style="width: ${Math.min(100, (bike.acceleration * (1 + currentUpgrade * 0.05)) / 60 * 100)}%;"></div></div>
      </div>

      <div style="width: 100%; margin-bottom:15px;">
        <div style="display:flex; justify-content:space-between; color:rgba(255,255,255,0.7);">
          <span style="text-align: left;">HANDLING</span>
          <span>${(bike.handling * (1 + currentUpgrade * 0.02)).toFixed(1)}</span>
        </div>
        <div class="bar-bg" style="width: 100%; background:rgba(255,255,255,0.1);"><div class="bar-fill" style="width: ${Math.min(100, (bike.handling * (1 + currentUpgrade * 0.02)) / 28 * 100)}%;"></div></div>
      </div>

      <div style="width: 100%; margin-bottom:15px;">
        <div style="display:flex; justify-content:space-between; color:rgba(255,255,255,0.7);">
          <span style="text-align: left;">FUEL CAPACITY</span>
          <span>${(bike.fuelCapacity * (1 + currentUpgrade * 0.03)).toFixed(2)}</span>
        </div>
        <div class="bar-bg" style="width: 100%; background:rgba(255,255,255,0.1);"><div class="bar-fill" style="width: ${Math.min(100, (bike.fuelCapacity * (1 + currentUpgrade * 0.03)) / 2.5 * 100)}%; background: #ffcc00;"></div></div>
      </div>

      <div style="margin-bottom:15px; text-align:center; color:rgba(255,255,255,0.5); font-size:14px;">
        UPGRADE LEVEL: ${currentUpgrade} / ${maxUpgrades}
      </div>

      ${btnHtml}
      ${upgradeHtml}
    `;

    panel.innerHTML = panelHtml;

    // Remove old listeners to avoid memory leak / multiple triggers
    const selBtn = panel.querySelector('.btn-select');
    if (selBtn) selBtn.onclick = () => {
      state.currentBike = bike.id;
      SaveSystem.save(state);
      game.applyBikeStats(bike.id);
      renderGarage();
      playBtnClick();
    };

    const upBtn = panel.querySelector('.btn-upgrade');
    if (upBtn) upBtn.onclick = () => {
      if (state.coins >= upgradeCost) {
        state.coins -= upgradeCost;
        if (!state.upgrades) state.upgrades = {};
        if (!state.upgrades[bike.id]) state.upgrades[bike.id] = 0;
        state.upgrades[bike.id]++;
        SaveSystem.save(state);
        updateMenuCoins();
        game.applyBikeStats(state.currentBike);
        renderGarage();
        playBtnClick();
      }
    };

    const buyBtn = panel.querySelector('.btn-buy');
    if (buyBtn) buyBtn.onclick = () => {
      if (state.coins >= bike.cost) {
        state.coins -= bike.cost;
        state.unlockedBikes.push(bike.id);
        state.currentBike = bike.id;
        SaveSystem.save(state);
        updateMenuCoins();
        game.applyBikeStats(bike.id);
        renderGarage();
        playBtnClick();
      }
    };

    // Set color picker
    const colorPicker = document.getElementById('garage-color-picker');
    let defaultColor = '#ff0000';
    if (bike.color !== undefined) {
      defaultColor = '#' + bike.color.toString(16).padStart(6, '0');
    }
    colorPicker.value = (state.customColors && state.customColors[bike.id]) ? state.customColors[bike.id] : defaultColor;
    colorPicker.onchange = (e) => {
      const rgb = e.target.value;
      if (!state.customColors) state.customColors = {};
      state.customColors[bike.id] = rgb;
      SaveSystem.save(state);
      // Immediately reflect
      game.previewBike(bike.id);
    };
  }

  // Setup navigation buttons outside the render so they don't re-bind continuously
  // This will be called once on load
  document.getElementById('btn-next-bike').addEventListener('click', () => {
    playBtnClick();
    const list = Object.values(BIKES);
    currentGarageIndex = (currentGarageIndex + 1) % list.length;
    renderGarage();
  });

  document.getElementById('btn-prev-bike').addEventListener('click', () => {
    playBtnClick();
    const list = Object.values(BIKES);
    currentGarageIndex = (currentGarageIndex - 1 + list.length) % list.length;
    renderGarage();
  });

  document.getElementById('btn-tracks').addEventListener('click', () => {
    document.getElementById('menu-start').classList.remove('active');
    document.getElementById('menu-start').classList.add('hidden');
    document.getElementById('menu-tracks').classList.remove('hidden');
    document.getElementById('menu-tracks').classList.add('active');
    playBtnClick();
    renderTracks();
  });

  document.getElementById('btn-tracks-back').addEventListener('click', () => {
    document.getElementById('menu-tracks').classList.remove('active');
    document.getElementById('menu-tracks').classList.add('hidden');
    document.getElementById('menu-start').classList.remove('hidden');
    document.getElementById('menu-start').classList.add('active');
    playBtnClick();
    updateMenuCoins();
  });

  function renderTracks() {
    const state = SaveSystem.load();
    document.getElementById('tracks-coins').innerText = state.coins;
    
    const trackList = document.getElementById('track-list');
    trackList.innerHTML = '';
    
    Object.keys(TRACKS).forEach(trackId => {
      const track = TRACKS[trackId];
      // ensure backward compat for saves before tracks were added
      if (!state.unlockedTracks) {
        state.unlockedTracks = ['city'];
        state.currentTrack = 'city';
      }
      
      const isUnlocked = state.unlockedTracks.includes(trackId);
      const isSelected = state.currentTrack === trackId;
      
      const div = document.createElement('div');
      
      let thumbBg = '';
      if (trackId === 'city') thumbBg = 'linear-gradient(to bottom, #112233 40%, #87CEEB 80%, #333333)';
      else if (trackId === 'desert') thumbBg = 'linear-gradient(to bottom, #aa5522 40%, #ffaa55 80%, #443322)';
      else if (trackId === 'forest') thumbBg = 'linear-gradient(to bottom, #113311 40%, #557799 80%, #2d3028)';
      else if (trackId === 'ice') thumbBg = 'linear-gradient(to bottom, #88aabb 40%, #ddeeff 80%, #ffffff)';
      
      div.style.cssText = `background: rgba(0,0,0,0.8); border: 2px solid ${isSelected ? '#00ffaa' : isUnlocked ? '#aaa' : '#555'}; border-radius: 10px; width: 250px; text-align: center; display: flex; flex-direction: column; box-shadow: 0 5px 15px rgba(0,0,0,0.5); overflow: hidden;`;
      
      const thumbHtml = `<div style="height: 100px; width: 100%; background: ${thumbBg}; display: flex; align-items:flex-end; justify-content:center; padding-bottom:10px;">
         <span style="background: rgba(0,0,0,0.5); padding: 5px 10px; border-radius: 5px; font-weight: bold; color:white; font-family: 'Orbitron', sans-serif;">${track.name}</span>
      </div>`;
      
      let btnHtml = '';
      if (isSelected) {
        btnHtml = `<button disabled style="background: #008800; border: 1px solid #00ff00; padding: 10px; font-weight: bold; color: white;">SELECTED</button>`;
      } else if (isUnlocked) {
        btnHtml = `<button class="btn-select-track" data-id="${trackId}" style="background: linear-gradient(45deg, #222, #444); border: 1px solid #aaa; padding: 10px; cursor: pointer; color: white; font-weight: bold;">SELECT</button>`;
      } else {
        btnHtml = `<button class="btn-buy-track" data-id="${trackId}" data-cost="${track.cost}" style="background: linear-gradient(45deg, #664400, #aa6600); border: 1px solid #ffcc00; padding: 10px; cursor: pointer; color: white; font-weight: bold;">BUY: ${track.cost} COINS</button>`;
      }
      
      div.innerHTML = `
        ${thumbHtml}
        <div style="padding: 15px; display: flex; flex-direction: column; gap: 10px; flex-grow: 1;">
           <p style="margin:0; color: #aaa; font-size: 14px;">Coin Multiplier: <span style="color: #ffcc00; font-weight:bold;">${track.coinMultiplier}x</span></p>
           <div style="flex-grow: 1;"></div>
           ${btnHtml}
        </div>
      `;
      trackList.appendChild(div);
    });
    
    document.querySelectorAll('.btn-buy-track').forEach(btn => {
      btn.addEventListener('click', (e) => {
        playBtnClick();
        const id = e.target.getAttribute('data-id');
        const cost = parseInt(e.target.getAttribute('data-cost'));
        const st = SaveSystem.load();
        if (st.coins >= cost) {
          st.coins -= cost;
          st.unlockedTracks.push(id);
          st.currentTrack = id;
          SaveSystem.save(st);
          renderTracks();
          if (game.sceneManager && typeof game.sceneManager.applyTrackColors === 'function') {
            game.sceneManager.applyTrackColors(TRACKS[id]);
          }
          if (game.roadManager && typeof game.roadManager.applyTrackColors === 'function') {
            game.roadManager.applyTrackColors(TRACKS[id]);
          }
        }
      });
    });
    
    document.querySelectorAll('.btn-select-track').forEach(btn => {
      btn.addEventListener('click', (e) => {
        playBtnClick();
        const id = e.target.getAttribute('data-id');
        const st = SaveSystem.load();
        st.currentTrack = id;
        SaveSystem.save(st);
        renderTracks();
        if (game.sceneManager && typeof game.sceneManager.applyTrackColors === 'function') {
          game.sceneManager.applyTrackColors(TRACKS[id]);
        }
        if (game.roadManager && typeof game.roadManager.applyTrackColors === 'function') {
          game.roadManager.applyTrackColors(TRACKS[id]);
        }
      });
    });
  }

  // ── DAILY REWARDS ──
  document.getElementById('btn-daily').addEventListener('click', () => {
    document.getElementById('menu-start').classList.remove('active');
    document.getElementById('menu-start').classList.add('hidden');
    document.getElementById('menu-daily').classList.remove('hidden');
    document.getElementById('menu-daily').classList.add('active');
    playBtnClick();
    renderDaily();
  });

  document.getElementById('btn-daily-back').addEventListener('click', () => {
    document.getElementById('menu-daily').classList.remove('active');
    document.getElementById('menu-daily').classList.add('hidden');
    document.getElementById('menu-start').classList.remove('hidden');
    document.getElementById('menu-start').classList.add('active');
    playBtnClick();
    updateMenuCoins();
  });

  function renderDaily() {
    const container = document.getElementById('daily-content');
    container.innerHTML = '';
    const dm = game.dailyManager;

    // ── Login Reward Section ──
    const login = dm.getLoginStatus();
    const loginDiv = document.createElement('div');
    loginDiv.style.cssText = 'background: rgba(0,0,0,0.6); border: 1px solid #ffcc00; border-radius: 12px; padding: 20px;';
    loginDiv.innerHTML = `
      <h2 style="color:#ffcc00; margin:0 0 10px 0; font-size:22px;">LOGIN REWARD</h2>
      <p style="color:#aaa; margin:0 0 10px 0; font-size:14px;">Day ${login.dayInCycle} of 7 &nbsp;|&nbsp; Streak: ${login.streak} days</p>
      <div style="display:flex; gap:8px; margin-bottom:15px; flex-wrap:wrap;">
        ${[1, 2, 3, 4, 5, 6, 7].map(d => {
      const isToday = d === login.dayInCycle;
      const isPast = d < login.dayInCycle || login.alreadyClaimed;
      const bg = isToday && !login.alreadyClaimed ? '#ffcc00' : isToday && login.alreadyClaimed ? '#448844' : isPast ? '#334433' : '#222';
      const color = isToday && !login.alreadyClaimed ? '#000' : isPast ? '#88aa88' : '#666';
      const rewards = [100, 150, 200, 300, 500, 750, 1500];
      return '<div style="width:70px; text-align:center; padding:8px 4px; border-radius:8px; background:' + bg + '; color:' + color + '; font-size:12px; border:1px solid ' + (isToday ? '#ffcc00' : '#333') + ';"><div style="font-weight:bold;">Day ' + d + '</div><div>' + rewards[d - 1] + '</div></div>';
    }).join('')}
      </div>
      ${login.canClaim
        ? '<button id="btn-claim-login" style="background:linear-gradient(45deg,#cc9900,#ffcc00); color:#000; border:none; padding:12px 30px; border-radius:8px; font-size:18px; font-weight:bold; cursor:pointer;">CLAIM ' + login.reward.coins + ' COINS</button>'
        : '<div style="color:#88aa88; font-size:16px; font-weight:bold;">Already claimed today!</div>'}
    `;
    container.appendChild(loginDiv);

    if (login.canClaim) {
      loginDiv.querySelector('#btn-claim-login').addEventListener('click', () => {
        playBtnClick();
        dm.claimLoginReward();
        updateMenuCoins();
        renderDaily();
      });
    }

    // ── Streak Milestones ──
    const milestones = dm.getStreakMilestones();
    const streakDiv = document.createElement('div');
    streakDiv.style.cssText = 'background: rgba(0,0,0,0.6); border: 1px solid #ff8800; border-radius: 12px; padding: 20px;';
    streakDiv.innerHTML = `
      <h2 style="color:#ff8800; margin:0 0 10px 0; font-size:22px;">STREAK MILESTONES</h2>
      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        ${milestones.map(m => {
      const canClaim = m.reached && !m.claimed;
      const bg = m.claimed ? '#334433' : canClaim ? '#442200' : '#1a1a1a';
      const border = canClaim ? '#ff8800' : m.claimed ? '#336633' : '#333';
      return '<div style="padding:12px 16px; border-radius:8px; background:' + bg + '; border:1px solid ' + border + '; text-align:center; min-width:100px;">'
        + '<div style="color:' + (m.claimed ? '#88aa88' : canClaim ? '#ffcc00' : '#555') + '; font-size:13px; font-weight:bold;">' + m.label + '</div>'
        + '<div style="color:' + (m.claimed ? '#668866' : '#aaa') + '; font-size:16px; margin:4px 0;">' + m.coins + '</div>'
        + (canClaim ? '<button class="btn-claim-streak" data-days="' + m.days + '" style="background:#ff8800; color:#000; border:none; padding:6px 14px; border-radius:6px; font-size:12px; font-weight:bold; cursor:pointer; margin-top:4px;">CLAIM</button>'
          : m.claimed ? '<div style="color:#668866; font-size:11px;">Claimed</div>'
            : '<div style="color:#444; font-size:11px;">' + m.days + ' days</div>')
        + '</div>';
    }).join('')}
      </div>
    `;
    container.appendChild(streakDiv);

    streakDiv.querySelectorAll('.btn-claim-streak').forEach(btn => {
      btn.addEventListener('click', (e) => {
        playBtnClick();
        const days = parseInt(e.target.getAttribute('data-days'));
        dm.claimStreakMilestone(days);
        updateMenuCoins();
        renderDaily();
      });
    });

    // ── Daily Tasks ──
    const tasks = dm.getDailyTasks();
    const taskDiv = document.createElement('div');
    taskDiv.style.cssText = 'background: rgba(0,0,0,0.6); border: 1px solid #00ccff; border-radius: 12px; padding: 20px;';
    let taskHtml = '<h2 style="color:#00ccff; margin:0 0 10px 0; font-size:22px;">DAILY TASKS</h2>';
    taskHtml += '<p style="color:#667; font-size:12px; margin:0 0 10px 0;">Refreshes daily. Bonus tasks have higher rewards!</p>';

    tasks.forEach(t => {
      const pct = Math.min(100, Math.floor((t.progress / t.target) * 100));
      const done = t.completed;
      const redeemed = t.redeemed;
      const barColor = t.isBonus ? 'linear-gradient(90deg, #ff8800, #ffcc00)' : 'linear-gradient(90deg, #0088ff, #00ccff)';
      const borderColor = redeemed ? '#336633' : done ? '#00ff88' : t.isBonus ? '#ff8800' : '#00ccff';

      taskHtml += '<div style="background:rgba(0,0,0,0.4); border:1px solid ' + borderColor + '; padding:14px; border-radius:8px; margin-bottom:10px;">';
      taskHtml += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">';
      taskHtml += '<span style="color:' + (redeemed ? '#668866' : done ? '#00ff88' : t.isBonus ? '#ffcc00' : '#00ccff') + '; font-size:16px; font-weight:bold;">' + t.title + '</span>';
      taskHtml += '<span style="color:#ffcc00; font-size:14px;">' + t.reward + ' Coins</span>';
      taskHtml += '</div>';
      taskHtml += '<div style="width:100%; height:14px; background:rgba(255,255,255,0.08); border-radius:7px; overflow:hidden; position:relative;">';
      taskHtml += '<div style="width:' + pct + '%; height:100%; background:' + (redeemed ? '#336633' : barColor) + '; transition:width 0.3s;"></div>';
      taskHtml += '<div style="position:absolute; top:0; left:0; width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:white; font-size:10px; font-weight:bold; text-shadow:1px 1px 2px #000;">' + (redeemed ? 'REDEEMED' : done ? 'COMPLETE!' : Math.floor(t.progress) + ' / ' + t.target) + '</div>';
      taskHtml += '</div>';
      if (done && !redeemed) {
        taskHtml += '<button class="btn-redeem-daily" data-task-id="' + t.id + '" style="background:linear-gradient(45deg,#00cc66,#00ff88); color:#000; border:none; padding:8px 20px; border-radius:6px; font-size:14px; font-weight:bold; cursor:pointer; margin-top:8px;">REDEEM</button>';
      }
      taskHtml += '</div>';
    });

    taskDiv.innerHTML = taskHtml;
    container.appendChild(taskDiv);

    taskDiv.querySelectorAll('.btn-redeem-daily').forEach(btn => {
      btn.addEventListener('click', (e) => {
        playBtnClick();
        const taskId = parseInt(e.target.getAttribute('data-task-id'));
        dm.redeemDailyTask(taskId);
        updateMenuCoins();
        renderDaily();
      });
    });
  }

  // Show daily reward popup on first load if claimable
  setTimeout(() => {
    const dm = game.dailyManager;
    const login = dm.getLoginStatus();
    if (login.canClaim) {
      const popup = document.createElement('div');
      popup.style.cssText = 'position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); z-index:9999; background:rgba(0,0,0,0.95); border:2px solid #ffcc00; border-radius:16px; padding:30px 40px; text-align:center; animation:fadeIn 0.3s;';
      popup.innerHTML = `
        <h2 style="color:#ffcc00; margin:0 0 10px;">Daily Reward Available!</h2>
        <p style="color:#aaa; font-size:16px; margin:0 0 20px;">Day ${login.dayInCycle} — ${login.reward.label}</p>
        <button id="btn-popup-claim" style="background:linear-gradient(45deg,#cc9900,#ffcc00); color:#000; border:none; padding:12px 30px; border-radius:8px; font-size:18px; font-weight:bold; cursor:pointer; margin-right:10px;">CLAIM NOW</button>
        <button id="btn-popup-close" style="background:#333; color:#aaa; border:1px solid #555; padding:12px 20px; border-radius:8px; font-size:14px; cursor:pointer;">Later</button>
      `;
      document.body.appendChild(popup);
      popup.querySelector('#btn-popup-claim').addEventListener('click', () => {
        playBtnClick();
        dm.claimLoginReward();
        updateMenuCoins();
        popup.remove();
      });
      popup.querySelector('#btn-popup-close').addEventListener('click', () => {
        popup.remove();
      });
    }
  }, 1000);
});
