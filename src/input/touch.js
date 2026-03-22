export class TouchInput {
  constructor() {
    this.state = {
      accelerate: false,
      brake: false,
      left: false,
      right: false,
      nitro: false
    };

    this.initTouchAreas();
  }

  initTouchAreas() {
    // Add touch overlay zones dynamically
    const style = document.createElement('style');
    style.innerHTML = `
      #touch-controls {
        position: absolute;
        top: 0; left: 0; width: 100%; height: 100%;
        z-index: 5; /* Below UI, Above Game */
        display: flex;
        pointer-events: none;
      }
      .touch-zone {
        pointer-events: auto;
        opacity: 0; /* invisible but clickable */
      }
      #zone-left { width: 33%; height: 100%; }
      #zone-right { width: 33%; height: 100%; margin-left: auto; }
      #btn-touch-nitro, #btn-touch-brake {
        position: absolute;
        bottom: 20px;
        width: 80px; height: 80px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        border: 2px solid #fff;
        pointer-events: auto;
        display: none; /* hidden on desktop */
        align-items: center; justify-content: center;
        font-weight: bold; color: white;
      }
      #btn-touch-brake { left: 35%; }
      #btn-touch-nitro { right: 35%; background: rgba(0, 170, 255, 0.4); }

      @media (hover: none) and (pointer: coarse) {
        #btn-touch-nitro, #btn-touch-brake { display: flex; }
      }
    `;
    document.head.appendChild(style);

    const overlay = document.createElement('div');
    overlay.id = 'touch-controls';
    
    const zoneLeft = document.createElement('div');
    zoneLeft.id = 'zone-left';
    zoneLeft.className = 'touch-zone';
    
    const zoneRight = document.createElement('div');
    zoneRight.id = 'zone-right';
    zoneRight.className = 'touch-zone';

    const btnBrake = document.createElement('div');
    btnBrake.id = 'btn-touch-brake';
    btnBrake.innerText = 'BRK';

    const btnNitro = document.createElement('div');
    btnNitro.id = 'btn-touch-nitro';
    btnNitro.innerText = 'NITRO';

    overlay.appendChild(zoneLeft);
    overlay.appendChild(zoneRight);
    overlay.appendChild(btnBrake);
    overlay.appendChild(btnNitro);
    document.body.appendChild(overlay);

    // Auto-accelerate for mobile by default when playing (managed by Game usually, but we'll bind left/right)
    
    const bindBtn = (el, key) => {
      el.addEventListener('touchstart', (e) => { e.preventDefault(); this.state[key] = true; });
      el.addEventListener('touchend', (e) => { e.preventDefault(); this.state[key] = false; });
      el.addEventListener('mousedown', (e) => { e.preventDefault(); this.state[key] = true; });
      el.addEventListener('mouseup', (e) => { e.preventDefault(); this.state[key] = false; });
      el.addEventListener('mouseleave', (e) => { e.preventDefault(); this.state[key] = false; });
    };

    bindBtn(zoneLeft, 'left');
    bindBtn(zoneRight, 'right');
    bindBtn(btnBrake, 'brake');
    bindBtn(btnNitro, 'nitro');
  }

  update() {
    // Touch state is driven directly by event listeners
  }
}
