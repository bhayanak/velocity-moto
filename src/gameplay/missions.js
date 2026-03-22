export const MISSIONS = [
  { id: 'dist_short', title: 'Travel 3000m', type: 'distance', target: 3000, rewardCoins: 150 },
  { id: 'dist_long', title: 'Travel 10000m', type: 'distance', target: 10000, rewardCoins: 600 },
  { id: 'coins_run', title: 'Collect 25 Coins', type: 'coin', target: 25, rewardCoins: 200 },
  { id: 'coins_big', title: 'Collect 100 Coins', type: 'coin', target: 100, rewardCoins: 800 },
  { id: 'overtake_10', title: 'Overtake 15 Cars', type: 'overtake', target: 15, rewardCoins: 250 },
  { id: 'overtake_50', title: 'Overtake 50 Cars', type: 'overtake', target: 50, rewardCoins: 800 },
  { id: 'crash_survive', title: 'Survive 5 Crashes', type: 'crash', target: 5, rewardCoins: 300 }
];

export class MissionManager {
  constructor(saveData) {
    this.saveData = saveData;
    
    // Ensure we have an active mission
    if (!this.saveData.activeMission) {
      this.assignNewMission();
    }
    
    this.initSessionStats();
  }

  initSessionStats() {
    this.sessionProgress = 0; // Depends on mission type
  }

  assignNewMission() {
    // Pick a random mission
    const mission = MISSIONS[Math.floor(Math.random() * MISSIONS.length)];
    this.saveData.activeMission = {
      id: mission.id,
      title: mission.title,
      type: mission.type,
      target: mission.target,
      progress: 0,
      rewardCoins: mission.rewardCoins
    };
  }

  getActiveMission() {
    return this.saveData.activeMission;
  }

  updateProgress(type, amount) {
    const mission = this.saveData.activeMission;
    if (!mission) return false;

    if (mission.type === type) {
      // For some missions like distance, we add the delta
      // For coins, we just add the amount
      mission.progress += amount;
      
      if (mission.progress >= mission.target) {
        // Mission complete! Give reward!
        this.saveData.coins += mission.rewardCoins;
        const reward = mission.rewardCoins;
        this.assignNewMission();
        return reward; // Return reward if completed
      }
    }
    return false;
  }
}
