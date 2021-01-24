#version 450

layout (location = 0) in vec2 vUV;

layout(location = 0) out vec4 outColor;

layout(set = 0, binding = 0) uniform sampler blitSampler;
layout(set = 0, binding = 1) uniform texture2D blitTexture;

void main() {
  const vec4 color = texture(sampler2D(blitTexture, blitSampler), vUV);
  outColor = vec4(color.rgb, 1.0);
}
