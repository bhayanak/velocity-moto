import * as THREE from 'three';

export class PickupManager {
  constructor(scene) {
    this.scene = scene;
    this.pickups = [];
    
    // Geometries & Materials mapped by type
    this.types = {
      fuel: {
        geo: new THREE.CylinderGeometry(0.3, 0.3, 0.6, 8),
        mat: new THREE.MeshLambertMaterial({ color: 0x00ff00 }), // Green for fuel
        reward: 0.3 // adds 30% fuel
      },
      nitro: {
        geo: new THREE.CylinderGeometry(0.2, 0.2, 0.8, 8),
        mat: new THREE.MeshLambertMaterial({ color: 0x00aaff }), // Blue for nitro
        reward: 0.5 // adds 50% nitro
      },
      coin: {
        geo: new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16),
        mat: new THREE.MeshLambertMaterial({ color: 0xffcc00 }), // Gold/Yellow for coin
        reward: 1 // 1 coin
      }
    };
    
    this.spawnTimer = 0;
  }
  
  reset() {
    this.pickups.forEach(p => this.scene.remove(p.mesh));
    this.pickups = [];
    this.spawnTimer = 0;
  }
  
  spawnPickup(playerZ) {
    const typeKeys = Object.keys(this.types);
    // Weighted selection: coins are more common than fuel, nitro is rarest
    const roll = Math.random();
    let selectedType = 'coin';
    if (roll > 0.85) selectedType = 'fuel';
    else if (roll > 0.70) selectedType = 'nitro';
    
    const config = this.types[selectedType];
    const lane = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
    const laneWidth = 3.3;

    // Spawn grouped coins
    const count = selectedType === 'coin' ? Math.floor(Math.random() * 3) + 2 : 1;
    
    for (let i = 0; i < count; i++) {
        const mesh = new THREE.Mesh(config.geo, config.mat);
        
        // Stand coins up, orient cylinders
        if (selectedType === 'coin') {
          mesh.rotation.x = Math.PI / 2;
        } else {
          mesh.rotation.z = Math.PI / 2;
        }

        // Space out coins longitudinally
        mesh.position.set(lane * laneWidth, 0.5, playerZ - 200 - (i * 3)); 
        
        this.scene.add(mesh);
        
        this.pickups.push({
          mesh,
          type: selectedType,
          reward: config.reward,
          bounds: new THREE.Box3()
        });
    }
  }
  
  update(dt, playerZ) {
    this.spawnTimer += dt;
    
    // Pickups spawn less frequently than traffic
    if (this.spawnTimer > 4.0) {
      if (Math.random() > 0.1) {
        this.spawnPickup(playerZ);
      }
      this.spawnTimer = 0;
    }
    
    // Animate and cleanup
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      p.mesh.rotation.y += dt * 2; // rotating animation
      
      // Update bounds for collection check
      p.bounds.setFromObject(p.mesh);
      
      // Cleanup if missed
      if (p.mesh.position.z > playerZ + 20) {
        this.scene.remove(p.mesh);
        this.pickups.splice(i, 1);
      }
    }
  }
  
  // Return collected pickups to be processed by game core
  checkCollections(playerBounds) {
    const collected = [];
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      if (playerBounds.intersectsBox(this.pickups[i].bounds)) {
        collected.push(this.pickups[i]);
        this.scene.remove(this.pickups[i].mesh);
        this.pickups.splice(i, 1);
      }
    }
    return collected;
  }
}
