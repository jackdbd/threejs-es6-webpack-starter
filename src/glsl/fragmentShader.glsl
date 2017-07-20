uniform float delta;
varying float vOpacity;
varying vec3 vUv;

void main() {
    float r = 1.0 + cos(vUv.x * delta);
    float g = 0.5 + sin(delta) * 0.5;
    float b = 0.0;
    vec3 rgb = vec3(r, g, b);

    gl_FragColor = vec4(rgb, vOpacity);
}