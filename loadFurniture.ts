import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { mat4 } from "gl-matrix";

// GPU에 보낼 Material 데이터 
export interface Material{
  BaseColor: [number, number, number, number];
  EmissiveColor: [number, number, number];
  EmissiveIntensity: number;

  Metalness: number;
  Roughness: number;
  BlendMode: number;    // 0 OPAQUE, 1 MASK, 2 BLEND
  OpacityMask: number;  // alphaTest 임계값(없으면 0)

  NormalScale: [number, number];
  IOR: number;
  Padding_0: number;

  BaseColorTextureID: number;
  ORMTextureID: number;
  EmissiveTextureID: number;
  NormalTextureID: number;
}

export interface triangleAndMaterialID{  //이름이 안예뻐서 뭐가 좋을지 고민중...
  triAndMaterialID: [number, number, number, number];
}

export interface Instance{
  //vertexOffset : number,

  //triToMaterialOffset : number,
  triCount : number,

  //materialOffset : number,
  materialCount : number,

  modelMatrix : mat4,
  modelMatrixInverse : mat4
}

const materials: Material[] = [];
const triAndMaterialIDs : triangleAndMaterialID[] =[];
const loader = new GLTFLoader();


export async function createBufferData(model : THREE.Group){
  let indexCountSum = 0;

  model.traverse(o => {
  const mesh = o as THREE.Mesh; 
  if (!mesh.isMesh) return;

  console.log(mesh);

  const material = mesh.material
  materials.push({
    BaseColor : [material.color.r, material.color.g, material.color.b, 1.0],
    EmissiveColor : [material.emissive.r, material.emissive.g, material.emissive.b],
    EmissiveIntensity : material.emissiveIntensity,
    Metalness : material.metalness,
    Roughness : material.roughness,  
    BlendMode : 0,   
    //OpacityMask : ?
    NormalScale : [material.normalScale.x, material.normalScale.y],   
    IOR : 1.5,     
    BaseColorTexture : material.map,
    ORMTexture : material.aoMap || material.metalnessMap || material.roughnessMap,
    EmissiveTexture : material.emissiveMap,
    NormalTexture : material.normalMap
  });

  const count = mesh.geometry.index.count;
  indexCountSum += count;
  for(let i=0 ; i<count ; i+=3){
    triAndMaterialIDs.push({
      triAndMaterialID : [
          mesh.geometry.index.array[i]  , 
          mesh.geometry.index.array[i+1], 
          mesh.geometry.index.array[i+2], 
          materials.length - 1
        ]})
    }}); //순회 끝

  const instance : Instance = {
  //vertexOffset : 0,

  //triToMaterialOffset : 0,
  triCount : 0,

  //materialOffset : 0,
  materialCount : materials.length,

  modelMatrix : model.matrixWorld,
  modelMatrixInverse : model.matrixWorld.invert()
}



}


/* loadFurniture(url) */ 
// 가구를 로드하고 화면상에 그리고, 동시에 WebGPU용 데이터를 생성합니다
export async function loadFurniture(url: string): Promise<THREE.Object3D> {
  const gltf = await loader.loadAsync(url);
  const model = gltf.scene || gltf.scenes[0];
  console.log(model);

  model.rotateX(-Math.PI/2); //기본 회전, 어째 지금 모델들이 다 앞으로 엎어져 있어서 임시로...
  model.scale.multiplyScalar(0.001); //크기 조절

  //초기 수평 중앙정렬
  const box = new THREE.Box3().setFromObject(model);
  const c = box.getCenter(new THREE.Vector3());
  model.position.x -= c.x;
  model.position.z -= c.z;
  model.position.y -= box.min.y;

  model.updateMatrixWorld(true);

  createBufferData(model);  //모델 내 서브메쉬를 순회하면서 데이터를 생성합니다
  return model;
}
