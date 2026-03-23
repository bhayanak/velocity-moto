import { Game } from './core/game.js';
import { setupHUD } from './ui/hud.js';
import { SaveSystem } from './persistence/save-game.js';
import { BIKES } from './data/bikes.js';
import { TRACKS } from './data/tracks.js';

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('game-container');
  
  // Setup UI elements
  setupHUD();
  
  function playBtnClick() {
    if (game.audio) game.audio.playClick();
  }
  
  document.querySelectorAll("button").forEach(b => b.addEventListener("click", playBtnClick));
  
  // Initialize game
  const game = new Game(container);
  
  function updateMenuCoins() {
    const state = SaveSystem.load();
    document.getElementById('menu-coins').innerText = state.coins;
    document.getElementById('garage-coins').innerText = state.coins;
  }
  updateMenuCoins();

  // Setup UI event listeners
  document.getElementById('btn-start').addEventListener('click', () => {
    document.getElementById('menu-start').classList.remove('active');
    document.getElementById('menu-start').classList.add('hidden');
    
    document.getElementById('hud-playing').classList.remove('hidden');
    document.getElementById('hud-playing').classList.add('active');
    
    // Refresh stats from whatever bike is selected
    const state = SaveSystem.load();
    game.applyBikeStats(state.currentBike);
    const tId = state.currentTrack || 'city';
    if (TRACKS[tId]) {
      if (game.sceneManager.applyTrackColors) game.sceneManager.applyTrackColors(TRACKS[tId]);
      if (game.roadManager.applyTrackColors) game.roadManager.applyTrackColors(TRACKS[tId]);
    }

    game.start();
  });
  
  document.getElementById('btn-restart').addEventListener('click', () => {
    document.getElementById('menu-gameover').classList.remove('active');
    document.getElementById('menu-gameover').classList.add('hidden');
    
    document.getElementById('hud-playing').classList.remove('hidden');
    document.getElementById('hud-playing').classList.add('active');
    
    game.reset();
    game.start();
  });

  document.getElementById('btn-to-main').addEventListener('click', () => {
    document.getElementById('menu-gameover').classList.remove('active');
    document.getElementById('menu-gameover').classList.add('hidden');
    document.getElementById('menu-start').classList.remove('hidden');
    document.getElementById('menu-start').classList.add('active');
    updateMenuCoins();
    game.reset();
  });

  document.getElementById('btn-garage').addEventListener('click', () => {
    document.getElementById('menu-start').classList.remove('active');
    document.getElementById('menu-start').classList.add('hidden');
    document.getElementById('menu-garage').classList.remove('hidden');
    document.getElementById('menu-garage').classList.add('active');
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
});
