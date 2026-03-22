import * as THREE from 'three';

export class TrafficManager {
  constructor(scene) {
    this.scene = scene;
    this.vehicles = [];
    

    // Create shared geometries to save memory
    this.carBodyGeo = new THREE.BoxGeometry(1.8, 0.6, 4.0);
    this.carCabinGeo = new THREE.BoxGeometry(1.4, 0.5, 2.0);
    this.truckBodyGeo = new THREE.BoxGeometry(2.2, 2.0, 7.0);
    this.truckCabinGeo = new THREE.BoxGeometry(2.0, 1.5, 2.5);
    
    this.busBodyGeo = new THREE.BoxGeometry(2.4, 2.8, 10.0);

    this.wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.3, 16);
    this.wheelGeo.rotateZ(Math.PI / 2);
    
    this.windowMat = new THREE.MeshPhongMaterial({ color: 0x111111, shininess: 100 });

    this.wheelMat = new THREE.MeshLambertMaterial({ color: 0x222222 });

    this.carMats = [
      new THREE.MeshLambertMaterial({ color: 0x1144ff }),
      new THREE.MeshLambertMaterial({ color: 0xff2244 }),
      new THREE.MeshLambertMaterial({ color: 0xffee00 }),
      new THREE.MeshLambertMaterial({ color: 0xee5500 }),
      new THREE.MeshLambertMaterial({ color: 0x888888 })
    ];
    
