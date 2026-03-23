import * as THREE from 'three';

export class PlayerBike {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    
    this.topSpeed = 120;
    this.acceleration = 30;
    this.deceleration = 40;
    this.handling = 15;

    this.position = new THREE.Vector3(0, 0, 0);
    this.speed = 0;
    this.leanAngle = 0;
    this.fuel = 1.0;
    this.nitro = 1.0;
    this.isCrashed = false;

    this.bounds = new THREE.Box3();
    
    this.buildBikeMesh('starter', 0, 0xcc0000);

    this.exhaustParticles = [];
    this.exhaustGeo = new THREE.PlaneGeometry(0.2, 0.2);
    this.exhaustMat = new THREE.MeshBasicMaterial({ 
      color: 0xffaa00, transparent: true, opacity: 0.8,
      blending: THREE.AdditiveBlending, depthWrite: false
    });

    this.skidMarks = [];
    this.skidGeo = new THREE.PlaneGeometry(0.5, 2.0);
    this.skidMat = new THREE.MeshBasicMaterial({ 
      color: 0x050505, transparent: true, opacity: 0.8, depthWrite: false
    });
  }
  
  buildBikeMesh(bikeId, upgradeLevel, colorHex) {
    if (this.bikeGroup) {
      while (this.bikeGroup.children.length > 0) {
        this.bikeGroup.remove(this.bikeGroup.children[0]);
      }
    } else {
      this.bikeGroup = new THREE.Group();
      this.scene.add(this.bikeGroup);
    }

    upgradeLevel = upgradeLevel || 0;
    colorHex = colorHex || 0xcc0000;

    const isMaxed = upgradeLevel >= 10;
    const baseColor = isMaxed ? 0xffcc00 : colorHex;

    // ── Shared Materials ──
    const bodyMat = new THREE.MeshPhongMaterial({ color: baseColor, specular: 0x666666, shininess: isMaxed ? 120 : 60 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: isMaxed ? 0xffcc00 : 0xaaaaaa, metalness: 0.95, roughness: 0.1 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const engineMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.7, roughness: 0.5 });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.95 });
    const rimMat = new THREE.MeshStandardMaterial({ color: isMaxed ? 0xffcc00 : 0x999999, metalness: 0.85, roughness: 0.15 });

    // ── Per-bike config ──
    const configs = {
      starter: { forkAngle: -0.35, tankW: 0.28, tankH: 0.65, tankSlant: 0, rearW: 0.22, barY: 0.88, barZ: -0.55, riderLean: Math.PI / 10, seatZ: 0.25, seatY: 0.58 },
      cruiser: { forkAngle: -0.55, tankW: 0.38, tankH: 0.8, tankSlant: 0, rearW: 0.35, barY: 1.05, barZ: -0.35, riderLean: Math.PI / 14, seatZ: 0.35, seatY: 0.52 },
      sport: { forkAngle: -0.3, tankW: 0.32, tankH: 0.6, tankSlant: 0.3, rearW: 0.24, barY: 0.78, barZ: -0.6, riderLean: Math.PI / 3.5, seatZ: 0.2, seatY: 0.58 },
      superbike: { forkAngle: -0.25, tankW: 0.34, tankH: 0.55, tankSlant: 0.35, rearW: 0.3, barY: 0.72, barZ: -0.65, riderLean: Math.PI / 3, seatZ: 0.15, seatY: 0.58 },
    };
    const c = configs[bikeId] || configs.starter;

    // ── Frame ──
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 1.4), engineMat);
    frame.position.set(0, 0.45, -0.15);
    this.bikeGroup.add(frame);
    const downTube = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6), engineMat);
    downTube.position.set(0, 0.25, -0.3);
    downTube.rotation.x = Math.PI / 6;
    this.bikeGroup.add(downTube);

    // ── Front Wheel ──
    const frontWheel = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.08, 12, 24), tireMat);
    frontWheel.position.set(0, 0.28, -0.95);
    frontWheel.rotation.y = Math.PI / 2;
    this.bikeGroup.add(frontWheel);
    const fwHub = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.12, 16), rimMat);
    fwHub.rotation.z = Math.PI / 2;
    fwHub.position.copy(frontWheel.position);
    this.bikeGroup.add(fwHub);
    for (let i = 0; i < 6; i++) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.24, 0.015), rimMat);
      spoke.position.copy(frontWheel.position);
      spoke.rotation.z = (i / 6) * Math.PI;
      this.bikeGroup.add(spoke);
    }

    // ── Rear Wheel ──
    const rwRad = bikeId === 'superbike' ? 0.32 : 0.28;
    const rearWheel = new THREE.Mesh(new THREE.TorusGeometry(rwRad, 0.1, 12, 24), tireMat);
    rearWheel.position.set(0, rwRad, 0.6);
    rearWheel.rotation.y = Math.PI / 2;
    this.bikeGroup.add(rearWheel);
    const rwHub = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, c.rearW, 16), rimMat);
    rwHub.rotation.z = Math.PI / 2;
    rwHub.position.copy(rearWheel.position);
    this.bikeGroup.add(rwHub);
    for (let i = 0; i < 6; i++) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.015, rwRad * 0.85, 0.015), rimMat);
      spoke.position.copy(rearWheel.position);
      spoke.rotation.z = (i / 6) * Math.PI;
      this.bikeGroup.add(spoke);
    }

    // ── Forks ──
    const forkGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.85);
    [-0.14, 0.14].forEach(x => {
      const fork = new THREE.Mesh(forkGeo, chromeMat);
      fork.position.set(x, 0.58, -0.75);
      fork.rotation.x = c.forkAngle;
      this.bikeGroup.add(fork);
    });

    // ── Rear Swingarm ──
    [-0.12, 0.12].forEach(x => {
      const sw = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.7), engineMat);
      sw.position.set(x, 0.3, 0.25);
      sw.rotation.x = -0.15;
      this.bikeGroup.add(sw);
    });
    const shock = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.02, 0.4), chromeMat);
    shock.position.set(0, 0.4, 0.35);
    shock.rotation.x = -0.3;
    this.bikeGroup.add(shock);

    // ── Engine ──
    const eSizes = { starter: [0.25, 0.3, 0.4], cruiser: [0.35, 0.3, 0.5], sport: [0.28, 0.32, 0.42], superbike: [0.3, 0.35, 0.45] };
    const es = eSizes[bikeId] || eSizes.starter;
    const engine = new THREE.Mesh(new THREE.BoxGeometry(es[0], es[1], es[2]), engineMat);
    engine.position.set(0, 0.25, -0.1);
    this.bikeGroup.add(engine);
    if (bikeId !== 'starter') {
      const numCyls = bikeId === 'superbike' ? 4 : bikeId === 'sport' ? 3 : 2;
      for (let i = 0; i < numCyls; i++) {
        const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.18, 8), chromeMat);
        cyl.rotation.z = Math.PI / 2;
        cyl.position.set(es[0] / 2 + 0.05, 0.22, -0.22 + i * 0.13);
        this.bikeGroup.add(cyl);
      }
    }

    // ── Gas Tank ──
    const tankGeo = new THREE.CylinderGeometry(c.tankW, c.tankW + 0.06, c.tankH, 16);
    tankGeo.rotateX(Math.PI / 2);
    const tank = new THREE.Mesh(tankGeo, bodyMat);
    tank.position.set(0, 0.6, -0.08);
    if (c.tankSlant) tank.rotation.x = c.tankSlant;
    this.bikeGroup.add(tank);
    this.tank = tank;
    // Racing stripe
    if (bikeId === 'sport' || bikeId === 'superbike') {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.01, c.tankH * 0.75), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      stripe.position.set(0, 0.6 + c.tankW + 0.01, -0.08);
      this.bikeGroup.add(stripe);
    }
    // Cap
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 12), new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 }));
    cap.position.set(0, 0.6 + c.tankW, -0.15);
    this.bikeGroup.add(cap);

    // ── Fairings ──
    if (bikeId === 'sport' || bikeId === 'superbike') {
      const fairW = bikeId === 'superbike' ? 0.52 : 0.46;
      const fairing = new THREE.Mesh(new THREE.BoxGeometry(fairW, 0.35, 0.6), bodyMat);
      fairing.position.set(0, 0.4, -0.5);
      this.bikeGroup.add(fairing);
      // Side vents
      [-fairW / 2, fairW / 2].forEach(x => {
        for (let v = 0; v < 3; v++) {
          const vent = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.05), new THREE.MeshBasicMaterial({ color: 0x222222, side: THREE.DoubleSide }));
          vent.position.set(x, 0.42 - v * 0.08, -0.45);
          vent.rotation.y = x > 0 ? Math.PI / 2 : -Math.PI / 2;
          this.bikeGroup.add(vent);
        }
      });
    }

    // Cruiser crash bars
    if (bikeId === 'cruiser') {
      [-0.2, 0.2].forEach(x => {
        const guard = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.025, 8, 12, Math.PI), chromeMat);
        guard.position.set(x, 0.2, -0.25);
        guard.rotation.y = Math.PI / 2;
        this.bikeGroup.add(guard);
      });
    }

    // ── Seat ──
    const seatLen = bikeId === 'cruiser' ? 0.55 : 0.4;
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, seatLen), darkMat);
    seat.position.set(0, c.seatY, c.seatZ);
    this.bikeGroup.add(seat);
    // Cruiser backrest
    if (bikeId === 'cruiser' && upgradeLevel >= 2) {
      const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.2, 0.04), chromeMat);
      backrest.position.set(0, 0.65, 0.55);
      this.bikeGroup.add(backrest);
    }

    // ── Tail section ──
    if (bikeId === 'sport' || bikeId === 'superbike') {
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.35), bodyMat);
      tail.position.set(0, 0.6, 0.5);
      tail.rotation.x = -0.2;
      this.bikeGroup.add(tail);
    }
    if (bikeId === 'cruiser') {
      const fender = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.5), bodyMat);
      fender.position.set(0, 0.55, 0.55);
      this.bikeGroup.add(fender);
    }

    // ── Exhaust ──
    const exGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.7, 8);
    exGeo.rotateX(Math.PI / 2);
    const exMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 });
    const tipGeo = new THREE.CylinderGeometry(0.055, 0.04, 0.08, 8);
    tipGeo.rotateX(Math.PI / 2);
    const tipMat = new THREE.MeshStandardMaterial({ color: isMaxed ? 0xffcc00 : 0x888888, metalness: 0.95 });

    const addExhaust = (x, rotY) => {
      const ex = new THREE.Mesh(exGeo, exMat);
      ex.position.set(x, 0.22, 0.35);
      ex.rotation.y = rotY;
      this.bikeGroup.add(ex);
      const tip = new THREE.Mesh(tipGeo, tipMat);
      tip.position.set(x, 0.22, 0.7);
      this.bikeGroup.add(tip);
    };
    addExhaust(0.22, -0.08);
    if (bikeId === 'cruiser' || bikeId === 'superbike' || upgradeLevel >= 4) {
      addExhaust(-0.22, 0.08);
    }

    // ── Saddlebags ──
    if (bikeId === 'cruiser' && upgradeLevel >= 3) {
      [-0.3, 0.3].forEach(x => {
        const bag = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.25, 0.35), new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 }));
        bag.position.set(x, 0.42, 0.5);
        this.bikeGroup.add(bag);
      });
    }

    // ── Spoiler ──
    if ((bikeId === 'sport' || bikeId === 'superbike') && upgradeLevel >= 5) {
      const spoiler = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.04, 0.08), bodyMat);
      spoiler.position.set(0, 0.75, 0.65);
      this.bikeGroup.add(spoiler);
      [-0.12, 0.12].forEach(x => {
        const sup = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.1, 0.02), chromeMat);
        sup.position.set(x, 0.7, 0.65);
        this.bikeGroup.add(sup);
      });
    }

    // ── Carbon fiber accents ──
    if (upgradeLevel >= 6) {
      const carbonMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.3, roughness: 0.4 });
      const fFender = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.04, 0.35), carbonMat);
      fFender.position.set(0, 0.48, -0.85);
      this.bikeGroup.add(fFender);
    }

    // ── Handlebars ──
    const barW = bikeId === 'cruiser' ? 0.9 : 0.7;
    const handleBar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, barW), chromeMat);
    handleBar.rotation.z = Math.PI / 2;
    handleBar.position.set(0, c.barY, c.barZ);
    this.bikeGroup.add(handleBar);
    const gripHalfW = bikeId === 'cruiser' ? 0.45 : 0.35;
    [-gripHalfW, gripHalfW].forEach(x => {
      const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.12), darkMat);
      grip.rotation.z = Math.PI / 2;
      grip.position.set(x, c.barY, c.barZ);
      this.bikeGroup.add(grip);
    });
    // Mirrors
    [-gripHalfW - 0.04, gripHalfW + 0.04].forEach(x => {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.12), chromeMat);
      arm.position.set(x, c.barY + 0.06, c.barZ);
      this.bikeGroup.add(arm);
      const mirror = new THREE.Mesh(new THREE.CircleGeometry(0.04, 8), new THREE.MeshPhongMaterial({ color: 0x555588, shininess: 100, side: THREE.DoubleSide }));
      mirror.position.set(x, c.barY + 0.12, c.barZ);
      mirror.rotation.x = -0.3;
      this.bikeGroup.add(mirror);
    });

    // ── Windshield ──
    if (bikeId !== 'cruiser') {
      const gW = bikeId === 'superbike' ? 0.32 : 0.28;
      const gH = bikeId === 'superbike' ? 0.28 : 0.22;
      const glassGeo = new THREE.PlaneGeometry(gW, gH, 4, 4);
      const pos = glassGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        pos.setZ(i, -0.5 * pos.getX(i) * pos.getX(i));
      }
      glassGeo.computeVertexNormals();
      const windshield = new THREE.Mesh(glassGeo, new THREE.MeshPhongMaterial({ color: 0x88bbff, transparent: true, opacity: 0.45, side: THREE.DoubleSide, shininess: 120 }));
      windshield.position.set(0, c.barY + 0.08, c.barZ - 0.08);
      windshield.rotation.x = -Math.PI / 5;
      this.bikeGroup.add(windshield);
    }

    // ── Headlight ──
    const hlSize = bikeId === 'cruiser' ? 0.12 : 0.09;
    const hlMesh = new THREE.Mesh(new THREE.SphereGeometry(hlSize, 12, 12, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0xffffee }));
    hlMesh.position.set(0, 0.55, -0.92);
    hlMesh.rotation.y = Math.PI;
    this.bikeGroup.add(hlMesh);
    const hlHousing = new THREE.Mesh(new THREE.SphereGeometry(hlSize + 0.02, 12, 12, 0, Math.PI), chromeMat);
    hlHousing.position.copy(hlMesh.position);
    hlHousing.position.z += 0.01;
    hlHousing.rotation.y = Math.PI;
    this.bikeGroup.add(hlHousing);

    this.headlight = new THREE.SpotLight(0xffffee, 0, 80, Math.PI / 5, 0.6, 1.5);
    this.headlight.position.set(0, 0.55, -0.95);
    this.headlightTarget = new THREE.Object3D();
    this.headlightTarget.position.set(0, 0, -10);
    this.bikeGroup.add(this.headlightTarget);
    this.headlight.target = this.headlightTarget;
    this.bikeGroup.add(this.headlight);

    // Tail light
    const tailLight = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 0.02), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
    tailLight.position.set(0, 0.55, 0.72);
    this.bikeGroup.add(tailLight);

    // ── RIDER ──
    const suitColor = bikeId === 'cruiser' ? 0x222222 : 0x1a1a2e;
    const suitMat = new THREE.MeshStandardMaterial({ color: suitColor, roughness: 0.8 });
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const helmetMat = new THREE.MeshStandardMaterial({ color: baseColor, metalness: 0.5, roughness: 0.2 });

    const riderGroup = new THREE.Group();

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.38, 0.18), suitMat);
    torso.position.set(0, 0.82, c.seatZ);
    torso.rotation.x = c.riderLean;
    riderGroup.add(torso);

    // Arms
    [-0.2, 0.2].forEach(x => {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 0.08), suitMat);
      arm.position.set(x, 0.85, c.seatZ - 0.12);
      arm.rotation.x = c.riderLean + 0.4;
      riderGroup.add(arm);
    });
    [-0.2, 0.2].forEach(x => {
      const fa = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.25, 0.07), suitMat);
      fa.position.set(x, 0.84, c.barZ + 0.15);
      fa.rotation.x = -0.6;
      riderGroup.add(fa);
    });
    [-gripHalfW, gripHalfW].forEach(x => {
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), darkMat);
      hand.position.set(x, c.barY - 0.02, c.barZ);
      riderGroup.add(hand);
    });

    // Legs
    [-0.09, 0.09].forEach(x => {
      const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.3), suitMat);
      thigh.position.set(x, 0.56, c.seatZ - 0.05);
      riderGroup.add(thigh);
    });
    [-0.1, 0.1].forEach(x => {
      const shin = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.28, 0.1), suitMat);
      shin.position.set(x, 0.4, c.seatZ - 0.2);
      shin.rotation.x = 0.2;
      riderGroup.add(shin);
    });
    [-0.1, 0.1].forEach(x => {
      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.16), bootMat);
      boot.position.set(x, 0.24, c.seatZ - 0.28);
      riderGroup.add(boot);
    });

    // Helmet
    const headY = (bikeId === 'sport' || bikeId === 'superbike') ? 1.02 : 1.1;
    const headZ = (bikeId === 'sport' || bikeId === 'superbike') ? c.seatZ - 0.08 : c.seatZ + 0.02;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), helmetMat);
    head.position.set(0, headY, headZ);
    riderGroup.add(head);
    // Visor
    const visor = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.07), new THREE.MeshPhongMaterial({ color: 0x111122, shininess: 100, transparent: true, opacity: 0.85 }));
    visor.position.set(0, headY - 0.02, headZ - 0.115);
    visor.rotation.x = -c.riderLean * 0.3;
    riderGroup.add(visor);

    this.riderGroup = riderGroup;
    this.bikeGroup.add(riderGroup);

    // ── Dashboard HUD ──
    this.hudCanvas = document.createElement('canvas');
    this.hudCanvas.width = 256;
    this.hudCanvas.height = 128;
    this.hudCtx = this.hudCanvas.getContext('2d');
    this.dashTexture = new THREE.CanvasTexture(this.hudCanvas);
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.14), new THREE.MeshBasicMaterial({ map: this.dashTexture }));
    dash.position.set(0, c.barY - 0.06, c.barZ + 0.08);
    dash.rotation.x = -Math.PI / 4;
    this.bikeGroup.add(dash);

    this._currentBikeId = bikeId;
    this._currentUpgradeLevel = upgradeLevel;
  }
  
  setHeadlight(isOn) {
    if (this.headlight) this.headlight.intensity = isOn ? 2.5 : 0;
  }
  
  reset() {
    this.position.set(0, 0, 0);
    this.speed = 0;
    this.leanAngle = 0;
    this.fuel = 1.0;
    this.nitro = 1.0;
    this.isCrashed = false;
    this.bikeGroup.position.copy(this.position);
    this.bikeGroup.rotation.z = 0;
  }
  
  crash() {
    this.isCrashed = true;
    this.speed = 0;
  }
  
  update(dt, input) {
    if (this.isCrashed) return;

    let targetSpeed = 0;
    if (input.accelerate) {
      targetSpeed = this.topSpeed;
    } else {
      targetSpeed = 10;
    }
    
    if (input.brake) {
      targetSpeed = 0;
      this.speed = THREE.MathUtils.lerp(this.speed, targetSpeed, dt * 2);
    } else {
      this.speed = THREE.MathUtils.lerp(this.speed, targetSpeed, dt * 0.5);
    }

    if (input.nitro && this.nitro > 0 && this.speed > 20) {
      this.speed += this.acceleration * 1.5 * dt;
      this.nitro -= dt * 0.2;
    } else {
      this.nitro = Math.min(1.0, this.nitro + dt * 0.05);
    }

    this.fuel -= dt * 0.01 * (this.speed / this.topSpeed + 0.5);

    let targetLean = 0;
    if (input.left) {
      this.position.x -= this.handling * dt;
      targetLean = Math.PI / 6;
    }
    if (input.right) {
      this.position.x += this.handling * dt;
      targetLean = -Math.PI / 6;
    }

    const roadWidth = 8;
    this.position.x = THREE.MathUtils.clamp(this.position.x, -roadWidth / 2 + 1, roadWidth / 2 - 1);
    this.position.z -= this.speed * dt;
    this.leanAngle = THREE.MathUtils.lerp(this.leanAngle, targetLean, dt * 5);

    this.bikeGroup.position.copy(this.position);
    this.bikeGroup.rotation.z = this.leanAngle;

    if (input.brake && this.speed > 30) {
      const skid = new THREE.Mesh(this.skidGeo, this.skidMat.clone());
      skid.rotation.x = -Math.PI / 2;
      skid.position.copy(this.position);
      skid.position.y = 0.02;
      skid.position.z += 1.0;
      skid.position.x -= this.leanAngle * 0.5;
      this.scene.add(skid);
      this.skidMarks.push({ mesh: skid, life: 3.0 });
    }

    for (let i = this.skidMarks.length - 1; i >= 0; i--) {
      let p = this.skidMarks[i];
      p.life -= dt;
      p.mesh.material.opacity = (p.life / 3.0) * 0.8;
      if (p.life <= 0 || p.mesh.position.z > this.position.z + 100) {
        this.scene.remove(p.mesh);
        this.skidMarks.splice(i, 1);
      }
    }

    if (this.speed > 20 && Math.random() > 0.3) {
      if (input.nitro && this.nitro > 0) {
        this.exhaustMat.color.setHex(0x00ffff);
      } else {
        this.exhaustMat.color.setHex(0xff5500);
      }
      const particle = new THREE.Mesh(this.exhaustGeo, this.exhaustMat.clone());
      particle.position.copy(this.position);
      particle.position.z += 1.5;
      particle.position.y += 0.4;
      particle.position.x += (Math.random() - 0.5) * 0.4;
      this.scene.add(particle);
      this.exhaustParticles.push({ mesh: particle, life: 1.0 });
    }

    for (let i = this.exhaustParticles.length - 1; i >= 0; i--) {
      let p = this.exhaustParticles[i];
      p.life -= dt * 4;
      p.mesh.scale.setScalar(p.life * 2);
      p.mesh.material.opacity = p.life;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.exhaustParticles.splice(i, 1);
      }
    }

    this.bounds.setFromCenterAndSize(
      new THREE.Vector3(this.position.x, this.position.y + 0.5, this.position.z),
      new THREE.Vector3(0.6, 1.0, 2.0)
    );

    this.updateDashboard();
  }
  
  updateDashboard() {
    if (!this.hudCtx) return;
    const ctx = this.hudCtx;

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, 256, 128);
    ctx.strokeStyle = '#334455';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 252, 124);

    ctx.beginPath();
    ctx.moveTo(128, 10);
    ctx.lineTo(128, 118);
    ctx.strokeStyle = '#223344';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = 'bold 36px sans-serif';
    ctx.fillStyle = '#00ffcc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.floor(this.speed * 2.5)}`, 64, 45);

    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = '#888888';
    ctx.fillText('KM/H', 64, 80);

    ctx.fillStyle = '#aaaaaa';
    ctx.fillText('FUEL', 192, 30);

    ctx.fillStyle = '#222222';
    ctx.fillRect(172, 45, 40, 60);
    
    const fp = Math.max(0, this.fuel);
    ctx.fillStyle = fp > 0.5 ? '#00ff00' : fp > 0.2 ? '#ffff00' : '#ff0000';
    const fh = 56 * fp;
    ctx.fillRect(174, 47 + (56 - fh), 36, fh);
    
    this.dashTexture.needsUpdate = true;
  }
}
