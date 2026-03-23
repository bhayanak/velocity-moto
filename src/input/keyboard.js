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

    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
  }

  onKeyDown(e) {
    if (this.keys.hasOwnProperty(e.key)) {
      this.keys[e.key] = true;
    }
    // Also capture C for camera globally
    if (e.key === 'c' || e.key === 'C') {
      const event = new CustomEvent('toggle-camera');
      window.dispatchEvent(event);
    }
  }

  onKeyUp(e) {
    if (this.keys.hasOwnProperty(e.key)) {
      this.keys[e.key] = false;
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
