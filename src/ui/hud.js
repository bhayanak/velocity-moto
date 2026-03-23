let speedVal, fuelFill, nitroFill, scoreVal, coinsVal, missionText;

export function setupHUD() {
  speedVal = document.getElementById('speed-val');
  fuelFill = document.getElementById('fuel-fill');
  nitroFill = document.getElementById('nitro-fill');
  scoreVal = document.getElementById('score-val');
  coinsVal = document.getElementById('coins-val');
  missionText = document.getElementById('mission-text');
}

export function updateHUD(state) {
  if (!speedVal) return;
  
  // km/h roughly conversion from units
  speedVal.innerText = Math.floor(state.speed * 2);
  
  // Fuel is 0.0 to 1.0
  fuelFill.style.width = `${Math.max(0, state.fuel) * 100}%`;
  
  // Nitro is 0.0 to 1.0
  nitroFill.style.width = `${Math.max(0, state.nitro) * 100}%`;
  
  scoreVal.innerText = state.score;
  if(coinsVal) coinsVal.innerText = state.coins || 0;
}

export function updateMissionHUD(missions) {
  if (!missionText) return;
  if (!missions || missions.length === 0) {
    missionText.innerText = `Missions Complete!`;
    return;
  }
  const mission = missions[0];
  const progressText = mission.type === 'distance' ? 
    `${Math.floor(mission.progress)}/${mission.target} m` : 
    `${Math.floor(mission.progress)}/${mission.target}`;
    
  missionText.innerText = `📍 ${mission.title} (${progressText}) (+${missions.length - 1})`;
}

export function showMissionComplete(count) {
  const popup = document.createElement('div');
  popup.className = 'mission-complete-popup';
  popup.innerText = `🎯 MISSION COMPLETE!\nVisit Missions to redeem`;
  document.body.appendChild(popup);
  
  // Animate and remove
  setTimeout(() => {
    popup.classList.add('fade-out');
    setTimeout(() => popup.remove(), 1000);
  }, 2000);
}

export function showGameOver(finalScore, finalCoins) {
  document.getElementById('hud-playing').classList.remove('active');
  document.getElementById('hud-playing').classList.add('hidden');
  
  document.getElementById('menu-gameover').classList.remove('hidden');
  document.getElementById('menu-gameover').classList.add('active');
  
  // Hide touch controls on game over
  const tc = document.getElementById('touch-controls');
  if (tc) tc.classList.add('tc-hidden');

  document.getElementById('final-score').innerText = finalScore;
  document.getElementById('final-coins').innerText = finalCoins || 0;
}
