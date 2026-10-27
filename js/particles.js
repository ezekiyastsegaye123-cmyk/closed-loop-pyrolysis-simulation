/**
 * Industrial Process Flow Particles & FX
 * Instanced and GPU particle streams visualizing:
 * - Biomass feed injection
 * - Fluidized bubbling bed
 * - Recirculating solid heat carrier (hot ash & return char)
 * - Hot pyrolysis vapor stream
 * - Recirculated syngas loop
 * - Condensed bio-oil collection
 */

import * as THREE from 'three';

export class ProcessParticleStreams {
  constructor(scene) {
    this.scene = scene;
    this.streams = [];
    this.visible = true;

    this.initHotAshStream();
    this.initSpentAshStream();
    this.initBiomassFeedStream();
    this.initFluidizedBedStream();
    this.initVaporStream();
    this.initSyngasLoopStream();
    this.initBioOilDripStream();
  }

  createPathParticles(curve, count, size, color, speed, spread = 0.15) {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const progress = new Float32Array(count);
    const offsets = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      progress[i] = Math.random();
      offsets[i * 3 + 0] = (Math.random() - 0.5) * spread;
      offsets[i * 3 + 1] = (Math.random() - 0.5) * spread;
      offsets[i * 3 + 2] = (Math.random() - 0.5) * spread;

      const pt = curve.getPointAt(progress[i]);
      positions[i * 3 + 0] = pt.x + offsets[i * 3 + 0];
      positions[i * 3 + 1] = pt.y + offsets[i * 3 + 1];
      positions[i * 3 + 2] = pt.z + offsets[i * 3 + 2];
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: color,
      size: size,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const points = new THREE.Points(geo, mat);
    this.scene.add(points);

    return {
      points,
      curve,
      count,
      progress,
      offsets,
      speed,
      active: true
    };
  }

