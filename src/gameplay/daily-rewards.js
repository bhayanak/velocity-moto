import { SaveSystem } from '../persistence/save-game.js';

// ── Daily Login Rewards (7-day cycle) ──
const LOGIN_REWARDS = [
  { day: 1, coins: 100,  label: '100 Coins' },
  { day: 2, coins: 150,  label: '150 Coins' },
  { day: 3, coins: 200,  label: '200 Coins' },
  { day: 4, coins: 300,  label: '300 Coins' },
  { day: 5, coins: 500,  label: '500 Coins' },
  { day: 6, coins: 750,  label: '750 Coins' },
  { day: 7, coins: 1500, label: '1500 Coins + Bonus!' },
];

// ── Streak Milestones ──
const STREAK_MILESTONES = [
  { days: 3,  coins: 500,   label: '3-Day Streak' },
  { days: 7,  coins: 2000,  label: '7-Day Streak' },
  { days: 14, coins: 5000,  label: '14-Day Streak' },
  { days: 30, coins: 15000, label: '30-Day Streak' },
  { days: 60, coins: 40000, label: '60-Day Streak' },
];

// ── Daily Task Pool ──
const DAILY_TASK_POOL = [
  { type: 'distance',    target: 5000,  reward: 300,  title: 'Travel 5000m' },
  { type: 'distance',    target: 10000, reward: 600,  title: 'Travel 10000m' },
  { type: 'distance',    target: 20000, reward: 1200, title: 'Travel 20000m' },
  { type: 'coin',        target: 30,    reward: 400,  title: 'Collect 30 Coins' },
  { type: 'coin',        target: 60,    reward: 800,  title: 'Collect 60 Coins' },
  { type: 'overtake',    target: 10,    reward: 350,  title: 'Overtake 10 Cars' },
  { type: 'overtake',    target: 25,    reward: 700,  title: 'Overtake 25 Cars' },
  { type: 'crash',       target: 3,     reward: 250,  title: 'Survive 3 Crashes' },
  { type: 'near_miss',   target: 8,     reward: 500,  title: '8 Near Misses' },
  { type: 'near_miss',   target: 15,    reward: 900,  title: '15 Near Misses' },
  { type: 'speed_time',  target: 8,     reward: 600,  title: 'Speed >150 for 8s' },
  { type: 'speed_time',  target: 15,    reward: 1100, title: 'Speed >150 for 15s' },
  { type: 'distance_nocrash', target: 3000, reward: 500, title: 'No-Crash 3000m' },
  { type: 'distance_nocrash', target: 8000, reward: 1200, title: 'No-Crash 8000m' },
];

