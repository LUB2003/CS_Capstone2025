import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * 선택된 Object3D를 XZ 평면에서 드래그 이동시키는 컨트롤러
 * - setTarget(obj) 로 대상 설정
 * - 선택 박스(Box3Helper)로 강조 표시
 * - 캔버스(pointerdown/move), window(pointerup) 이벤트 사용
 */
export class DragController {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private controls: OrbitControls;
  private dom: HTMLElement;

  private raycaster = new THREE.Raycaster();
  private pointerNDC = new THREE.Vector2();
  private dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // y=const
  private dragHit = new THREE.Vector3();
  private dragOffset = new THREE.Vector3();

  private target: THREE.Object3D | null = null;
  private targetMeshes: THREE.Object3D[] = [];
  private dragging = false;
  private dragStartY = 0;
  private bboxHelper: THREE.Box3Helper | null = null;

  constructor(scene: THREE.Scene, camera: THREE.Camera, controls: OrbitControls, domElement: HTMLElement) {
    this.scene = scene;
    this.camera = camera;
    this.controls = controls;
    this.dom = domElement;

    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);

    this.dom.addEventListener('pointerdown', this.onPointerDown);
    this.dom.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
  }

  /** 현재 선택 강조 표시 업데이트 */
  private updateSelectionHelper() {
    if (!this.target) {
      if (this.bboxHelper) { this.scene.remove(this.bboxHelper); this.bboxHelper = null; }
      return;
    }
    const box = new THREE.Box3().setFromObject(this.target);
    if (!this.bboxHelper) {
      this.bboxHelper = new THREE.Box3Helper(box, 0x00ffff);
      this.scene.add(this.bboxHelper);
    } else {
      (this.bboxHelper as any).box.copy(box);
      this.bboxHelper.updateMatrixWorld(true);
    }
  }

  /** 드래그 대상으로 설정(선택) */
  setTarget(obj: THREE.Object3D | null) {
    this.target = obj;
    this.targetMeshes = [];
    if (obj) {
      obj.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) this.targetMeshes.push(m); });
    }
    this.updateSelectionHelper();
  }

  /** 내부: 포인터 → NDC */
  private setPointerNDC(ev: PointerEvent) {
    const r = this.dom.getBoundingClientRect();
    this.pointerNDC.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
    this.pointerNDC.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
  }

  /** pointerdown: 선택된 대상 위를 클릭하면 드래그 시작 */
  private onPointerDown(ev: PointerEvent) {
    if (!this.target) return;

    this.setPointerNDC(ev);
    this.raycaster.setFromCamera(this.pointerNDC, this.camera);

    const hits = this.raycaster.intersectObjects(this.targetMeshes, true);
    if (hits.length === 0) return;

    this.dragStartY = this.target.position.y;
    this.dragPlane.set(new THREE.Vector3(0, 1, 0), -this.dragStartY);

    if (this.raycaster.ray.intersectPlane(this.dragPlane, this.dragHit)) {
      this.dragOffset.subVectors(this.target.position, this.dragHit);
      this.dragging = true;
      this.controls.enabled = false;
    }
  }

  /** pointermove: 평면 교차점 + offset으로 XZ 이동 */
  private onPointerMove(ev: PointerEvent) {
    if (!this.dragging || !this.target) return;

    this.setPointerNDC(ev);
    this.raycaster.setFromCamera(this.pointerNDC, this.camera);

    if (this.raycaster.ray.intersectPlane(this.dragPlane, this.dragHit)) {
      const targetPos = this.dragHit.clone().add(this.dragOffset);
      this.target.position.set(targetPos.x, this.dragStartY, targetPos.z);
      
    this.target.updateMatrixWorld(true);
    console.log(this.target.matrixWorld);
      this.updateSelectionHelper();
    }
  }

  /** pointerup: 드래그 종료 */
  private onPointerUp() {
    if (!this.dragging) return;
    this.dragging = false;
    this.controls.enabled = true;
    // 선택 박스는 유지(현재 선택 상태 표시)
    this.updateSelectionHelper();
  }

  /** 정리(이 컨트롤러가 더 이상 필요 없을 때 호출) */
  dispose() {
    this.dom.removeEventListener('pointerdown', this.onPointerDown);
    this.dom.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    if (this.bboxHelper) { this.scene.remove(this.bboxHelper); this.bboxHelper = null; }
    this.target = null;
    this.targetMeshes = [];
  }
}
