// ── Tiered Mission Chains ──
// Each chain goes from easy → hard. Completing + redeeming tier N unlocks tier N+1.
const MISSION_CHAINS = {
  distance: {
    label: 'Travel',
    unit: 'm',
    tiers: [
      { target: 1000, reward: 100 },
      { target: 3000, reward: 250 },
      { target: 5000, reward: 500 },
      { target: 10000, reward: 1000 },
      { target: 25000, reward: 2500 },
      { target: 50000, reward: 5000 },
    ]
  },
  coin: {
    label: 'Collect',
    unit: ' Coins',
    tiers: [
      { target: 10, reward: 100 },
      { target: 25, reward: 200 },
      { target: 50, reward: 400 },
      { target: 100, reward: 800 },
      { target: 200, reward: 1500 },
    ]
  },
  overtake: {
    label: 'Overtake',
    unit: ' Cars',
    tiers: [
      { target: 5, reward: 100 },
      { target: 15, reward: 250 },
      { target: 30, reward: 500 },
      { target: 50, reward: 800 },
      { target: 100, reward: 1500 },
    ]
  },
  crash: {
    label: 'Survive',
    unit: ' Crashes',
    tiers: [
      { target: 3, reward: 100 },
      { target: 5, reward: 200 },
      { target: 10, reward: 400 },
      { target: 20, reward: 800 },
    ]
  },
  distance_nocrash: {
    label: 'No-Crash Run',
    unit: 'm',
    tiers: [
      { target: 1000, reward: 300 },
      { target: 2000, reward: 500 },
      { target: 5000, reward: 1000 },
      { target: 10000, reward: 2000 },
    ]
  },
  speed_time: {
    label: 'Speed >150km/h for',
    unit: 's',
    tiers: [
      { target: 5, reward: 300 },
      { target: 10, reward: 600 },
      { target: 20, reward: 1200 },
      { target: 30, reward: 2000 },
    ]
  },
  near_miss: {
    label: 'Near Miss',
    unit: ' times',
    tiers: [
      { target: 5, reward: 200 },
      { target: 10, reward: 400 },
      { target: 25, reward: 800 },
      { target: 50, reward: 1500 },
    ]
  },
};

import { SaveSystem } from '../persistence/save-game.js';

export class MissionManager {
  constructor(saveData) {
    this.saveData = saveData;
    if (!this.saveData.activeMissions || !Array.isArray(this.saveData.activeMissions)) {
      this.saveData.activeMissions = [];
    }
    // Track completed tiers per chain type
    if (!this.saveData.missionTiers) {
      this.saveData.missionTiers = {};
    }
    // Migrate old missions that lack `completed` field
    this.saveData.activeMissions.forEach(m => {
      if (m.completed === undefined) m.completed = false;
    });
    this.assignNewMissions(5);
    SaveSystem.save(this.saveData);
    this.initSessionStats();
  }

  initSessionStats() {
    this.sessionProgress = 0;
  }

  _buildTitle(chainType, tier) {
    const chain = MISSION_CHAINS[chainType];
    if (!chain) return 'Unknown Mission';
    const t = chain.tiers[tier];
    return `${chain.label} ${t.target}${chain.unit}`;
  }

  assignNewMissions(count) {
    if (!this.saveData.activeMissions) this.saveData.activeMissions = [];
    const active = this.saveData.activeMissions;

    // Determine which chain types already have an active mission
    const activeTypes = new Set(active.map(m => m.chainType || m.type));

    const chainTypes = Object.keys(MISSION_CHAINS);
    // Shuffle to randomize which chains fill first
    for (let i = chainTypes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chainTypes[i], chainTypes[j]] = [chainTypes[j], chainTypes[i]];
    }

    for (const cType of chainTypes) {
      if (active.length >= count) break;
      if (activeTypes.has(cType)) continue; // already have one for this chain

      const chain = MISSION_CHAINS[cType];
      const completedTier = this.saveData.missionTiers[cType] || 0;
      const nextTier = completedTier; // tier index (0-based); missionTiers stores count of completed
      if (nextTier >= chain.tiers.length) continue; // chain fully completed

      const tierData = chain.tiers[nextTier];
      active.push({
        chainType: cType,
        type: cType, // for updateProgress matching
        tier: nextTier,
        idRef: Date.now() + Math.random(),
        title: this._buildTitle(cType, nextTier),
        target: tierData.target,
        progress: 0,
        rewardCoins: tierData.reward,
        completed: false,
      });
      activeTypes.add(cType);
    }
  }

  getActiveMissions() {
    return this.saveData.activeMissions || [];
  }

  /**
   * Update progress on matching missions. Does NOT auto-pay or auto-remove.
   * Sets `completed = true` when target is reached so UI can show REDEEM.
   * Returns number of newly completed missions this call (for HUD flash).
   */
  updateProgress(type, amount) {
    if (!this.saveData.activeMissions) return 0;

    let newlyCompleted = 0;
    for (const mission of this.saveData.activeMissions) {
      if (mission.completed) continue; // already done, waiting redeem
      if (mission.type === type) {
        mission.progress = Math.min(mission.progress + amount, mission.target);
        if (mission.progress >= mission.target && !mission.completed) {
          mission.completed = true;
          newlyCompleted++;
        }
      }
    }

    if (newlyCompleted > 0) {
      SaveSystem.save(this.saveData);
    }
    return newlyCompleted;
  }

  /**
   * Manually redeem a completed mission by idRef.
   * Pays out coins, removes from active list, advances tier, spawns next.
   * Returns reward amount or 0 if not found/not completed.
   */
  redeemMission(idRef) {
    const active = this.saveData.activeMissions;
    const idx = active.findIndex(m => m.idRef === idRef);
    if (idx === -1) return 0;

    const mission = active[idx];
    if (!mission.completed) return 0;

    const reward = mission.rewardCoins;
    this.saveData.coins = (this.saveData.coins || 0) + reward;

    // Advance tier for this chain
    const cType = mission.chainType || mission.type;
    if (!this.saveData.missionTiers[cType]) this.saveData.missionTiers[cType] = 0;
    this.saveData.missionTiers[cType]++;

    // Remove redeemed mission
    active.splice(idx, 1);

    // Fill back up
    this.assignNewMissions(5);
    SaveSystem.save(this.saveData);
    return reward;
  }
}