    this.spawnTimer = 0;
  }
  
  createCarMesh(material) {
    const group = new THREE.Group();
    
    // Body
    const body = new THREE.Mesh(this.carBodyGeo, material);
    body.position.y = 0.5;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);
    
    // Cabin
    const cabin = new THREE.Mesh(this.carCabinGeo, this.windowMat);
    cabin.position.set(0, 1.05, -0.2);
    group.add(cabin);
    
    // Wheels
    const wheelPositions = [
      [-1.0, 0.35, 1.2],
      [1.0, 0.35, 1.2],
      [-1.0, 0.35, -1.2],
      [1.0, 0.35, -1.2]
    ];
    
    wheelPositions.forEach(pos => {
        const wheel = new THREE.Mesh(this.wheelGeo, this.wheelMat);
        wheel.position.set(...pos);
        group.add(wheel);
    });
    
    // Taillights
    const tailLightGeo = new THREE.BoxGeometry(0.4, 0.1, 0.1);
    const tailLightMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const tailLightL = new THREE.Mesh(tailLightGeo, tailLightMat);
    tailLightL.position.set(-0.6, 0.5, 2.01);
    group.add(tailLightL);
    
    const tailLightR = new THREE.Mesh(tailLightGeo, tailLightMat);
    tailLightR.position.set(0.6, 0.5, 2.01);
    group.add(tailLightR);

    // Headlights
    const headLightGeo = new THREE.BoxGeometry(0.3, 0.15, 0.1);
    const headLightMat = new THREE.MeshBasicMaterial({ color: 0xffffee });
    const headLightL = new THREE.Mesh(headLightGeo, headLightMat);
    headLightL.position.set(-0.6, 0.5, -2.01);
    group.add(headLightL);
    
    const headLightR = new THREE.Mesh(headLightGeo, headLightMat);
    headLightR.position.set(0.6, 0.5, -2.01);
    group.add(headLightR);
    
    // Indicators (Blinkers)
    const blinkerGeo = new THREE.BoxGeometry(0.2, 0.1, 0.15);
    const blinkerMatL = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0 });
    const blinkerMatR = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0 });
    
    const blinkerL = new THREE.Mesh(blinkerGeo, blinkerMatL);
    blinkerL.position.set(-0.9, 0.5, 2.0);
    blinkerL.name = "blinkerL";
    group.add(blinkerL);
    
    const blinkerR = new THREE.Mesh(blinkerGeo, blinkerMatR);
    blinkerR.position.set(0.9, 0.5, 2.0);
    blinkerR.name = "blinkerR";
    group.add(blinkerR);

    return group;
  }
  
  reset() {
    this.vehicles.forEach(v => this.scene.remove(v.mesh));
    this.vehicles = [];
    this.spawnTimer = 0;
  }
  
  spawnTruck(playerZ) {
    const mat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    const group = new THREE.Group();
    
    // Truck Body
    const body = new THREE.Mesh(this.truckBodyGeo, mat);
    body.position.y = 1.0;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);
    
    // Truck Cabin
    const cabinMat = new THREE.MeshLambertMaterial({ color: 0xff4422 });
    const cabin = new THREE.Mesh(this.truckCabinGeo, cabinMat);
    cabin.position.set(0, 1.25, -2.5);
    group.add(cabin);
    
    // Wheels
    const wheelPositions = [
      [-1.2, 0.4, 2.5],
      [1.2, 0.4, 2.5],
      [-1.2, 0.4, 0],
      [1.2, 0.4, 0],
      [-1.2, 0.4, -2.5],
      [1.2, 0.4, -2.5]    ];
        wheelPositions.forEach(pos => {
        const wheel = new THREE.Mesh(this.wheelGeo, this.wheelMat);
        wheel.position.set(...pos);
        group.add(wheel);
    });

    // Tail lights
    const tailLightGeo = new THREE.BoxGeometry(0.3, 0.15, 0.1);
    const tailLightMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const tailLightL = new THREE.Mesh(tailLightGeo, tailLightMat);
    tailLightL.position.set(-0.8, 0.8, 3.51);
    group.add(tailLightL);
    const tailLightR = new THREE.Mesh(tailLightGeo, tailLightMat);
    tailLightR.position.set(0.8, 0.8, 3.51);
    group.add(tailLightR);

    // Indicators for truck
    const blinkerGeo = new THREE.BoxGeometry(0.3, 0.2, 0.15);
    const blinkerMatL = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0 });
    const blinkerMatR = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0 });
    const blinkerL = new THREE.Mesh(blinkerGeo, blinkerMatL);
    blinkerL.position.set(-1.1, 0.8, 3.5);
    blinkerL.name = "blinkerL";
    group.add(blinkerL);
    const blinkerR = new THREE.Mesh(blinkerGeo, blinkerMatR);
    blinkerR.position.set(1.1, 0.8, 3.5);
    blinkerR.name = "blinkerR";
    group.add(blinkerR);

    const targetLane = Math.floor(Math.random() * 3) - 1;
    const laneWidth = 3.3;
    
    group.position.set(targetLane * laneWidth, 0, playerZ - 250);
    this.scene.add(group);
    
    this.vehicles.push({
      mesh: group,
      speed: 12 + Math.random() * 10,
      currentLane: targetLane,
      targetLane: targetLane,
      intendedLane: targetLane,
      intentTimer: 0,
      laneSwitchTimer: 100, 
      bounds: new THREE.Box3()
    });
  }
  spawnBus(playerZ) {
    const mat = new THREE.MeshLambertMaterial({ color: 0xeeeeee }); // white/light bus
    const group = new THREE.Group();
    
    // Bus Body
    const body = new THREE.Mesh(this.busBodyGeo, mat);
    body.position.y = 1.6;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);
    
    // Long side windows
    const windowGeo = new THREE.BoxGeometry(2.45, 0.8, 8.0);
    const windows = new THREE.Mesh(windowGeo, this.windowMat);
    windows.position.set(0, 1.8, -0.5);
    group.add(windows);
    
    // Wheels
    const wheelPositions = [
      [-1.2, 0.4, 3.5],
      [1.2, 0.4, 3.5],
      [-1.2, 0.4, -3.5],
      [1.2, 0.4, -3.5]
    ];
    
    wheelPositions.forEach(pos => {
        const wheel = new THREE.Mesh(this.wheelGeo, this.wheelMat);
        wheel.position.set(...pos);
        group.add(wheel);
    });

    // Tail lights
    const tailLightGeo = new THREE.BoxGeometry(0.3, 0.15, 0.1);
    const tailLightMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const tailLightL = new THREE.Mesh(tailLightGeo, tailLightMat);
    tailLightL.position.set(-0.8, 1.2, 5.01);
    group.add(tailLightL);
    const tailLightR = new THREE.Mesh(tailLightGeo, tailLightMat);
    tailLightR.position.set(0.8, 1.2, 5.01);
    group.add(tailLightR);

    // Indicators for bus
    const blinkerGeo = new THREE.BoxGeometry(0.3, 0.2, 0.15);
    const blinkerMatL = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0 });
    const blinkerMatR = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0 });
    const blinkerL = new THREE.Mesh(blinkerGeo, blinkerMatL);
    blinkerL.position.set(-1.1, 1.2, 5.0);
    blinkerL.name = "blinkerL";
    group.add(blinkerL);
    const blinkerR = new THREE.Mesh(blinkerGeo, blinkerMatR);
    blinkerR.position.set(1.1, 1.2, 5.0);
    blinkerR.name = "blinkerR";
    group.add(blinkerR);

    const targetLane = Math.floor(Math.random() * 3) - 1;
    const laneWidth = 3.3;
    
    group.position.set(targetLane * laneWidth, 0, playerZ - 250);
    this.scene.add(group);
    
    this.vehicles.push({
      mesh: group,
      speed: 10 + Math.random() * 8, // Buses are slower
      currentLane: targetLane,
      targetLane: targetLane,
      intendedLane: targetLane,
      intentTimer: 0,
      laneSwitchTimer: 100, // Rarely switch lanes
      bounds: new THREE.Box3()
    });
  }
  spawnVehicle(playerZ) {
    const mat = this.carMats[Math.floor(Math.random() * this.carMats.length)];
    const mesh = this.createCarMesh(mat);
    
    // Determine lane (-1, 0, 1) -> maps to roughly -3.3, 0, +3.3 on X
    const targetLane = Math.floor(Math.random() * 3) - 1;
    const laneWidth = 3.3;
    
    mesh.position.set(targetLane * laneWidth, 0, playerZ - 250); // spawn far ahead
    
    this.scene.add(mesh);
    
    this.vehicles.push({
      mesh,
      speed: 15 + Math.random() * 30, // Random baseline speed
      currentLane: targetLane,
      targetLane: targetLane,
      intendedLane: targetLane,
      intentTimer: 0,
      laneSwitchTimer: 0,
      bounds: new THREE.Box3()
    });
  }
  
  update(dt, playerZ, director) {
    let passed = 0;
    this.spawnTimer += dt;
    
    // Spawn logic based on director
    const spawnRate = director ? director.currentTrafficSpawnRate : 1.5;
    if (this.spawnTimer > spawnRate) {
      const rand = Math.random();
      if (rand > 0.85) {
        this.spawnTruck(playerZ);
      } else if (rand > 0.70) {
        this.spawnBus(playerZ);
      } else {
        this.spawnVehicle(playerZ);
      }
      this.spawnTimer = 0;
    }
    
    const laneWidth = 3.3;
    const aggressiveness = director ? director.aggressiveness : 0;

    // Move and cleanup vehicles
    for (let i = this.vehicles.length - 1; i >= 0; i--) {
      const v = this.vehicles[i];
      
      // AI Logic: chance to change lanes based on aggressiveness
      if (v.intentTimer <= 0) {
        v.laneSwitchTimer -= dt;
        if (v.laneSwitchTimer <= 0 && aggressiveness > 0 && v.currentLane === v.targetLane) {
          if (Math.random() < aggressiveness * dt) {
            // Intent to switch lane
            const newLane = v.currentLane + (Math.random() > 0.5 ? 1 : -1);
            if (newLane >= -1 && newLane <= 1) {
              v.intendedLane = newLane;
              v.intentTimer = 1.0; // 1 second warning
            }
          }
        }
      }

      // Handle intent/indicators
      if (v.intentTimer > 0) {
        v.intentTimer -= dt;
        
        // Blink lights
        const blinkOn = Math.sin(v.intentTimer * 20) > 0;
        const blinkerL = v.mesh.children.find(c => c.name === 'blinkerL');
        const blinkerR = v.mesh.children.find(c => c.name === 'blinkerR');
        
        if (blinkerL && blinkerR) {
          if (v.intendedLane < v.currentLane) {
            blinkerL.material.opacity = blinkOn ? 1 : 0.2;
          } else {
            blinkerR.material.opacity = blinkOn ? 1 : 0.2;
          }
        }

        if (v.intentTimer <= 0) {
          // actually switch
          v.targetLane = v.intendedLane;
          v.laneSwitchTimer = 2.0; // cooldown
          // turn off lights
          if (blinkerL) blinkerL.material.opacity = 0;
          if (blinkerR) blinkerR.material.opacity = 0;
        }
      }

      // Smooth horizontal movement to target lane
      const targetX = v.targetLane * laneWidth;
      v.mesh.position.x = THREE.MathUtils.lerp(v.mesh.position.x, targetX, dt * 2);
      if (Math.abs(v.mesh.position.x - targetX) < 0.1) {
        v.currentLane = v.targetLane;
      }

      // Move forward away from origin
      v.mesh.position.z -= v.speed * dt; 
      
      // Update bounds for collision
      v.bounds.setFromObject(v.mesh);
      
      // Cleanup if passed behind player comfortably
      if (v.mesh.position.z > playerZ + 20) {
        passed++;
        passed++;
        this.scene.remove(v.mesh);
        this.vehicles.splice(i, 1);
      }
    }
    return passed;
  }
  
  checkCollisions(playerBounds) {
    for (const v of this.vehicles) {
      if (playerBounds.intersectsBox(v.bounds)) {
        return true;
      }
    }
    return false;
  }
}
