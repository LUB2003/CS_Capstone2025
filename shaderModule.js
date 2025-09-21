export function createPipeline_sample(device, presentationFormat) {
    const module_sample = device.createShaderModule({
        code: /*wgsl*/`
        struct Uniforms{ matrix: mat4x4f, };
        @group(0) @binding(0) var<uniform> uni: Uniforms;
    
        struct VSOutput{
            @builtin(position) position: vec4f,
            @location(0) normal: vec3f,
        };

        @vertex fn vs(@location(0) position: vec3f) -> VSOutput {
            var out: VSOutput;
            out.position = uni.matrix * vec4f(position, 1.0);
            out.normal = normalize(position);
            return out;
        }

        @fragment fn fs(in: VSOutput) -> @location(0) vec4f {
            let n = in.normal * 0.5 + vec3f(0.5); // 노멀 기반 색
            return vec4f(n, 1.0);
            
            //return vec4f(1.0, 1.0, 1.0, 1.0); //흰색
        }`,
    });
    
    const pipeline_sample = device.createRenderPipeline({
        layout: 'auto',
        vertex: {
            module: module_sample,
            entryPoint: 'vs',
            buffers: [
                {
                    arrayStride: (3) * 4, // (3) floats 4 bytes each
                    attributes: [
                        { shaderLocation: 0, offset: 0, format: 'float32x3' },
                    ],
                },
            ],
        },

        fragment: {
            module: module_sample,
            entryPoint: 'fs',
            targets: [{ format: presentationFormat }],
        },

        primitive: {
            topology: 'triangle-list',
            cullMode: 'back',
        },

        depthStencil: {
            depthWriteEnabled: false,
            depthCompare: 'less',
            format: 'depth24plus'
        },
    });

    return pipeline_sample
}