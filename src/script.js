import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as CANNON from "cannon-es";

/**
 * BASE
 */
// Canvas
const canvas = document.querySelector(".webgl");

// SIZES

const sizes = {
  width: window.innerHeight,
  height: window.innerWidth,
};

// Scene
const scene = new THREE.Scene();

// CAMERA
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(-3, 3, 3);
scene.add(camera);

// CONTROLS
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * TEXTURES
 */

const textureLoader = new THREE.TextureLoader()


// LIGHTS
const ambientLight = new THREE.AmbientLight(new THREE.Color("#ffffff"), .5);
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(new THREE.Color('#ffffff'), .8)
directionalLight.position.set(-3, 3, 0)
scene.add(directionalLight)

window.addEventListener("resize", () => {
  // Update the sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update the Camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update Renderer
  renderer.setSize(sizes.width, sizes.height);
});

/**
 * GROUND
 */

const floorGeometry = new THREE.PlaneGeometry(5, 5);
const floorMaterial = new THREE.MeshBasicMaterial({
  color: new THREE.Color("#ffffff"),
});
const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
floorMesh.rotation.x = -Math.PI * 0.5;
floorMesh.position.set(0, 0, 0);
scene.add(floorMesh);

const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

/**
 * PHYSICS
 */
// World
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);

// Materials
const defaultMaterial = new CANNON.Material("default");

const defaultContactMaterial = new CANNON.ContactMaterial(
  defaultMaterial,
  defaultMaterial,
  {
    friction: 0.1,
    restitution: 0.9,
  }
);
world.addContactMaterial(defaultContactMaterial);
world.defaultContactMaterial = defaultContactMaterial;

/**
 * OBJECTS
 */

const objectsToUpdate = []

const createSphere = (radius, x, y, z) => {
  // THREEJS MESH
  const sphereGeometry = new THREE.SphereGeometry(radius);
  const sphereMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#ff0000'),
    metalness: 0.1,
    roughness: 0.3
});

  const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);

  sphereMesh.position.set(x, y, z);

  scene.add(sphereMesh);

  // CANNON BODY
  const sphereShape = new CANNON.Sphere(radius)
  const sphereBody = new CANNON.Body({
      mass: 1,
      position: new CANNON.Vec3(x, y, z),
      shape: sphereShape,
      material: defaultMaterial
  })
  world.addBody(sphereBody)

  // Save in objects to update
  objectsToUpdate.push({
      mesh: sphereMesh,
      body: sphereBody
  })
};

createSphere(.5, 1, 2, 0)
createSphere(.5, -1, 2, 0)

// Floor
const floorShape = new CANNON.Plane();
const floorBody = new CANNON.Body();
floorBody.mass = 0;
floorBody.addShape(floorShape);
floorBody.material = defaultMaterial;
floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(-1, 0, 0), Math.PI / 2);

world.addBody(floorBody);

/**
 * RENDERER
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * CONTROLLER
 */

 window.addEventListener('keypress', (event) => {
    if(event.code === 'KeyW') {
        objectsToUpdate[0].body.force.set(150, 0, 0)
    }
    if(event.code === 'KeyS') {
        objectsToUpdate[0].body.force.set(-150, 0, 0)
    }
})

/**
 * ANIMATE
 */

const clock = new THREE.Clock();
let oldElapsedTime = 0;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - oldElapsedTime;
  oldElapsedTime = elapsedTime;

  // Update Controls
  controls.update();

  //Update world physics
  world.step(1 / 60, deltaTime, 3)

  for(const object of objectsToUpdate) {
    object.mesh.position.copy(object.body.position)
    object.mesh.quaternion.copy(object.body.quaternion)
  }

  // Render Scene
  renderer.render(scene, camera);

  // Call the tick again on next frame
  window.requestAnimationFrame(tick);
};

tick();
