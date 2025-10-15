struct Uniforms{
    eye : vec3f
};


struct StaticBufferHeader{
    vertexDataOffset : u32,
    normalDataOffset : u32,
    triToMaterialDataOffset : u32,
    materialDataOffset : u32,

};

struct DynamicBufferHeader{
    instanceDataOffset : u32,
    instanceDataCount : u32,
    tlasDataOffset : u32,
    tlasDataCount : u32
};


struct Instance{
    vertexOffset : u32,
    triToMaterialOffset : u32,
    materialCount : u32,
    materialOffset : u32,
    modelMatrix : mat4x4f,
    modelMatrixInverse : mat4x4f
};

struct Material{
    BaseColor           : vec4<f32>,
    EmissiveColor       : vec3<f32>,
    EmissiveIntensity   : f32,

    Metalness           : f32,
    Roughness           : f32,
    BlendMode           : u32,   // OPAQUE: 0, MASK: 1, BLEND: 2
    OpacityMask         : f32,   // AlphaCutOff Value For MASK Mode

    NormalScale         : vec2<f32>,
    IOR                 : f32,
    Padding_0           : u32,

    BaseColorTextureID      : u32,
    ORMTextureID            : u32,
    EmissiveTextureID       : u32,
    NormalTextureID         : u32,
};

struct TriangleAndMaterialID {
    triAndMaterialID : vec4<u32>
};



struct BLAS{

};


//@group(0) @bindling(0)

@group(1) @binding(0) var<storage, read> vertex: array<f32>;
@group(1) @binding(1) var<storage, read> normal: array<f32>;
@group(1) @binding(2) var<storage, read> tri4: array<TriangleAndMaterialID>;
@group(1) @binding(3) var<storage, read> material: array<Material>;
@group(1) @binding(4) var<storage, read> blas: array<TriangleAndMaterialID>;

@group(2) @binding(0) var<storage, read> instance: array<Instance>;
@group(2) @binding(1) var<storage, read> tlas: array<Instance>;








