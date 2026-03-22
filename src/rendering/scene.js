import * as THREE from 'three';

export class SceneManager {
  constructor(container) {
    this.container = container;
    
    this.scene = new THREE.Scene();
    
    // Add linear fog to keep foreground clear and hide edge of the world
    this.scene.fog = new THREE.Fog(0x87CEEB, 150, 600);
    this.scene.background = new THREE.Color(0x87CEEB);
    
    this.camera = new THREE.PerspectiveCamera(
      75, 
      window.innerWidth / window.innerHeight, 
      0.1, 
      1000
    );
    
    // Initial camera position (cockpit offset)
    this.camera.position.set(0, 1.5, 0);
    
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);
    
    // Lighting
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(this.ambientLight);
    
    this.dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.dirLight.position.set(100, 200, 50);
    this.scene.add(this.dirLight);

    this.timeOfDay = 0; // 0 to 1
    
    // Weather System (Rain)
    this.isRaining = false;
    this.rainCount = 1500;
    const rainGeo = new THREE.BufferGeometry();
    const rainPositions = new Float32Array(this.rainCount * 3);
    const rainVelocities = [];
    for(let i=0; i<this.rainCount; i++){
      rainPositions[i*3] = (Math.random() - 0.5) * 100;
      rainPositions[i*3 + 1] = Math.random() * 100;
      rainPositions[i*3 + 2] = (Math.random() - 0.5) * 100;
      rainVelocities.push(0);
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0xaaaaaa,
      size: 0.15,
      transparent: true,
      opacity: 0.6
    });
    this.rainSystem = new THREE.Points(rainGeo, rainMat);
    this.rainSystem.visible = false;
    this.scene.add(this.rainSystem);
    this.rainVelocities = rainVelocities;
    this.lightningTimer = 0;
    this.lightningFlash = 0;

    // Garage Stage
    this.garageGroup = new THREE.Group();
    this.garageGroup.position.set(0, -90, 0); // Hide below ground
    
    const stageGeo = new THREE.CylinderGeometry(4, 4.5, 0.5, 32);
    const stageMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.5, roughness: 0.5 });
    const stage = new THREE.Mesh(stageGeo, stageMat);
    this.garageGroup.add(stage);

    const rimGeo = new THREE.TorusGeometry(4.2, 0.1, 16, 100);
    const rimMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.y = 0.3;
    this.garageGroup.add(rim);

    // Garage spotlight
    this.garageLight = new THREE.SpotLight(0xffffff, 50, 50, Math.PI/4, 0.5, 1);
    this.garageLight.position.set(0, 10, 5);
    this.garageLight.target = stage;
    this.garageGroup.add(this.garageLight);
    
    // Ambient boost for garage
    this.garageAmbient = new THREE.AmbientLight(0xffffff, 0.4);
    this.garageGroup.add(this.garageAmbient);

    this.scene.add(this.garageGroup);

    // Handle resize
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }
  
  setWeather(isRaining) {
    this.isRaining = isRaining;
    this.rainSystem.visible = isRaining;
  }
  
  updateWeather(dt, playerPosition, playerSpeed) {
    if (!this.isRaining) return;
    
    // Keep rain centered around player to prevent outrunning it
    this.rainSystem.position.x = playerPosition.x;
    this.rainSystem.position.z = playerPosition.z - 20; 
    
    const positions = this.rainSystem.geometry.attributes.position.array;
    for(let i=0; i<this.rainCount; i++){
      this.rainVelocities[i] -= 0.1 + Math.random() * 0.1;
      let y = positions[i*3 + 1];
      y += this.rainVelocities[i]; // drop down
      
      // Slant rain based on player speed
      positions[i*3 + 2] += (playerSpeed * dt * 0.5); 
      
      if (y < 0) {
        y = 50 + Math.random() * 50; // reset to top
        this.rainVelocities[i] = 0;
        // random local X, Z distribution
        positions[i*3] = (Math.random() - 0.5) * 100;
        positions[i*3 + 2] = (Math.random() - 0.5) * 100 - (playerSpeed * 0.1); 
      }
      positions[i*3 + 1] = y;
    }
    this.rainSystem.geometry.attributes.position.needsUpdate = true;
    
    // Lightning
    this.lightningTimer -= dt;
    if (this.lightningTimer <= 0) {
      if (Math.random() > 0.8) {
        this.lightningFlash = 1.0; // trigger flash
      }
      this.lightningTimer = 5 + Math.random() * 10; // next lightning in 5-15s
    }
  }

  updateDayNightCycle(dt, speed) {
    // Cycle every ~60 seconds of real driving time
    if (speed > 10) {
      this.timeOfDay = (this.timeOfDay + (dt / 60)) % 1;
    }

    // timeOfDay: 0 = noon, 0.25 = sunset, 0.5 = midnight, 0.75 = sunrise
    let cycle = Math.sin(this.timeOfDay * Math.PI * 2);

    // Color definitions
    const dayColor = new THREE.Color(this.currentSkyColor || 0x87CEEB);
    const sunsetColor = new THREE.Color(0xFF7E47);
    const nightColor = new THREE.Color(0x0a0a2a);

    let targetColor = new THREE.Color();
    let lightIntensity = 1.0;

    if (cycle > 0) {
      // Day to Sunset
      targetColor.lerpColors(sunsetColor, dayColor, cycle);
      lightIntensity = 0.4 + (0.6 * cycle);
    } else {
      // Sunset to Night to Sunrise
      targetColor.lerpColors(sunsetColor, nightColor, -cycle);
      lightIntensity = 0.1 + (0.3 * (1 + cycle));
    }

    this.scene.background.copy(targetColor);
    this.scene.fog.color.copy(targetColor);
    
    // Apply Lightning Flash
    if (this.isRaining && this.lightningFlash > 0) {
      lightIntensity += this.lightningFlash * 2.0;
      this.scene.background.lerpColors(targetColor, new THREE.Color(0xFFFFFF), this.lightningFlash * 0.5);
      this.lightningFlash -= dt * 5; // fade flash quickly
      if (this.lightningFlash < 0) this.lightningFlash = 0;
    }

    this.ambientLight.intensity = lightIntensity;
    this.dirLight.intensity = Math.min(2.0, lightIntensity);

    return cycle < 0; // returns true if it is "night" (sunset to sunrise)
  }

  applyTrackColors(trackConfig) {
    if (trackConfig && trackConfig.colors && trackConfig.colors.sky) {
      this.currentSkyColor = trackConfig.colors.sky;
    }
  }
  
  updateCamera(playerPosition, leanAngle, speed, time) {
    // Camera rigidly follows the bike, but with a slight offset
    this.camera.position.x = playerPosition.x;
    this.camera.position.y = playerPosition.y + 1.2; // height of rider eyes
    this.camera.position.z = playerPosition.z + 0.5; // sit slightly behind the tank
    
    // Add high-speed camera shake and head bobble
    if (speed > 100) {
       const shakeIntensity = (speed - 100) * 0.0002;
       this.camera.position.x += (Math.random() - 0.5) * shakeIntensity;
       this.camera.position.y += (Math.random() - 0.5) * shakeIntensity;
    }
    
    // Normal head bobble based on distance traveled
    const bobble = Math.sin(time * 15) * (speed * 0.0001);
    this.camera.position.y += bobble;

    // Roll camera based on lean angle
    this.camera.rotation.z = -leanAngle * 0.5;
  }
  
  setGarageMode(active, bikeGroup) {
    if (active) {
      if (bikeGroup) {
        this.currentGarageBike = bikeGroup;
        // Strip out the bike from normal position and put on stage
        this.garageGroup.add(bikeGroup);
        bikeGroup.position.set(0, 0.5, 0);
        bikeGroup.rotation.set(0, Math.PI / 4, 0); // initial spin
      }
      this.camera.position.set(0, -88, 4); // looking at stage (stage is at -90)
      this.camera.lookAt(0, -89.5, 0);
      this.camera.rotation.z = 0;
      this.scene.fog.near = 10;
      this.scene.fog.far = 30;
    } else {
      if (this.currentGarageBike) {
        this.scene.add(this.currentGarageBike); // return to normal scene
        this.currentGarageBike.rotation.y = 0; // reset spin
      }
      this.scene.fog.near = 150;
      this.scene.fog.far = 600;
    }
  }

  updateGarageSpin(dt) {
    if (this.currentGarageBike) {
      this.currentGarageBike.rotation.y += dt * 0.5; // slowly rotate
    }
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
