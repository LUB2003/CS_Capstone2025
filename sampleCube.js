export function createCubeVertices() {
  const vertexData = new Float32Array([
     // front face
    -3,  0.5,  3,
    -3, -0.5,  3,
     3,  0.5,  3,
     3, -0.5,  3,
     // right face
     3,  0.5, -3,
     3,  0.5,  3,
     3, -0.5, -3,
     3, -0.5,  3,
     // back face
     3,  0.5, -3,
     3, -0.5, -3,
    -3,  0.5, -3,
    -3, -0.5, -3,
    // left face
    -3,  0.5,  3,
    -3,  0.5, -3,
    -3, -0.5,  3,
    -3, -0.5, -3,
    // bottom face
     3, -0.5,  3,
    -3, -0.5,  3,
     3, -0.5, -3,
    -3, -0.5, -3,
    // top face
    -3,  0.5,  3,
     3,  0.5,  3,
    -3,  0.5, -3,
     3,  0.5, -3,
  ]);

  const indexData = new Uint16Array([
     0,  1,  2,  2,  1,  3,  // front
     4,  5,  6,  6,  5,  7,  // right
     8,  9, 10, 10,  9, 11,  // back
    12, 13, 14, 14, 13, 15,  // left
    16, 17, 18, 18, 17, 19,  // bottom
    20, 21, 22, 22, 21, 23,  // top
  ]);

  return {
    vertexData,
    indexData,
    numVertices: indexData.length,
  };
}