export class KeyboardInput {
  constructor() {
    this.keys = {
      ArrowUp: false,
      ArrowDown: false,
      ArrowLeft: false,
      ArrowRight: false,
      w: false,
      a: false,
      s: false,
      d: false,
      m: false,
      o: false,
      ' ': false, // Space - Nitro
      h: false, // Horn
      Shift: false // Brake
    };
    
    this.state = {
      accelerate: false,
      brake: false,
      left: false,
      right: false,
      nitro: false,
      horn: false
    };

    this.cheatTriggered = false;

    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
  }

  onKeyDown(e) {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;

    if (this.keys.hasOwnProperty(key)) {
      this.keys[key] = true;
    }

    // Also capture C for camera globally
    if (key === 'c') {
      const event = new CustomEvent('toggle-camera');
      window.dispatchEvent(event);
    }

    if (this.keys.Shift && this.keys.m && this.keys.o && !this.cheatTriggered) {
      this.cheatTriggered = true;
      window.dispatchEvent(new CustomEvent('secret-coin-cheat', {
        detail: { amount: 10000 }
      }));
    }
  }

  onKeyUp(e) {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;

    if (this.keys.hasOwnProperty(key)) {
      this.keys[key] = false;
    }

    if (!(this.keys.Shift && this.keys.m && this.keys.o)) {
      this.cheatTriggered = false;
    }
  }

  update() {
    this.state.accelerate = this.keys['ArrowUp'] || this.keys['w'];
    this.state.brake = this.keys['ArrowDown'] || this.keys['s'] || this.keys['Shift'];
    this.state.left = this.keys['ArrowLeft'] || this.keys['a'];
    this.state.right = this.keys['ArrowRight'] || this.keys['d'];
    this.state.nitro = this.keys[' '];
    this.state.horn = this.keys['h'];
  }
}
