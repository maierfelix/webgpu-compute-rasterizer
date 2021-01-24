var bundle = (function (glMatrix) {
    'use strict';

    /**
     * Returns an initialized module of the glslang compiler
     */
    async function getGLSLangModule() {
        // @ts-ignore
        const glslangModule = await import('https://unpkg.com/@webgpu/glslang@0.0.15/dist/web-devel/glslang.js');
        const glslang = await glslangModule.default();
        return glslang;
    }
    /**
     * Load a text from the provided path
     * @param path - The path to load the text from
     */
    function fetchText(path) {
        return new Promise(resolve => {
            fetch(path).then(resp => {
                resp.text().then(resolve);
            });
        });
    }

    /// <reference types="@webgpu/types" />
    /**
     * Does magic
     * @param canvas - The canvas to render into
     */
    async function main(canvas) {
        const glslang = await getGLSLangModule();
        const adapter = await navigator.gpu.requestAdapter();
        const device = await adapter.requestDevice();
        const context = canvas.getContext("gpupresent");
        const swapChainFormat = await context.getSwapChainPreferredFormat(adapter);
        const swapChain = context.configureSwapChain({
            device,
            format: swapChainFormat,
        });
        const mModel = glMatrix.mat4.create();
        const mView = glMatrix.mat4.create();
        const mProjection = glMatrix.mat4.create();
        const mModelViewProjection = glMatrix.mat4.create();
        glMatrix.mat4.perspective(mProjection, (2 * Math.PI) / 5, -Math.abs(canvas.width / canvas.height), 0.1, 768.0);
        glMatrix.mat4.translate(mView, mView, glMatrix.vec3.fromValues(0, 0, -2));
        const blitVertexShaderSource = await fetchText("./shaders/blit.vert");
        const blitFragmentShaderSource = await fetchText("./shaders/blit.frag");
        const rasterComputeShaderSource = await fetchText("./shaders/rasterizer.comp");
        const screenBuffer = device.createTexture({
            size: {
                width: canvas.width,
                height: canvas.height,
                depth: 1,
            },
            format: "rgba32float",
            usage: GPUTextureUsage.STORAGE | GPUTextureUsage.SAMPLED
        });
        const screenBufferView = screenBuffer.createView();
        const depthBuffer = device.createBuffer({
            size: canvas.width * canvas.height * 1 * Float32Array.BYTES_PER_ELEMENT,
            usage: GPUBufferUsage.STORAGE,
        });
        const rasterDisplayUniform = device.createBuffer({
            size: 4 * 4 * Float32Array.BYTES_PER_ELEMENT,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        const rasterRasterizationUniform = device.createBuffer({
            size: 8 * Float32Array.BYTES_PER_ELEMENT,
            usage: GPUBufferUsage.UNIFORM,
            mappedAtCreation: true,
        });
        new Float32Array(rasterRasterizationUniform.getMappedRange()).set(new Float32Array([
            // Viewport
            0, 0, canvas.width, canvas.height,
            // Depth range
            0.0, 1.0, 0.0, 0.0
        ]));
        rasterRasterizationUniform.unmap();
        const rasterPipeline = device.createComputePipeline({
            computeStage: {
                module: device.createShaderModule({
                    code: glslang.compileGLSL(rasterComputeShaderSource, "compute")
                }),
                entryPoint: "main"
            },
        });
        const rasterBindGroup = device.createBindGroup({
            layout: rasterPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: screenBufferView },
                { binding: 1, resource: { buffer: depthBuffer } },
                { binding: 2, resource: { buffer: rasterRasterizationUniform } },
                { binding: 3, resource: { buffer: rasterDisplayUniform } },
            ]
        });
        const blitSampler = device.createSampler({
            magFilter: "linear",
            minFilter: "linear",
        });
        const blitBindGroupLayout = device.createBindGroupLayout({
            entries: [
                { binding: 0, visibility: GPUShaderStage.FRAGMENT, sampler: { type: "filtering" } },
                { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float", viewDimension: "2d" } },
            ]
        });
        const blitBindGroup = device.createBindGroup({
            layout: blitBindGroupLayout,
            entries: [
                { binding: 0, resource: blitSampler },
                { binding: 1, resource: screenBufferView },
            ]
        });
        const blitPipelineLayout = device.createPipelineLayout({
            bindGroupLayouts: [blitBindGroupLayout]
        });
        const blitPipeline = device.createRenderPipeline({
            layout: blitPipelineLayout,
            vertexStage: {
                module: device.createShaderModule({
                    code: glslang.compileGLSL(blitVertexShaderSource, "vertex")
                }),
                entryPoint: "main"
            },
            fragmentStage: {
                module: device.createShaderModule({
                    code: glslang.compileGLSL(blitFragmentShaderSource, "fragment")
                }),
                entryPoint: "main"
            },
            primitiveTopology: "triangle-list",
            colorStates: [
                { format: swapChainFormat },
            ],
        });
        requestAnimationFrame(function drawLoop(time) {
            requestAnimationFrame(drawLoop);
            glMatrix.mat4.identity(mModel);
            glMatrix.mat4.rotateY(mModel, mModel, time * 0.001);
            glMatrix.mat4.scale(mModel, mModel, glMatrix.vec3.fromValues(1, 1, 1));
            glMatrix.mat4.multiply(mModelViewProjection, mView, mModel);
            glMatrix.mat4.multiply(mModelViewProjection, mProjection, mModelViewProjection);
            device.defaultQueue.writeBuffer(rasterDisplayUniform, 0x0, mModelViewProjection);
            const swapchainTexture = swapChain.getCurrentTexture();
            const swapchainTextureView = swapchainTexture.createView();
            const renderPassDescriptor = {
                colorAttachments: [{
                        attachment: swapchainTextureView,
                        loadValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                    }],
            };
            // Rasterization
            {
                const commandEncoder = device.createCommandEncoder({});
                const computePass = commandEncoder.beginComputePass();
                computePass.setPipeline(rasterPipeline);
                computePass.setBindGroup(0, rasterBindGroup);
                computePass.dispatch(Math.ceil(canvas.width / 8), Math.ceil(canvas.height / 8), 1);
                computePass.endPass();
                const commandBuffer = commandEncoder.finish();
                device.defaultQueue.submit([commandBuffer]);
            }
            // Screen blit
            {
                const commandEncoder = device.createCommandEncoder({});
                const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
                passEncoder.setPipeline(blitPipeline);
                passEncoder.setBindGroup(0, blitBindGroup);
                passEncoder.draw(6, 1, 0, 0);
                passEncoder.endPass();
                const commandBuffer = commandEncoder.finish();
                device.defaultQueue.submit([commandBuffer]);
            }
        });
    }

    return main;

}(glMatrix));
//# sourceMappingURL=index.js.map
