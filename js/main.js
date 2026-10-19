/**
 * Main Application Orchestrator & Animation Loop
 * Adheres to 3D Web Experience guidelines:
 * - WebGL capability detection & graceful fallback
 * - Progress loader screen
 * - DPR mobile capping & 60fps performance optimization
 */

import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { PyrolysisSimulationModel } from './simulation.js';
import { Plant3DScene } from './scene.js';
import { ProcessParticleStreams } from './particles.js';
import { SceneControls } from './controls.js';
import { DashboardUI } from './ui.js';

// Global execution state
window.simulationRunning = true;
window.simulationSpeed = 1.0;

class PyrolysisWebExperienceApp {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.loaderEl = document.getElementById('app-loader');
    this.loaderProgress = document.getElementById('loader-progress');
    this.loaderStatus = document.getElementById('loader-status');

    if (!this.checkWebGL()) {
      this.showWebGLFallback();
      return;
    }

    this.init();
  }

  checkWebGL() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && 
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  showWebGLFallback() {
    if (this.loaderEl) this.loaderEl.style.display = 'none';
    const fallback = document.getElementById('webgl-fallback');
    if (fallback) fallback.style.display = 'flex';
  }

  updateLoader(pct, statusText) {
    if (this.loaderProgress) this.loaderProgress.style.width = `${pct}%`;
    if (this.loaderStatus) this.loaderStatus.textContent = statusText;
  }

  async init() {
    this.updateLoader(20, 'Initializing WebGL 3D Engine...');

    // 1. Setup Camera & Renderer
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(45, w / h, 0.5, 200);
    this.camera.position.set(20, 18, 25);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(w, h);
    // Mobile DPR capping as required by 3D Web Experience best practices
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    this.renderer.setPixelRatio(isMobile ? 1.0 : Math.min(window.devicePixelRatio, 2.0));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    this.container.appendChild(this.renderer.domElement);

    this.updateLoader(50, 'Assembling Reactor Geometry & Refractory Vessels...');

    // 2. Physics & Kinetic Engine
    this.sim = new PyrolysisSimulationModel();

    // 3. 3D Scene Architecture
    this.plantScene = new Plant3DScene(this.container);

    this.updateLoader(75, 'Configuring Heat Carrier Loops & Particle Streams...');

    // 4. Particle Streams
    this.particles = new ProcessParticleStreams(this.plantScene.scene);
    window.particleStreams = this.particles;

    // 5. Controls & Interaction
    this.controls = new SceneControls(
      this.camera,
      this.renderer,
      this.plantScene.scene,
      this.plantScene.interactiveObjects,
      (objInfo) => {
        if (this.ui) this.ui.showEquipmentModal(objInfo);
      }
    );

    // 6. UI Dashboard
    this.ui = new DashboardUI(this.sim, this.plantScene, this.controls);

    this.updateLoader(100, 'System Online: Ready');

    // Dismiss loader smoothly
    setTimeout(() => {
      if (this.loaderEl) {
        this.loaderEl.classList.add('fade-out');
        setTimeout(() => this.loaderEl.style.display = 'none', 600);
      }
    }, 400);

    // Resize listener
    window.addEventListener('resize', () => this.onResize());

    // Clock
    this.clock = new THREE.Clock();
    this.lastSimTime = 0;

    // Start loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  onResize() {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  animate() {
    requestAnimationFrame(this.animate);

    const delta = Math.min(0.1, this.clock.getDelta());

    // 1. Run simulation integration steps if active
    if (window.simulationRunning) {
      const simDt = delta * window.simulationSpeed * 1.5;
      this.sim.step(simDt);
    }

    const currentState = this.sim.lastState;

    // 2. Update 3D scene visual states
    this.plantScene.updateThermalState(currentState);

    // 3. Update particle flows
    this.particles.update(delta * window.simulationSpeed, currentState);

    // 4. Update camera transition and orbit controls
    this.controls.update();

    // 5. Update UI HUD and Charts
    this.ui.update(currentState);

    // 6. Render 3D Frame
    this.renderer.render(this.plantScene.scene, this.camera);
  }
}

// Bootstrap on DOM ready
window.addEventListener('DOMContentLoaded', () => {
  new PyrolysisWebExperienceApp();
});
