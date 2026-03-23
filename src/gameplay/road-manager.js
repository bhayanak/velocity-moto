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

    const rand = Math.random();

    if (isCity) {
      if (rand < 0.2) {
        // ── Pedestrian: head, torso, 2 arms, 2 legs ──
        const skinCol = [0xf5cba7, 0xd4a574, 0x8d5524, 0xf0c8a0][Math.floor(Math.random() * 4)];
        const shirtCol = Math.random() * 0xffffff;
        const pantsCol = [0x222244, 0x333333, 0x443322, 0x224422][Math.floor(Math.random() * 4)];
        const skinMat = new THREE.MeshLambertMaterial({ color: skinCol });
        const shirtMat = new THREE.MeshLambertMaterial({ color: shirtCol });
        const pantsMat = new THREE.MeshLambertMaterial({ color: pantsCol });
        const shoeMat = new THREE.MeshLambertMaterial({ color: 0x111111 });

        // Head
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), skinMat);
        head.position.set(0, 1.72, 0);
        group.add(head);
        // Hair
        const hair = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ color: [0x111111, 0x553311, 0xaa8833, 0xcc4400][Math.floor(Math.random() * 4)] }));
        hair.position.set(0, 1.76, 0);
        group.add(hair);
        // Torso
        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 0.2), shirtMat);
        torso.position.set(0, 1.35, 0);
        group.add(torso);
        // Arms
        [-0.22, 0.22].forEach(x => {
          const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.45, 6), shirtMat);
          arm.position.set(x, 1.3, 0);
          arm.rotation.z = x > 0 ? -0.15 : 0.15;
          group.add(arm);
          // Hand
          const hand = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), skinMat);
          hand.position.set(x * 1.05, 1.05, 0);
          group.add(hand);
        });
        // Legs
        [-0.08, 0.08].forEach(x => {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.5, 6), pantsMat);
          leg.position.set(x, 0.85, 0);
          group.add(leg);
          const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.16), shoeMat);
          shoe.position.set(x, 0.58, 0.02);
          group.add(shoe);
        });
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
        // ── Camel: body, hump(s), neck, head, 4 legs, tail ──
        const camelColor = 0xc2a677;
        const camelMat = new THREE.MeshLambertMaterial({ color: camelColor });
        const darkCamel = new THREE.MeshLambertMaterial({ color: 0x8a7550 });


        // Body
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.65, 1.4), camelMat);
        body.position.set(0, 1.15, 0);
        group.add(body);
        // Hump(s)
        const numHumps = Math.random() > 0.5 ? 2 : 1;
        for (let h = 0; h < numHumps; h++) {
          const hump = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), camelMat);
          hump.position.set(0, 1.6, numHumps === 1 ? 0 : -0.3 + h * 0.6);
          hump.scale.y = 1.2;
          group.add(hump);
        }
        // Neck
        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.8, 8), camelMat);
        neck.position.set(0, 1.55, -0.65);
        neck.rotation.x = 0.5;
        group.add(neck);
        // Head
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.18, 0.3), camelMat);
        head.position.set(0, 1.85, -0.9);
        group.add(head);
        // Snout  
        const snout = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.15), darkCamel);
        snout.position.set(0, 1.82, -1.08);
        group.add(snout);
        // Eyes
        [-0.08, 0.08].forEach(x => {
          const eye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), new THREE.MeshBasicMaterial({ color: 0x111111 }));
          eye.position.set(x, 1.9, -0.92);
          group.add(eye);
        });
        // Ears
        [-0.1, 0.1].forEach(x => {
          const ear = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.08, 4), camelMat);
          ear.position.set(x, 1.97, -0.85);
          group.add(ear);
        });
        // Legs
        [[-0.2, -0.5], [0.2, -0.5], [-0.2, 0.45], [0.2, 0.45]].forEach(([x, z]) => {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.82, 6), camelMat);
          leg.position.set(x, 0.42, z);
          group.add(leg);
          const hoof = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.04, 6), darkCamel);
          hoof.position.set(x, 0.02, z);
          group.add(hoof);
        });
        // Tail
        const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.02, 0.35, 4), camelMat);
        tail.position.set(0, 1.25, 0.72);
        tail.rotation.x = -0.4;
        group.add(tail);
      } else if (rand < 0.35) {
        // ── Ostrich ──
        const bodyMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
        const legMat = new THREE.MeshLambertMaterial({ color: 0xcc8866 });
        const headMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
        // Body
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), bodyMat);
        body.position.set(0, 1.2, 0);
        body.scale.z = 1.3;
        group.add(body);
        // Neck
        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.9, 6), headMat);
        neck.position.set(0, 1.65, -0.2);
        neck.rotation.x = 0.2;
        group.add(neck);
        // Head
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), headMat);
        head.position.set(0, 2.1, -0.3);
        group.add(head);
        // Beak
        const beak = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.1, 4), new THREE.MeshLambertMaterial({ color: 0xff8844 }));
        beak.position.set(0, 2.07, -0.4);
        beak.rotation.x = Math.PI / 2;
        group.add(beak);
        // Legs
        [-0.12, 0.12].forEach(x => {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.03, 0.85, 5), legMat);
          leg.position.set(x, 0.45, 0);
          group.add(leg);
        });
        // Tail feathers
        const tf = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.3, 6), new THREE.MeshLambertMaterial({ color: 0xeeeeee }));
        tf.position.set(0, 1.35, 0.4);
        tf.rotation.x = -0.5;
        group.add(tf);
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
        const arm2 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.7), cactusMat);
        arm2.rotation.z = -Math.PI / 2;
        arm2.position.set(-0.4, 2.0, 0);
        group.add(arm2);
      }
    } else if (isNeon) {
      if (rand < 0.3) {
        // ── Robot Dog: body, head, legs, glowing eyes, antenna ──
        const wireMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true });
        const glowMat = new THREE.MeshBasicMaterial({ color: 0xff00ff });
        const plateMat = new THREE.MeshBasicMaterial({ color: 0x00aacc, transparent: true, opacity: 0.6 });

        // Body
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.9), wireMat);
        body.position.set(0, 0.65, 0);
        group.add(body);
        // Inner plates
        const inner = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.35, 0.85), plateMat);
        inner.position.copy(body.position);
        group.add(inner);
        // Head
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.3, 0.3), wireMat);
        head.position.set(0, 0.8, -0.55);
        group.add(head);
        // Glowing eyes
        [-0.1, 0.1].forEach(x => {
          const eye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), glowMat);
          eye.position.set(x, 0.85, -0.72);
          group.add(eye);
        });
        // Ears / antenna
        [-0.12, 0.12].forEach(x => {
          const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.2), wireMat);
          ant.position.set(x, 1.0, -0.5);
          group.add(ant);
          const tip = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), glowMat);
          tip.position.set(x, 1.12, -0.5);
          group.add(tip);
        });
        // Legs
        [[-0.18, -0.3], [0.18, -0.3], [-0.18, 0.3], [0.18, 0.3]].forEach(([x, z]) => {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.45, 6), wireMat);
          leg.position.set(x, 0.23, z);
          group.add(leg);
          // Paw pad
          const paw = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 6), glowMat);
          paw.position.set(x, 0.01, z);
          group.add(paw);
        });
        // Tail antenna
        const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.015, 0.35, 4), wireMat);
        tail.position.set(0, 0.8, 0.5);
        tail.rotation.x = -0.6;
        group.add(tail);
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
        // ── Polar Bear: body, head, snout, ears, nose, 4 legs ──
        const furMat = new THREE.MeshLambertMaterial({ color: 0xf0f0f0 });
        const noseMat = new THREE.MeshLambertMaterial({ color: 0x111111 });

        // Body
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.6, 1.3), furMat);
        body.position.set(0, 0.7, 0);
        group.add(body);
        // Head
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.4, 0.4), furMat);
        head.position.set(0, 0.9, -0.75);
        group.add(head);
        // Snout
        const snout = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.18, 0.2), furMat);
        snout.position.set(0, 0.82, -1.0);
        group.add(snout);
        // Nose
        const nose = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), noseMat);
        nose.position.set(0, 0.85, -1.12);
        group.add(nose);
        // Eyes
        [-0.12, 0.12].forEach(x => {
          const eye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), noseMat);
          eye.position.set(x, 0.95, -0.93);
          group.add(eye);
        });
        // Ears
        [-0.15, 0.15].forEach(x => {
          const ear = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), furMat);
          ear.position.set(x, 1.1, -0.7);
          ear.scale.y = 0.7;
          group.add(ear);
        });
        // Legs
        [[-0.25, -0.45], [0.25, -0.45], [-0.25, 0.4], [0.25, 0.4]].forEach(([x, z]) => {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.42, 6), furMat);
          leg.position.set(x, 0.22, z);
          group.add(leg);
        });
        // Tail nub
        const tail = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), furMat);
        tail.position.set(0, 0.8, 0.65);
        group.add(tail);
      } else {
        // Pine tree snowy
        const trunk = new THREE.Mesh(this.trunkGeo, this.trunkMat);
        trunk.position.y = 0.75;
        group.add(trunk);
        const leavesMatSnow = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const leaves = new THREE.Mesh(this.leavesGeo, leavesMatSnow);
        leaves.position.y = 2.5;
        group.add(leaves);
      }
    } else {
      // Forest / default
      if (rand < 0.15) {
        // ── Deer: body, neck, head, antlers, 4 legs, tail ──
        const deerMat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
        const bellyMat = new THREE.MeshLambertMaterial({ color: 0xd4b87a });

        // Body
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.95), deerMat);
        body.position.set(0, 0.9, 0);
        group.add(body);
        // Belly
        const belly = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.15, 0.7), bellyMat);
        belly.position.set(0, 0.72, 0);
        group.add(belly);
        // Neck
        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.45, 6), deerMat);
        neck.position.set(0, 1.2, -0.4);
        neck.rotation.x = 0.35;
        group.add(neck);
        // Head
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.25), deerMat);
        head.position.set(0, 1.4, -0.55);
        group.add(head);
        // Nose
        const nose = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), new THREE.MeshLambertMaterial({ color: 0x333333 }));
        nose.position.set(0, 1.37, -0.7);
        group.add(nose);
        // Eyes
        [-0.08, 0.08].forEach(x => {
          const eye = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), new THREE.MeshBasicMaterial({ color: 0x111111 }));
          eye.position.set(x, 1.44, -0.62);
          group.add(eye);
        });
        // Antlers (branching)
        [-0.08, 0.08].forEach(x => {
          const main = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.35, 4), new THREE.MeshLambertMaterial({ color: 0x5a3e2b }));
          main.position.set(x, 1.6, -0.48);
          main.rotation.z = x > 0 ? -0.3 : 0.3;
          group.add(main);
          // Branch
          const br = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.2, 4), new THREE.MeshLambertMaterial({ color: 0x5a3e2b }));
          br.position.set(x * 1.8, 1.7, -0.5);
          br.rotation.z = x > 0 ? -0.8 : 0.8;
          group.add(br);
        });
        // Legs
        [[-0.12, -0.35], [0.12, -0.35], [-0.12, 0.3], [0.12, 0.3]].forEach(([x, z]) => {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.03, 0.65, 5), deerMat);
          leg.position.set(x, 0.35, z);
          group.add(leg);
          const hoof = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.03, 5), new THREE.MeshLambertMaterial({ color: 0x333333 }));
          hoof.position.set(x, 0.02, z);
          group.add(hoof);
        });
        // Tail
        const tail = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), bellyMat);
        tail.position.set(0, 0.95, 0.5);
        group.add(tail);
      } else if (rand < 0.25) {
        // ── Bear ──
        const bearMat = new THREE.MeshLambertMaterial({ color: 0x4a3520 });
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.55, 1.1), bearMat);
        body.position.set(0, 0.65, 0);
        group.add(body);
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.35), bearMat);
        head.position.set(0, 0.85, -0.65);
        group.add(head);
        const snout = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.15, 0.15), new THREE.MeshLambertMaterial({ color: 0x8a6a48 }));
        snout.position.set(0, 0.78, -0.85);
        group.add(snout);
        const nose = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), new THREE.MeshLambertMaterial({ color: 0x111111 }));
        nose.position.set(0, 0.82, -0.94);
        group.add(nose);
        [-0.12, 0.12].forEach(x => {
          const ear = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), bearMat);
          ear.position.set(x, 1.04, -0.58);
          ear.scale.y = 0.7;
          group.add(ear);
        });
        [[-0.2, -0.35], [0.2, -0.35], [-0.2, 0.3], [0.2, 0.3]].forEach(([x, z]) => {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.42, 6), bearMat);
          leg.position.set(x, 0.22, z);
          group.add(leg);
        });
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
