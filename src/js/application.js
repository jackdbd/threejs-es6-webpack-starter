import * as THREE from "three";
// TODO: OrbitControls import three.js on its own, so the webpack bundle includes three.js twice!
import OrbitControls from "orbit-controls-es6";
import * as Detector from "../js/vendor/Detector";
import * as DAT from "../js/vendor/dat.gui.min";
import * as checkerboard from "../textures/checkerboard.jpg";
import * as star from "../textures/star.png";
import * as vertexShader from "../glsl/vertexShader.glsl";
import * as fragmentShader from "../glsl/fragmentShader.glsl";
import "../sass/home.sass";

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
      console.warn("WebGL NOT supported in your browser!");
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
      const material = new THREE.MeshLambertMaterial({ color: 0xfbbc05 });
      const cube = new THREE.Mesh(geometry, material);
      cube.position.set(0, side / 2, 0);
      this.scene.add(cube);
    }

    this.setupCustomObject();
    this.addParticleSystem();
    this.addGroupObject();
  }

  render() {
    this.controls.update();
    this.updateCustomObject();
    this.renderer.render(this.scene, this.camera);
    // when render is invoked via requestAnimationFrame(this.render) there is
    // no 'this', so either we bind it explicitly or use an es6 arrow function.
    // requestAnimationFrame(this.render.bind(this));
    requestAnimationFrame(() => this.render());
  }

  static createContainer() {
    const div = document.createElement("div");
    div.setAttribute("id", "canvas-container");
    div.setAttribute("class", "container");
    // div.setAttribute('width', window.innerWidth);
    // div.setAttribute('height', window.innerHeight);
    return div;
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    // this.renderer.setClearColor(0xd3d3d3);  // it's a light gray
    this.renderer.setClearColor(0x222222); // it's a dark gray
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
    const axesHelper = new THREE.AxesHelper(75);
    this.scene.add(axesHelper);
    // directional light helper + shadow camera helper
    const dirLightHelper = new THREE.DirectionalLightHelper(this.dirLight, 10);
    this.scene.add(dirLightHelper);
    const dirLightCameraHelper = new THREE.CameraHelper(
      this.dirLight.shadow.camera
    );
    this.scene.add(dirLightCameraHelper);
    // spot light helper + shadow camera helper
    const spotLightHelper = new THREE.SpotLightHelper(this.spotLight);
    this.scene.add(spotLightHelper);
    const spotLightCameraHelper = new THREE.CameraHelper(
      this.spotLight.shadow.camera
    );
    this.scene.add(spotLightCameraHelper);
  }

  setupFloor() {
    const geometry = new THREE.PlaneGeometry(100, 100, 1, 1);
    const texture = new THREE.TextureLoader().load(checkerboard);
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
    gui
      .add(this.camera.position, "x")
      .name("Camera X")
      .min(0)
      .max(100);
    gui
      .add(this.camera.position, "y")
      .name("Camera Y")
      .min(0)
      .max(100);
    gui
      .add(this.camera.position, "z")
      .name("Camera Z")
      .min(0)
      .max(100);
  }

  setupCustomObject() {
    // create an object that uses custom shaders
    this.delta = 0;
    const customUniforms = {
      delta: { value: 0 },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: customUniforms,
    });

    const geometry = new THREE.SphereBufferGeometry(5, 32, 32);

    this.vertexDisplacement = new Float32Array(
      geometry.attributes.position.count
    );
    for (let i = 0; i < this.vertexDisplacement.length; i += 1) {
      this.vertexDisplacement[i] = Math.sin(i);
    }

    geometry.addAttribute(
      "vertexDisplacement",
      new THREE.BufferAttribute(this.vertexDisplacement, 1)
    );

    this.customMesh = new THREE.Mesh(geometry, material);
    this.customMesh.position.set(5, 5, 5);
    this.scene.add(this.customMesh);
  }

  updateCustomObject() {
    // update an object that uses custom shaders
    this.delta += 0.1;
    this.customMesh.material.uniforms.delta.value =
      0.5 + Math.sin(this.delta) * 0.5;
    for (let i = 0; i < this.vertexDisplacement.length; i += 1) {
      this.vertexDisplacement[i] = 0.5 + Math.sin(i + this.delta) * 0.25;
    }
    // attribute buffers are not refreshed automatically. To update custom
    // attributes we need to set the needsUpdate flag to true
    this.customMesh.geometry.attributes.vertexDisplacement.needsUpdate = true;
  }

  addParticleSystem() {
    const geometry = new THREE.Geometry();

    const count = 500;
    for (let i = 0; i < count; i += 1) {
      const particle = new THREE.Vector3();
      particle.x = THREE.Math.randFloatSpread(50);
      particle.y = THREE.Math.randFloatSpread(50);
      particle.z = THREE.Math.randFloatSpread(50);
      geometry.vertices.push(particle);
    }

    const texture = new THREE.TextureLoader().load(star);
    const material = new THREE.PointsMaterial({
      size: 5,
      map: texture,
      transparent: true,
      // alphaTest's default is 0 and the particles overlap. Any value > 0
      // prevents the particles from overlapping.
      alphaTest: 0.5,
    });

    const particleSystem = new THREE.Points(geometry, material);
    particleSystem.position.set(-50, 50, -50);
    this.scene.add(particleSystem);
  }

  addGroupObject() {
    const group = new THREE.Group();
    const side = 5;
    const geometry = new THREE.BoxGeometry(side, side, side);
    const material = new THREE.MeshLambertMaterial({
      color: 0x228b22, // forest green
    });

    for (let i = 0; i < 50; i += 1) {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.x = THREE.Math.randFloatSpread(50);
      mesh.position.y = THREE.Math.randFloatSpread(50);
      mesh.position.z = THREE.Math.randFloatSpread(50);
      mesh.rotation.x = Math.random() * 360 * (Math.PI / 180);
      mesh.rotation.y = Math.random() * 360 * (Math.PI / 180);
      mesh.rotation.z = Math.random() * 360 * (Math.PI / 180);
      group.add(mesh);
    }
    group.position.set(50, 20, 50);
    this.scene.add(group);
  }
}

export default Application;