function getToday() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function seededRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export class DailyRewardManager {
  constructor(saveData) {
    this.saveData = saveData;
    this._ensureFields();
  }

  _ensureFields() {
    if (!this.saveData.daily) {
      this.saveData.daily = {};
    }
    const d = this.saveData.daily;
    if (!d.lastLoginDate) d.lastLoginDate = null;
    if (typeof d.streak !== 'number') d.streak = 0;
    if (!d.claimedStreaks) d.claimedStreaks = [];
    if (!d.dailyTasks) d.dailyTasks = [];
    if (!d.dailyTaskDate) d.dailyTaskDate = null;
  }

  /**
   * Check if the user can claim today's login reward.
   * Returns { canClaim, dayInCycle, reward, streak } or null if already claimed.
   */
  getLoginStatus() {
    const today = getToday();
    const d = this.saveData.daily;
    const alreadyClaimed = d.lastLoginDate === today;

    return {
      canClaim: !alreadyClaimed,
      streak: d.streak,
      dayInCycle: ((d.streak) % 7) + 1,
      reward: LOGIN_REWARDS[((d.streak) % 7)],
      alreadyClaimed,
    };
  }

  /**
   * Claim today's login reward. Returns coins earned or 0.
   */
  claimLoginReward() {
    const today = getToday();
    const d = this.saveData.daily;
    if (d.lastLoginDate === today) return 0; // already claimed

    // Check if streak continues (yesterday or first login)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    if (d.lastLoginDate === yesterdayStr) {
      d.streak++;
    } else if (d.lastLoginDate === null) {
      d.streak = 1;
    } else {
      d.streak = 1; // streak broken
    }

    d.lastLoginDate = today;

    const dayInCycle = ((d.streak - 1) % 7);
    const reward = LOGIN_REWARDS[dayInCycle];
    this.saveData.coins = (this.saveData.coins || 0) + reward.coins;
    SaveSystem.save(this.saveData);
    return reward.coins;
  }

  /**
   * Get unclaimed streak milestones.
   */
  getStreakMilestones() {
    const d = this.saveData.daily;
    return STREAK_MILESTONES.map(m => ({
      ...m,
      reached: d.streak >= m.days,
      claimed: (d.claimedStreaks || []).includes(m.days),
    }));
  }

  /**
   * Claim a streak milestone reward.
   */
  claimStreakMilestone(days) {
    const d = this.saveData.daily;
    if (d.streak < days) return 0;
    if ((d.claimedStreaks || []).includes(days)) return 0;

    const milestone = STREAK_MILESTONES.find(m => m.days === days);
    if (!milestone) return 0;

    if (!d.claimedStreaks) d.claimedStreaks = [];
    d.claimedStreaks.push(days);
    this.saveData.coins = (this.saveData.coins || 0) + milestone.coins;
    SaveSystem.save(this.saveData);
    return milestone.coins;
  }

  /**
   * Get today's daily tasks. Generates 3 random tasks seeded by date.
   */
  getDailyTasks() {
    const today = getToday();
    const d = this.saveData.daily;

    // Regenerate if it's a new day
    if (d.dailyTaskDate !== today) {
      const seed = parseInt(today.replace(/-/g, ''), 10);
      const indices = new Set();
      let attempt = 0;
      while (indices.size < 3 && attempt < 50) {
        const idx = Math.floor(seededRandom(seed + attempt + 1) * DAILY_TASK_POOL.length);
        indices.add(idx);
        attempt++;
      }

      d.dailyTasks = [...indices].map((idx, i) => {
        const template = DAILY_TASK_POOL[idx];
        // Random bonus multiplier (1x, 1.5x, or 2x)
        const bonusSeed = seededRandom(seed + idx + 100);
        const multiplier = bonusSeed > 0.8 ? 2 : bonusSeed > 0.5 ? 1.5 : 1;
        const finalReward = Math.round(template.reward * multiplier);
        return {
          id: i,
          type: template.type,
          target: template.target,
          reward: finalReward,
          title: template.title + (multiplier > 1 ? ` (${multiplier}x!)` : ''),
          progress: 0,
          completed: false,
          redeemed: false,
          isBonus: multiplier > 1,
        };
      });
      d.dailyTaskDate = today;
      SaveSystem.save(this.saveData);
    }

    return d.dailyTasks;
  }

  /**
   * Update progress on daily tasks (called during gameplay).
   * Returns count of newly completed tasks.
   */
  updateDailyTaskProgress(type, amount) {
    const tasks = this.getDailyTasks();
    let newlyDone = 0;
    for (const task of tasks) {
      if (task.redeemed || task.completed) continue;
      if (task.type === type) {
        task.progress = Math.min(task.progress + amount, task.target);
        if (task.progress >= task.target) {
          task.completed = true;
          newlyDone++;
        }
      }
    }
    if (newlyDone > 0) SaveSystem.save(this.saveData);
    return newlyDone;
  }

  /**
   * Redeem a completed daily task.
   */
  redeemDailyTask(taskId) {
    const tasks = this.getDailyTasks();
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.completed || task.redeemed) return 0;
    task.redeemed = true;
    this.saveData.coins = (this.saveData.coins || 0) + task.reward;
    SaveSystem.save(this.saveData);
    return task.reward;
  }
}
