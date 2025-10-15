import * as THREE from 'three';

export type Asset = { id: string; name: string; url: string; thumb?: string };
export type PlacedItem = { id: string; name: string; object: THREE.Object3D };

type Callbacks = {
  onAssetClick: (asset: Asset) => void;          // 하단 갤러리 아이콘 클릭
  onPlacedSelect: (item: PlacedItem) => void;    // 우측 리스트 항목 선택
};

export type AxesGridOptions = {
  scene: THREE.Scene;
  axesLength?: number;          // 기본 2
  gridSize?: number;            // 기본 20
  gridDivisions?: number;       // 기본 40
  bindKeyToggles?: boolean;     // A/G 키 토글(기본 true)
};

/**
 * UI 매니저: 하단 갤러리 + 우측 배치 리스트 + (옵션) 축/그리드 설치/토글
 * - addPlaced(item): 씬에 추가된 가구를 리스트에 반영
 * - setActivePlaced(id): 우측 리스트 활성 표시
 * - setupAxesGrid(opts): 축/그리드 생성 + 토글 핸들러 등록
 */
export class UIManager {
  private galleryEl = document.getElementById('gallery')!;
  private placedListEl = document.getElementById('placed-list')!;
  private placed: PlacedItem[] = [];
  private activePlacedId: string | null = null;

  private axes?: THREE.AxesHelper;
  private grid?: THREE.GridHelper;
  private keyHandler?: (e: KeyboardEvent) => void;

  constructor(private assets: Asset[], private cb: Callbacks) {
    this.buildGallery();
  }

  /** 하단 갤러리 구축 */
  private buildGallery() {
    this.galleryEl.innerHTML = '';
    this.assets.forEach((a, i) => {
      const card = document.createElement('button');
      card.className = 'card';
      card.dataset.id = a.id;
      card.title = a.name;
      card.ariaLabel = a.name;

      if (a.thumb) {
        const img = document.createElement('img');
        img.src = a.thumb;
        img.alt = a.name;
        card.appendChild(img);
      } else {
        const ph = document.createElement('div');
        ph.style.cssText = 'width:80px;height:80px;display:grid;place-items:center;background:#222;';
        ph.textContent = a.name.slice(0, 4);
        card.appendChild(ph);
      }

      const label = document.createElement('div');
      label.className = 'label';
      label.textContent = a.name;
      card.appendChild(label);

      card.addEventListener('click', () => {
        document.querySelectorAll('.card').forEach(el => el.classList.remove('active'));
        card.classList.add('active');
        this.cb.onAssetClick(a);
      });

      this.galleryEl.appendChild(card);
      if (i === 0) card.classList.add('active');
    });
  }

  /** 우측 리스트에 배치 항목 추가 */
  addPlaced(item: PlacedItem) {
    this.placed.push(item);

    const row = document.createElement('div');
    row.className = 'placed-item';
    row.dataset.id = item.id;

    const dot = document.createElement('span');
    dot.className = 'dot';
    row.appendChild(dot);

    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = item.name;
    row.appendChild(name);

    row.addEventListener('click', () => {
      this.setActivePlaced(item.id);
      this.cb.onPlacedSelect(item);
    });

    this.placedListEl.appendChild(row);
  }

  /** 우측 리스트 활성 표시 */
  setActivePlaced(id: string | null) {
    this.activePlacedId = id;
    this.placedListEl.querySelectorAll('.placed-item').forEach(el => el.classList.remove('active'));
    if (!id) return;
    const row = this.placedListEl.querySelector(`.placed-item[data-id="${id}"]`);
    row?.classList.add('active');
  }

  /** 축/그리드 설치(+ A/G 키 토글) */
  setupAxesGrid(opts: AxesGridOptions) {
    const {
      scene, axesLength = 2, gridSize = 20, gridDivisions = 40,
      bindKeyToggles = true
    } = opts;

    // 축
    this.axes = new THREE.AxesHelper(axesLength);
    this.axes.renderOrder = 1;
    scene.add(this.axes);

    // 그리드
    this.grid = new THREE.GridHelper(gridSize, gridDivisions, 0x4aa3ff, 0x2a2a2a);
    (this.grid.material as THREE.LineBasicMaterial).transparent = true;
    (this.grid.material as THREE.LineBasicMaterial).opacity = 0.6;
    scene.add(this.grid);

    // 키 토글 바인딩
    if (bindKeyToggles) {
      this.keyHandler = (e: KeyboardEvent) => {
        const k = e.key.toLowerCase();
        if (k === 'a' && this.axes) this.axes.visible = !this.axes.visible;
        if (k === 'g' && this.grid) this.grid.visible = !this.grid.visible;
      };
      window.addEventListener('keydown', this.keyHandler);
    }
  }

  /** 축/그리드 수동 토글/표시 제어 (원하면 사용) */
  setAxesVisible(v: boolean) { if (this.axes) this.axes.visible = v; }
  setGridVisible(v: boolean) { if (this.grid) this.grid.visible = v; }

  /** 정리 */
  dispose() {
    if (this.keyHandler) window.removeEventListener('keydown', this.keyHandler);
    this.keyHandler = undefined;
  }
}
