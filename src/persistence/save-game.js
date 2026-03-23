import { CrazySDK } from '../integrations/crazygames.js';

const SAVE_KEY = 'velocity_moto_save_v1';

const defaultSave = {
  coins: 0,
  highScore: 0,
  unlockedBikes: ['starter'],
  currentBike: 'starter',
  unlockedTracks: ['city'],
  currentTrack: 'city',
  upgrades: {
    starter: 0,
    cruiser: 0,
    sport: 0,
    superbike: 0
  },
  settings: {
    music: 1.0,
    sfx: 1.0
  }
};

export class SaveSystem {
  static load() {
    try {
      const data = CrazySDK.dataGetItem(SAVE_KEY);
      if (data) {
        return { ...defaultSave, ...JSON.parse(data) };
      }
    } catch (err) {
      console.warn("Could not load save data", err);
    }
    return { ...defaultSave };
  }

  static save(state) {
    try {
      CrazySDK.dataSetItem(SAVE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn("Could not save data", err);
    }
  }

  static addCoins(amount) {
    const state = this.load();
    state.coins += amount;
    this.save(state);
    return state.coins;
  }
}