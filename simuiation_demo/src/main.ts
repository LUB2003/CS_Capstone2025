import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'; // HDRI 쓸 때만 사용(지금은 RoomEnvironment)
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { RectAreaLightHelper } from 'three/examples/jsm/helpers/RectAreaLightHelper.js';

import { loadFurniture, type LoadSizeOptions } from './loadFurniture';
import { DragController } from './dragController';
import { UIManager, type Asset, type PlacedItem } from './ui';
import { createRig, addDefaultLights } from './sceneSetup';

/** 갤러리: public 기준 절대경로 */
const ASSETS: Asset[] = [
  { id: 'Series3300_3303', name: 'Series3300_3303', url: '/furniture/Series3300_3303.glb', thumb: '/thumbs/Series3300_3303.png' },
  { id: 'EGG_3316',        name: 'EGG_3316',        url: '/furniture/EGG_3316.glb',        thumb: '/thumbs/EGG_3316.png' },
];


const canvas = document.querySelector<HTMLCanvasElement>('#c')!;

const Adapter   = await navigator.gpu?.requestAdapter()     as GPUAdapter;
const Device    = await Adapter?.requestDevice()            as GPUDevice;

/** WebGL 렌더러 */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.2;          // 하이라이트가 보이도록 너무 낮추지 않음(0.7~1.0에서 취향 조절)
renderer.physicallyCorrectLights = true;
renderer.shadowMap.enabled = true;           // 그림자
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

/** 씬 */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

/** 카메라/컨트롤/리사이즈/프레이밍 */
const { camera, controls, resize } = createRig(renderer);

/** 라이트(기본 보조광) */
//addDefaultLights(scene);

/** 환경광(파일 없이 RoomEnvironment 사용) */
const pmrem = new THREE.PMREMGenerator(renderer);
const envTex = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
scene.environment = envTex;
//scene.background = envTex; // 배경까지 환경 넣으면 화면이 더 밝아 보임(보통 비권장)

/** 키라이트: 작고 밝은 면광원(하이라이트 선명) */
RectAreaLightUniformsLib.init();
const key = new THREE.RectAreaLight(0xffffff, 35, 0.6, 0.6); // intensity, width, height
key.position.set(2, 1.8, 2);
key.lookAt(0, 0.8, 0);
scene.add(key);
scene.add(new RectAreaLightHelper(key)); // 필요시 시각화

/** 바닥(그림자만 받는 투명 바닥) */
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 20),
  new THREE.ShadowMaterial({ opacity: 0.35 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0;
ground.receiveShadow = true;
scene.add(ground);

/** 배치된 가구 목록 & 선택 */
const placed: PlacedItem[] = [];
let selectedId: string | null = null;

/** 드래그 컨트롤러 */
const drag = new DragController(scene, camera, controls, renderer.domElement);


/** (전역) OBJ→GLB 변환물 보정: 러프니스/금속/스무스/그림자 */
function fixConvertedMaterials(root: THREE.Object3D) {
  const metalKeywords = ['inox','steel','stainless','metal','chrome','aluminium','aluminum','ss'];

  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;

    // 노멀 없으면 계산(스무스 셰이딩)
    const geo = mesh.geometry as THREE.BufferGeometry;
    if (!geo.getAttribute('normal')) geo.computeVertexNormals();

    let m: any = (mesh as any).material;
    if (!m) return;

    // 러프니스 상한(전부 1.0이면 하이라이트 사라짐)
    const r = m.roughness ?? 1.0;
    if (r >= 0.95) m.roughness = 0.35;      // 필요시 0.35까지 더 낮추면 더 또렷

    // 금속 추정(이름 규칙): 금속 하이라이트 강화
    const n = (m.name || mesh.name || '').toLowerCase();
    if (metalKeywords.some(k => n.includes(k))) {
      m.metalness = Math.max(m.metalness ?? 0.0, 0.9);
      m.roughness = Math.min(m.roughness, 0.25);
    }

    // 환경 반사 강도(너무 크면 씻김)
    if (m.envMapIntensity == null) m.envMapIntensity = 0.5;

    // 그림자
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    m.needsUpdate = true;
  });
}

/** 가구 추가(로드 → 보정 → 씬 추가 → 리스트 → 선택) */
async function addFurniture(asset: Asset) {
  const model = await loadFurniture(asset.url);
  fixConvertedMaterials(model);   // ★ 보정
  (model as any).userData.isModel = true;
  scene.add(model);

  const id = `${asset.id}-${Date.now()}`;
  const item: PlacedItem = { id, name: asset.name, object: model };
  placed.push(item);

  ui.addPlaced(item);
  selectPlaced(id, /*frame*/ true);
}

/** 선택 전환(드래그 대상 포함) */
function selectPlaced(id: string | null, frame = false) {
  selectedId = id;
  ui.setActivePlaced(id);

  const obj = placed.find(p => p.id === id)?.object ?? null;
  drag.setTarget(obj);

}

/** UI 매니저 + 축/그리드 설치 */
const ui = new UIManager(ASSETS, {
  onAssetClick: (a) => addFurniture(a),
  onPlacedSelect: (item) => selectPlaced(item.id, /*frame*/ false),
});
ui.setupAxesGrid({ scene, axesLength: 2, gridSize: 20, gridDivisions: 40, bindKeyToggles: true });

/** 첫 가구 자동 추가 */
addFurniture(ASSETS[0]);

/** 렌더 루프 */
function tick() {
  resize();
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();
