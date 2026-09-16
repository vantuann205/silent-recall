import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export type ProductScene = ReturnType<typeof createProductScene>;

export function createProductScene(
  host: HTMLElement,
  interaction: HTMLElement,
  onLost: () => void,
) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  host.appendChild(renderer.domElement);
  const world = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.z = 12;
  // A separate orbit camera keeps the product anchored away from the page text.
  const orbitCamera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  orbitCamera.position.z = 10;
  const controls = new OrbitControls(orbitCamera, interaction);
  controls.enablePan = false;
  controls.minDistance = 8.5;
  controls.maxDistance = 13;
  controls.rotateSpeed = 0.7;
  controls.zoomSpeed = 0.6;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.6;
  controls.saveState();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04);
  world.environment = environment.texture;
  room.dispose();
  pmrem.dispose();
  const product = new THREE.Group();
  world.add(product);
  const silver = new THREE.MeshStandardMaterial({
    color: '#c3cbc8',
    metalness: 0.85,
    roughness: 0.28,
  });
  const dark = new THREE.MeshStandardMaterial({
    color: '#19241e',
    metalness: 0.45,
    roughness: 0.4,
  });
  const lime = new THREE.MeshStandardMaterial({
    color: '#c5ee82',
    roughness: 0.38,
  });
  const box = (
    w: number,
    h: number,
    d: number,
    material: THREE.Material,
    x = 0,
    y = 0,
    z = 0,
  ) => {
    const mesh = new THREE.Mesh(
      new RoundedBoxGeometry(w, h, d, 3, Math.min(0.12, d / 3)),
      material,
    );
    mesh.position.set(x, y, z);
    product.add(mesh);
    return mesh;
  };
  box(3.15, 4.1, 0.95, silver);
  box(3.17, 4.12, 0.075, dark, 0, 0, 0.03);
  box(0.3, 4.16, 1, lime, -1.05);
  box(0.42, 0.55, 1.04, dark, 1.25, 1.25);
  box(0.42, 0.55, 1.04, dark, 1.25, -1.25);
  const label = document.createElement('canvas');
  label.width = 768;
  label.height = 1024;
  const ctx = label.getContext('2d')!;
  ctx.fillStyle = '#17241e';
  ctx.fillRect(0, 0, 768, 1024);
  ctx.fillStyle = '#d0ee8f';
  ctx.font = '500 125px sans-serif';
  ctx.fillText('SR / 001', 60, 180);
  ctx.fillStyle = '#f0f2eb';
  ctx.font = '36px sans-serif';
  ctx.fillText('PRODUCT', 60, 300);
  ctx.fillText('PASSPORT', 60, 350);
  ctx.strokeStyle = '#718375';
  ctx.beginPath();
  ctx.moveTo(60, 410);
  ctx.lineTo(708, 410);
  ctx.stroke();
  ctx.fillStyle = '#a7b6aa';
  ctx.font = '24px monospace';
  ctx.fillText('PRIVATE BY CONSTRUCTION', 60, 480);
  ctx.fillText('SERIAL  /  ********', 60, 535);
  ctx.fillStyle = '#8ce0e4';
  ctx.font = '30px sans-serif';
  ctx.fillText('SEALED CREDENTIAL', 60, 670);
  for (let i = 0; i < 62; i++)
    ctx.fillRect(60 + i * 10, 740, i % 3 === 0 ? 6 : 2, 125);
  ctx.fillStyle = '#a7b6aa';
  ctx.font = '23px monospace';
  ctx.fillText('SILENTRECALL / MIDNIGHT', 60, 945);
  const texture = new THREE.CanvasTexture(label);
  texture.colorSpace = THREE.SRGBColorSpace;
  box(
    1.95,
    2.6,
    0.025,
    new THREE.MeshStandardMaterial({ map: texture, roughness: 0.5 }),
    0.27,
    -0.15,
    0.49,
  );
  const light = new THREE.DirectionalLight('#e6faff', 4);
  light.position.set(-3, 6, 8);
  world.add(light);
  let paused = false;
  let visible = true;
  let phase = 0;
  let last = 0;
  let baseScale = 1;
  let baseY = 0;
  const draw = () => {
    product.rotation.set(0.12 + Math.sin(phase) * 0.04, -0.35, -0.12);
    product.quaternion.premultiply(orbitCamera.quaternion);
    product.scale.setScalar((baseScale * 10) / orbitCamera.position.length());
    product.position.y = baseY + Math.sin(phase) * 0.07;
    renderer.render(world, camera);
  };
  const animate = (time: number) => {
    const delta = Math.min((time - (last || time)) / 1000, 0.05);
    phase += delta * 0.5;
    last = time;
    controls.update(delta);
    draw();
  };
  const schedule = () => {
    last = 0;
    renderer.setAnimationLoop(
      !paused && visible && !document.hidden ? animate : null,
    );
    draw();
  };
  const resize = () => {
    const { width, height } = host.getBoundingClientRect();
    renderer.setSize(width, height);
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
    const mobile = width <= 800;
    const viewHeight = 2 * 12 * Math.tan(THREE.MathUtils.degToRad(17));
    baseScale = mobile ? (height < 620 ? 0.38 : 0.44) : 0.96;
    product.position.x = mobile ? 0 : viewHeight * camera.aspect * 0.255;
    baseY = mobile ? -viewHeight * (height < 620 ? 0.25 : 0.265) : 0.1;
    draw();
  };
  const change = () => {
    if (paused) draw();
  };
  controls.addEventListener('change', change);
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    schedule();
  });
  intersection.observe(host);
  const lost = (event: Event) => {
    event.preventDefault();
    renderer.setAnimationLoop(null);
    onLost();
  };
  renderer.domElement.addEventListener('webglcontextlost', lost);
  document.addEventListener('visibilitychange', schedule);
  resize();
  schedule();
  return {
    pause(value: boolean) {
      paused = value;
      controls.autoRotate = !value;
      schedule();
    },
    rotate(direction: number) {
      orbitCamera.position.applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        (direction * Math.PI) / 6,
      );
      controls.update(0);
      draw();
    },
    zoom(direction: number) {
      orbitCamera.position.multiplyScalar(direction > 0 ? 0.9 : 1.1);
      controls.update(0);
      draw();
    },
    reset() {
      phase = 0;
      controls.reset();
      draw();
    },
    dispose() {
      observer.disconnect();
      intersection.disconnect();
      renderer.setAnimationLoop(null);
      controls.removeEventListener('change', change);
      controls.dispose();
      document.removeEventListener('visibilitychange', schedule);
      renderer.domElement.removeEventListener('webglcontextlost', lost);
      world.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      texture.dispose();
      environment.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
