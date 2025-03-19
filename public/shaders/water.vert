uniform float uTime;
varying vec2 vUv;
varying float vElevation;

void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    
    // Create wave effect
    float elevation = sin(modelPosition.x * 2.0 + uTime * 0.5) *
                     sin(modelPosition.z * 2.0 + uTime * 0.5) * 0.2;
    
    modelPosition.y += elevation;
    
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    
    gl_Position = projectedPosition;
    
    vUv = uv;
    vElevation = elevation;
} 