  initHotAshStream() {
    // Hot ash (800 °C) flowing Combustor -> Reactor via riser
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(8.5, 11.0, 0),
      new THREE.Vector3(7.0, 11.8, 1.5),
      new THREE.Vector3(3.5, 11.2, 1.5),
      new THREE.Vector3(1.8, 9.5, 0.5),
      new THREE.Vector3(0.0, 9.0, 0)
    ]);
    this.hotAshStream = this.createPathParticles(curve, 180, 0.28, 0xff5500, 0.16, 0.2);
    this.streams.push(this.hotAshStream);
  }

  initSpentAshStream() {
    // Spent ash returning Reactor base -> Combustor base
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.0, 2.0, 0),
      new THREE.Vector3(1.8, 1.5, -1.5),
      new THREE.Vector3(5.0, 1.8, -1.5),
      new THREE.Vector3(7.2, 2.2, -0.5),
      new THREE.Vector3(8.5, 2.5, 0)
    ]);
    this.spentAshStream = this.createPathParticles(curve, 140, 0.24, 0xff8800, 0.13, 0.18);
    this.streams.push(this.spentAshStream);
  }

  initBiomassFeedStream() {
    // Raw biomass feeding from hopper screw feeder into reactor
    const curve = new THREE.LineCurve3(
      new THREE.Vector3(-6.5, 3.2, 0),
      new THREE.Vector3(-0.2, 3.2, 0)
    );
    this.biomassStream = this.createPathParticles(curve, 100, 0.22, 0xa3e635, 0.10, 0.15);
    this.streams.push(this.biomassStream);
  }

  initFluidizedBedStream() {
    // Fluidized sand/ash bubbling inside reactor core
    const count = 250;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const radius = Math.random() * 0.95;
      const angle = Math.random() * Math.PI * 2;
      pos[i * 3 + 0] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = 2.0 + Math.random() * 3.5;
      pos[i * 3 + 2] = Math.sin(angle) * radius;

      vel[i * 3 + 0] = (Math.random() - 0.5) * 0.025;
      vel[i * 3 + 1] = 0.018 + Math.random() * 0.035;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.025;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xffaa00,
      size: 0.22,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });

    this.bedPoints = new THREE.Points(geo, mat);
    this.bedVelocities = vel;
    this.bedCount = count;
    this.scene.add(this.bedPoints);
  }

  initVaporStream() {
    // Fast pyrolysis vapors rising from reactor top to cyclone
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 11.5, 0),
      new THREE.Vector3(0, 13.0, -3.0),
      new THREE.Vector3(0.8, 11.2, -6.5)
    ]);
    this.vaporStream = this.createPathParticles(curve, 150, 0.32, 0xfde047, 0.20, 0.25);
    this.streams.push(this.vaporStream);
  }

  initSyngasLoopStream() {
    // Syngas recirculation loop
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-11.0, 7.0, -6.5),
      new THREE.Vector3(-11.0, 1.0, -6.5),
      new THREE.Vector3(-8.0, 0.8, -3.0),
      new THREE.Vector3(-3.0, 0.8, -1.0),
      new THREE.Vector3(0.0, 1.2, 0.0)
    ]);
    this.syngasStream = this.createPathParticles(curve, 160, 0.25, 0x00f0ff, 0.18, 0.15);
    this.streams.push(this.syngasStream);
  }

  initBioOilDripStream() {
    // Condensed bio-oil liquid falling into receiver tank
    const count = 40;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] = -7.7 + (Math.random() - 0.5) * 0.4;
      pos[i * 3 + 1] = 1.0 + Math.random() * 2.5;
      pos[i * 3 + 2] = -6.5 + (Math.random() - 0.5) * 0.4;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x22c55e,
      size: 0.25,
      transparent: true,
      opacity: 0.95
    });
    this.bioOilDrips = new THREE.Points(geo, mat);
    this.scene.add(this.bioOilDrips);
  }

  update(delta, simState) {
    if (!this.visible) return;

    // Modulate stream speeds based on feed rate and recirc ratio
    const feedFactor = (simState.ashCarrierRateKgHr || 5940) / 5940;
    const syngasActive = simState.syngasRecirc;

    // 1. Update curve path particles
    this.streams.forEach((stream) => {
      const positions = stream.points.geometry.attributes.position.array;
      const speed = stream.speed * feedFactor * delta;

      for (let i = 0; i < stream.count; i++) {
        stream.progress[i] += speed;
        if (stream.progress[i] > 1.0) stream.progress[i] -= 1.0;

        const pt = stream.curve.getPointAt(stream.progress[i]);
        positions[i * 3 + 0] = pt.x + stream.offsets[i * 3 + 0];
        positions[i * 3 + 1] = pt.y + stream.offsets[i * 3 + 1];
        positions[i * 3 + 2] = pt.z + stream.offsets[i * 3 + 2];
      }
      stream.points.geometry.attributes.position.needsUpdate = true;
    });

    // 2. Update fluidized bed tumbling particles
    if (this.bedPoints) {
      const bedPos = this.bedPoints.geometry.attributes.position.array;
      for (let i = 0; i < this.bedCount; i++) {
        bedPos[i * 3 + 1] += this.bedVelocities[i * 3 + 1] * (delta * 60);
        bedPos[i * 3 + 0] += this.bedVelocities[i * 3 + 0] * (delta * 60);
        bedPos[i * 3 + 2] += this.bedVelocities[i * 3 + 2] * (delta * 60);

        // Reset if risen past top of bed
        if (bedPos[i * 3 + 1] > 6.0) {
          const r = Math.random() * 0.95;
          const a = Math.random() * Math.PI * 2;
          bedPos[i * 3 + 0] = Math.cos(a) * r;
          bedPos[i * 3 + 1] = 1.8 + Math.random() * 0.4;
          bedPos[i * 3 + 2] = Math.sin(a) * r;
        }
      }
      this.bedPoints.geometry.attributes.position.needsUpdate = true;
    }

    // 3. Update bio-oil dripping
    if (this.bioOilDrips) {
      const dripPos = this.bioOilDrips.geometry.attributes.position.array;
      for (let i = 0; i < 40; i++) {
        dripPos[i * 3 + 1] -= delta * 1.8;
        if (dripPos[i * 3 + 1] < 1.0) {
          dripPos[i * 3 + 1] = 3.5 + Math.random() * 0.5;
        }
      }
      this.bioOilDrips.geometry.attributes.position.needsUpdate = true;
    }

    // Syngas visibility toggle
    if (this.syngasStream) {
      this.syngasStream.points.visible = syngasActive;
    }
  }

  setVisible(visible) {
    this.visible = visible;
    this.streams.forEach(s => s.points.visible = visible);
    if (this.bedPoints) this.bedPoints.visible = visible;
    if (this.bioOilDrips) this.bioOilDrips.visible = visible;
  }
}
