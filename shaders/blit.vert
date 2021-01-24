#version 450

const vec2 pos[6] = vec2[6](
  vec2( 1.0,  1.0),
  vec2(-1.0,  1.0),
  vec2(-1.0, -1.0),
  vec2(-1.0, -1.0),
  vec2( 1.0, -1.0),
  vec2( 1.0,  1.0)
);

layout (location = 0) out vec2 vUV;

void main() {
  vec2 vertex = pos[gl_VertexIndex];
  gl_Position = vec4(vertex, 0.0, 1.0);
  vUV = vertex * 0.5 + 0.5;
}
