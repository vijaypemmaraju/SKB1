import glsl from "../../utils/glsl";

const grass = glsl`
#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;
uniform sampler2D gradient;
uniform sampler2D tex;
uniform sampler2D noise_tex;
uniform sampler2D cloud_tex;
uniform sampler2D grass_tex;
uniform sampler2D grass_tex2;
uniform float wind_speed;
uniform vec2 wind_direction;
uniform vec4 tip_color;
uniform vec4 wind_color;
uniform vec2 noise_tex_size;
uniform vec2 camera_position;
uniform float camera_zoom;

varying vec2 fragCoord;

const int firstOctave = 3;
const int octaves = 8;
const float persistence = 0.6;

#define PI 3.1415926535
#define MAX_BLADE_LENGTH 1.0

const float BLADE_WIDTH_IN_PIXELS = 4.0;
const float BLADE_HEIGHT_IN_PIXELS = 32.0;

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

vec4 sampleColor(float dist) {
  vec2 value = vec2(dist + 0.5, 0.0) / 3.0;
  return texture2D(gradient, value);
}

float sampleBladeLength(vec2 uv) {
    return texture2D(tex, uv).r * MAX_BLADE_LENGTH;
}

float sampleNoise(float value, vec2 texture_pixel_size, float offset) {
  float valueX = value / texture_pixel_size.x / noise_tex_size.x + offset;
  // wrap value between 0 and 1
  valueX = fract(valueX);
  valueX = floor(valueX * 100.0) / 100.0;
	return texture2D(noise_tex, vec2(valueX, 0.0)).r * 2.0;
}

float wind (vec2 pos, float t, float pnoise) {
	return pnoise * (sineWave(200.0, 5.8, 4.0*wind_speed*t, normalize(wind_direction), pos)
		   + sineWave(75.0, 2.1, 1.0*wind_speed*t, normalize(wind_direction - vec2(0.0, 0.4)), pos)
		   + sineWave(70.0, 1.1, 0.5*wind_speed*t, normalize(wind_direction + vec2(0.4, 0.0)), pos))
		   / 3.0;
}

#define cell_amount 100
#define period vec2(0, 4.)

vec2 modulo(vec2 divident, vec2 divisor){
	vec2 positiveDivident = mod(divident, divisor) + divisor;
	return mod(positiveDivident, divisor);
}

vec2 random(vec2 value){
	value = vec2( dot(value, vec2(127.1,311.7) ),
				  dot(value, vec2(269.5,183.3) ) );
	return -1.0 + 2.0 * fract(sin(value) * 43758.5453123);
}

float seamless_noise(vec2 uv) {
	uv = uv * float(cell_amount);
	vec2 cellsMinimum = floor(uv);
	vec2 cellsMaximum = ceil(uv);
	vec2 uv_fract = fract(uv);

	cellsMinimum = modulo(cellsMinimum, period);
	cellsMaximum = modulo(cellsMaximum, period);

	vec2 blur = smoothstep(0.0, 1.0, uv_fract);

	vec2 lowerLeftDirection = random(vec2(cellsMinimum.x, cellsMinimum.y));
	vec2 lowerRightDirection = random(vec2(cellsMaximum.x, cellsMinimum.y));
	vec2 upperLeftDirection = random(vec2(cellsMinimum.x, cellsMaximum.y));
	vec2 upperRightDirection = random(vec2(cellsMaximum.x, cellsMaximum.y));

	vec2 fraction = fract(uv);

	return mix( mix( dot( lowerLeftDirection, fraction - vec2(0, 0) ),
                     dot( lowerRightDirection, fraction - vec2(1, 0) ), blur.x),
                mix( dot( upperLeftDirection, fraction - vec2(0, 1) ),
                     dot( upperRightDirection, fraction - vec2(1, 1) ), blur.x), blur.y) * 0.8 + 0.5;
}

// Add these uniform variables near the top of the shader
const float sway_strength = 0.01;
const float sway_speed = 1.9;

// Add this function before the main() function
vec2 sway(vec2 uv, float time) {
    float noise_value = seamless_noise(uv * 0.5);
    float sway_offset = sin(time * sway_speed + noise_value * 10.0) * sway_strength;
    return vec2(sway_offset, 0.0);
}

vec2 voronoi(vec2 uv) {
  uv = uv * 10.0;
  vec2 uv_i = floor(uv);
  vec2 uv_f = fract(uv);

  float m = 1.0;
  vec2 m_p = vec2(0.0);
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 neighbor = vec2(float(x), float(y));
      vec2 point = random(uv_i + neighbor);
      vec2 diff = neighbor + point - uv_f;
      float d = length(diff);
      if (d < m) {
        m = d;
        m_p = point;
      }
    }
  }
  return vec2(m, m_p);
}

void main() {
  vec2 UV = fragCoord / resolution;
  UV.y = 1.0 - UV.y;

  vec2 SCREEN_PIXEL_SIZE = vec2(1.0 / resolution.x, 1.0 / resolution.y);
	float noise = sampleNoise(fragCoord.x, SCREEN_PIXEL_SIZE, 4.0 * wind_speed * time);
	vec2 uv = UV - vec2(0.0, noise / resolution);
  vec2 downscaled_resolution = vec2(resolution.x / 1., resolution.y / 1.);


  float uvWorldPosX = (uv.x);
  float uvWorldPosY = (uv.y);
  float cameraX = camera_position.x / resolution.x;
  float cameraY = camera_position.y / resolution.y;
  uvWorldPosX += cameraX;
  uvWorldPosY += cameraY;
  uvWorldPosX = fract(uvWorldPosX);
  uvWorldPosY = fract(uvWorldPosY);

  vec2 uvWorld = vec2(uvWorldPosX, uvWorldPosY);

  float pnoise = fract(seamless_noise(vec2(uvWorldPosX * 1.0, uvWorldPosY * 1.0)) * 1. + seamless_noise(vec2(uvWorldPosX * 1.0, uvWorldPosY * 1.0)) / 2.0);


  vec4 COLOR = vec4(0.0, 0.0, 0.0, 1.0);


  if (texture2D(tex, uv).a == 0.0) {
    discard;
  }
  // float pnoise = fract(seamless_noise(uvWorld / 12.0));

  vec4 grass_color = texture2D(grass_tex, uvWorld * 1.0);
  vec4 grass_color2 = texture2D(grass_tex2, uvWorld * 1.0);

//   if (seamless_noise(step(0.1, uvWorld)) > 0.5) {
    COLOR = grass_color;
//   } else {
    // COLOR = grass_color2;
//   }

  // Apply wind effect
  vec2 swayed_uv = uvWorld + sway(uvWorld, time * 10.0);
//   COLOR.rgb += wind_color.rgb;
  COLOR.rgb += wind_color.rgb * abs(wind(swayed_uv * resolution, time * 100.0, pnoise)) * 0.2;



  // // COLOR /= 10.0;

  // COLOR.r *= 0.01;
  // COLOR.b *= 0.01;

  // // Apply wind effect
//   COLOR.rgb += wind_color.rgb * abs(wind(uvWorld * resolution * 1.0, time * 10.0, pnoise)) * 0.2;

//   COLOR.rgb = fract(COLOR.rgb);

  // start with brown ground base color
  vec4 ground_color = vec4(0.5, 0.3, 0.1, 1.0);
  vec2 voro = voronoi(uvWorld * 8.0) + pnoise * 0.1;
  COLOR = texture2D(grass_tex, voro.xy) * 0.3;
  COLOR = mix(ground_color, COLOR, 0.35);
  COLOR.a = 1.0;
  // COLOR = mix(COLOR, tip_color, 0.4);


  gl_FragColor = COLOR;
}`;

export default grass;
