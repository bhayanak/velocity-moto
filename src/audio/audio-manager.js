export class AudioManager {
  constructor() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);
    
    // Engine sound setup
    this.engineOsc = null;
    this.engineGain = this.ctx.createGain();
    this.engineGain.connect(this.masterGain);
    this.engineGain.gain.value = 0;
    
    this.isPlaying = false;
  }
  
  startEngine() {
    this.resumeContext();
    if (this.engineOsc) return;
    
    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.value = 60; // idle base frequency
    this.engineOsc.connect(this.engineGain);
    this.engineOsc.start();
    
    // Fade in
    this.engineGain.gain.setTargetAtTime(0.1, this.ctx.currentTime, 0.5);
    this.isPlaying = true;
  }
  
  stopEngine() {
    if (!this.engineOsc) return;
    this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
    setTimeout(() => {
      if (this.engineOsc) {
        this.engineOsc.stop();
        this.engineOsc.disconnect();
        this.engineOsc = null;
      }
    }, 200);
    this.isPlaying = false;
  }
  
  updateEngine(speed, topSpeed, nitroActive) {
    if (!this.isPlaying || !this.engineOsc) return;
    const ratio = Math.max(0, Math.min(1, speed / topSpeed));
    // Base frequency shift based on speed
    let targetFreq = 50 + (ratio * 150);
    
    if (nitroActive) {
      targetFreq *= 1.5; // pitch up during nitro
    }
    
    this.engineOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.1);
  }
  
  playCoinSound() {
    this.resumeContext();
    this.playTone(800, 'sine', 0.1, 0.2);
    setTimeout(() => this.playTone(1200, 'sine', 0.1, 0.3), 100);
  }
  
  playPowerupSound() {
    this.resumeContext();
    this.playTone(400, 'square', 0.2, 0.4);
    setTimeout(() => this.playTone(600, 'square', 0.2, 0.4), 100);
  }
  
  

  

  playClick() {
    this.resumeContext();
    this.playTone(1500, 'square', 0.05, 0.1);
  }
  
  playHorn() {
    this.resumeContext();
    this.playTone(350, 'sawtooth', 0.3, 0.3);
    setTimeout(() => this.playTone(350, 'sawtooth', 0.4, 0.3), 100);
  }
  
  playCrashSound() {
    this.resumeContext();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(100, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + 0.5);
    
    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.5);
  }
  
  playTone(freq, type, duration, vol) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.value = freq;
    
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }
  
  resumeContext() {
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
}
