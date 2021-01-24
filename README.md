# webgpu-compute-rasterizer

Instead of using the hardware rasterizer, this experiment uses a compute shader to perform rasterization.
Note that a software rasterizer is significantly slower than a rasterizer with hardware acceleration.

I didn't spend any time optimizing this, see this as barebones sample in case you're interested in this topic.

## References
 - [OpenGL 4.4 Specification](https://www.khronos.org/registry/OpenGL/specs/gl/glspec44.core.pdf)
