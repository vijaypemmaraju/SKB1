import glsl from "../../utils/glsl";

const island = glsl`
#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;
uniform sampler2D gradient;
uniform sampler2D tex;

uniform vec2 scale;
uniform vec2 camera_position;
uniform float camera_zoom;

varying vec2 fragCoord;

#define PI 3.1415926535


const int firstOctave = 3;
const int octaves = 8;
const float persistence = 0.6;

#define MAX_BLADE_LENGTH 5.0

float sineWave(float T, float a, float phase, vec2 dir, vec2 pos) {
    return a * sin(2.0 * PI / T * dot(dir, pos) + phase);
}

float noise(int x,int y)
{
    float fx = float(x);
    float fy = float(y);

    return 2.0 * fract(sin(dot(vec2(fx, fy) ,vec2(12.9898,78.233))) * 43758.5453) - 1.0;
}

float smoothNoise(int x,int y)
{
    return noise(x,y)/4.0+(noise(x+1,y)+noise(x-1,y)+noise(x,y+1)+noise(x,y-1))/8.0+(noise(x+1,y+1)+noise(x+1,y-1)+noise(x-1,y+1)+noise(x-1,y-1))/16.0;
}

float COSInterpolation(float x,float y,float n)
{
    float r = n*PI;
    float f = (1.0-cos(r))*0.5;
    return x*(1.0-f)+y*f;

}

float InterpolationNoise(float x, float y)
{
    int ix = int(x);
    int iy = int(y);
    float fracx = x-float(int(x));
    float fracy = y-float(int(y));

    float v1 = smoothNoise(ix,iy);
    float v2 = smoothNoise(ix+1,iy);
    float v3 = smoothNoise(ix,iy+1);
    float v4 = smoothNoise(ix+1,iy+1);

   	float i1 = COSInterpolation(v1,v2,fracx);
    float i2 = COSInterpolation(v3,v4,fracx);

    return COSInterpolation(i1,i2,fracy);

}

float PerlinNoise2D(float x,float y)
{
    float sum = 0.0;
    float frequency =0.0;
    float amplitude = 0.0;
    for(int i=firstOctave;i<octaves + firstOctave;i++)
    {
        frequency = pow(2.0,float(i)) + time / 1000.0;
        amplitude = pow(persistence,float(i)) + sin(time / 1000.0) * 0.1;
        sum = sum + InterpolationNoise(x*frequency,y*frequency)*amplitude;
    }

    return sum;
}


void main() {
  vec2 UV = fragCoord / resolution;
  // UV.x *= 0.1;
  // vec2 camera_screen_position = vec2(-1. * camera_position.x, camera_position.y) / resolution;
  // UV = UV - camera_screen_position * 0.;
  UV.y = 1.0 - UV.y;
  // UV.x = 1.0 - UV.x;

  // vec4 COLOR = vec4(0.0, 0.0, 0.0, 1.0);
  // gl_FragColor = COLOR;
  // return;

		vec4 COLOR = texture2D(tex, UV);
    int count = 0;
    float noise = PerlinNoise2D(UV.x, UV.y) * 0.1;
    for (float radius = 1.0; radius <= 1.0; radius += 1.) {
      for (float angle = 0.0; angle < 2.0 * PI; angle += PI / 4.0) {
        vec2 offset = vec2(cos(angle), sin(angle)) * float(radius) / resolution;
        COLOR += texture2D(tex, UV + offset + noise) * vec4(1. / float(radius), 1. / float(radius), 1. / float(radius), 1.0);
        count += 1;
      }
    }

    COLOR /= float(count);

    if (COLOR.r <= 0.1) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
      return;
    }

    gl_FragColor = COLOR;

    return;
}`;

export default island;
