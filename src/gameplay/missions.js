export const MISSIONS = [
  { id: 'dist_short', title: 'Travel 3000m', type: 'distance', target: 3000, rewardCoins: 150 },
  { id: 'dist_long', title: 'Travel 10000m', type: 'distance', target: 10000, rewardCoins: 600 },
  { id: 'coins_run', title: 'Collect 25 Coins', type: 'coin', target: 25, rewardCoins: 200 },
  { id: 'coins_big', title: 'Collect 100 Coins', type: 'coin', target: 100, rewardCoins: 800 },
  { id: 'overtake_10', title: 'Overtake 15 Cars', type: 'overtake', target: 15, rewardCoins: 250 },
  { id: 'overtake_50', title: 'Overtake 50 Cars', type: 'overtake', target: 50, rewardCoins: 800 },
  { id: 'crash_survive', title: 'Survive 5 Crashes', type: 'crash', target: 5, rewardCoins: 300 },
  { id: 'no_crash_dist', title: 'Drive 2000m without Crash', type: 'distance_nocrash', target: 2000, rewardCoins: 500 },
  { id: 'high_speed', title: 'Stay above 150km/h for 10s', type: 'speed_time', target: 10, rewardCoins: 1000 },
  { id: 'close_calls', title: 'Near Miss 10 times', type: 'near_miss', target: 10, rewardCoins: 400 },
  { id: 'distance_marathon', title: 'Travel 50000m', type: 'distance', target: 50000, rewardCoins: 3000 }
];

import { SaveSystem } from '../persistence/save-game.js';

export class MissionManager {
  constructor(saveData) {
    this.saveData = saveData;
    if (!this.saveData.activeMissions || !Array.isArray(this.saveData.activeMissions)) {
      this.saveData.activeMissions = [];
    }
    this.assignNewMissions(3);
    SaveSystem.save(this.saveData);
    this.initSessionStats();
  }

  initSessionStats() {
    this.sessionProgress = 0; // Depends on mission type
  }

  assignNewMissions(count) {
    if (!this.saveData.activeMissions) this.saveData.activeMissions = [];
    while (this.saveData.activeMissions.length < count) {
      const available = MISSIONS.filter(m => !this.saveData.activeMissions.find(am => am.id === m.id));
      const nextMission = available.length > 0 ? available[Math.floor(Math.random() * available.length)] : MISSIONS[Math.floor(Math.random() * MISSIONS.length)];
      this.saveData.activeMissions.push({
        id: nextMission.id,
        idRef: Date.now() + Math.random(), // unique instance
        title: nextMission.title,
        type: nextMission.type,
        target: nextMission.target,
        progress: 0,
        rewardCoins: nextMission.rewardCoins
      });
    }
  }

  getActiveMissions() {
    return this.saveData.activeMissions;
  }

  updateProgress(type, amount) {
    let completedRewards = 0;
    if (!this.saveData.activeMissions) return 0;

    for (let i = this.saveData.activeMissions.length - 1; i >= 0; i--) {
      const mission = this.saveData.activeMissions[i];
      if (mission.type === type) {
        mission.progress += amount;
        if (mission.progress >= mission.target) {
          completedRewards += mission.rewardCoins;
          this.saveData.coins += mission.rewardCoins;
          // remove completed mission
          this.saveData.activeMissions.splice(i, 1);
        }
      }
    }

    if (completedRewards > 0) {
      if (isNaN(this.saveData.coins)) this.saveData.coins = 0; // Sanity check
      this.assignNewMissions(3); // Refill missing slots
      SaveSystem.save(this.saveData); // Persist immediately when a mission completes!
      return completedRewards;
    }
    return 0;
  }
}
