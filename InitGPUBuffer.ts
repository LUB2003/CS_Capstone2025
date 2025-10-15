export async function InitGPUBuffers(device : GPUDevice){
    const UniformBufferUsageFlags: GPUBufferUsageFlags = GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST;
    const StorageBufferUsageFlags: GPUBufferUsageFlags = GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST;

    const UniformBufferDescriptor: GPUBufferDescriptor = {size: device.limits.maxUniformBufferBindingSize, usage: UniformBufferUsageFlags};
    const StorageBufferDescriptor: GPUBufferDescriptor = {size: device.limits.maxStorageBufferBindingSize, usage: StorageBufferUsageFlags}; 


    const UniformBuffer = device.createBuffer(UniformBufferDescriptor); //Uniform Buffer
    const TriToMaterialBuffer = device.createBuffer(StorageBufferDescriptor); //Static Buffer A
    const VertexNormalBuffer= device.createBuffer(StorageBufferDescriptor); //Static Buffer B
    const InstanceTLASBuffer= device.createBuffer(StorageBufferDescriptor); //Dynamic Buffer
    /* +BLAS Buffer */


// Group 0: UBO
const g0 = device.createBindGroupLayout({
  entries: [
    { binding: 0, visibility: GPUShaderStage.COMPUTE | GPUShaderStage.FRAGMENT,
      buffer: { type: 'uniform' } },
  ],
});

// Group 1: Static SSBO (예: 같은 큰 버퍼를 슬라이스로 여러 바인딩에)
const g1 = device.createBindGroupLayout({
  entries: [
    { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } }, // vertices
    { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } }, // normals
    { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } }, // tri4
    { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } }, // materials
    { binding: 4, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } }, // BLAS
  ],
});

// Group 2: Dynamic SSBO
const g2 = device.createBindGroupLayout({
  entries: [
    { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } }, // instances
    { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } }, // TLAS
  ],
});


const pipelineLayout = device.createPipelineLayout({
  bindGroupLayouts: [g0, g1, g2],
});


const StaticBindgroupA = device.createBindGroup({
  layout: g1,
  entries: [
    { binding: 0, resource: { buffer: VertexNormalBuffer, offset: offsVertices, size: sizeVertices } },
    { binding: 1, resource: { buffer: VertexNormalBuffer, offset: offsNormals,  size: sizeNormals  } },
    { binding: 2, resource: { buffer: TriToMaterialBuffer, offset: offsTri4,     size: sizeTri4     } },
    { binding: 3, resource: { buffer: TriToMaterialBuffer, offset: offsMaterials,size: sizeMaterials} },
    { binding: 4, resource: { buffer: BlasBuffer, offset: offsBLAS,     size: sizeBLAS     } },
  ],
});

const StaticBindgroupB = device.createBindGroup({
  layout: g2,
  entries: [
    { binding: 0, resource: { buffer: InstanceTLASBuffer, offset: offsVertices, size: sizeInstance } },
    { binding: 1, resource: { buffer: InstanceTLASBuffer, offset: offsNormals,  size: sizeTLAS  } },
  ],
});


}