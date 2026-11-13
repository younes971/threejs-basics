
import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(5, 4, 7);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

// Environment map
const pmremGenerator = new THREE.PMREMGenerator(renderer);
const environment = new RoomEnvironment();
scene.environment = pmremGenerator.fromScene(environment).texture;
environment.dispose();
pmremGenerator.dispose();

// Materials
const snowMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
const noseMaterial = new THREE.MeshStandardMaterial({ color: 0xff6600 });
const hatMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });

// Snowman body
const bottom = new THREE.Mesh(
  new THREE.SphereGeometry(1, 32, 32),
  snowMaterial
);
bottom.position.y = 1;
scene.add(bottom);

const middle = new THREE.Mesh(
  new THREE.SphereGeometry(0.7, 32, 32),
  snowMaterial
);
middle.position.y = 2.4;
scene.add(middle);

const head = new THREE.Mesh(
  new THREE.SphereGeometry(0.45, 32, 32),
  snowMaterial
);
head.position.y = 3.45;
scene.add(head);

// Nose
const nose = new THREE.Mesh(
  new THREE.ConeGeometry(0.12, 0.5, 16),
  noseMaterial
);
nose.rotation.x = -Math.PI / 2;
nose.position.set(0, 3.45, 0.48);
scene.add(nose);

// Hat
const hat = new THREE.Mesh(
  new THREE.CylinderGeometry(0.3, 0.3, 0.5, 32),
  hatMaterial
);
hat.position.y = 4.25;
scene.add(hat);

// Eyes
const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });

for (const x of [-0.15, 0.15]) {
  const eye = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 16, 16),
    eyeMaterial
  );
  eye.position.set(x, 3.55, 0.38);
  scene.add(eye);
}

// Load external GLB model
const loader = new GLTFLoader();

loader.load(
  '/models/pizza.glb',
  (gltf) => {
    const pizza = gltf.scene;
    pizza.position.set(-3, 0.1, 0);
    pizza.scale.set(3, 3, 3);
    scene.add(pizza);
  },
  undefined,
  (error) => {
    console.error('Error loading pizza model:', error);
  }
);

// Axis helper
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(5, 8, 5);
scene.add(directionalLight);

const pointLight = new THREE.PointLight(0xffffff, 30);
pointLight.position.set(-3, 4, 3);
scene.add(pointLight);

// Orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Animation
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// Window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
