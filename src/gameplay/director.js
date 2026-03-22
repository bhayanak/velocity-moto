export class Director {
  constructor() {
    this.difficulty = 1.0;
    this.baseTrafficSpawnRate = 1.5;
    this.currentTrafficSpawnRate = 1.5;
    this.aggressiveness = 0; // chance for traffic to change lanes
  }

  reset() {
    this.difficulty = 1.0;
    this.currentTrafficSpawnRate = this.baseTrafficSpawnRate;
    this.aggressiveness = 0;
  }

  update(dt, speed, distance) {
    // Difficulty scales based on distance and sustained speed
    // e.g., max difficulty roughly at distance = 10000 or high average speed
    
    // Distance factor (slowly increases over run)
    const distanceFactor = Math.min(distance / 5000, 3.0); 
    
    // Speed factor (temporary spikes in difficulty if player goes very fast)
    const speedFactor = speed > 80 ? (speed - 80) / 100 : 0;
    
    this.difficulty = 1.0 + distanceFactor + (speedFactor * 0.5);

    // Update derived stats
    // Traffic spawns faster at higher difficulty
    this.currentTrafficSpawnRate = Math.max(0.4, this.baseTrafficSpawnRate / this.difficulty);
    
    // Aggressiveness dictates lane switching logic in the TrafficManager
    this.aggressiveness = Math.min(0.8, (this.difficulty - 1.0) * 0.2);
  }
}
