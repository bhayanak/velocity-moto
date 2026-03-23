import { SceneManager } from '../rendering/scene.js';
import { KeyboardInput } from '../input/keyboard.js';
import { TouchInput } from '../input/touch.js';
import { PlayerBike } from '../gameplay/player-bike.js';
import { RoadManager } from '../gameplay/road-manager.js';
import { TrafficManager } from '../gameplay/traffic-manager.js';
import { PickupManager } from '../gameplay/pickups.js';
import { HazardManager } from '../gameplay/hazards.js';

import { AudioManager } from '../audio/audio-manager.js';
import { SaveSystem } from '../persistence/save-game.js';
import { BIKES } from '../data/bikes.js';
import { TRACKS } from '../data/tracks.js';
import { updateHUD, showGameOver, updateMissionHUD, showMissionComplete } from '../ui/hud.js';
import { Director } from '../gameplay/director.js';
import { MissionManager } from '../gameplay/missions.js';
import { DailyRewardManager } from '../gameplay/daily-rewards.js';

import { CrazySDK } from '../integrations/crazygames.js';

export class Game {
  constructor(container) {
    this.container = container;
    this.isRunning = false;
    this.lastTime = 0;
    
    // Save state
    this.saveData = SaveSystem.load();
    this.sessionCoins = 0;

    // Core systems
    this.sceneManager = new SceneManager(container);
    this.keyboardConfig = new KeyboardInput();
    this.touchConfig = new TouchInput();
    this.audio = new AudioManager();
    
    
    // Gameplay systems
    this.player = new PlayerBike(this.sceneManager.scene, this.sceneManager.camera);
    this.applyBikeStats(this.saveData.currentBike);

    this.roadManager = new RoadManager(this.sceneManager.scene);
    this.trafficManager = new TrafficManager(this.sceneManager.scene);
    this.pickupManager = new PickupManager(this.sceneManager.scene);
    this.hazardManager = new HazardManager(this.sceneManager.scene);
    
    this.director = new Director();
    this.missionManager = new MissionManager(this.saveData);
    this.dailyManager = new DailyRewardManager(this.saveData);
    
    this.score = 0;
    this.distance = 0;
    
    // Bind loop
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  applyBikeStats(bikeId) {
    const stats = BIKES[bikeId] || BIKES['starter'];

    const upgrades = this.saveData.upgrades || {};
    const level = upgrades[bikeId] || 0;
    const multi = 1 + (level * 0.05);

    this.player.topSpeed = stats.topSpeed * multi;
    this.player.acceleration = stats.acceleration * multi;
    this.player.handling = stats.handling * (1 + (level * 0.02));

    // Determine color: custom > default
    let colorHex = stats.color;
    if (this.saveData.customColors && this.saveData.customColors[bikeId]) {
      const hex = this.saveData.customColors[bikeId].replace('#', '');
      colorHex = parseInt(hex, 16);
    }

    // Rebuild the full 3D bike mesh with proper shape, color, and upgrade visuals
    this.player.buildBikeMesh(bikeId, level, colorHex);

    // Pass rider reference to scene manager for first-person visibility toggle
    if (this.sceneManager) this.sceneManager._riderGroup = this.player.riderGroup;
  }
  
  start() {
    this.saveData = SaveSystem.load();
    this.isRunning = true;
    this.lastTime = performance.now();
    this.audio.startEngine();
    updateMissionHUD(this.missionManager.getActiveMissions());
  }
  
  reset() {
    this.player.reset();
    this.roadManager.reset();
    this.trafficManager.reset();
    this.pickupManager.reset();
    this.hazardManager.reset();
    this.director.reset();
    this.missionManager.initSessionStats();
    this.score = 0;
    this.distance = 0;
    this.sessionCoins = 0;
    updateHUD({ speed: 0, fuel: 1, nitro: 1, score: 0, coins: 0 });
    updateMissionHUD(this.missionManager.getActiveMissions());
  }
  
  async gameOver() {
    this.missionManager.updateProgress('crash', 1);
    this.dailyManager.updateDailyTaskProgress('crash', 1);

    this.isRunning = false;
    this.audio.stopEngine();
    this.audio.playCrashSound();

    // Save coins & high score
    const isNewHighScore = this.score > this.saveData.highScore;
    this.saveData.coins += this.sessionCoins;
    if (isNewHighScore) {
      this.saveData.highScore = Math.floor(this.score);
    }
    SaveSystem.save(this.saveData);

    CrazySDK.gameplayStop();

    // Happytime on new high score
    if (isNewHighScore && this.score > 500) {
      CrazySDK.happytime();
    }

    // Fire midgame ad (non-blocking — game over screen shows after ad or immediately if no ad)
    const muteForAd = () => this.audio.mute();
    const unmuteAfterAd = () => {
      const state = SaveSystem.load();
      if (!state.settings?.muted) this.audio.unmute();
    };
    await CrazySDK.requestMidgameAd(muteForAd, unmuteAfterAd);

    showGameOver(Math.floor(this.score), this.sessionCoins);

    // Show game over banner ad
    CrazySDK.requestBanner('banner-gameover', 728, 90);

    // Show double-coins button if SDK is available
    const dblBtn = document.getElementById('btn-double-coins');
    if (dblBtn) {
      dblBtn.style.display = CrazySDK.isAvailable ? 'block' : 'none';
      dblBtn.textContent = '🎬 DOUBLE COINS';
      dblBtn.disabled = false;
    }

    // Expose session coins for rewarded ad doubling
    window._lastSessionCoins = this.sessionCoins;
  }
  
  loop(time) {
    requestAnimationFrame(this.loop);
    
    const dt = (time - this.lastTime) / 1000;
    this.lastTime = time;
    
    if (this.inGarage) {
      this.sceneManager.updateGarageSpin(dt);
    } else if (this.isRunning) {
      this.update(dt);
    }
    
    this.sceneManager.render();
  }

  previewBike(bikeId) {
    // Reload save data to pick up freshly set custom colors
    this.saveData = SaveSystem.load();
    this.applyBikeStats(bikeId);
  }

  setGarageMode(active) {
    this.inGarage = active;
    this.sceneManager.setGarageMode(active, this.player.bikeGroup);
  }
  
  getMergedInputState() {
    return {
      accelerate: this.keyboardConfig.state.accelerate || this.touchConfig.state.accelerate || true, // Auto-accelerate for arcade feel
      brake: this.keyboardConfig.state.brake || this.touchConfig.state.brake,
      left: this.keyboardConfig.state.left || this.touchConfig.state.left,
      right: this.keyboardConfig.state.right || this.touchConfig.state.right,
      nitro: this.keyboardConfig.state.nitro || this.touchConfig.state.nitro,
      horn: this.keyboardConfig.state.horn || false
    };
  }

  update(dt) {
    // 1. Update Input
    this.keyboardConfig.update();
    this.touchConfig.update();
    const inputState = this.getMergedInputState();

    if (inputState.horn && !this.hornPlayed) {
      this.audio.playHorn();
      this.hornPlayed = true;
    } else if (!inputState.horn) {
      this.hornPlayed = false;
    }
    
    // 2. Update Player
    this.player.update(dt, inputState);
    
    // Check if fuel ran out or player crashed internally (simplified for now)
    if (this.player.fuel <= 0 || this.player.isCrashed) {
      this.gameOver();
      return;
    }
    
    // 3. Update World (Road & Traffic)
    // We move the world elements toward the player Z to simulate forward movement
    // Or we move player Z forward. Let's move player forward and let the camera follow.
    const playerZ = this.player.position.z;
    
    // Update director based on speed and distance
    this.director.update(dt, this.player.speed, this.distance);

    this.roadManager.update(dt, playerZ);
    const passedCars = this.trafficManager.update(dt, playerZ, this.director);
    if (passedCars > 0) {
      const completed = this.missionManager.updateProgress('overtake', passedCars);
      if (completed) { showMissionComplete(completed); CrazySDK.happytime(); }
      this.dailyManager.updateDailyTaskProgress('overtake', passedCars);
    }
    this.pickupManager.update(dt, playerZ);
    this.hazardManager.update(dt, playerZ);
    
    // 4. Collision & Collection Detection
    const collision = this.trafficManager.checkCollisions(this.player.bounds);
    if (collision) {
      this.player.crash();
      this.gameOver();
      return;
    }
    
    
    const hazardCollision = this.hazardManager.checkCollisions(this.player.bounds);
    if (hazardCollision) {
      if (hazardCollision === 'barrier') {
        this.player.crash();
        this.gameOver();
        return;
      } else if (hazardCollision === 'pothole') {
        this.player.speed *= 0.5;
        this.audio.playCrashSound();
      }
    }

    const collections = this.pickupManager.checkCollections(this.player.bounds);
    collections.forEach(pickup => {
      if (pickup.type === 'fuel') {
        this.player.fuel = Math.min(1.0, this.player.fuel + pickup.reward);
        this.audio.playPowerupSound();
      }
      if (pickup.type === 'nitro') {
        this.player.nitro = Math.min(1.0, this.player.nitro + pickup.reward);
        this.audio.playPowerupSound();
      }
      if (pickup.type === 'coin') {
        let mult = 1;
        if (TRACKS[this.saveData.currentTrack]) {
          mult = TRACKS[this.saveData.currentTrack].coinMultiplier || 1;
        }
        this.sessionCoins += (pickup.reward * mult);
        this.score += 50; // extra score for coins
        this.audio.playCoinSound();
        const completed = this.missionManager.updateProgress('coin', 1);
        if (completed) { showMissionComplete(completed); CrazySDK.happytime(); }
        this.dailyManager.updateDailyTaskProgress('coin', 1);
      }
    });

    // 5. Scoring & HUD
    const distDelta = this.player.speed * dt;
    this.distance += distDelta;
    this.score += distDelta * 0.1; // 10 points per km/h unit
    
    const distCompleted = this.missionManager.updateProgress('distance', distDelta);
    if (distCompleted) { showMissionComplete(distCompleted); CrazySDK.happytime(); }
    this.dailyManager.updateDailyTaskProgress('distance', distDelta);
    
    // Update audio engine pitch
    this.audio.updateEngine(this.player.speed, this.player.topSpeed, (inputState.nitro && this.player.nitro > 0 && this.player.speed > 20));
    
    updateHUD({
      speed: this.player.speed,
      fuel: this.player.fuel,
      nitro: this.player.nitro,
      score: Math.floor(this.score),
      coins: this.sessionCoins
    });
    updateMissionHUD(this.missionManager.getActiveMissions());
    
    // 6. Camera & Environment Update
    const currentTime = performance.now() / 1000;
    this.sceneManager.updateCamera(this.player.position, this.player.leanAngle, this.player.speed, currentTime);
    
    // Day/Night Cycle
    const isNight = this.sceneManager.updateDayNightCycle(dt, this.player.speed);
    this.player.setHeadlight(isNight);

    // Weather Update (randomize rain every so often)
    if (Math.random() < 0.0001) { // small chance per frame to toggle
      this.sceneManager.setWeather(!this.sceneManager.isRaining);
    }
    this.sceneManager.updateWeather(dt, this.player.position, this.player.speed);
  }
}
