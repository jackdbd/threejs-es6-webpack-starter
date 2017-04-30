import * as THREE from 'three';
import OrbitControls from 'orbit-controls-es6';
import * as Detector from '../js/Detector';
import * as DAT from '../js/dat.gui.min';

require('../sass/style.sass');


class Application {
  constructor(opts = {}) {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    if (opts.container) {
      this.container = opts.container;
    } else {
      const div = Application.createContainer();
      document.body.appendChild(div);
      this.container = div;
    }

    if (Detector.webgl) {
      this.init();
      this.render();
    } else {
      // TODO: style warning message
      console.log('WebGL NOT supported in your browser!');
      const warning = Detector.getWebGLErrorMessage();
      this.container.appendChild(warning);
    }
  }

  init() {
    this.scene = new THREE.Scene();
    this.setupRenderer();
    this.setupCamera();
    this.setupLights();
    this.setupHelpers();
    this.setupFloor();
    this.setupControls();
    this.setupGUI();

    {
      const side = 20;
      const geometry = new THREE.CubeGeometry(side, side, side);
      const material = new THREE.MeshLambertMaterial({ color: 0xFBBC05 });
      const cube = new THREE.Mesh(geometry, material);
      cube.position.set(0, side / 2, 0);
      this.scene.add(cube);
    }
  }

  render() {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    // when render is invoked via requestAnimationFrame(this.render) there is
    // no 'this', so either we bind it explicitly or use an es6 arrow function.
    // requestAnimationFrame(this.render.bind(this));
    requestAnimationFrame(() => this.render());
  }

  static createContainer() {
    const div = document.createElement('div');
    div.setAttribute('id', 'canvas-container');
    div.setAttribute('class', 'container');
    // div.setAttribute('width', window.innerWidth);
    // div.setAttribute('height', window.innerHeight);
    return div;
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    // this.renderer.setClearColor(0xd3d3d3);  // it's a light gray
    this.renderer.setClearColor(0x222222);  // it's a dark gray
    this.renderer.setPixelRatio(window.devicePixelRatio || 1);
    this.renderer.setSize(this.width, this.height);
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);
  }

  setupCamera() {
    const fov = 75;
    const aspect = this.width / this.height;
    const near = 0.1;
    const far = 10000;
    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.camera.position.set(100, 100, 100);
    this.camera.lookAt(this.scene.position);
    // this.camera.lookAt(new THREE.Vector3(0, 0, 0));
  }

  setupLights() {
    // directional light
    this.dirLight = new THREE.DirectionalLight(0x4682b4, 1); // steelblue
    this.dirLight.position.set(120, 30, -200);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.camera.near = 10;
    this.scene.add(this.dirLight);
    // spotlight
    this.spotLight = new THREE.SpotLight(0xffaa55);
    this.spotLight.position.set(120, 30, 0);
    this.spotLight.castShadow = true;
    this.dirLight.shadow.camera.near = 10;
    this.scene.add(this.spotLight);
    // const ambientLight = new THREE.AmbientLight(0xffaa55);
    // this.scene.add(ambientLight);
  }

  setupHelpers() {
    // floor grid helper
    const gridHelper = new THREE.GridHelper(200, 16);
    this.scene.add(gridHelper);
    // XYZ axes helper (XYZ axes are RGB colors, respectively)
    const axisHelper = new THREE.AxisHelper(75);
    this.scene.add(axisHelper);
    // directional light helper + shadow camera helper
    const dirLightHelper = new THREE.DirectionalLightHelper(this.dirLight, 10);
    this.scene.add(dirLightHelper);
    const dirLightCameraHelper = new THREE.CameraHelper(this.dirLight.shadow.camera);
    this.scene.add(dirLightCameraHelper);
    // spot light helper + shadow camera helper
    const spotLightHelper = new THREE.SpotLightHelper(this.spotLight);
    this.scene.add(spotLightHelper);
    const spotLightCameraHelper = new THREE.CameraHelper(this.spotLight.shadow.camera);
    this.scene.add(spotLightCameraHelper);
  }

  setupFloor() {
    const geometry = new THREE.PlaneGeometry(100, 100, 1, 1);
    const texture = new THREE.TextureLoader().load('/textures/checkerboard.jpg');
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    const material = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      map: texture,
    });
    const floor = new THREE.Mesh(geometry, material);
    floor.position.y = -0.5;
    floor.rotation.x = Math.PI / 2;
    this.scene.add(floor);
  }

  setupControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enabled = true;
    this.controls.maxDistance = 1500;
    this.controls.minDistance = 0;
    this.controls.autoRotate = true;
  }

  setupGUI() {
    const gui = new DAT.GUI();
    gui.add(this.camera.position, 'x').name('Camera X').min(0).max(100);
    gui.add(this.camera.position, 'y').name('Camera Y').min(0).max(100);
    gui.add(this.camera.position, 'z').name('Camera Z').min(0).max(100);
  }

}

// wrap everything inside a function scope and invoke it (IIFE, a.k.a. SEAF)
(() => {
  const app = new Application({
    container: document.getElementById('canvas-container'),
  });
  console.log(app);
})();
