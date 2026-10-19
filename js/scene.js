/**
 * 3D Scene Architecture & Industrial Plant Geometry
 * Built using Three.js with PBR materials, procedural industrial assets,
 * dynamic thermal glow shaders, cutaway transparency, and structural framing.
 */

import * as THREE from 'three';

export class Plant3DScene {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.interactiveObjects = [];
    this.thermalMaterials = [];
    this.cutawayMaterials = [];
    this.cutawayMode = false;
    this.thermalMode = false;

    this.initLighting();
    this.initEnvironment();
    this.buildStructuralFraming();
    this.buildPyrolysisReactor();
    this.buildCombustorAndHeatCarrierLoop();
    this.buildBiomassFeedSystem();
    this.buildSeparationAndCatalyticSystem();
    this.buildCondensationAndProductTrain();
    this.buildPipingNetworks();
    this.buildInteractiveMarkers();
  }

  initLighting() {
    this.scene.background = new THREE.Color(0x0a0e17);
    this.scene.fog = new THREE.FogExp2(0x0a0e17, 0.015);

    const ambientLight = new THREE.AmbientLight(0x90a4ae, 0.6);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.4);
    sunLight.position.set(25, 45, 30);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 120;
    sunLight.shadow.camera.left = -25;
    sunLight.shadow.camera.right = 25;
    sunLight.shadow.camera.top = 25;
    sunLight.shadow.camera.bottom = -25;
    sunLight.shadow.bias = -0.0005;
    this.scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x4a90e2, 0.5);
    fillLight.position.set(-20, 20, -20);
    this.scene.add(fillLight);

    // Dynamic reactor and combustor thermal point lights
    this.reactorLight = new THREE.PointLight(0xff6600, 1.8, 12, 1.2);
    this.reactorLight.position.set(0, 7.5, 0);
    this.scene.add(this.reactorLight);

    this.combustorLight = new THREE.PointLight(0xff3300, 2.5, 15, 1.2);
    this.combustorLight.position.set(8.5, 9.0, 0);
    this.scene.add(this.combustorLight);
  }

  initEnvironment() {
    // Heavy concrete foundation pad
    const padGeo = new THREE.BoxGeometry(42, 1.0, 32);
    const padMat = new THREE.MeshStandardMaterial({
      color: 0x1f2430,
      roughness: 0.85,
      metalness: 0.15,
    });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.set(2, -0.5, 0);
    pad.receiveShadow = true;
    this.scene.add(pad);

    // Industrial floor grid markings
    const grid = new THREE.GridHelper(40, 40, 0x00f0ff, 0x1c2b3d);
    grid.position.y = 0.02;
    this.scene.add(grid);

    // Equipment perimeter yellow/black safety curb
    const curbGeo = new THREE.BoxGeometry(36, 0.3, 26);
    const curbMat = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      roughness: 0.4,
      metalness: 0.2
    });
    const curb = new THREE.Mesh(curbGeo, curbMat);
    curb.position.set(2, 0.15, 0);
    curb.receiveShadow = true;
    this.scene.add(curb);
  }

  createSteelMaterial(color = 0x475569, metalness = 0.8, roughness = 0.35) {
    const mat = new THREE.MeshStandardMaterial({
      color: color,
      metalness: metalness,
      roughness: roughness,
    });
    return mat;
  }

  createThermalVesselMaterial(baseColor, emissiveColor, baseTempC, targetTempC) {
    const mat = new THREE.MeshStandardMaterial({
      color: baseColor,
      metalness: 0.6,
      roughness: 0.3,
      emissive: emissiveColor,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 1.0
    });
    mat.userData = {
      baseColor: new THREE.Color(baseColor),
      emissiveColor: new THREE.Color(emissiveColor),
      baseTempC: baseTempC,
      targetTempC: targetTempC,
      originalOpacity: 1.0
    };
    this.thermalMaterials.push(mat);
    this.cutawayMaterials.push(mat);
    return mat;
  }

  buildStructuralFraming() {
    const frameGroup = new THREE.Group();
    const beamMat = this.createSteelMaterial(0x273549, 0.9, 0.4);

    // 4 Corner vertical support I-beam pillars
    const pillarPositions = [
      [-6, 0, -6], [-6, 0, 6], [14, 0, -6], [14, 0, 6],
      [4, 0, -6], [4, 0, 6], [-12, 0, -4], [-12, 0, 4]
    ];

    pillarPositions.forEach(([x, y, z]) => {
      const colGeo = new THREE.CylinderGeometry(0.25, 0.25, 17, 8);
      const col = new THREE.Mesh(colGeo, beamMat);
      col.position.set(x, 8.5, z);
      col.castShadow = true;
      col.receiveShadow = true;
      frameGroup.add(col);
    });

    // Horizontal structural cross-beams and walkways at levels y=6 and y=12
    [6.0, 12.0].forEach((level) => {
      // Main catwalk platform
      const catwalkGeo = new THREE.BoxGeometry(22, 0.25, 14);
      const catwalkMat = new THREE.MeshStandardMaterial({
        color: 0x1b2838,
        metalness: 0.85,
        roughness: 0.6,
        wireframe: false
      });
      const catwalk = new THREE.Mesh(catwalkGeo, catwalkMat);
      catwalk.position.set(4, level, 0);
      catwalk.receiveShadow = true;
      frameGroup.add(catwalk);

      // Safety yellow handrails
      const railMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, metalness: 0.5, roughness: 0.4 });
      const railGeoX = new THREE.CylinderGeometry(0.06, 0.06, 22);
      const railGeoZ = new THREE.CylinderGeometry(0.06, 0.06, 14);

      const railFront = new THREE.Mesh(railGeoX, railMat);
      railFront.rotation.z = Math.PI / 2;
      railFront.position.set(4, level + 1.1, 7);
      frameGroup.add(railFront);

      const railBack = new THREE.Mesh(railGeoX, railMat);
      railBack.rotation.z = Math.PI / 2;
      railBack.position.set(4, level + 1.1, -7);
      frameGroup.add(railBack);

      const railLeft = new THREE.Mesh(railGeoZ, railMat);
      railLeft.rotation.x = Math.PI / 2;
      railLeft.position.set(-7, level + 1.1, 0);
      frameGroup.add(railLeft);

      const railRight = new THREE.Mesh(railGeoZ, railMat);
      railRight.rotation.x = Math.PI / 2;
      railRight.position.set(15, level + 1.1, 0);
      frameGroup.add(railRight);
    });

    // Industrial staircase connecting ground to walkway
    const stairSteps = 16;
    for (let i = 0; i < stairSteps; i++) {
      const stepGeo = new THREE.BoxGeometry(1.6, 0.1, 0.4);
      const step = new THREE.Mesh(stepGeo, beamMat);
      step.position.set(15.5, (i / stairSteps) * 6.0, -5 + i * 0.45);
      step.castShadow = true;
      frameGroup.add(step);
    }

    this.scene.add(frameGroup);
  }

  buildPyrolysisReactor() {
    this.reactorGroup = new THREE.Group();
    this.reactorGroup.position.set(0, 0, 0);

    // Vessel material with thermal emissivity (500 °C nominal)
    this.reactorMat = this.createThermalVesselMaterial(0x3b4252, 0xff5500, 500, 500);

    // 1. Lower fluidization bed section (narrow column)
    const lowerGeo = new THREE.CylinderGeometry(1.4, 1.2, 5.5, 32);
    const lowerBody = new THREE.Mesh(lowerGeo, this.reactorMat);
    lowerBody.position.y = 4.25;
    lowerBody.castShadow = true;
    lowerBody.receiveShadow = true;
    this.reactorGroup.add(lowerBody);

    // 2. Disengagement freeboard expansion zone (wider top)
    const expandGeo = new THREE.CylinderGeometry(2.1, 1.4, 2.0, 32);
    const expandBody = new THREE.Mesh(expandGeo, this.reactorMat);
    expandBody.position.y = 8.0;
    expandBody.castShadow = true;
    this.reactorGroup.add(expandBody);

    const upperGeo = new THREE.CylinderGeometry(2.1, 2.1, 3.5, 32);
    const upperBody = new THREE.Mesh(upperGeo, this.reactorMat);
    upperBody.position.y = 10.75;
    upperBody.castShadow = true;
    this.reactorGroup.add(upperBody);

    // Top domed head
    const domeGeo = new THREE.SphereGeometry(2.1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const dome = new THREE.Mesh(domeGeo, this.reactorMat);
    dome.position.y = 12.5;
    this.reactorGroup.add(dome);

    // Metallic flange reinforcement rings
    const flangeMat = this.createSteelMaterial(0xd8dee9, 0.95, 0.2);
    [1.5, 7.0, 9.0, 12.5].forEach((h) => {
      const ringGeo = new THREE.TorusGeometry(h > 8 ? 2.15 : 1.45, 0.08, 16, 32);
      const ring = new THREE.Mesh(ringGeo, flangeMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = h;
      this.reactorGroup.add(ring);
    });

    // Glass inspection viewport (allows seeing inner fluidized action)
    const viewportGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffaa44,
      transmission: 0.9,
      opacity: 1.0,
      transparent: true,
      roughness: 0.1,
      ior: 1.5
    });
    const viewport = new THREE.Mesh(viewportGeo, glassMat);
    viewport.rotation.z = Math.PI / 2;
    viewport.position.set(1.4, 4.5, 0);
    this.reactorGroup.add(viewport);

    // Reactor internal fluidized bed core (visible in cutaway)
    const bedCoreGeo = new THREE.CylinderGeometry(1.2, 1.1, 3.5, 24);
    this.reactorCoreMat = new THREE.MeshStandardMaterial({
      color: 0xff7700,
      emissive: 0xff3300,
      emissiveIntensity: 0.8,
      roughness: 0.6,
      transparent: true,
      opacity: 0.85
    });
    const bedCore = new THREE.Mesh(bedCoreGeo, this.reactorCoreMat);
    bedCore.position.y = 3.5;
    this.reactorGroup.add(bedCore);

    // Digital temperature pyrometer housing mounted on reactor
    const sensorGeo = new THREE.BoxGeometry(0.6, 0.8, 0.4);
    const sensorMat = this.createSteelMaterial(0x10b981, 0.5, 0.4);
    const sensor = new THREE.Mesh(sensorGeo, sensorMat);
    sensor.position.set(0, 5.5, 1.55);
    this.reactorGroup.add(sensor);

    this.reactorGroup.userData = {
      id: 'reactor',
      name: 'Continuous Fast Pyrolysis Reactor',
      tempTag: 'T_pyro: 500 °C (Nominal)',
      desc: 'Rapid thermal decomposition of biomass pseudo-components (cellulose, hemicellulose, lignin) in an oxygen-free fluidized bed under Semyonov kinetics.'
    };
    this.interactiveObjects.push(this.reactorGroup);
    this.scene.add(this.reactorGroup);
  }

  buildCombustorAndHeatCarrierLoop() {
    this.combustorGroup = new THREE.Group();
    this.combustorGroup.position.set(8.5, 0, 0);

    // Ash Reheater / Byproduct Combustor vessel (800 °C nominal, bright incandescent glow)
    this.combustorMat = this.createThermalVesselMaterial(0x2e3440, 0xff2200, 800, 800);

    const combGeo = new THREE.CylinderGeometry(1.6, 1.6, 11, 32);
    const combBody = new THREE.Mesh(combGeo, this.combustorMat);
    combBody.position.y = 6.5;
    combBody.castShadow = true;
    combBody.receiveShadow = true;
    this.combustorGroup.add(combBody);

    // Combustor dome and flue stack
    const combDomeGeo = new THREE.SphereGeometry(1.6, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const combDome = new THREE.Mesh(combDomeGeo, this.combustorMat);
    combDome.position.y = 12.0;
    this.combustorGroup.add(combDome);

    const stackGeo = new THREE.CylinderGeometry(0.6, 0.7, 5, 24);
    const stackMat = this.createSteelMaterial(0x4c566a, 0.7, 0.4);
    const stack = new THREE.Mesh(stackGeo, stackMat);
    stack.position.y = 14.5;
    stack.castShadow = true;
    this.combustorGroup.add(stack);

    // Auxiliary startup burner & air blower plenum at base
    const plenumGeo = new THREE.CylinderGeometry(2.0, 2.0, 1.2, 24);
    const plenumMat = this.createSteelMaterial(0x3b4252, 0.8, 0.3);
    const plenum = new THREE.Mesh(plenumGeo, plenumMat);
    plenum.position.y = 0.6;
    this.combustorGroup.add(plenum);

    // LPG Trim Fuel Burner manifold
    const burnerGeo = new THREE.BoxGeometry(1.2, 0.8, 1.2);
    const burnerMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0x991b1b,
      emissiveIntensity: 0.5,
      metalness: 0.5
    });
    this.burnerMesh = new THREE.Mesh(burnerGeo, burnerMat);
    this.burnerMesh.position.set(0, 1.2, 1.8);
    this.combustorGroup.add(this.burnerMesh);

    this.combustorGroup.userData = {
      id: 'combustor',
      name: 'Solid Heat Carrier Combustor & Reheater',
      tempTag: 'T_comb: 800 °C (Nominal)',
      desc: 'Exothermic combustion of byproduct biochar (70%) and excess syngas to reheat recirculating solid ash carrier back to 800 °C, ensuring autothermal self-sufficiency (+4.39 GJ surplus).'
    };
    this.interactiveObjects.push(this.combustorGroup);
    this.scene.add(this.combustorGroup);

    // --- RECIRCULATING SOLID HEAT CARRIER PIPING ---
    // 1. Hot Ash Riser: Combustor (high) -> Pyrolysis Reactor (high)
    const riserCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(8.5, 11.0, 0),
      new THREE.Vector3(7.0, 11.8, 1.5),
      new THREE.Vector3(3.5, 11.2, 1.5),
      new THREE.Vector3(1.8, 9.5, 0.5),
      new THREE.Vector3(0.0, 9.0, 0)
    ]);
    const riserGeo = new THREE.TubeGeometry(riserCurve, 32, 0.35, 16, false);
    this.hotAshPipeMat = this.createThermalVesselMaterial(0x475569, 0xff3300, 800, 800);
    const hotAshPipe = new THREE.Mesh(riserGeo, this.hotAshPipeMat);
    hotAshPipe.castShadow = true;
    this.scene.add(hotAshPipe);

    // 2. Spent Carrier Downcomer: Reactor (bottom) -> Combustor (bottom)
    const downcomerCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.0, 2.0, 0),
      new THREE.Vector3(1.8, 1.5, -1.5),
      new THREE.Vector3(5.0, 1.8, -1.5),
      new THREE.Vector3(7.2, 2.2, -0.5),
      new THREE.Vector3(8.5, 2.5, 0)
    ]);
    const downcomerGeo = new THREE.TubeGeometry(downcomerCurve, 32, 0.35, 16, false);
    this.spentAshPipeMat = this.createThermalVesselMaterial(0x475569, 0xff8800, 500, 500);
    const spentAshPipe = new THREE.Mesh(downcomerGeo, this.spentAshPipeMat);
    spentAshPipe.castShadow = true;
    this.scene.add(spentAshPipe);
  }

  buildBiomassFeedSystem() {
    this.feedGroup = new THREE.Group();
    this.feedGroup.position.set(-6.5, 0, 0);

    const hopperMat = this.createSteelMaterial(0x0284c7, 0.7, 0.35); // Blue industrial hopper

    // Feed Hopper (inverted pyramid/cone)
    const hopperUpperGeo = new THREE.CylinderGeometry(2.0, 2.0, 2.5, 6);
    const hopperUpper = new THREE.Mesh(hopperUpperGeo, hopperMat);
    hopperUpper.position.y = 7.5;
    hopperUpper.castShadow = true;
    this.feedGroup.add(hopperUpper);

    const hopperConeGeo = new THREE.CylinderGeometry(2.0, 0.6, 2.0, 6);
    const hopperCone = new THREE.Mesh(hopperConeGeo, hopperMat);
    hopperCone.position.y = 5.25;
    hopperCone.castShadow = true;
    this.feedGroup.add(hopperCone);

    // Rotary Airlock Valve
    const valveGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.8, 16);
    const valveMat = this.createSteelMaterial(0x0369a1, 0.85, 0.25);
    const valve = new THREE.Mesh(valveGeo, valveMat);
    valve.position.y = 3.8;
    this.feedGroup.add(valve);

    // Motorized Injection Screw Feeder (horizontal tube from hopper to reactor)
    const feederTubeGeo = new THREE.CylinderGeometry(0.4, 0.4, 5.5, 16);
    const feederTubeMat = this.createSteelMaterial(0x334155, 0.8, 0.3);
    const feederTube = new THREE.Mesh(feederTubeGeo, feederTubeMat);
    feederTube.rotation.z = Math.PI / 2;
    feederTube.position.set(2.5, 3.2, 0);
    feederTube.castShadow = true;
    this.feedGroup.add(feederTube);

    // Electric Drive Motor
    const motorGeo = new THREE.BoxGeometry(1.2, 1.0, 1.0);
    const motorMat = this.createSteelMaterial(0x059669, 0.6, 0.4);
    const motor = new THREE.Mesh(motorGeo, motorMat);
    motor.position.set(-0.6, 3.2, 0);
    this.feedGroup.add(motor);

    this.feedGroup.userData = {
      id: 'feeder',
      name: 'Biomass Metering & Injection System',
      tempTag: 'T_feed: 25 °C Ambient',
      desc: 'Regulates continuous dry biomass feedstock intake (1,000 kg/h baseline) via dual sealed variable-frequency screw augers, isolating reactor inert atmosphere.'
    };
    this.interactiveObjects.push(this.feedGroup);
    this.scene.add(this.feedGroup);
  }

  buildSeparationAndCatalyticSystem() {
    this.separationGroup = new THREE.Group();
    this.separationGroup.position.set(0, 0, -6.5);

    const cycloneMat = this.createSteelMaterial(0x475569, 0.75, 0.3);

    // --- 1. PRIMARY CYCLONE SEPARATOR ---
    const cycUpperGeo = new THREE.CylinderGeometry(1.1, 1.1, 2.5, 24);
    const cycUpper = new THREE.Mesh(cycUpperGeo, cycloneMat);
    cycUpper.position.set(0, 10.5, 0);
    cycUpper.castShadow = true;
    this.separationGroup.add(cycUpper);

    const cycConeGeo = new THREE.CylinderGeometry(1.1, 0.3, 2.5, 24);
    const cycCone = new THREE.Mesh(cycConeGeo, cycloneMat);
    cycCone.position.set(0, 8.0, 0);
    cycCone.castShadow = true;
    this.separationGroup.add(cycCone);

    // Dipleg returning separated char
    const diplegGeo = new THREE.CylinderGeometry(0.18, 0.18, 4.0, 16);
    const dipleg = new THREE.Mesh(diplegGeo, cycloneMat);
    dipleg.position.set(0, 5.0, 0);
    this.separationGroup.add(dipleg);

    // --- 2. SECONDARY CHAR-CATALYTIC CRACKER BED ---
    const catBedGeo = new THREE.CylinderGeometry(1.3, 1.3, 3.5, 24);
    this.catBedMat = this.createThermalVesselMaterial(0x334155, 0xd97706, 750, 750);
    const catBed = new THREE.Mesh(catBedGeo, this.catBedMat);
    catBed.position.set(4.5, 8.0, 0);
    catBed.castShadow = true;
    this.separationGroup.add(catBed);

    // Piping: Reactor top to Cyclone tangential inlet
    const ductCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 12.5, 0),
      new THREE.Vector3(0, 13.0, -3.0),
      new THREE.Vector3(0.8, 11.2, -6.5)
    ]);
    const ductGeo = new THREE.TubeGeometry(ductCurve, 24, 0.3, 16, false);
    const ductMesh = new THREE.Mesh(ductGeo, cycloneMat);
    this.scene.add(ductMesh);

    // Piping: Cyclone vortex finder to Catalytic Bed
    const catPipeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 11.8, -6.5),
      new THREE.Vector3(2.0, 12.5, -6.5),
      new THREE.Vector3(4.5, 10.0, -6.5)
    ]);
    const catPipeGeo = new THREE.TubeGeometry(catPipeCurve, 24, 0.25, 16, false);
    const catPipeMesh = new THREE.Mesh(catPipeGeo, cycloneMat);
    this.scene.add(catPipeMesh);

    this.separationGroup.userData = {
      id: 'separation',
      name: 'Primary Cyclone & Char-Catalytic Upgrader',
      tempTag: 'T_bed: 700 - 900 °C (AAEMs In Situ)',
      desc: 'Separates entrained biochar and routes vapors over active alkaline and alkaline earth metals (AAEMs) bed to selectively crack heavy polycyclic aromatics into light condensables.'
    };
    this.interactiveObjects.push(this.separationGroup);
    this.scene.add(this.separationGroup);
  }

  buildCondensationAndProductTrain() {
    this.condenserGroup = new THREE.Group();
    this.condenserGroup.position.set(-6.5, 0, -6.5);

    const stainlessMat = this.createSteelMaterial(0x94a3b8, 0.9, 0.2);

    // Multi-stage shell and tube condenser column 1
    const col1Geo = new THREE.CylinderGeometry(0.8, 0.8, 6.0, 24);
    const col1 = new THREE.Mesh(col1Geo, stainlessMat);
    col1.position.set(0, 6.0, 0);
    col1.castShadow = true;
    this.condenserGroup.add(col1);

    // Condenser column 2 (Chilled secondary stage)
    const col2Geo = new THREE.CylinderGeometry(0.7, 0.7, 5.0, 24);
    const col2 = new THREE.Mesh(col2Geo, stainlessMat);
    col2.position.set(-2.5, 5.5, 0);
    col2.castShadow = true;
    this.condenserGroup.add(col2);

    // Electrostatic Precipitator (ESP) for aerosol removal
    const espGeo = new THREE.BoxGeometry(1.4, 2.5, 1.4);
    const espMat = this.createSteelMaterial(0x64748b, 0.8, 0.35);
    const esp = new THREE.Mesh(espGeo, espMat);
    esp.position.set(-4.5, 6.0, 0);
    this.condenserGroup.add(esp);

    // Liquid Upgraded Bio-Oil Holding Receiver Tank
    const tankGeo = new THREE.CylinderGeometry(1.4, 1.4, 2.5, 24);
    const tankMat = this.createSteelMaterial(0x16a34a, 0.6, 0.4); // Green product tank
    const tank = new THREE.Mesh(tankGeo, tankMat);
    tank.position.set(-1.2, 1.5, 0);
    tank.castShadow = true;
    this.condenserGroup.add(tank);

    // Liquid sight glass on bio-oil receiver
    const sightGeo = new THREE.BoxGeometry(0.15, 1.8, 0.2);
    const sightMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      emissive: 0x15803d,
      roughness: 0.1
    });
    const sight = new THREE.Mesh(sightGeo, sightMat);
    sight.position.set(-1.2, 1.5, 1.45);
    this.condenserGroup.add(sight);

    this.condenserGroup.userData = {
      id: 'condenser',
      name: 'Fractional Condensation & Bio-Oil Train',
      tempTag: 'T_cond: 20 - 45 °C Rapid Quench',
      desc: 'Quenches vapor stream (<2s residence time) to capture premium stabilized bio-oil (23.5% yield) while directing non-condensable syngas toward recirculation and combustor burners.'
    };
    this.interactiveObjects.push(this.condenserGroup);
    this.scene.add(this.condenserGroup);
  }

  buildPipingNetworks() {
    const pipeMatSyngas = new THREE.MeshStandardMaterial({
      color: 0x06b6d4, // Cyan/blue syngas line
      metalness: 0.85,
      roughness: 0.3
    });

    // Syngas Recirculation Loop: from Condenser/ESP -> Recirc Blower -> Base of Pyrolysis Reactor
    const syngasLoopCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-11.0, 7.0, -6.5),
      new THREE.Vector3(-11.0, 1.0, -6.5),
      new THREE.Vector3(-8.0, 0.8, -3.0),
      new THREE.Vector3(-3.0, 0.8, -1.0),
      new THREE.Vector3(0.0, 1.2, 0.0)
    ]);
    const syngasPipeGeo = new THREE.TubeGeometry(syngasLoopCurve, 40, 0.2, 16, false);
    const syngasPipe = new THREE.Mesh(syngasPipeGeo, pipeMatSyngas);
    this.scene.add(syngasPipe);

    // Recirculation Blower / Compressor skid
    const blowerGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.8, 16);
    const blowerMat = this.createSteelMaterial(0x0e7490, 0.8, 0.3);
    const blower = new THREE.Mesh(blowerGeo, blowerMat);
    blower.rotation.x = Math.PI / 2;
    blower.position.set(-5.5, 0.8, -2.0);
    this.scene.add(blower);
  }

  buildInteractiveMarkers() {
    this.markersGroup = new THREE.Group();
    const markerData = [
      { pos: [0, 13.5, 0], id: 'reactor', label: 'Pyrolysis Reactor' },
      { pos: [8.5, 15.0, 0], id: 'combustor', label: 'Solid Ash Combustor' },
      { pos: [-6.5, 9.5, 0], id: 'feeder', label: 'Biomass Feeder' },
      { pos: [2.5, 13.0, -6.5], id: 'separation', label: 'Catalytic Cyclone' },
      { pos: [-6.5, 8.5, -6.5], id: 'condenser', label: 'Condensation Train' }
    ];

    markerData.forEach((m) => {
      // 3D holographic pulsing pin
      const pinGeo = new THREE.OctahedronGeometry(0.45);
      const pinMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        wireframe: true
      });
      const pin = new THREE.Mesh(pinGeo, pinMat);
      pin.position.set(m.pos[0], m.pos[1], m.pos[2]);
      pin.userData = { id: m.id, label: m.label, isMarker: true };

      // Inner glowing core
      const coreGeo = new THREE.SphereGeometry(0.2, 12, 12);
      const coreMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
      const core = new THREE.Mesh(coreGeo, coreMat);
      pin.add(core);

      this.markersGroup.add(pin);
      this.interactiveObjects.push(pin);
    });

    this.scene.add(this.markersGroup);
  }

  updateThermalState(state) {
    // Dynamic emissivity and color shifts based on live simulation temperature
    const tempC = state.tempC;
    const combTempC = state.combustorTempC;

    // Reactor vessel emissive glow
    if (this.reactorMat) {
      const heatFactor = Math.max(0.0, Math.min(1.0, (tempC - 300) / 250));
      this.reactorMat.emissive.setRGB(heatFactor * 0.9, heatFactor * 0.3, heatFactor * 0.05);
      this.reactorMat.emissiveIntensity = 0.2 + (heatFactor * 0.7);
    }

    // Core bed inside reactor
    if (this.reactorCoreMat) {
      const coreFactor = Math.max(0.0, Math.min(1.0, (tempC - 250) / 300));
      this.reactorCoreMat.emissiveIntensity = 0.5 + (coreFactor * 1.5);
    }

    // Point lights
    if (this.reactorLight) {
      this.reactorLight.intensity = 0.8 + (tempC / 500.0) * 1.5;
    }
    if (this.combustorLight) {
      this.combustorLight.intensity = 1.2 + (combTempC / 800.0) * 1.8;
    }

    // Auxiliary trim burner visibility (glows bright when firing, fades out to black when 0%)
    if (this.burnerMesh) {
      const fuelPct = state.trimFuelPct || 0;
      this.burnerMesh.material.emissiveIntensity = 0.1 + (fuelPct / 100.0) * 1.5;
    }

    // Animate pulsing 3D markers
    if (this.markersGroup) {
      const time = performance.now() * 0.003;
      this.markersGroup.children.forEach((marker, idx) => {
        marker.rotation.y = time + idx;
        marker.position.y += Math.sin(time * 2 + idx) * 0.003;
      });
    }
  }

  setCutawayMode(enabled) {
    this.cutawayMode = enabled;
    this.cutawayMaterials.forEach((mat) => {
      mat.transparent = true;
      mat.opacity = enabled ? 0.35 : 1.0;
      mat.needsUpdate = true;
    });
  }

  setThermalHeatmapMode(enabled) {
    this.thermalMode = enabled;
    this.thermalMaterials.forEach((mat) => {
      if (enabled) {
        // Temperature-based False-Color Heat Map
        const t = mat.userData.targetTempC || 500;
        if (t >= 750) {
          mat.color.setHex(0xffffff); // White-hot
          mat.emissive.setHex(0xff1100);
        } else if (t >= 450) {
          mat.color.setHex(0xff6600); // Amber orange
          mat.emissive.setHex(0xdd4400);
        } else {
          mat.color.setHex(0x0284c7); // Cool cyan
          mat.emissive.setHex(0x0369a1);
        }
        mat.emissiveIntensity = 0.8;
      } else {
        // Reset to standard PBR metallic textures
        mat.color.copy(mat.userData.baseColor);
        mat.emissive.copy(mat.userData.emissiveColor);
        mat.emissiveIntensity = 0.4;
      }
      mat.needsUpdate = true;
    });
  }
}
