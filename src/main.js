import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { VRButton } from "three/addons/webxr/VRButton.js";
import { XRControllerModelFactory } from "three/addons/webxr/XRControllerModelFactory.js";

// VR controller variables
let controller1, controller2;
let controllerGrip1, controllerGrip2;
let raycaster;
const intersected = [];
const tempMatrix = new THREE.Matrix4();
let group;

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

group = new THREE.Group();
scene.add(group);

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.set(0, 1.6, 8);
camera.lookAt(0, 2, 0);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

// VR setup
initVR();

function initVR() {
  document.body.appendChild(VRButton.createButton(renderer));
  renderer.xr.enabled = true;

  raycaster = new THREE.Raycaster();

  controller1 = renderer.xr.getController(0);
  controller1.add(
    new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, -1),
      new THREE.Vector3(0, 0, 0),
      3,
      0xff0000,
    ),
  );
  controller1.addEventListener("selectstart", onSelectStart);
  controller1.addEventListener("selectend", onSelectEnd);
  scene.add(controller1);

  controller2 = renderer.xr.getController(1);
  controller2.addEventListener("selectstart", onSelectStart);
  controller2.addEventListener("selectend", onSelectEnd);
  scene.add(controller2);

  const controllerModelFactory = new XRControllerModelFactory();

  controllerGrip1 = renderer.xr.getControllerGrip(0);
  controllerGrip1.add(
    controllerModelFactory.createControllerModel(controllerGrip1),
  );
  scene.add(controllerGrip1);

  controllerGrip2 = renderer.xr.getControllerGrip(1);
  controllerGrip2.add(
    controllerModelFactory.createControllerModel(controllerGrip2),
  );
  scene.add(controllerGrip2);
}

// Grabbing
function onSelectStart(event) {
  const controller = event.target;
  const intersections = getIntersections(controller);

  if (intersections.length > 0) {
    const hitObject = intersections[0].object;

    let object = hitObject;

    while (object.parent && object.parent !== group) {
      object = object.parent;
    }

    controller.attach(object);
    controller.userData.selected = object;
    controller.userData.selectedMesh = hitObject;
  }
}

// Releasing
function onSelectEnd(event) {
  const controller = event.target;

  if (controller.userData.selected !== undefined) {
    const object = controller.userData.selected;

    group.attach(object);

    controller.userData.selected = undefined;
    controller.userData.selectedMesh = undefined;
  }
}

// Find objects in front of controller
function getIntersections(controller) {
  tempMatrix.identity().extractRotation(controller.matrixWorld);

  raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
  raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

  const hits = raycaster.intersectObjects(group.children, true);
  console.log("Objects detected:", hits.length);
  return hits;
}

// Highlight objects when pointing at them
function intersectObjects(controller) {
  if (controller.userData.selected !== undefined) return;

  const intersections = getIntersections(controller);

  if (intersections.length > 0) {
    const object = intersections[0].object;
    setEmissive(object, 1, 0, 0);
    intersected.push(object);
  }
}

// Remove highlighting
function cleanIntersected() {
  while (intersected.length) {
    const object = intersected.pop();
    setEmissive(object, 0, 0, 0);
  }
}

// Set emissive color
function setEmissive(object, red, green, blue) {
  const materials = Array.isArray(object.material)
    ? object.material
    : [object.material];

  for (const material of materials) {
    if (material && material.emissive) {
      material.emissive.setRGB(red, green, blue);
    }
  }
}

// Environment map
const pmremGenerator = new THREE.PMREMGenerator(renderer);
const environment = new RoomEnvironment();
scene.environment = pmremGenerator.fromScene(environment).texture;
environment.dispose();
pmremGenerator.dispose();

// Snowman group
const snowmanGroup = new THREE.Group();
scene.add(snowmanGroup);
snowmanGroup.position.set(0, 0, -3);

// Materials
const snowMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
const noseMaterial = new THREE.MeshStandardMaterial({ color: 0xff6600 });
const hatMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });

// Snowman body
const bottom = new THREE.Mesh(
  new THREE.SphereGeometry(1, 32, 32),
  snowMaterial,
);
bottom.position.y = 1;
snowmanGroup.add(bottom);

const middle = new THREE.Mesh(
  new THREE.SphereGeometry(0.7, 32, 32),
  snowMaterial,
);
middle.position.y = 2.4;
snowmanGroup.add(middle);

const head = new THREE.Mesh(
  new THREE.SphereGeometry(0.45, 32, 32),
  snowMaterial,
);
head.position.y = 3.45;
snowmanGroup.add(head);

// Nose
const nose = new THREE.Mesh(
  new THREE.ConeGeometry(0.12, 0.5, 16),
  noseMaterial,
);
nose.rotation.x = -Math.PI / 2;
nose.position.set(0, 3.45, 0.48);
snowmanGroup.add(nose);

// Hat
const hat = new THREE.Mesh(
  new THREE.CylinderGeometry(0.3, 0.3, 0.5, 32),
  hatMaterial,
);
hat.position.y = 4.25;
snowmanGroup.add(hat);

// Eyes
const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });

for (const x of [-0.15, 0.15]) {
  const eye = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 16, 16),
    eyeMaterial,
  );
  eye.position.set(x, 3.55, 0.38);
  snowmanGroup.add(eye);
}

// Load pizza model
const loader = new GLTFLoader();

loader.load(
  "/models/pizza.glb",
  (gltf) => {
    const pizza = gltf.scene;
    pizza.position.set(-2, 0.1, -3);
    pizza.scale.set(3, 3, 3);
    group.add(pizza);
  },
  undefined,
  (error) => {
    console.error("Error loading pizza model:", error);
  },
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

// Animation loop
renderer.setAnimationLoop(() => {
  cleanIntersected();
  intersectObjects(controller1);
  intersectObjects(controller2);
  controls.update();
  renderer.render(scene, camera);
});

// Window resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
