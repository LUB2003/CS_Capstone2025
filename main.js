import { mat4 } from './mat4.js';
import { createCubeVertices } from './sampleCube.js';
import { createPipeline_sample } from './shaderModule.js'
const {vertexData, indexData, numVertices} = createCubeVertices();


async function main() {
  const adapter = await navigator.gpu?.requestAdapter();
  const device = await adapter?.requestDevice();
  if (!device) {
    alert('need a browser that supports WebGPU');
    return;
  }

  const canvas = document.querySelector('canvas');
  const context = canvas.getContext('webgpu');
  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device,
    format: presentationFormat,
    alphaMode: 'premultiplied',
  });

  /*마우스로 회전*/ 
  let dragging = false;
  let lastX;
  let lastY;
  let rotX=0;
  let rotY=0;
  canvas.onmousemove = function(ev){
    if(dragging){
      let dx = lastX - ev.clientX;
      let dy = lastY - ev.clientY;
      rotX = rotX + dx * 0.05;
      rotY = rotY + dy * 0.05;
      lastX = ev.clientX;  
      lastY = ev.clientY; 
      render();
    } 
  }

  canvas.onmousedown = function(ev){
    dragging = true;
    lastX = ev.clientX;
    lastY = ev.clientY;
  }

  canvas.onmouseup = function(ev){
    dragging = false;
  }


  /* Pipelines */
  const pipeline_sample = createPipeline_sample(device, presentationFormat);

  /* Uniforms (MVP) */
  const uniformBufferSize = 16 * 4;
  const uniformBuffer = device.createBuffer({
    label: 'uniforms',
    size: uniformBufferSize,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  const uniformValues = new Float32Array(uniformBufferSize / 4);
  const matrixValue = uniformValues.subarray(0, 16); //MVP

  /* Buffers */
  const vertexBuffer = device.createBuffer({
    label: 'vertex buffer',
    size: vertexData.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(vertexBuffer, 0, vertexData);

  const indexBuffer = device.createBuffer({
    label: 'index buffer',
    size: indexData.byteLength,          
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(indexBuffer, 0, indexData);

  /* Bindgroups */
  const bindGroup = device.createBindGroup({
    label: 'bind group',
    layout: pipeline_sample.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: uniformBuffer }},
    ],});

  /*  Render pass */
  let depthTexture = device.createTexture({
    size: [canvas.width || 1, canvas.height || 1],
    format: 'depth24plus',
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });

  const renderPassDescriptor = {
    label: 'canvas pass',
    colorAttachments: [
      {
        view: undefined, // frame마다 설정
        clearValue: [0.15, 0.15, 0.2, 1], // 배경색
        loadOp: 'clear',
        storeOp: 'store',
      },
    ],
    depthStencilAttachment: {
      view: depthTexture.createView(),
      depthClearValue: 1.0,
      depthLoadOp: 'clear',
      depthStoreOp: 'store',
    },
  };

  /* MVP update (회전) */

  function updateMVP() {
    const aspect = (canvas.clientWidth || canvas.width) / (canvas.clientHeight || canvas.height);
    mat4.perspective(60 * Math.PI / 180, aspect, 0.1, 10.0, matrixValue);
    const view = mat4.lookAt([0, 1, 5], [0, 0, 0], [0, 1, 0]);
    mat4.multiply(matrixValue, view, matrixValue);
    mat4.rotateX(matrixValue, -rotY, matrixValue);
    mat4.rotateY(matrixValue, -rotX, matrixValue);
    device.queue.writeBuffer(uniformBuffer, 0, uniformValues);
  }

  function render() {
    renderPassDescriptor.colorAttachments[0].view = context.getCurrentTexture().createView();

    const wantW = canvas.width || 1;
    const wantH = canvas.height || 1;
    depthTexture.destroy();
    depthTexture = device.createTexture({
      size: [wantW, wantH],
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    renderPassDescriptor.depthStencilAttachment.view = depthTexture.createView();
    updateMVP();

    const encoder = device.createCommandEncoder();
    const pass = encoder.beginRenderPass(renderPassDescriptor);
    pass.setPipeline(pipeline_sample);
    pass.setBindGroup(0, bindGroup);
    pass.setVertexBuffer(0, vertexBuffer);
    pass.setIndexBuffer(indexBuffer, 'uint16');
    pass.drawIndexed(numVertices);
    pass.end();

    device.queue.submit([encoder.finish()]);
  }

 /* 첫 렌더 */
  render();

  // 리사이즈 대응
  const observer = new ResizeObserver(entries => {
    for (const entry of entries) {
      const c = entry.target;
      const width = entry.contentBoxSize?.[0]?.inlineSize ?? c.clientWidth;
      const height = entry.contentBoxSize?.[0]?.blockSize ?? c.clientHeight;
      c.width = Math.max(1, Math.min(width, device.limits.maxTextureDimension2D));
      c.height = Math.max(1, Math.min(height, device.limits.maxTextureDimension2D));
      render();
    }
  });
  observer.observe(canvas);
}

main();
