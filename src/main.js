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
    
    // Update mission board UI
    const state = SaveSystem.load();
    if (state.activeMission) {
      document.getElementById('mission-board-title').innerText = state.activeMission.title;
      document.getElementById('mission-board-reward').innerText = state.activeMission.rewardCoins;
      const progress = Math.floor(state.activeMission.progress);
      const target = state.activeMission.target;
      const pct = Math.min(100, Math.floor((progress / target) * 100));
      document.getElementById('mission-board-progress-bar').style.width = pct + '%';
      document.getElementById('mission-board-progress-text').innerText = `${progress} / ${target}`;
    }
  });

  document.getElementById('btn-missions-back').addEventListener('click', () => {
    document.getElementById('menu-missions').classList.remove('active');
    document.getElementById('menu-missions').classList.add('hidden');
    document.getElementById('menu-start').classList.remove('hidden');
    document.getElementById('menu-start').classList.add('active');
  });

  function renderGarage() {
    const list = document.getElementById('bike-list');
    list.innerHTML = '';
    const state = SaveSystem.load();

    Object.values(BIKES).forEach(bike => {
      const isUnlocked = state.unlockedBikes.includes(bike.id);
      const isSelected = state.currentBike === bike.id;
      
      const currentUpgrade = (state.upgrades && state.upgrades[bike.id]) ? state.upgrades[bike.id] : 0;
      const maxUpgrades = bike.maxUpgrades || 5;
      const upgradeCost = 200 + (currentUpgrade * 300); // progressive cost
      const canAffordUpgrade = state.coins >= upgradeCost && currentUpgrade < maxUpgrades;
      
      const card = document.createElement('div');
      card.style.background = 'rgba(0,0,0,0.6)';
      card.style.border = '2px solid #555';
      card.style.padding = '15px';
      card.style.borderRadius = '12px';
      card.style.textAlign = 'center';
      card.style.position = 'relative';

      let btnHtml = '';
      if (isSelected) {
        btnHtml = `<button disabled style="background:#00ffaa; color:#000;">SELECTED</button>`;
      } else if (isUnlocked) {
        btnHtml = `<button class="btn-select" data-id="${bike.id}">SELECT</button>`;
      } else {
        const canAfford = state.coins >= bike.cost;
        btnHtml = `<button class="btn-buy" data-id="${bike.id}" data-cost="${bike.cost}" ${!canAfford?'disabled':''} style="background:${canAfford?'#00aaff':'#555'};">BUY (${bike.cost})</button>`;
      }
      
      let upgradeHtml = '';
      if (isUnlocked) {
         if (currentUpgrade < maxUpgrades) {
            upgradeHtml = `<button class="btn-upgrade" data-id="${bike.id}" data-cost="${upgradeCost}" ${!canAffordUpgrade?'disabled':''} style="margin-top: 5px; font-size: 14px; background:${canAffordUpgrade?'#ff00ff':'#555'};">UPGRADE ${currentUpgrade}/${maxUpgrades} (${upgradeCost}C)</button>`;
         } else {
            upgradeHtml = `<div style="color: #ffcc00; font-weight: bold; margin-top: 10px;">MAX LEVEL</div>`;
         }
      }

      card.innerHTML = `
        <h3 style="margin-top: 0; color: #fff;">${bike.name}</h3>
        <div style="width: 100%; height: 5px; background: #${bike.color.toString(16).padStart(6,'0')}; margin: 10px 0;"></div>
        <p style="font-size: 14px; color: #aaa; margin: 5px 0;">Spd: ${bike.topSpeed} | Acc: ${bike.acceleration}</p>
        <div style="margin-top: 15px;">${btnHtml}</div>
        ${upgradeHtml}
      `;
      list.appendChild(card);
    });

    // Attach events
    document.querySelectorAll('.btn-select').forEach(b => b.addEventListener('click', (e) => {
      const id = e.target.getAttribute('data-id');
      state.currentBike = id;
      SaveSystem.save(state);
      game.applyBikeStats(id);
      renderGarage();
      setTimeout(() => document.querySelectorAll(".btn-select, .btn-buy, .btn-upgrade").forEach(b => b.addEventListener("click", playBtnClick)), 50);
    }));

    document.querySelectorAll('.btn-upgrade').forEach(b => b.addEventListener('click', (e) => {
      const id = e.target.getAttribute('data-id');
      const cost = parseInt(e.target.getAttribute('data-cost'));
      if (state.coins >= cost) {
        state.coins -= cost;
        if (!state.upgrades) state.upgrades = {};
        if (!state.upgrades[id]) state.upgrades[id] = 0;
        state.upgrades[id]++;
        SaveSystem.save(state);
        updateMenuCoins();
        game.applyBikeStats(state.currentBike); // refresh model
        renderGarage();
        setTimeout(() => document.querySelectorAll(".btn-select, .btn-buy, .btn-upgrade").forEach(b => b.addEventListener("click", playBtnClick)), 50);
      }
    }));

    document.querySelectorAll('.btn-buy').forEach(b => b.addEventListener('click', (e) => {
      playBtnClick();
      const id = e.target.getAttribute('data-id');
      const cost = parseInt(e.target.getAttribute('data-cost'));
      if (state.coins >= cost) {
        state.coins -= cost;
        state.unlockedBikes.push(id);
        state.currentBike = id;
        SaveSystem.save(state);
        updateMenuCoins();
        game.applyBikeStats(id);
        renderGarage();
        setTimeout(() => document.querySelectorAll(".btn-select, .btn-buy, .btn-upgrade").forEach(b => b.addEventListener("click", playBtnClick)), 50);
      }
    }));
  }

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
