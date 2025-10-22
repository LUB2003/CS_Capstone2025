import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export type Rig = {
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  /** 캔버스 리사이즈 대응 */
  resize: () => void;
  /** 대상 오브젝트를 화면에 보기 좋게 프레이밍 */
  frameObject: (obj: THREE.Object3D) => void;
};

/** 카메라 + OrbitControls 생성 */
export function createRig(renderer: THREE.WebGLRenderer): Rig {
  const camera = new THREE.PerspectiveCamera(60, 2, 0.01, 1000);
  camera.position.set(2, 1.5, 3);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  const resize = () => {
    const canvas = renderer.domElement as HTMLCanvasElement;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== w || canvas.height !== h) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
  };

  
  return { camera, controls, resize};
}

/** 기본 조명 추가(반환값은 필요 시 제거용으로 쓸 수 있음) */
export function addDefaultLights(scene: THREE.Scene) {
  const hemi = new THREE.HemisphereLight(0xffffff, 0x222233, 0.9);
  const dir = new THREE.DirectionalLight(0xffffff, 1.0);
  dir.position.set(5, 10, 7);
  scene.add(hemi, dir);
  return { hemi, dir };
}
