import * as THREE from 'three';

export class HazardManager {
  constructor(scene) {
    this.scene = scene;
    this.hazards = [];
    
    // Pot hole geometry - a flat dark disc slightly above the ground
    this.potholeGeo = new THREE.CircleGeometry(0.8, 16);
    this.potholeMat = new THREE.MeshBasicMaterial({ color: 0x111111, depthWrite: false }); // Prevents Z-fighting
    
    // Roadblock geometry
    this.barrierGeo = new THREE.BoxGeometry(2.5, 0.8, 0.4);
    this.barrierMat = new THREE.MeshLambertMaterial({ color: 0xffaa00 });

    this.spawnTimer = 0;
  }
  
  reset() {
    this.hazards.forEach(h => this.scene.remove(h.mesh));
    this.hazards = [];
    this.spawnTimer = 0;
  }
  
  spawnHazard(playerZ) {
    const type = 'pothole'; // Temporarily removed barriers as per design
    let mesh, boundsSize;
    
    if (type === 'pothole') {
      mesh = new THREE.Mesh(this.potholeGeo, this.potholeMat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = 0.05; // Slightly above road
      boundsSize = new THREE.Vector3(1.6, 0.1, 1.6);
    } else {
      mesh = new THREE.Mesh(this.barrierGeo, this.barrierMat);
      mesh.position.y = 0.4;
      mesh.castShadow = true;
      boundsSize = new THREE.Vector3(2.5, 0.8, 0.4);
    }

    const lane = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
    const laneWidth = 3.3;
    
    mesh.position.set(lane * laneWidth, mesh.position.y, playerZ - 300);
    this.scene.add(mesh);
    
    const bounds = new THREE.Box3();
    
    this.hazards.push({
      mesh,
      type,
      bounds,
      boundsSize
    });
  }
  
  update(dt, playerZ) {
    this.spawnTimer += dt;
    
    // Spawn hazards every ~4 seconds
    if (this.spawnTimer > 4.0) {
      if (Math.random() > 0.5) {
        this.spawnHazard(playerZ);
      }
      this.spawnTimer = 0;
    }
    
    // Cleanup passed hazards
    for (let i = this.hazards.length - 1; i >= 0; i--) {
      const h = this.hazards[i];
      
      // Update bounds for collision check
      h.bounds.setFromCenterAndSize(h.mesh.position, h.boundsSize);
      
      if (h.mesh.position.z > playerZ + 20) {
        this.scene.remove(h.mesh);
        this.hazards.splice(i, 1);
      }
    }
  }

  checkCollisions(playerBounds) {
    for (let i = this.hazards.length - 1; i >= 0; i--) {
      if (playerBounds.intersectsBox(this.hazards[i].bounds)) {
        const hit = this.hazards[i];
        
        // Remove it so it doesn't cause constant collisons
        this.scene.remove(hit.mesh);
        this.hazards.splice(i, 1);
        
        return hit.type; // 'pothole' or 'barrier'
      }
    }
    return null;
  }
}
