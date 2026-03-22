import * as THREE from 'three';

export class PlayerBike {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    
    // Core stats
    this.topSpeed = 120; // max Z units per second
    this.acceleration = 30; // units per second squared
    this.deceleration = 40;
    this.handling = 15; // lateral units per second
    
    // State
    this.position = new THREE.Vector3(0, 0, 0);
    this.speed = 0;
    this.leanAngle = 0;
    this.fuel = 1.0;
    this.nitro = 1.0;
    this.isCrashed = false;
    
    // Bounding box for collisions
    this.bounds = new THREE.Box3();
    
    this.createCockpitModel();

    // Setup Exhaust particles
    this.exhaustParticles = [];
    this.exhaustGeo = new THREE.PlaneGeometry(0.2, 0.2);
    this.exhaustMat = new THREE.MeshBasicMaterial({ 
      color: 0xffaa00, 
      transparent: true, 
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    // Setup Skid Marks
    this.skidMarks = [];
    this.skidGeo = new THREE.PlaneGeometry(0.5, 2.0); // wide, long
    this.skidMat = new THREE.MeshBasicMaterial({ 
      color: 0x050505, 
      transparent: true, 
      opacity: 0.8,
      depthWrite: false
    });
  }
  
  createCockpitModel() {
    this.bikeGroup = new THREE.Group();
    this.scene.add(this.bikeGroup);
    
    // More complex fuel tank (cylinder + box combo shaped)
    const tankGeo = new THREE.CylinderGeometry(0.3, 0.4, 0.8, 16);
    tankGeo.rotateX(Math.PI / 2);
    // Dark carbon fiber look
    const tankMat = new THREE.MeshPhongMaterial({ color: 0x111111, specular: 0x555555, shininess: 50 });
    const tank = new THREE.Mesh(tankGeo, tankMat);
    tank.position.set(0, 0.5, 0.2);
    this.bikeGroup.add(tank);
    this.tank = tank; // Added reference for upgrades
    
    // Handlebars with grips
    const barGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.2);
    const barMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 });
    const handleBar = new THREE.Mesh(barGeo, barMat);
    handleBar.rotation.z = Math.PI / 2;
    handleBar.position.set(0, 0.8, -0.2);
    this.bikeGroup.add(handleBar);

    // Grips
    const gripGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.2);
    const gripMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    const gripL = new THREE.Mesh(gripGeo, gripMat);
    gripL.rotation.z = Math.PI / 2;
    gripL.position.set(-0.5, 0.8, -0.2);
    this.bikeGroup.add(gripL);
    
    const gripR = new THREE.Mesh(gripGeo, gripMat);
    gripR.rotation.z = Math.PI / 2;
    gripR.position.set(0.5, 0.8, -0.2);
    this.bikeGroup.add(gripR);

    // Windshield (sleek, smaller and sporty)
    const glassGeo = new THREE.PlaneGeometry(0.35, 0.25, 4, 4);
    const posAttribute = glassGeo.attributes.position;
    for (let i = 0; i < posAttribute.count; i++) {
        const x = posAttribute.getX(i);
        const y = posAttribute.getY(i);
        // Curve the windshield horizontally and tilt top back
        const z = -0.6 * (x * x) - 0.1 * y; 
        posAttribute.setZ(i, z);
    }
    glassGeo.computeVertexNormals();

    const glassMat = new THREE.MeshPhongMaterial({ 
        color: 0x55aaff, 
        transparent: true, 
        opacity: 0.5, 
        side: THREE.DoubleSide,
        shininess: 120
    });
    const windshield = new THREE.Mesh(glassGeo, glassMat);
    windshield.position.set(0, 0.90, -0.45); 
    windshield.rotation.x = -Math.PI / 4.5;
    this.bikeGroup.add(windshield);
    
    // Tank Cap (Gas Hole - 2 3D effect dark circles with pin hole)
    // Outer Ring
    const capOuterGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.02, 16);
    const capOuterMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.6 });
    const capOuter = new THREE.Mesh(capOuterGeo, capOuterMat);
    capOuter.position.set(0, 0.72, 0.2); 
    this.bikeGroup.add(capOuter);

    // Inner Hole (pin hole impression)
    const capInnerGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.025, 12);
    const capInnerMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
    const capInner = new THREE.Mesh(capInnerGeo, capInnerMat);
    capInner.position.set(0, 0.725, 0.2);
    this.bikeGroup.add(capInner);

    // Rider Hands on handles
    const handGeo = new THREE.SphereGeometry(0.06, 16, 16);
    // Gloved hands
    const handMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
    
    const handL = new THREE.Mesh(handGeo, handMat);
    handL.scale.set(1.5, 1, 1);
    handL.position.set(-0.5, 0.82, -0.2);
    this.bikeGroup.add(handL);
    
    const handR = new THREE.Mesh(handGeo, handMat);
    handR.scale.set(1.5, 1, 1);
    handR.position.set(0.5, 0.82, -0.2);
    this.bikeGroup.add(handR);
    
    // Dashboard screen (Dynamic Canvas for Speedometer)
    const dashGeo = new THREE.PlaneGeometry(0.35, 0.2);
    
    this.hudCanvas = document.createElement('canvas');
    this.hudCanvas.width = 256;
    this.hudCanvas.height = 128;
    this.hudCtx = this.hudCanvas.getContext('2d');
    this.dashTexture = new THREE.CanvasTexture(this.hudCanvas);
    
    const dashMat = new THREE.MeshBasicMaterial({ map: this.dashTexture });
    const dash = new THREE.Mesh(dashGeo, dashMat);
    dash.position.set(0, 0.88, -0.3);
    dash.rotation.x = -Math.PI / 4;
    this.bikeGroup.add(dash);
    
    // Headlight
    this.headlight = new THREE.SpotLight(0xffffee, 0, 100, Math.PI / 4, 0.5, 1);
    this.headlight.position.set(0, 0.7, -0.5);
    // Target slightly ahead and down
    this.headlightTarget = new THREE.Object3D();
    this.headlightTarget.position.set(0, 0, -10);
    this.bikeGroup.add(this.headlightTarget);
    this.headlight.target = this.headlightTarget;
    this.bikeGroup.add(this.headlight);
  }
  
  setHeadlight(isOn) {
    this.headlight.intensity = isOn ? 2.5 : 0;
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
    
    // Base moving forward
    let targetSpeed = 0;
    
    if (input.accelerate) {
      targetSpeed = this.topSpeed;
    } else {
      // Passive deceleration (engine braking)
      targetSpeed = 10; // minimum cruising speed unless crashed
    }
    
    if (input.brake) {
      targetSpeed = 0;
      this.speed = THREE.MathUtils.lerp(this.speed, targetSpeed, dt * 2);
    } else {
      // Normal acceleration
      this.speed = THREE.MathUtils.lerp(this.speed, targetSpeed, dt * 0.5);
    }
    
    // Nitro logic
    if (input.nitro && this.nitro > 0 && this.speed > 20) {
      this.speed += this.acceleration * 1.5 * dt; // Nitro Boost
      this.nitro -= dt * 0.2; // drain nitro
    } else {
      // Recharge nitro slowly
      this.nitro = Math.min(1.0, this.nitro + dt * 0.05);
    }
    
    // Fuel drain
    this.fuel -= dt * 0.01 * (this.speed / this.topSpeed + 0.5);
    
    // Steering
    let targetLean = 0;
    if (input.left) {
      this.position.x -= this.handling * dt;
      targetLean = Math.PI / 6;
    }
    if (input.right) {
      this.position.x += this.handling * dt;
      targetLean = -Math.PI / 6;
    }
    
    // Limit road bounds
    const roadWidth = 8;
    this.position.x = THREE.MathUtils.clamp(this.position.x, -roadWidth/2 + 1, roadWidth/2 - 1);
    
    // Apply speed to Z moving forward (negative Z is forward in Three.js)
    this.position.z -= this.speed * dt;
    
    // Update Lean smoothing
    this.leanAngle = THREE.MathUtils.lerp(this.leanAngle, targetLean, dt * 5);
    
    // Update Mesh
    this.bikeGroup.position.copy(this.position);
    this.bikeGroup.rotation.z = this.leanAngle;
    
    // Braking Skidmarks
    if (input.brake && this.speed > 30) {
      const skid = new THREE.Mesh(this.skidGeo, this.skidMat.clone());
      skid.rotation.x = -Math.PI / 2; // flat on road
      skid.position.copy(this.position);
      skid.position.y = 0.02; // just above road
      skid.position.z += 1.0; // behind bike
      // slightly sway with lean
      skid.position.x -= this.leanAngle * 0.5;
      
      this.scene.add(skid);
      this.skidMarks.push({ mesh: skid, life: 3.0 }); // 3 seconds life
    }
    
    // Animate Skidmarks
    for (let i = this.skidMarks.length - 1; i >= 0; i--) {
      let p = this.skidMarks[i];
      p.life -= dt;
      p.mesh.material.opacity = (p.life / 3.0) * 0.8;
      // remove when too far behind
      if (p.life <= 0 || p.mesh.position.z > this.position.z + 100) {
        this.scene.remove(p.mesh);
        this.skidMarks.splice(i, 1);
      }
    }
    
    // Update Exhaust
    if (this.speed > 20 && Math.random() > 0.3) {
      if (input.nitro && this.nitro > 0) {
        this.exhaustMat.color.setHex(0x00ffff); // blue flame for nitro
      } else {
        this.exhaustMat.color.setHex(0xff5500); // normal orange flame
      }
      const particle = new THREE.Mesh(this.exhaustGeo, this.exhaustMat.clone());
      particle.position.copy(this.position);
      // Place at the tailpipes
      particle.position.z += 1.5;
      particle.position.y += 0.4;
      particle.position.x += (Math.random() - 0.5) * 0.4;
      
      this.scene.add(particle);
      this.exhaustParticles.push({ mesh: particle, life: 1.0 });
    }
    
    // Animate Exhaust
    for (let i = this.exhaustParticles.length - 1; i >= 0; i--) {
      let p = this.exhaustParticles[i];
      p.life -= dt * 4; // fast fade
      p.mesh.scale.setScalar(p.life * 2);
      p.mesh.material.opacity = p.life;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.exhaustParticles.splice(i, 1);
      }
    }
    
    // Update collision bounds - make much narrower than visual width for zooming near cars
    this.bounds.setFromCenterAndSize(
      new THREE.Vector3(this.position.x, this.position.y + 0.5, this.position.z),
      new THREE.Vector3(0.6, 1.0, 2.0)
    );
    
    // Update Digital Dashboard
    this.updateDashboard();
  }
  
  updateDashboard() {
    if (!this.hudCtx) return;
    const ctx = this.hudCtx;
    
    // Background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, 256, 128);
    
    // Outer Border
    ctx.strokeStyle = '#334455';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 252, 124);
    
    // Separator line
    ctx.beginPath();
    ctx.moveTo(128, 10);
    ctx.lineTo(128, 118);
    ctx.strokeStyle = '#223344';
    ctx.lineWidth = 2;
    ctx.stroke();

    // LEFT SIDE: SPEED
    ctx.font = 'bold 36px sans-serif';
    ctx.fillStyle = '#00ffcc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const displaySpeed = Math.floor(this.speed * 2.5);
    ctx.fillText(`${displaySpeed}`, 64, 45);
    
    // KM/H label
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = '#888888';
    ctx.fillText('KM/H', 64, 80);
    
    // RIGHT SIDE: FUEL
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText('FUEL', 192, 30);
    
    // Vertical Fuel Bar Background
    ctx.fillStyle = '#222222';
    // x, y, w, h
    ctx.fillRect(172, 45, 40, 60);
    
    // Fuel Bar Fill (changes color based on level)
    const fuelPercent = Math.max(0, this.fuel);
    if (fuelPercent > 0.5) ctx.fillStyle = '#00ff00';
    else if (fuelPercent > 0.2) ctx.fillStyle = '#ffff00';
    else ctx.fillStyle = '#ff0000';
    
    const fillHeight = 56 * fuelPercent;
    ctx.fillRect(174, 47 + (56 - fillHeight), 36, fillHeight);
    
    this.dashTexture.needsUpdate = true;
  }
}
