/**
 * Camera Navigation, OrbitControls, Viewpoint Presets & Raycaster Interaction
 */

import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js';

export class SceneControls {
  constructor(camera, renderer, scene, interactiveObjects, onSelectObject) {
    this.camera = camera;
    this.renderer = renderer;
    this.scene = scene;
    this.interactiveObjects = interactiveObjects;
    this.onSelectObject = onSelectObject;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.hoveredObject = null;

    this.initOrbitControls();
    this.initRaycasting();

    this.targetCameraPos = null;
    this.targetLookAt = null;
    this.transitioning = false;
    this.transitionSpeed = 0.06;

    this.viewPresets = {
      overview: { pos: new THREE.Vector3(20, 18, 25), target: new THREE.Vector3(1, 6, -1) },
      reactor: { pos: new THREE.Vector3(5, 9, 8), target: new THREE.Vector3(0, 6.5, 0) },
      combustor: { pos: new THREE.Vector3(16, 12, 6), target: new THREE.Vector3(8.5, 7.5, 0) },
      feeder: { pos: new THREE.Vector3(-12, 7, 6), target: new THREE.Vector3(-5, 4.5, 0) },
      separation: { pos: new THREE.Vector3(6, 14, -13), target: new THREE.Vector3(2.5, 9, -6.5) },
      condenser: { pos: new THREE.Vector3(-12, 8, -12), target: new THREE.Vector3(-6.5, 4.5, -6.5) }
    };
  }

  initOrbitControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 4.0;
    this.controls.maxDistance = 60.0;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02; // Prevent going beneath ground pad
    this.controls.target.set(1, 6, -1);
    this.controls.update();
  }

  initRaycasting() {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.checkHover();
    });

    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.handleClick();
    });
  }

  checkHover() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveObjects, true);

    if (intersects.length > 0) {
      this.renderer.domElement.style.cursor = 'pointer';
    } else {
      this.renderer.domElement.style.cursor = 'default';
    }
  }

  handleClick() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveObjects, true);

    if (intersects.length > 0) {
      let topObj = intersects[0].object;
      while (topObj && !topObj.userData?.id && topObj.parent && topObj.parent !== this.scene) {
        topObj = topObj.parent;
      }

      if (topObj && topObj.userData?.id && this.onSelectObject) {
        this.onSelectObject(topObj.userData);
        if (this.viewPresets[topObj.userData.id]) {
          this.setPreset(topObj.userData.id);
        }
      }
    }
  }

  setPreset(name) {
    const preset = this.viewPresets[name];
    if (preset) {
      this.targetCameraPos = preset.pos.clone();
      this.targetLookAt = preset.target.clone();
      this.transitioning = true;
    }
  }

  update() {
    if (this.transitioning && this.targetCameraPos && this.targetLookAt) {
      this.camera.position.lerp(this.targetCameraPos, this.transitionSpeed);
      this.controls.target.lerp(this.targetLookAt, this.transitionSpeed);

      if (this.camera.position.distanceTo(this.targetCameraPos) < 0.05 &&
          this.controls.target.distanceTo(this.targetLookAt) < 0.05) {
        this.camera.position.copy(this.targetCameraPos);
        this.controls.target.copy(this.targetLookAt);
        this.transitioning = false;
      }
    }

    this.controls.update();
  }
}
