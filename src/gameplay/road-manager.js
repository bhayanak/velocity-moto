import * as THREE from 'three';

export class RoadManager {
  constructor(scene) {
    this.scene = scene;
    
    this.segmentLength = 50;
    this.activeSegments = [];
    this.roadWidth = 10;
    
    // Create material once
    this.roadMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a }); // Darker asphalt
    this.lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
    // Add grass material
    this.grassMat = new THREE.MeshLambertMaterial({ color: 0x113311 });
    
    // Tree/Scenery materials
    this.trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 1.5, 5);
    this.trunkMat = new THREE.MeshLambertMaterial({ color: 0x3d2817 });
    this.leavesGeo = new THREE.ConeGeometry(1.5, 3, 5);
    this.leavesMat = new THREE.MeshLambertMaterial({ color: 0x114a11 });

    // Init initial segments
    for (let i = 0; i < 5; i++) {
      this.spawnSegment(-i * this.segmentLength);
    }
  }

  applyTrackColors(trackConfig) {
    if (!trackConfig) return;
    this.currentTrackId = trackConfig.id || 'city';
    if (!trackConfig.colors) return;
    if (trackConfig.colors.road) {
      this.roadMat.color.setHex(trackConfig.colors.road);
    }
    if (trackConfig.colors.grass) {
      this.grassMat.color.setHex(trackConfig.colors.grass);
    }
    // Refresh existing segments to apply new scenery
    this.reset();
  }
  
  createDecor() {
    const group = new THREE.Group();
    const isNeon = this.currentTrackId === 'neon';
    const isDesert = this.currentTrackId === 'desert';
    const isSnow = this.currentTrackId === 'snow';
    const isCity = this.currentTrackId === 'city';

    // Pick random structure
    const rand = Math.random();

    if (isCity) {
      if (rand < 0.2) {
        // Pedestrian / Human
        const humanGeo = new THREE.BoxGeometry(0.5, 1.8, 0.5);
        const humanMat = new THREE.MeshBasicMaterial({ color: Math.random() * 0xffffff });
        const human = new THREE.Mesh(humanGeo, humanMat);
        human.position.y = 0.9;
        group.add(human);
      } else if (rand < 0.5) {
        // Street lamp
        const poleGeo = new THREE.CylinderGeometry(0.1, 0.1, 5);
        const poleMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.y = 2.5;
        group.add(pole);
        const lightGeo = new THREE.SphereGeometry(0.4);
        const lightMat = new THREE.MeshBasicMaterial({ color: 0xffffaa });
        const light = new THREE.Mesh(lightGeo, lightMat);
        light.position.y = 5.2;
        group.add(light);
      } else {
        // Tree
        const trunk = new THREE.Mesh(this.trunkGeo, this.trunkMat);
        trunk.position.y = 0.75;
        group.add(trunk);
        const leaves = new THREE.Mesh(this.leavesGeo, this.leavesMat);
        leaves.position.y = 2.5;
        group.add(leaves);
      }
    } else if (isDesert) {
      if (rand < 0.2) {
        // Camel / Ostrich
        const camelGeo = new THREE.BoxGeometry(0.8, 1.2, 1.5);
        const camelMat = new THREE.MeshLambertMaterial({ color: 0xc2a677 });
        const camel = new THREE.Mesh(camelGeo, camelMat);
        camel.position.y = 0.6;
        const neckGeo = new THREE.BoxGeometry(0.3, 1, 0.3);
        const neck = new THREE.Mesh(neckGeo, camelMat);
        neck.position.set(0, 1.5, -0.6);
        group.add(camel);
        group.add(neck);
      } else {
        // Cactus
        const cactusGeo = new THREE.CylinderGeometry(0.3, 0.3, 3);
        const cactusMat = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        const cactus = new THREE.Mesh(cactusGeo, cactusMat);
        cactus.position.y = 1.5;
        group.add(cactus);
        const armGeo = new THREE.CylinderGeometry(0.2, 0.2, 1);
        const arm = new THREE.Mesh(armGeo, cactusMat);
        arm.rotation.z = Math.PI / 2;
        arm.position.set(0.5, 1.5, 0);
        group.add(arm);
      }
    } else if (isNeon) {
      if (rand < 0.3) {
        // Robot dog
        const dogGeo = new THREE.BoxGeometry(0.8, 0.6, 1.2);
        const dogMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true });
        const dog = new THREE.Mesh(dogGeo, dogMat);
        dog.position.y = 0.4;
        group.add(dog);
      } else {
        // Neon pillar
        const poleGeo = new THREE.BoxGeometry(0.5, Math.random() * 10 + 5, 0.5);
        const poleMat = new THREE.MeshBasicMaterial({ color: Math.random() > 0.5 ? 0xff00ff : 0x00ffff, transparent: true, opacity: 0.8 });
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.y = poleGeo.parameters.height / 2;
        group.add(pole);
      }
    } else if (isSnow) {
      if (rand < 0.2) {
        // Polar bear
        const bearGeo = new THREE.BoxGeometry(1, 1, 2);
        const bearMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const bear = new THREE.Mesh(bearGeo, bearMat);
        bear.position.y = 0.5;
        group.add(bear);
      } else {
        // Pine tree snowy
        const trunk = new THREE.Mesh(this.trunkGeo, this.trunkMat);
        trunk.position.y = 0.75;
        group.add(trunk);
        const leavesMatSnow = new THREE.MeshLambertMaterial({ color: 0xffffff }); // Snowy
        const leaves = new THREE.Mesh(this.leavesGeo, leavesMatSnow);
        leaves.position.y = 2.5;
        group.add(leaves);
      }
    } else {
      if (rand < 0.2) {
        // Deer / Bear
        const deerGeo = new THREE.BoxGeometry(0.6, 0.8, 1.2);
        const deerMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const deer = new THREE.Mesh(deerGeo, deerMat);
        deer.position.y = 0.5;
        group.add(deer);
      } else {
    // Tree
        const trunk = new THREE.Mesh(this.trunkGeo, this.trunkMat);
        trunk.position.y = 0.75;
        group.add(trunk);
        const leaves = new THREE.Mesh(this.leavesGeo, this.leavesMat);
        leaves.position.y = 2.5;
        group.add(leaves);
      }
    }

    return group;
  }
  
  spawnSegment(zPos) {
    const group = new THREE.Group();
    group.position.z = zPos;
    
    // Asphalt
    const roadGeo = new THREE.PlaneGeometry(this.roadWidth, this.segmentLength);
    const roadMesh = new THREE.Mesh(roadGeo, this.roadMat);
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.receiveShadow = true;
    group.add(roadMesh);
    
    // Lane dividers
    for (let i = -1; i <= 1; i += 2) {
      const lineGeo = new THREE.PlaneGeometry(0.2, this.segmentLength - 2);
      const lineMesh = new THREE.Mesh(lineGeo, this.lineMat);
      lineMesh.rotation.x = -Math.PI / 2;
      lineMesh.position.x = i * (this.roadWidth / 6);
      lineMesh.position.y = 0.01; // slightly above road
      group.add(lineMesh);
    }
    
    // Shoulders (rumble strips)
    const shoulderGeo = new THREE.PlaneGeometry(1, this.segmentLength);
    // Create alternating red/white pattern for curbs natively via repeating textures or just simple planes
    // For simplicity, let's use gray curbs
    const shoulderMat = new THREE.MeshLambertMaterial({ color: 0x999999 });
    const leftShoulder = new THREE.Mesh(shoulderGeo, shoulderMat);
    leftShoulder.rotation.x = -Math.PI / 2;
    leftShoulder.position.set(-this.roadWidth/2 - 0.5, 0.01, 0);
    group.add(leftShoulder);
    
    const rightShoulder = new THREE.Mesh(shoulderGeo, shoulderMat);
    rightShoulder.rotation.x = -Math.PI / 2;
    rightShoulder.position.set(this.roadWidth/2 + 0.5, 0.01, 0);
    group.add(rightShoulder);
    
    // Grass planes on the sides
    const grassGeo = new THREE.PlaneGeometry(40, this.segmentLength);
    const leftGrass = new THREE.Mesh(grassGeo, this.grassMat);
    leftGrass.rotation.x = -Math.PI / 2;
    leftGrass.position.set(-this.roadWidth/2 - 21, 0.005, 0);
    leftGrass.receiveShadow = true;
    group.add(leftGrass);
    
    const rightGrass = new THREE.Mesh(grassGeo, this.grassMat);
    rightGrass.rotation.x = -Math.PI / 2;
    rightGrass.position.set(this.roadWidth/2 + 21, 0.005, 0);
    rightGrass.receiveShadow = true;
    group.add(rightGrass);

    // Occasional Trees
    if (Math.random() > 0.3) {
        // left tree
      const tree1 = this.createDecor();
        tree1.position.set(-this.roadWidth/2 - 2 - Math.random() * 8, 0, (Math.random() - 0.5) * this.segmentLength);
        group.add(tree1);
    }
    if (Math.random() > 0.3) {
        // right tree
      const tree2 = this.createDecor();
        tree2.position.set(this.roadWidth/2 + 2 + Math.random() * 8, 0, (Math.random() - 0.5) * this.segmentLength);
        group.add(tree2);
    }

    this.scene.add(group);
    this.activeSegments.push({ group, z: zPos });
  }
  
  reset() {
    this.activeSegments.forEach(seg => {
      this.scene.remove(seg.group);
    });
    this.activeSegments = [];
    for (let i = 0; i < 5; i++) {
      this.spawnSegment(-i * this.segmentLength);
    }
  }
  
  update(dt, playerZ) {
    // If the furthest segment is too far behind string, recycle it
    if (this.activeSegments[0].z > playerZ + this.segmentLength) {
      const oldSeg = this.activeSegments.shift();
      this.scene.remove(oldSeg.group);
      
      // Add a new one ahead
      const furthestZ = this.activeSegments[this.activeSegments.length - 1].z;
      this.spawnSegment(furthestZ - this.segmentLength);
    }
  }
}
