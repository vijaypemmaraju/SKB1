#ifdef GL_ES
precision mediump float;
#endif

// uniform float time;
// uniform vec2 resolution;
// uniform sampler2D gradient;
// uniform sampler2D tex;
// uniform sampler2D noise_tex;
// uniform sampler2D cloud_tex;
uniform float wind_speed;
uniform vec2 wind_direction;
// uniform vec4 tip_color;
// uniform vec4 wind_color;
// uniform vec2 noise_tex_size;

// varying vec2 fragCoord;

// #define PI 3.1415926535
// #define MAX_BLADE_LENGTH 10.0

// float sineWave(float T, float a, float phase, vec2 dir, vec2 pos) {
//     return a * sin(2.0 * PI / T * dot(dir, pos) + phase);
// }

// vec4 sampleColor(float dist) {
//     return texture2D(gradient, vec2(dist + 0.5, 0.0) / 3.0);
// }

// float sampleBladeLength(vec2 uv) {
//     return texture2D(cloud_tex, uv).r * MAX_BLADE_LENGTH;
// }

void main() {
//  vec2 uv = fragCoord.xy / resolution.xy;
    // vec3 cdir = normalize(vec3(0.0, 1.0, 0.0)); // Assuming camera is looking straight down

    // float blade_length = sampleBladeLength(uv);
    // vec2 pos = fragCoord.xy / resolution.xy * noise_tex_size;
    // float noise = texture2D(noise_tex, pos).r;
    // float wind_phase = wind_speed * time + noise * 10.0;
    // float wind_wave = sineWave(1.0, 1.0, wind_phase, wind_direction, uv * resolution.xy);
    // float blade_wave = sineWave(blade_length / 2.0, 1.0, 0.0, cdir.xy, uv * resolution.xy);

    // float tip = smoothstep(0.95, 1.0, blade_wave);
    // float wind_blend = smoothstep(0.0, 0.1, wind_wave);
    // vec4 color = mix(sampleColor(blade_wave), tip_color, tip);
    // color = mix(color, wind_color, wind_blend);

    gl_FragColor = vec4(wind_direction.x, 0.0, 0.0, 1.0);
}
